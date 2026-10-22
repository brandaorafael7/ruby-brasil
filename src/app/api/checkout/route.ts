import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSizeSurcharge, isValidCPF } from '@/lib/utils';
import { sanitizePostalCode } from '@/lib/melhor-envio';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { form, items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'O carrinho está vazio' }, { status: 400 });
    }

    // OBRIGAÇÃO: CPF / CNPJ obrigatório para entrega
    const cleanDoc = (form?.document || '').replace(/\D/g, '');
    const isPj = form?.customerType === 'PJ';
    if (isPj) {
      if (cleanDoc.length !== 14) {
        return NextResponse.json(
          { error: 'É obrigatório informar um CNPJ válido com 14 dígitos para a entrega e emissão do pedido.' },
          { status: 400 }
        );
      }
    } else {
      if (cleanDoc.length !== 11) {
        return NextResponse.json(
          { error: 'É obrigatório informar um CPF válido com 11 dígitos para a entrega e emissão da etiqueta de envio.' },
          { status: 400 }
        );
      }
      if (!isValidCPF(cleanDoc)) {
        return NextResponse.json(
          { error: 'O CPF informado é inválido. Por favor, confira os dígitos digitados.' },
          { status: 400 }
        );
      }
    }

    // OBRIGAÇÃO: Endereço de entrega completo no momento da compra
    const cleanZip = sanitizePostalCode(form?.zipCode || '');
    if (
      cleanZip.length !== 8 ||
      !form?.street?.trim() ||
      !form?.number?.trim() ||
      !form?.neighborhood?.trim() ||
      !form?.city?.trim() ||
      !form?.state?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            'É obrigatório informar um endereço de entrega completo (CEP válido, Rua, Número, Bairro, Cidade e Estado) no momento da compra.',
        },
        { status: 400 }
      );
    }

    const totalQuantity = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
    const isWholesale = false;

    // Preço individual por produto (mantendo valor de versões Torcedor/Jogador sem desconto de atacado a R$ 55)
    const appliedTierPrice = 60.0;

    const activeBatch = await prisma.promotionalBatch.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Frete via Melhor Envio selecionado pelo cliente
    const shippingCost = Math.max(
      0,
      Number(form.shippingCost) || Number(form.shippingOption?.price) || 0
    );
    const shippingService =
      form.shippingService ||
      (form.shippingOption
        ? `${form.shippingOption.name} - ${form.shippingOption.company}`
        : null);
    const isFreeShipping = false;

    let promoBatchId: string | null = null;
    if (activeBatch && activeBatch.isActive) {
      promoBatchId = activeBatch.id;
    }

    // 1. Agrupa e totaliza as quantidades solicitadas por (productId, size)
    const variantQuantities: Record<string, { productId: string; size: string; quantity: number }> = {};
    for (const item of items) {
      if (!item.productId || !item.size) continue;
      const key = `${item.productId}:${item.size}`;
      if (!variantQuantities[key]) {
        variantQuantities[key] = { productId: item.productId, size: item.size, quantity: 0 };
      }
      variantQuantities[key].quantity += Math.max(1, Number(item.quantity) || 1);
    }

    const requestedVariants = Object.values(variantQuantities);

    // 2. Validação estrita de estoque no banco de dados antes de efetivar o pedido
    for (const reqVar of requestedVariants) {
      const variant = await prisma.productVariant.findUnique({
        where: {
          productId_size: {
            productId: reqVar.productId,
            size: reqVar.size,
          },
        },
        include: {
          product: {
            select: { name: true },
          },
        },
      });

      if (!variant) {
        return NextResponse.json(
          { error: `O produto no tamanho ${reqVar.size} não foi localizado no catálogo.` },
          { status: 400 }
        );
      }

      if (variant.stockQuantity < reqVar.quantity) {
        const prodName = variant.product?.name || 'Camisa';
        return NextResponse.json(
          {
            error: `Estoque insuficiente para "${prodName}" (${variant.size}). Restam apenas ${variant.stockQuantity} unidade(s) em estoque, mas foram solicitadas ${reqVar.quantity}. Ajuste a quantidade no carrinho antes de continuar.`,
          },
          { status: 400 }
        );
      }
    }

    // 3. Decrementa o estoque real de cada variante comprada e atualiza a cota do lote
    for (const reqVar of requestedVariants) {
      await prisma.productVariant.update({
        where: {
          productId_size: {
            productId: reqVar.productId,
            size: reqVar.size,
          },
        },
        data: {
          stockQuantity: {
            decrement: reqVar.quantity,
          },
        },
      }).catch((err) => {
        console.warn(`Aviso ao atualizar estoque variante (${reqVar.productId} - ${reqVar.size}):`, err);
      });
    }

    if (promoBatchId) {
      await prisma.promotionalBatch.update({
        where: { id: promoBatchId },
        data: {
          remainingQuota: {
            decrement: totalQuantity,
          },
        },
      }).catch(() => {});
    }

    let subtotal = 0;
    const orderItemsData = items.map((item: any) => {
      const basePrice = item.retailPrice || 60.0;
      const surcharge = getSizeSurcharge(item.size);
      const unitPrice = basePrice + surcharge;
      const customFee = item.customName ? 15.0 : 0.0;
      const totalItem = (unitPrice + customFee) * item.quantity;
      subtotal += totalItem;

      return {
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        unitPriceApplied: unitPrice,
        customName: item.customName || null,
        customNumber: item.customNumber || null,
        customFee,
        totalItemPrice: totalItem,
      };
    });

    const discountAmount = 0.0;
    const finalTotal = subtotal + shippingCost;

    const orderNumber = `RUBY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerType: form.customerType || 'PF',
        document: form.document || '',
        customerName: form.customerName || 'Cliente WhatsApp',
        email: form.email || '',
        phone: form.phone || '',
        zipCode: form.zipCode || '',
        street: form.street || '',
        number: form.number || '',
        complement: form.complement || null,
        neighborhood: form.neighborhood || '',
        city: form.city || '',
        state: form.state || '',
        totalQuantity,
        subtotal,
        discountAmount,
        shippingCost,
        shippingService,
        isFreeShipping,
        finalTotal,
        paymentMethod: 'WHATSAPP_ASSISTED',
        status: 'PENDING',
        isWholesale,
        promotionalBatchId: promoBatchId,
        items: {
          create: orderItemsData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      finalTotal: order.finalTotal,
      isFreeShipping: order.isFreeShipping,
      isWholesale: order.isWholesale,
      remainingQuota: activeBatch ? Math.max(0, activeBatch.remainingQuota - totalQuantity) : null,
    });
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    return NextResponse.json({ error: 'Erro ao gerar pedido' }, { status: 500 });
  }
}

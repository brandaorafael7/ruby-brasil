import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSizeSurcharge } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { form, items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'O carrinho está vazio' }, { status: 400 });
    }

    const totalQuantity = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
    const isWholesale = totalQuantity >= 50;

    // Regras de Preço (João Felipe):
    // 50 ou mais camisas: R$ 55,00 cada
    // Menos de 50 camisas: Preço base R$ 60,00 cada (ou item.retailPrice)
    const appliedTierPrice = totalQuantity >= 50 ? 55.0 : 60.0;

    const activeBatch = await prisma.promotionalBatch.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const minPiecesForFreeShip = activeBatch?.minPiecesForFreeShip ?? 10;
    const fixedShippingFee = activeBatch?.fixedShippingFee ?? 30.0;

    const isFreeShipping = totalQuantity >= minPiecesForFreeShip;
    const shippingCost = isFreeShipping ? 0.0 : (totalQuantity > 0 ? fixedShippingFee : 0.0);

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
      const basePrice = totalQuantity >= 50 ? 55.0 : (item.retailPrice || 60.0);
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

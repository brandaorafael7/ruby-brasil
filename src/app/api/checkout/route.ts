import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { form, items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'O carrinho está vazio' }, { status: 400 });
    }

    const totalQuantity = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
    const isWholesale = totalQuantity >= 10;

    const tiers = await prisma.wholesaleTier.findMany({
      orderBy: { minQuantity: 'asc' },
    });

    let appliedTierPrice: number | null = null;
    if (isWholesale) {
      if (totalQuantity >= 60) {
        appliedTierPrice = tiers.find((t) => t.minQuantity === 60)?.unitPrice ?? 48.0;
      } else if (totalQuantity >= 30) {
        appliedTierPrice = tiers.find((t) => t.minQuantity === 30)?.unitPrice ?? 55.0;
      } else {
        appliedTierPrice = tiers.find((t) => t.minQuantity === 10)?.unitPrice ?? 65.0;
      }
    }

    const activeBatch = await prisma.promotionalBatch.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    let isFreeShipping = false;
    let shippingCost = isWholesale ? 0.0 : 22.9 + Math.max(0, totalQuantity - 1) * 3.5;
    let promoBatchId: string | null = null;

    if (
      isWholesale &&
      activeBatch &&
      activeBatch.isActive &&
      activeBatch.remainingQuota >= totalQuantity
    ) {
      isFreeShipping = true;
      shippingCost = 0.0;
      promoBatchId = activeBatch.id;

      await prisma.promotionalBatch.update({
        where: { id: activeBatch.id },
        data: {
          remainingQuota: {
            decrement: totalQuantity,
          },
        },
      });
    }

    let subtotal = 0;
    const orderItemsData = items.map((item: any) => {
      const unitPrice = isWholesale && appliedTierPrice ? appliedTierPrice : item.retailPrice;
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

    const discountAmount = form.paymentMethod === 'PIX' ? subtotal * 0.05 : 0.0;
    const finalTotal = subtotal - discountAmount + shippingCost;

    const orderNumber = `FUT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerType: form.customerType || 'PF',
        document: form.document,
        customerName: form.customerName,
        email: form.email,
        phone: form.phone,
        zipCode: form.zipCode,
        street: form.street,
        number: form.number,
        complement: form.complement || null,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        totalQuantity,
        subtotal,
        discountAmount,
        shippingCost,
        isFreeShipping,
        finalTotal,
        paymentMethod: form.paymentMethod || 'PIX',
        status: form.paymentMethod === 'WHATSAPP_ASSISTED' ? 'PENDING' : 'PAID',
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

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const VALID_ORDER_STATUSES = [
  'PENDING',
  'PROCESSAMENTO',
  'PAGAMENTO_CONFIRMADO',
  'ENVIADO',
  'ENTREGUE',
  'CANCELADO',
] as const;

// 1. LISTAR PEDIDOS COMPLETOS (Admin)
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Erro ao listar pedidos no admin:', error);
    return NextResponse.json({ error: 'Erro ao carregar lista de pedidos' }, { status: 500 });
  }
}

// 2. ATUALIZAR STATUS DO PEDIDO (Admin)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'ID do pedido e novo status são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanStatus = String(status).trim().toUpperCase();

    if (!VALID_ORDER_STATUSES.includes(cleanStatus as any)) {
      return NextResponse.json(
        {
          error: `Status inválido. Status permitidos: ${VALID_ORDER_STATUSES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: cleanStatus,
        updatedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Status do pedido ${updatedOrder.orderNumber} atualizado para ${cleanStatus}`,
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json({ error: 'Erro ao atualizar pedido no banco' }, { status: 500 });
  }
}

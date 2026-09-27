import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const batch = await prisma.promotionalBatch.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Nenhum lote promocional ativo' }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Erro ao buscar lote:', error);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { batchId, remainingQuota, totalQuota, isActive, minPiecesForFreeShip } = body;

    const updated = await prisma.promotionalBatch.update({
      where: { id: batchId },
      data: {
        ...(remainingQuota !== undefined ? { remainingQuota: Number(remainingQuota) } : {}),
        ...(totalQuota !== undefined ? { totalQuota: Number(totalQuota) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(minPiecesForFreeShip !== undefined ? { minPiecesForFreeShip: Number(minPiecesForFreeShip) } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar lote:', error);
    return NextResponse.json({ error: 'Erro ao atualizar lote' }, { status: 500 });
  }
}

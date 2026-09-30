import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let batch = await prisma.promotionalBatch.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!batch) {
      batch = await prisma.promotionalBatch.create({
        data: {
          name: 'Condição Especial RubyBR',
          code: 'LOTE-6000',
          totalQuota: 6000,
          remainingQuota: 5842,
          minPiecesForFreeShip: 10,
          fixedShippingFee: 30.0,
          isActive: true,
          description: 'Frete Fixo e Frete Grátis a partir da cota mínima.',
        },
      });
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
    const { batchId, remainingQuota, totalQuota, isActive, minPiecesForFreeShip, fixedShippingFee } = body;

    let targetId = batchId;
    if (!targetId) {
      const activeBatch = await prisma.promotionalBatch.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      targetId = activeBatch?.id;
    }

    if (!targetId) {
      const newBatch = await prisma.promotionalBatch.create({
        data: {
          name: 'Condição Especial RubyBR',
          code: 'LOTE-6000',
          totalQuota: Number(totalQuota) || 6000,
          remainingQuota: Number(remainingQuota) || 6000,
          minPiecesForFreeShip: Number(minPiecesForFreeShip) || 10,
          fixedShippingFee: Number(fixedShippingFee) !== undefined ? Number(fixedShippingFee) : 30.0,
          isActive: true,
        },
      });
      return NextResponse.json(newBatch);
    }

    const updated = await prisma.promotionalBatch.update({
      where: { id: targetId },
      data: {
        ...(remainingQuota !== undefined ? { remainingQuota: Number(remainingQuota) } : {}),
        ...(totalQuota !== undefined ? { totalQuota: Number(totalQuota) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(minPiecesForFreeShip !== undefined ? { minPiecesForFreeShip: Number(minPiecesForFreeShip) } : {}),
        ...(fixedShippingFee !== undefined ? { fixedShippingFee: Number(fixedShippingFee) } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar lote:', error);
    return NextResponse.json({ error: 'Erro ao atualizar lote' }, { status: 500 });
  }
}

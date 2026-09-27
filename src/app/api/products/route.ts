import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: true,
        priceTiers: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const globalTiers = await prisma.wholesaleTier.findMany({
      where: { productId: null },
      orderBy: { minQuantity: 'asc' },
    });

    return NextResponse.json({
      products,
      globalTiers,
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro ao carregar catálogo' }, { status: 500 });
  }
}

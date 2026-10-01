import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminDashboardClient from './_components/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
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

  const tiers = await prisma.wholesaleTier.findMany({
    orderBy: { minQuantity: 'asc' },
  });

  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <AdminDashboardClient
      initialBatch={batch}
      initialTiers={tiers}
      initialProducts={products}
      initialOrders={orders}
    />
  );
}

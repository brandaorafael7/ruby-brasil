import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const batch = await prisma.promotionalBatch.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

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

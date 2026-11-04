import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { getFastAdminDashboardData } from '@/lib/fast-queries';
import AdminDashboardClient from './_components/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('rubybr_admin_session')?.value;
  const session = sessionToken ? verifySessionToken(sessionToken) : null;

  if (!session) {
    redirect('/admin/login');
  }

  // Busca todos os dados do painel (batch, tiers, products e orders) em 1 único round-trip SQL
  const { batch: existingBatch, tiers, products, orders } = await getFastAdminDashboardData();

  let batch = existingBatch;
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
        description: 'Cota Promocional e Atacado Ruby Brasil com Envio via Melhor Envio.',
      },
    });
  }

  return (
    <AdminDashboardClient
      initialBatch={batch}
      initialTiers={tiers}
      initialProducts={products}
      initialOrders={orders}
    />
  );
}

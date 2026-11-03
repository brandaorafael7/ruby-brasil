import { prisma } from '@/lib/prisma';
import CatalogView from '@/components/catalog/CatalogView';

// Revalida a cada 2 minutos (ISR): evita consultas repetidas ao banco Supabase a cada acesso
export const revalidate = 120;

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      variants: true,
      priceTiers: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return <CatalogView initialProducts={products} />;
}

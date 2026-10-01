import { prisma } from '@/lib/prisma';
import CatalogView from '@/components/catalog/CatalogView';

export const dynamic = 'force-dynamic';

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

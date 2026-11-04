import CatalogView from '@/components/catalog/CatalogView';
import { getCachedCatalogProducts } from '@/lib/fast-queries';

// Revalida a cada 2 minutos (ISR): evita consultas repetidas ao banco Supabase a cada acesso
export const revalidate = 120;

export default async function HomePage() {
  const products = await getCachedCatalogProducts();

  return <CatalogView initialProducts={products} />;
}

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductDetailClient from './_components/ProductDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const rawSlug = params.slug || '';
  let decodedSlug = rawSlug;
  try {
    decodedSlug = decodeURIComponent(rawSlug);
  } catch {}

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: rawSlug },
        { slug: decodedSlug },
        { id: rawSlug },
        { id: decodedSlug },
      ],
    },
  });

  if (!product) {
    return {
      title: 'Produto não encontrado | RUBY BRASIL',
      description: 'O item procurado não foi encontrado em nosso catálogo.',
    };
  }

  const title = `${product.name} | RUBY BRASIL Oficial`;
  const description =
    product.description ||
    `Camisa ${product.name} padrão oficial Tailandesa 1:1. R$ 60,00 varejo e R$ 55,00 atacado (50+ un). Frete grátis a partir de 10 peças!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: product.imageUrl,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const rawSlug = params.slug || '';
  let decodedSlug = rawSlug;
  try {
    decodedSlug = decodeURIComponent(rawSlug);
  } catch {}

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: rawSlug },
        { slug: decodedSlug },
        { id: rawSlug },
        { id: decodedSlug },
      ],
    },
    include: {
      variants: true,
      priceTiers: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Busca outros modelos recomendados do catálogo (mesma liga ou gerais)
  const relatedProducts = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      isActive: true,
    },
    include: {
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  return (
    <ProductDetailClient
      product={product as any}
      relatedProducts={relatedProducts as any}
    />
  );
}

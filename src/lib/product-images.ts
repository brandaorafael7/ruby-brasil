import { prisma } from '@/lib/prisma';

const DATA_URL_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/;

export function isDataUrlImage(url?: string | null): boolean {
  return Boolean(url && url.startsWith('data:image/'));
}

/**
 * Se `imageUrl` for um Data URL Base64 (`data:image/...`), salva os bytes binários
 * na tabela `ProductImage` no `slot` indicado e retorna uma URL leve cacheável.
 * Isso evita armazenar ou trafegar megabytes de Base64 na tabela `Product`.
 */
export async function persistProductImageIfNeeded(
  productId: string,
  imageUrl: string,
  slot = 0
): Promise<string> {
  if (!isDataUrlImage(imageUrl)) {
    return imageUrl;
  }

  const match = imageUrl.match(DATA_URL_REGEX);
  if (!match) {
    return imageUrl;
  }

  const mimeType = match[1] || 'image/webp';
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  await prisma.$executeRaw`
    INSERT INTO "public"."ProductImage" ("productId", "slot", "mimeType", "data", "updatedAt")
    VALUES (${productId}, ${slot}, ${mimeType}, ${buffer}, NOW())
    ON CONFLICT ("productId", "slot")
    DO UPDATE SET
      "mimeType" = EXCLUDED."mimeType",
      "data" = EXCLUDED."data",
      "updatedAt" = NOW()
  `;

  if ((global as any).__rubyImageBufferCache) {
    const cache: Map<string, any> = (global as any).__rubyImageBufferCache;
    for (const key of Array.from(cache.keys())) {
      if (key.startsWith(`${productId}:`)) {
        cache.delete(key);
      }
    }
  }

  if (slot === 0) {
    return `/api/products/${productId}/image?v=${Date.now()}`;
  }
  return `/api/products/${productId}/image?slot=${slot}&v=${Date.now()}`;
}

/**
 * Processa uma lista de fotos do produto (1 ou mais fotos), convertendo qualquer
 * imagem Base64 em registro binário na tabela `ProductImage` com slot único e
 * retornando URLs leves.
 */
export async function persistProductGalleryImages(
  productId: string,
  rawImages: string[]
): Promise<{ mainImageUrl: string; galleryImages: string[] }> {
  const cleaned = rawImages
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter(Boolean);

  if (cleaned.length === 0) {
    return { mainImageUrl: '/ruby-brasil-icon.png', galleryImages: [] };
  }

  const baseSlot = Math.floor((Date.now() % 100000000) * 10) + 1;
  const galleryImages: string[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const slot = baseSlot + i;
    const url = await persistProductImageIfNeeded(productId, cleaned[i], slot);
    if (!galleryImages.includes(url)) {
      galleryImages.push(url);
    }
  }

  return {
    mainImageUrl: galleryImages[0] || '/ruby-brasil-icon.png',
    galleryImages,
  };
}

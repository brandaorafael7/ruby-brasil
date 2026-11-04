import { prisma } from '@/lib/prisma';

const DATA_URL_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/;

export function isDataUrlImage(url?: string | null): boolean {
  return Boolean(url && url.startsWith('data:image/'));
}

/**
 * Se `imageUrl` for um Data URL Base64 (`data:image/...`), salva os bytes binários
 * na tabela `ProductImage` e retorna uma URL leve cacheável (`/api/products/[id]/image?v=...`).
 * Isso evita armazenar ou trafegar megabytes de Base64 na tabela `Product`.
 */
export async function persistProductImageIfNeeded(
  productId: string,
  imageUrl: string
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
    INSERT INTO "public"."ProductImage" ("productId", "mimeType", "data", "updatedAt")
    VALUES (${productId}, ${mimeType}, ${buffer}, NOW())
    ON CONFLICT ("productId")
    DO UPDATE SET
      "mimeType" = EXCLUDED."mimeType",
      "data" = EXCLUDED."data",
      "updatedAt" = NOW()
  `;

  return `/api/products/${productId}/image?v=${Date.now()}`;
}


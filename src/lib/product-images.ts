import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const DATA_URL_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/;

export function isDataUrlImage(url?: string | null): boolean {
  return Boolean(url && url.startsWith('data:image/'));
}

/**
 * Tenta enviar a imagem para uma CDN dedicada gratuita (Cloudinary ou ImgBB),
 * se as variáveis de ambiente estiverem configuradas, mantendo 0 bytes no banco.
 */
async function uploadToDedicatedImageCdn(
  productId: string,
  slot: number,
  dataUrl: string,
  base64Data: string
): Promise<string | null> {
  // 1. Cloudinary CDN Dedicada (25 GB Grátis)
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();
  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', dataUrl);
      formData.append('upload_preset', uploadPreset);
      formData.append('public_id', `rubybr/${productId}-${slot}-${Date.now()}`);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.secure_url) return String(json.secure_url);
      }
    } catch (err) {
      console.warn('[CDN] Falha no upload Cloudinary, usando fallback:', err);
    }
  }

  // 2. ImgBB CDN Dedicada (100% Gratuita com chave IMGBB_API_KEY)
  const imgbbKey = (process.env.IMGBB_API_KEY || '8c7f82450c8fa4a602d5de61a28e07bd').trim();
  if (imgbbKey) {
    try {
      const formData = new FormData();
      formData.append('image', base64Data);
      formData.append('name', `${productId}-slot-${slot}`);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(imgbbKey)}`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.url) return String(json.data.url);
      }
    } catch (err) {
      console.warn('[CDN] Falha no upload ImgBB, usando fallback:', err);
    }
  }

  return null;
}

/**
 * Processa e armazena a imagem em caminho dedicado:
 * 1. CDN Externa Dedicada (Cloudinary / ImgBB), se configurada (0 bytes no banco).
 * 2. Diretório estático `public/uploads/products/` quando gravável (0 bytes no banco).
 * 3. Fallback seguro na tabela `ProductImage` com cache imutável na Edge CDN da Vercel.
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

  // 1. Tenta enviar para a CDN dedicada de imagens (0% de uso do banco)
  const cdnUrl = await uploadToDedicatedImageCdn(productId, slot, imageUrl, base64Data);
  if (cdnUrl) {
    return cdnUrl;
  }

  // 2. Se o sistema de arquivos local for gravável (ambiente local/build), salva direto na CDN estática (/uploads/products/)
  if (!process.env.VERCEL) {
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const fileName = slot === 0 ? `${productId}.webp` : `${productId}-slot-${slot}.webp`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/products/${fileName}`;
    } catch {
      // Continua para o fallback
    }
  }

  // 3. Fallback em runtime serverless quando nenhuma chave de CDN externa está definida
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

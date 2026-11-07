import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

interface ImageCacheItem {
  mimeType: string;
  data: Buffer;
}

// Cache LRU em memória no processo Node para servir fotos em < 1ms sem consultar o banco
const globalImageCache: Map<string, ImageCacheItem> =
  (global as any).__rubyImageBufferCache || new Map<string, ImageCacheItem>();
(global as any).__rubyImageBufferCache = globalImageCache;
const MAX_CACHE_ENTRIES = 400;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    if (!productId) {
      return new NextResponse('ID inválido', { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const slot = Math.max(0, parseInt(searchParams.get('slot') || '0', 10) || 0);
    const cacheKey = `${productId}:${slot}`;

    // 0. Retorno ultra-rápido do cache em memória RAM (< 1ms)
    if (globalImageCache.has(cacheKey)) {
      const cached = globalImageCache.get(cacheKey)!;
      return new NextResponse(cached.data as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': cached.mimeType || 'image/webp',
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'X-Cache': 'HIT-RAM',
        },
      });
    }

    // 1. Tenta buscar da tabela binária ProductImage no slot solicitado
    const rows = await prisma.$queryRaw<
      Array<{ mimeType: string; data: Buffer }>
    >`
      SELECT "mimeType", "data"
      FROM "public"."ProductImage"
      WHERE "productId" = ${productId} AND "slot" = ${slot}
      LIMIT 1
    `;

    if (rows.length > 0 && rows[0].data) {
      const { mimeType, data } = rows[0];
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

      if (globalImageCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = globalImageCache.keys().next().value;
        if (oldestKey) globalImageCache.delete(oldestKey);
      }
      globalImageCache.set(cacheKey, { mimeType, data: buffer });

      return new NextResponse(buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': mimeType || 'image/webp',
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'X-Cache': 'MISS-DB',
        },
      });
    }

    // 2. Fallback para slot 0: se existir arquivo estático em public/uploads/products/<id>.webp
    if (slot === 0) {
      const staticPath = path.join(process.cwd(), 'public', 'uploads', 'products', `${productId}.webp`);
      if (fs.existsSync(staticPath)) {
        const fileBuffer = fs.readFileSync(staticPath);

        if (globalImageCache.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = globalImageCache.keys().next().value;
          if (oldestKey) globalImageCache.delete(oldestKey);
        }
        globalImageCache.set(cacheKey, { mimeType: 'image/webp', data: fileBuffer });

        return new NextResponse(fileBuffer as unknown as BodyInit, {
          status: 200,
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'X-Cache': 'STATIC-FILE',
          },
        });
      }
    }

    // 3. Fallback: caso o produto ainda tenha uma URL externa ou data URL na coluna imageUrl
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { imageUrl: true },
    });

    if (product?.imageUrl) {
      if (product.imageUrl.startsWith('data:image/')) {
        const match = product.imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
        if (match) {
          const buf = Buffer.from(match[2], 'base64');
          const mimeType = match[1] || 'image/webp';

          if (globalImageCache.size >= MAX_CACHE_ENTRIES) {
            const oldestKey = globalImageCache.keys().next().value;
            if (oldestKey) globalImageCache.delete(oldestKey);
          }
          globalImageCache.set(cacheKey, { mimeType, data: buf });

          return new NextResponse(buf as unknown as BodyInit, {
            status: 200,
            headers: {
              'Content-Type': mimeType,
              'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            },
          });
        }
      } else if (product.imageUrl.startsWith('http')) {
        return NextResponse.redirect(product.imageUrl);
      }
    }

    return NextResponse.redirect(new URL('/ruby-brasil-icon.png', request.url));
  } catch (error) {
    console.error('Erro ao servir imagem do produto:', error);
    return new NextResponse('Erro interno', { status: 500 });
  }
}

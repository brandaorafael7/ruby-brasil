import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    if (!productId) {
      return new NextResponse('ID inválido', { status: 400 });
    }

    // 1. Tenta buscar da tabela binária ProductImage
    const rows = await prisma.$queryRaw<
      Array<{ mimeType: string; data: Buffer }>
    >`
      SELECT "mimeType", "data"
      FROM "public"."ProductImage"
      WHERE "productId" = ${productId}
      LIMIT 1
    `;

    if (rows.length > 0 && rows[0].data) {
      const { mimeType, data } = rows[0];
      const uint8 = new Uint8Array(data);
      return new NextResponse(uint8, {
        status: 200,
        headers: {
          'Content-Type': mimeType || 'image/webp',
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        },
      });
    }

    // 2. Fallback: se existir arquivo estático em public/uploads/products/<id>.webp
    const staticPath = path.join(process.cwd(), 'public', 'uploads', 'products', `${productId}.webp`);
    if (fs.existsSync(staticPath)) {
      const fileBuffer = fs.readFileSync(staticPath);
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        },
      });
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
          return new NextResponse(new Uint8Array(buf), {
            status: 200,
            headers: {
              'Content-Type': match[1] || 'image/webp',
              'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
            },
          });
        }
      } else if (product.imageUrl.startsWith('http')) {
        return NextResponse.redirect(product.imageUrl);
      }
    }

    return NextResponse.redirect(new URL('/ruby-brasil-icon.png', _request.url));
  } catch (error) {
    console.error('Erro ao servir imagem do produto:', error);
    return new NextResponse('Erro interno', { status: 500 });
  }
}


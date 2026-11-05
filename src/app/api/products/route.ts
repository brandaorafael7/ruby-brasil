import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAdminSessionFromRequest } from '@/lib/auth';
import {
  getProductPreSaleInfo,
  getProductGalleryImages,
  serializeProductPreSaleGallery,
} from '@/lib/utils';
import { persistProductGalleryImages } from '@/lib/product-images';
import { getCachedCatalogProducts, getFastCatalogProducts } from '@/lib/fast-queries';

// Revalida a cada 1 minuto para reduzir egress no Supabase
export const revalidate = 60;

// 1. LISTAR PRODUTOS (Para a loja e para o admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wantsAll = searchParams.get('all') === 'true';
    const session = wantsAll ? getAdminSessionFromRequest(request) : null;
    const includeInactive = Boolean(wantsAll && session);

    const [products, globalTiers] = await Promise.all([
      includeInactive ? getFastCatalogProducts(true) : getCachedCatalogProducts(),
      prisma.wholesaleTier.findMany({
        where: { productId: null },
        orderBy: { minQuantity: 'asc' },
      }),
    ]);

    return NextResponse.json(
      {
        products,
        globalTiers,
      },
      {
        headers: {
          'Cache-Control': includeInactive
            ? 'private, no-store'
            : 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro ao carregar catálogo' }, { status: 500 });
  }
}

// 2. ADICIONAR NOVA PEÇA (POST)
export async function POST(request: Request) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login como administrador.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      club,
      league,
      season,
      type = 'TORCEDOR',
      imageUrl,
      images,
      retailPrice,
      description = '',
      isActive = true,
      allowCustom = true,
      customPrice = 15.0,
      isPreSale = false,
      preSaleEta = '',
      variants = [
        { size: 'P', stockQuantity: 100 },
        { size: 'M', stockQuantity: 100 },
        { size: 'G', stockQuantity: 100 },
        { size: 'GG', stockQuantity: 100 },
        { size: 'XG', stockQuantity: 100 },
        { size: '3XL', stockQuantity: 50 },
        { size: '4XL', stockQuantity: 50 },
      ],
    } = body;

    const rawImagesList: string[] = Array.isArray(images) && images.length > 0
      ? images.filter(Boolean)
      : imageUrl
      ? [imageUrl]
      : [];

    if (!name || !club || !league || !season || rawImagesList.length === 0 || !retailPrice) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios (Nome, Clube, Liga, Temporada, pelo menos 1 Foto e Preço).' },
        { status: 400 }
      );
    }

    // Gera um slug amigável único
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const initialGallery = serializeProductPreSaleGallery(null, {
      isPreSale: Boolean(isPreSale),
      preSaleEta: preSaleEta ? String(preSaleEta) : '',
      images: [],
    });

    let product = await prisma.product.create({
      data: {
        name,
        slug,
        club,
        league,
        season,
        type,
        imageUrl: '/ruby-brasil-icon.png',
        gallery: initialGallery,
        retailPrice: Number(retailPrice),
        description,
        isActive: Boolean(isActive),
        allowCustom: Boolean(allowCustom),
        customPrice: Number(customPrice),
        variants: {
          create: variants.map((v: any) => ({
            size: v.size,
            stockQuantity: Number(v.stockQuantity) || 0,
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    const { mainImageUrl, galleryImages } = await persistProductGalleryImages(
      product.id,
      rawImagesList
    );

    const finalGallery = serializeProductPreSaleGallery(initialGallery, {
      isPreSale: Boolean(isPreSale),
      preSaleEta: preSaleEta ? String(preSaleEta) : '',
      images: galleryImages,
    });

    product = await prisma.product.update({
      where: { id: product.id },
      data: {
        imageUrl: mainImageUrl,
        gallery: finalGallery,
      },
      include: { variants: true },
    });

    revalidateTag('catalog-products');
    revalidatePath('/');
    revalidatePath(`/produto/${product.slug}`);

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao cadastrar produto:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao cadastrar peça no banco de dados' },
      { status: 500 }
    );
  }
}

// 3. EDITAR PEÇA EXISTENTE (PUT)
export async function PUT(request: Request) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login como administrador.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      name,
      club,
      league,
      season,
      type,
      imageUrl,
      images,
      retailPrice,
      description,
      isActive,
      allowCustom,
      customPrice,
      isPreSale,
      preSaleEta,
      variants,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true, gallery: true, league: true, type: true, name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    let finalImageUrl: string | undefined = undefined;
    let finalGalleryImages: string[] | undefined = undefined;

    if (Array.isArray(images) && images.length > 0) {
      const persisted = await persistProductGalleryImages(id, images);
      finalImageUrl = persisted.mainImageUrl;
      finalGalleryImages = persisted.galleryImages;
    } else if (imageUrl) {
      const existingList = getProductGalleryImages(existing);
      const mergedList = [
        imageUrl,
        ...existingList.filter((u) => u !== existing.imageUrl && u !== imageUrl),
      ];
      const persisted = await persistProductGalleryImages(id, mergedList);
      finalImageUrl = persisted.mainImageUrl;
      finalGalleryImages = persisted.galleryImages;
    }

    let updatedGallery: string | undefined = undefined;
    if (
      isPreSale !== undefined ||
      preSaleEta !== undefined ||
      finalGalleryImages !== undefined
    ) {
      const currentPreSale = getProductPreSaleInfo(existing);
      updatedGallery = serializeProductPreSaleGallery(existing.gallery, {
        isPreSale: isPreSale !== undefined ? Boolean(isPreSale) : currentPreSale.isPreSale,
        preSaleEta: preSaleEta !== undefined ? String(preSaleEta || '') : currentPreSale.preSaleEta,
        ...(finalGalleryImages !== undefined ? { images: finalGalleryImages } : {}),
      });
    }

    // Atualiza dados principais da camisa
    await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(club && { club }),
        ...(league && { league }),
        ...(season && { season }),
        ...(type && { type }),
        ...(finalImageUrl && { imageUrl: finalImageUrl }),
        ...(updatedGallery !== undefined && { gallery: updatedGallery }),
        ...(retailPrice !== undefined && { retailPrice: Number(retailPrice) }),
        ...(customPrice !== undefined && { customPrice: Number(customPrice) }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(allowCustom !== undefined && { allowCustom: Boolean(allowCustom) }),
      },
    });

    // Se foram enviados tamanhos e estoque, atualiza cada variante
    if (variants && Array.isArray(variants)) {
      const validSizes = variants.map((v: any) => v.size).filter(Boolean);
      if (validSizes.length > 0) {
        await prisma.productVariant.deleteMany({
          where: {
            productId: id,
            size: { notIn: validSizes },
          },
        });
      }

      await Promise.all(
        variants
          .filter((v: any) => v.size)
          .map((variant: any) =>
            prisma.productVariant.upsert({
              where: {
                productId_size: {
                  productId: id,
                  size: variant.size,
                },
              },
              update: {
                stockQuantity: Number(variant.stockQuantity) || 0,
              },
              create: {
                productId: id,
                size: variant.size,
                stockQuantity: Number(variant.stockQuantity) || 0,
              },
            })
          )
      );
    }

    const fullProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    revalidateTag('catalog-products');
    revalidatePath('/');
    if (fullProduct?.slug) {
      revalidatePath(`/produto/${fullProduct.slug}`);
    }

    return NextResponse.json(fullProduct);
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar peça' },
      { status: 500 }
    );
  }
}

// 4. EXCLUIR PEÇA (DELETE)
export async function DELETE(request: Request) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login como administrador.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do produto não informado' }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    revalidateTag('catalog-products');
    revalidatePath('/');

    return NextResponse.json({ success: true, message: 'Peça excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar produto:', error);
    return NextResponse.json(
      { error: 'Não foi possível excluir. Se já houver pedidos associados, recomendamos desativar/pausar a peça.' },
      { status: 500 }
    );
  }
}

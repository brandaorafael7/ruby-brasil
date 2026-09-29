import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 1. LISTAR PRODUTOS (Para a loja e para o admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';

    const products = await prisma.product.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        variants: true,
        priceTiers: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const globalTiers = await prisma.wholesaleTier.findMany({
      where: { productId: null },
      orderBy: { minQuantity: 'asc' },
    });

    return NextResponse.json({
      products,
      globalTiers,
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro ao carregar catálogo' }, { status: 500 });
  }
}

// 2. ADICIONAR NOVA PEÇA (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      club,
      league,
      season,
      type = 'TORCEDOR',
      imageUrl,
      retailPrice,
      description = '',
      isActive = true,
      allowCustom = true,
      customPrice = 15.0,
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

    if (!name || !club || !league || !season || !imageUrl || !retailPrice) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios (Nome, Clube, Liga, Temporada, Foto e Preço).' },
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

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        club,
        league,
        season,
        type,
        imageUrl,
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
    const body = await request.json();
    const { id, name, club, league, season, type, imageUrl, retailPrice, description, isActive, allowCustom, variants } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    // Atualiza dados principais da camisa
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(club && { club }),
        ...(league && { league }),
        ...(season && { season }),
        ...(type && { type }),
        ...(imageUrl && { imageUrl }),
        ...(retailPrice !== undefined && { retailPrice: Number(retailPrice) }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(allowCustom !== undefined && { allowCustom: Boolean(allowCustom) }),
      },
    });

    // Se foram enviados tamanhos e estoque, atualiza cada variante
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        if (variant.size) {
          await prisma.productVariant.upsert({
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
          });
        }
      }
    }

    const fullProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do produto não informado' }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Peça excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar produto:', error);
    return NextResponse.json(
      { error: 'Não foi possível excluir. Se já houver pedidos associados, recomendamos desativar/pausar a peça.' },
      { status: 500 }
    );
  }
}
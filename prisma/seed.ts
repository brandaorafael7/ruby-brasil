import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed do Banco de Dados Fut Atacado ---');

  // Limpa registros anteriores
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.wholesaleTier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.promotionalBatch.deleteMany();

  // 1. Criar Lote Promocional de 6.000 peças
  const promoBatch = await prisma.promotionalBatch.create({
    data: {
      name: 'Lote Master Fornecedor 2024 - Frete Grátis Nacional',
      code: 'LOTE-6000',
      totalQuota: 6000,
      remainingQuota: 5842,
      minPiecesForFreeShip: 10,
      isActive: true,
      description: 'Condição especial de frete 100% gratuito direto da fábrica para compras no atacado a partir de 10 peças.',
    },
  });
  console.log(`Lote Promocional Criado: ${promoBatch.code} (Restam ${promoBatch.remainingQuota}/${promoBatch.totalQuota})`);

  // 2. Criar Faixas Globais de Atacado
  await prisma.wholesaleTier.createMany({
    data: [
      { minQuantity: 10, maxQuantity: 29, unitPrice: 65.0 },
      { minQuantity: 30, maxQuantity: 59, unitPrice: 55.0 },
      { minQuantity: 60, maxQuantity: null, unitPrice: 48.0 },
    ],
  });
  console.log('Faixas de Atacado Criadas (10-29: R$ 65 | 30-59: R$ 55 | 60+: R$ 48)');

  // 3. Catálogo de Produtos
  const products = [
    {
      name: 'Camisa Flamengo I 24/25 - Rubro-Negro Tradicional',
      slug: 'camisa-flamengo-i-24-25',
      league: 'Brasileirão',
      club: 'Flamengo',
      season: '2024/2025',
      type: 'TORCEDOR',
      imageUrl: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80',
      retailPrice: 149.9,
      description: 'Manto sagrado rubro-negro 2024/25 com tecnologia de absorção AEROREADY e acabamento premium.',
    },
    {
      name: 'Camisa Real Madrid Home 24/25 - Edição Jogador Mbappé / Vini Jr',
      slug: 'camisa-real-madrid-home-24-25',
      league: 'La Liga',
      club: 'Real Madrid',
      season: '2024/2025',
      type: 'JOGADOR',
      imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80',
      retailPrice: 169.9,
      description: 'Versão de campo com corte atlético slim fit, escudo termoselado e textura com detalhes em pata de galo.',
    },
    {
      name: 'Camisa Brasil Retrô 1998 - Amarela Canarinho Ronaldo R9',
      slug: 'camisa-brasil-retro-1998',
      league: 'Seleções',
      club: 'Brasil',
      season: '1998 (Retrô)',
      type: 'RETRO',
      imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80',
      retailPrice: 179.9,
      description: 'Clássico imortal da Copa de 98 com as icônicas listras verdes nos ombros e tecido encorpado retrô.',
    },
    {
      name: 'Camisa Palmeiras Home 24/25 - Verde Alviverde Imponente',
      slug: 'camisa-palmeiras-home-24-25',
      league: 'Brasileirão',
      club: 'Palmeiras',
      season: '2024/2025',
      type: 'TORCEDOR',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
      retailPrice: 149.9,
      description: 'Manto alviverde com padrão geométrico gravado em relevo e detalhes dourados de campeão.',
    },
    {
      name: 'Camisa Manchester City Home 24/25 - 0161 Manchester Call',
      slug: 'camisa-manchester-city-home-24-25',
      league: 'Premier League',
      club: 'Manchester City',
      season: '2024/2025',
      type: 'JOGADOR',
      imageUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80',
      retailPrice: 169.9,
      description: 'Homenagem ao código postal de Manchester 0161 na gola e punhos, versão autêntica ULTRAWEAVE.',
    },
    {
      name: 'Camisa Milan Retrô 2007 Atenas - Branca Final da Champions',
      slug: 'camisa-milan-retro-2007',
      league: 'Retrô',
      club: 'Milan',
      season: '2007 (Retrô)',
      type: 'RETRO',
      imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80',
      retailPrice: 179.9,
      description: 'A histórica camisa branca da redenção em Atenas na Champions de 2007 com Kaká e Inzaghi.',
    },
    {
      name: 'Camisa Corinthians I 24/25 - Degradê Antirracista Preto e Branco',
      slug: 'camisa-corinthians-i-24-25',
      league: 'Brasileirão',
      club: 'Corinthians',
      season: '2024/2025',
      type: 'TORCEDOR',
      imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
      retailPrice: 149.9,
      description: 'Modelo com degrade marcante que simboliza a luta contra o preconceito e a tradição do Timão.',
    },
    {
      name: 'Camisa Arsenal Away 24/25 - Edição Especial African Heritage',
      slug: 'camisa-arsenal-away-24-25',
      league: 'Premier League',
      club: 'Arsenal',
      season: '2024/2025',
      type: 'TORCEDOR',
      imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80',
      retailPrice: 149.9,
      description: 'Colaboração com estética pan-africana em preto, verde e vermelho. Sucesso imediato de vendas.',
    },
    {
      name: 'Camisa Barcelona Home 24/25 - 125º Aniversário Meio a Meio',
      slug: 'camisa-barcelona-home-24-25',
      league: 'La Liga',
      club: 'Barcelona',
      season: '2024/2025',
      type: 'TORCEDOR',
      imageUrl: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=800&q=80',
      retailPrice: 149.9,
      description: 'Edição de comemoração aos 125 anos de fundação do clube com divisão metade azul e grená clássica.',
    },
    {
      name: 'Camisa São Paulo I 24/25 - Tricolor Paulista New Balance',
      slug: 'camisa-sao-paulo-i-24-25',
      league: 'Brasileirão',
      club: 'São Paulo',
      season: '2024/2025',
      type: 'TORCEDOR',
      imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
      retailPrice: 149.9,
      description: 'As tradicionais faixas horizontais no peito com selo comemorativo e escudo bordado de alta definição.',
    },
    {
      name: 'Camisa Seleção Brasileira Feminina 2024 - Amarela Canarinho',
      slug: 'camisa-brasil-feminina-2024',
      league: 'Seleções',
      club: 'Brasil',
      season: '2024',
      type: 'FEMININA',
      imageUrl: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=800&q=80',
      retailPrice: 139.9,
      description: 'Modelagem especialmente desenvolvida para o público feminino com estampa inspirada na fauna brasileira.',
    },
    {
      name: 'Camisa Argentina Home Três Estrelas 2024 - Campeão do Mundo',
      slug: 'camisa-argentina-home-2024',
      league: 'Seleções',
      club: 'Argentina',
      season: '2024',
      type: 'TORCEDOR',
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      retailPrice: 149.9,
      description: 'Listras celestes e brancas tradicionais com o escudo ostentando as 3 estrelas e o patch oficial de campeão.',
    },
  ];

  const sizes = ['P', 'M', 'G', 'GG'];

  for (const prodData of products) {
    await prisma.product.create({
      data: {
        ...prodData,
        variants: {
          create: sizes.map((size) => ({
            size,
            stockQuantity: 150,
          })),
        },
      },
    });
  }

  console.log('--- Seed Concluído com Sucesso! 12 Camisas Cadastradas. ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

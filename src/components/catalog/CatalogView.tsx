'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Clock,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store';
import { formatCurrency, getProductPreSaleInfo } from '@/lib/utils';
import ProductCard from '@/components/product/ProductCard';

interface Props {
  initialProducts: Product[];
}

const CATEGORIES = [
  'Todas as Categorias',
  'Pré-Venda',
  'Brasileirão',
  'Premier League',
  'La Liga',
  'Champions League',
  'Seleções',
  'Retrô',
  'Infantil',
  'Feminina',
];

const FAQS = [
  {
    question: '1. Qual a diferença entre os modelos Pronta Entrega e Pré-Venda?',
    answer:
      'Os modelos Pronta Entrega já estão em nosso estoque físico em Campinas/SP e são postados rapidamente após a confirmação. Os modelos marcados com ⏳ Pré-Venda são lançamentos e reposições que já estão em trânsito para o Brasil — você reserva seus tamanhos antecipadamente pelo site e garante prioridade total no envio assim que o lote dá entrada.',
  },
  {
    question: '2. Qual o valor unitário das camisas e posso misturar modelos?',
    answer:
      'Trabalhamos com preço direto de fábrica a partir de R$ 60,00 por camisa no padrão Tailandês 1:1 oficial. Você pode misturar livremente clubes, seleções, tamanhos adultos (P ao 4XL), kits infantis (16 ao 28) e modelos de pré-venda na mesma sacola.',
  },
  {
    question: '3. Qual o padrão de qualidade das camisas (Tailandesa 1:1)?',
    answer:
      'Trabalhamos exclusivamente com importação direta padrão 1:1: tecido tecnológico respirável Dri-Fit/AEROREADY, escudos bordados de alta definição ou termoaplicados em TPU nas versões Jogador, etiquetas internas e externas originais de fábrica e embalagem individual ziplock.',
  },
  {
    question: '4. É possível personalizar as camisas com Nome e Número oficial?',
    answer:
      'Sim! Basta clicar no botão "Personalizar ✎" em qualquer camisa para simular e adicionar qualquer nome e número oficial termoaplicado por apenas + R$ 15,00 por peça.',
  },
  {
    question: '5. Como funciona o cálculo de frete e o fechamento no WhatsApp?',
    answer:
      'O frete é cotado em tempo real via Melhor Envio (Correios PAC, SEDEX e Loggi) diretamente na sacola. Ao clicar em "Finalizar no WhatsApp", o sistema gera seu pedido completo e numerado (identificando automaticamente os itens a pronta entrega e as reservas de pré-venda) direto para nossa equipe.',
  },
];

export default function CatalogView({ initialProducts }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas as Categorias');
  const { addItem, openCart } = useCartStore();

  const preSaleProducts = useMemo(() => {
    return initialProducts.filter((p) => getProductPreSaleInfo(p).isPreSale);
  }, [initialProducts]);

  const kidsProducts = useMemo(() => {
    return initialProducts.filter(
      (p) =>
        p.type === 'INFANTIL' ||
        p.league?.toLowerCase().includes('infantil') ||
        p.name?.toLowerCase().includes('infantil') ||
        p.name?.toLowerCase().includes('kids') ||
        p.description?.toLowerCase().includes('infantil')
    );
  }, [initialProducts]);

  const spotlightProduct = useMemo(() => {
    if (preSaleProducts.length > 0) return preSaleProducts[0];
    return initialProducts[0] || null;
  }, [preSaleProducts, initialProducts]);

  const spotlightPreSale = useMemo(() => {
    return spotlightProduct ? getProductPreSaleInfo(spotlightProduct) : { isPreSale: false, preSaleEta: null };
  }, [spotlightProduct]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const preSaleInfo = getProductPreSaleInfo(product);
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.club && product.club.toLowerCase().includes(query)) ||
        (product.league && product.league.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (preSaleInfo.isPreSale && 'pré-venda pre-venda lançamento chegando'.includes(query));

      const matchesCategory =
        selectedCategory === 'Todas as Categorias' ||
        (selectedCategory === 'Pré-Venda' && preSaleInfo.isPreSale) ||
        (selectedCategory === 'Infantil' &&
          (product.type === 'INFANTIL' ||
            product.league.toLowerCase().includes('infantil') ||
            product.name.toLowerCase().includes('infantil') ||
            product.name.toLowerCase().includes('kids') ||
            product.description?.toLowerCase().includes('infantil'))) ||
        product.league.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        product.type.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === 'Feminina' && product.type === 'FEMININA') ||
        (selectedCategory === 'Retrô' &&
          (product.type === 'RETRO' || product.league.toLowerCase().includes('retrô')));

      return matchesSearch && matchesCategory;
    });
  }, [initialProducts, searchTerm, selectedCategory]);

  const handleSpotlightBuy = () => {
    if (!spotlightProduct) return;
    const defaultSize =
      spotlightProduct.type === 'INFANTIL' ? '22' : 'M';
    const res = addItem(spotlightProduct, defaultSize, 1);
    if (res.success) {
      openCart();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* =========================================================================
          1. LOOKBOOK EDITORIAL SPLIT-BANNER (Estilo Nike Lab / END. / Classic Football Shirts)
          ========================================================================= */}
      <section
        className="border-b"
        style={{
          borderColor: 'var(--border-crisp)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
            {/* Coluna Editorial Esquerda (7 cols): Manifesto + Condições Diretas */}
            <div
              className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-8 rounded-2xl border relative overflow-hidden"
              style={{
                borderColor: 'var(--border-crisp)',
                backgroundColor: 'var(--bg-studio)',
              }}
            >
              {/* Marca d'água sutil do Diamante Ruby Brasil */}
              <img
                src="/ruby-brasil-icon.png"
                alt=""
                aria-hidden="true"
                className="w-28 h-28 sm:w-36 sm:h-36 object-contain absolute -right-4 -top-4 opacity-[0.07] pointer-events-none ruby-icon-adaptive"
              />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3.5 sm:mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                    TEMPORADA 25/26 & CLÁSSICOS
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full border text-[10px] sm:text-[11px] font-mono uppercase tracking-wider whitespace-nowrap"
                    style={{
                      borderColor: 'var(--border-crisp)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span className="sm:hidden">TAILANDÊS 1:1 • CAMPINAS/SP</span>
                    <span className="hidden sm:inline">TECIDO TAILANDÊS 1:1 • ENVIO DE CAMPINAS/SP</span>
                  </span>
                </div>

                <h1
                  className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.08] uppercase"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Mantos Oficiais & Arquivo Histórico Direto da Fábrica.
                </h1>

                <p
                  className="mt-2.5 sm:mt-3 text-xs sm:text-base max-w-xl leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Bordados de alta definição, versões Jogador (Slim Fit) e Torcedor, além de relíquias retrô imortais. Compre pronta entrega ou reserve lançamentos exclusivos na pré-venda com envio seguro para todo o Brasil.
                </p>
              </div>

              {/* Barra de Condições Comerciais Integrada */}
              <div
                className="relative z-10 mt-5 sm:mt-6 pt-4 sm:pt-5 border-t grid grid-cols-3 gap-2 sm:gap-4"
                style={{ borderColor: 'var(--border-crisp)' }}
              >
                <div className="min-w-0">
                  <span
                    className="text-[9px] sm:text-[11px] font-mono uppercase block truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Preço Fábrica
                  </span>
                  <span
                    className="text-sm sm:text-xl font-black font-mono tabular-nums whitespace-nowrap block mt-0.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    R$ 60
                    <small
                      className="text-[10px] sm:text-xs font-normal"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      /un
                    </small>
                  </span>
                </div>

                <div
                  className="border-l pl-2.5 sm:pl-4 min-w-0"
                  style={{ borderColor: 'var(--border-crisp)' }}
                >
                  <span className="text-[9px] sm:text-[11px] font-mono uppercase block text-rose-600 dark:text-rose-400 truncate">
                    Qualidade
                  </span>
                  <span
                    className="text-sm sm:text-xl font-black font-mono tabular-nums whitespace-nowrap block mt-0.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Padrão 1:1
                  </span>
                </div>

                <div
                  className="border-l pl-2.5 sm:pl-4 min-w-0"
                  style={{ borderColor: 'var(--border-crisp)' }}
                >
                  <span
                    className="text-[9px] sm:text-[11px] font-mono uppercase block text-emerald-600 dark:text-emerald-400 truncate"
                  >
                    Frete Oficial
                  </span>
                  <span
                    className="text-sm sm:text-xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap block mt-0.5"
                  >
                    Melhor Envio
                  </span>
                </div>
              </div>
            </div>

            {/* Coluna Editorial Direita (5 cols): Card de Drop / Pré-Venda em Destaque */}
            <div
              className="lg:col-span-5 rounded-2xl border p-4 sm:p-6 flex flex-col justify-between bg-zinc-950 text-white relative overflow-hidden"
              style={{ borderColor: 'var(--border-crisp)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-zinc-950 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shrink-0 whitespace-nowrap">
                  {spotlightPreSale.isPreSale ? '⏳ DROP PRÉ-VENDA' : '★ DESTAQUE DA COLEÇÃO'}
                </span>
                <span className="text-[11px] sm:text-xs font-mono text-amber-300 truncate max-w-full">
                  {spotlightPreSale.isPreSale
                    ? spotlightPreSale.preSaleEta || 'Lote Chegando • Reserva Aberta'
                    : 'Pronta Entrega • Envio Rápido'}
                </span>
              </div>

              {spotlightProduct ? (
                <>
                  <div className="my-3.5 sm:my-4 flex items-center gap-3.5 sm:gap-5 z-10">
                    <Link
                      href={`/produto/${spotlightProduct.slug}`}
                      className="w-24 h-32 sm:w-32 sm:h-40 shrink-0 relative rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden block"
                    >
                      <Image
                        src={spotlightProduct.imageUrl}
                        alt={spotlightProduct.name}
                        fill
                        unoptimized={spotlightProduct.imageUrl?.startsWith('data:')}
                        sizes="150px"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
                      <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-zinc-400 truncate">
                        {spotlightProduct.club || spotlightProduct.league} •{' '}
                        {spotlightProduct.season || '25/26'}
                      </div>
                      <Link
                        href={`/produto/${spotlightProduct.slug}`}
                        className="text-sm sm:text-lg font-black tracking-tight leading-snug text-white line-clamp-2 hover:text-amber-300 tactile block"
                      >
                        {spotlightProduct.name}
                      </Link>
                      <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {spotlightProduct.description ||
                          'Acabamento oficial Tailandês 1:1 com tecido respirável e escudo de alta definição.'}
                      </p>
                      <div className="pt-1 flex items-baseline gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-black font-mono tabular-nums text-amber-400 whitespace-nowrap">
                          {formatCurrency(spotlightProduct.retailPrice || 60)}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono whitespace-nowrap">
                          Padrão 1:1
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/80 z-10">
                    <button
                      type="button"
                      onClick={handleSpotlightBuy}
                      className="flex-1 h-10 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-[11px] sm:text-xs uppercase tracking-wider whitespace-nowrap tactile"
                    >
                      {spotlightPreSale.isPreSale
                        ? 'Reservar Pré-Venda'
                        : 'Adicionar à Sacola'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (preSaleProducts.length > 0) {
                          setSelectedCategory('Pré-Venda');
                        }
                        document
                          .getElementById('catalogo')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="h-10 px-3 sm:px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-[11px] sm:text-xs shrink-0 whitespace-nowrap tactile"
                    >
                      Ver Drops ({preSaleProducts.length || initialProducts.length})
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. CATÁLOGO VISUAL DE CAMISAS (Proporção 4:5 de Estúdio • Estilo END. / Nike)
          ========================================================================= */}
      <main
        id="catalogo"
        className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8"
      >
        {/* Barra Unificada de Filtros de Coleção e Busca */}
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b"
          style={{ borderColor: 'var(--border-crisp)' }}
        >
          {/* Pílulas de Categoria */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => {
              const isPreSaleTab = cat === 'Pré-Venda';
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 sm:px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap tactile inline-flex items-center gap-1.5 border shrink-0 ${
                    isSelected
                      ? isPreSaleTab
                        ? 'bg-amber-400 text-zinc-950 border-amber-400'
                        : 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white'
                      : isPreSaleTab
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                      : 'hover:opacity-80'
                  }`}
                  style={
                    !isSelected && !isPreSaleTab
                      ? {
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-crisp)',
                          color: 'var(--text-secondary)',
                        }
                      : undefined
                  }
                >
                  {isPreSaleTab && <Clock className="w-3.5 h-3.5" />}
                  <span>
                    {cat === 'Todas as Categorias'
                      ? `Todos os Mantos (${initialProducts.length})`
                      : cat}
                  </span>
                  {isPreSaleTab && preSaleProducts.length > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full font-mono text-[11px] ${
                        isSelected
                          ? 'bg-zinc-950 text-amber-400'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                      }`}
                    >
                      {preSaleProducts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Busca Instantânea */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar clube, seleção ou ano..."
              className="w-full h-10 pl-9 pr-4 rounded-full border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-crisp)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Barra Contextual quando filtra por Pré-Venda */}
        {selectedCategory === 'Pré-Venda' && (
          <div className="mt-5 sm:mt-6 p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-amber-400 text-zinc-950 text-[11px] font-black uppercase shrink-0 whitespace-nowrap">
                Lote em Trânsito
              </span>
              <p className="text-xs sm:text-sm font-medium">
                Modelos em <strong>Pré-Venda</strong> são lançamentos e reposições que irão chegar. Reserve sua grade agora e garanta prioridade no envio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('Todas as Categorias')}
              className="text-xs font-bold underline shrink-0 self-start sm:self-auto"
            >
              Ver todo o catálogo
            </button>
          </div>
        )}

        {/* GRADE DE CAMISAS (4 COLUNAS DESKTOP) */}
        {filteredProducts.length === 0 ? (
          <div
            className="mt-6 rounded-2xl border p-8 sm:p-12 text-center"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-crisp)',
            }}
          >
            <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              {selectedCategory === 'Pré-Venda'
                ? 'Nenhum modelo em pré-venda cadastrado no momento'
                : 'Nenhum manto encontrado para este filtro'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {selectedCategory === 'Pré-Venda'
                ? 'Assim que novos lotes estiverem em trânsito, aparecerão aqui para reserva antecipada.'
                : 'Tente buscar por outro clube ou limpar o filtro selecionado.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Todas as Categorias');
              }}
              className="mt-4 px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold tactile hover:bg-rose-500"
            >
              Ver Todos os Mantos
            </button>
          </div>
        ) : (
          <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* =========================================================================
            3. SEÇÃO EDITORIAL: PRÉ-VENDA (MODELOS QUE IRÃO CHEGAR)
            ========================================================================= */}
        <section
          id="pre-venda"
          className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t"
          style={{ borderColor: 'var(--border-crisp)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
                ⏳ DROPS EM TRÂNSITO • RESERVA ANTECIPADA
              </span>
              <h2
                className="mt-1 text-xl sm:text-2xl font-black tracking-tight uppercase"
                style={{ color: 'var(--text-primary)' }}
              >
                Pré-Venda: Modelos que Irão Chegar
              </h2>
              <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Garanta seus tamanhos nos lançamentos da temporada antes do desembarque oficial do lote.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Pré-Venda');
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="self-start sm:self-auto px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 tactile"
            >
              <span>Filtrar Pré-Venda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {preSaleProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {preSaleProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl border p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-crisp)',
              }}
            >
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Próximo Lote de Lançamentos em Preparação
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Novos modelos em trânsito podem ser adicionados a qualquer momento pelo painel administrativo.
                </p>
              </div>
              <a
                href="#catalogo"
                className="px-4 py-2 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 tactile shrink-0"
                style={{
                  borderColor: 'var(--border-crisp)',
                  color: 'var(--text-primary)',
                }}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
                <span>Ver Pronta Entrega</span>
              </a>
            </div>
          )}
        </section>

        {/* =========================================================================
            4. SEÇÃO EDITORIAL: LINHA INFANTIL (KITS CAMISA + CALÇÃO)
            ========================================================================= */}
        {kidsProducts.length > 0 && (
          <section
            id="infantil"
            className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t"
            style={{ borderColor: 'var(--border-crisp)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-rose-600 font-bold">
                  LINHA KIDS • TAMANHOS 16 AO 28
                </span>
                <h2
                  className="mt-1 text-xl sm:text-2xl font-black tracking-tight uppercase"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Kits Infantis Oficiais (Camisa + Calção)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Infantil');
                  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="self-start sm:self-auto px-4 py-2 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 tactile"
                style={{
                  borderColor: 'var(--border-crisp)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                }}
              >
                <span>Ver Todos os Kits Kids</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {kidsProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            5. FAQ & LOGÍSTICA EM <details> NATIVO (content-first-noise-reduction)
            ========================================================================= */}
        <section
          id="faq"
          className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t"
          style={{ borderColor: 'var(--border-crisp)' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            <div className="lg:col-span-4">
              <span className="text-xs font-mono uppercase tracking-widest text-rose-600 font-bold">
                TRANSPARÊNCIA & ATACADO
              </span>
              <h2
                className="mt-1 text-xl sm:text-2xl font-black tracking-tight uppercase"
                style={{ color: 'var(--text-primary)' }}
              >
                Perguntas Frequentes & Logística
              </h2>
              <p
                className="mt-2 text-xs sm:text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Operação própria em Campinas/SP com despacho via Correios (PAC/SEDEX) e Loggi para todo o Brasil.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-2.5">
              {FAQS.map((faq, idx) => (
                <details
                  key={idx}
                  open={idx === 0}
                  className="group rounded-xl border p-4"
                  style={{
                    borderColor: 'var(--border-crisp)',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  <summary
                    className="flex items-center justify-between cursor-pointer font-bold text-xs sm:text-sm gap-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span>{faq.question}</span>
                    <span
                      className="font-mono text-sm group-open:rotate-45 tactile shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      +
                    </span>
                  </summary>
                  <p
                    className="mt-2.5 text-xs sm:text-sm leading-relaxed pt-2.5 border-t"
                    style={{
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-crisp)',
                    }}
                  >
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

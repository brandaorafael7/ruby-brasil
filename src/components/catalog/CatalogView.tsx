'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Clock,
  ArrowRight,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store';
import { formatCurrency, getProductPreSaleInfo, isGradeProduct } from '@/lib/utils';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import ProductCard from '@/components/product/ProductCard';

interface Props {
  initialProducts: Product[];
}

const PAGE_SIZE = 24;

const CATEGORIES = [
  'Todas as Categorias',
  'Grades (12 Peças)',
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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { addItem, openCart } = useCartStore();

  const gradeProducts = useMemo(() => {
    return initialProducts.filter((p) => isGradeProduct(p));
  }, [initialProducts]);

  const regularProducts = useMemo(() => {
    return initialProducts.filter((p) => !isGradeProduct(p));
  }, [initialProducts]);

  const preSaleProducts = useMemo(() => {
    return regularProducts.filter((p) => getProductPreSaleInfo(p).isPreSale);
  }, [regularProducts]);

  const kidsProducts = useMemo(() => {
    return regularProducts.filter(
      (p) =>
        p.type === 'INFANTIL' ||
        p.league?.toLowerCase().includes('infantil') ||
        p.name?.toLowerCase().includes('infantil') ||
        p.name?.toLowerCase().includes('kids') ||
        p.description?.toLowerCase().includes('infantil')
    );
  }, [regularProducts]);

  const spotlightProduct = useMemo(() => {
    if (preSaleProducts.length > 0) return preSaleProducts[0];
    return regularProducts[0] || initialProducts[0] || null;
  }, [preSaleProducts, regularProducts, initialProducts]);

  const spotlightPreSale = useMemo(() => {
    return spotlightProduct ? getProductPreSaleInfo(spotlightProduct) : { isPreSale: false, preSaleEta: null };
  }, [spotlightProduct]);

  const filteredProducts = useMemo(() => {
    const sourceList =
      selectedCategory === 'Grades (12 Peças)' ? gradeProducts : regularProducts;

    return sourceList.filter((product) => {
      const preSaleInfo = getProductPreSaleInfo(product);
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.club && product.club.toLowerCase().includes(query)) ||
        (product.league && product.league.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (preSaleInfo.isPreSale && 'pré-venda pre-venda lançamento chegando'.includes(query));

      if (selectedCategory === 'Grades (12 Peças)') {
        return matchesSearch;
      }

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
  }, [gradeProducts, regularProducts, searchTerm, selectedCategory]);

  // Reinicia a paginação progressiva ao trocar filtro ou busca
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    if (selectedCategory && selectedCategory !== 'Todas as Categorias') {
      trackAnalyticsEvent({
        eventType: 'CATEGORY_FILTER',
        category: selectedCategory,
      });
    }
  }, [searchTerm, selectedCategory]);

  // Carrega mais cards automaticamente conforme o usuário rola a página
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || visibleCount >= filteredProducts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredProducts.length));
        }
      },
      { rootMargin: '600px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

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
          1. BARRA PROMOCIONAL CINZA ESTILO NIKE.COM.BR (#F5F5F5)
          ========================================================================= */}
      <div
        className="border-b py-3 px-4 text-center"
        style={{
          backgroundColor: 'var(--bg-studio)',
          borderColor: 'var(--border-crisp)',
          color: 'var(--text-primary)',
        }}
      >
        <p className="text-xs sm:text-sm font-bold tracking-tight">
          MANTOS OFICIAIS PADRÃO TAILANDÊS 1:1 DIRETO DE FÁBRICA — A PARTIR DE R$ 60,00
        </p>
        <div className="mt-0.5 flex items-center justify-center gap-3 text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('Grades (12 Peças)');
              document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="underline font-semibold hover:opacity-75"
            style={{ color: 'var(--text-primary)' }}
          >
            Ver Grades Fechadas (12 Peças)
          </button>
          <span>•</span>
          <span>Envio para todo o Brasil via Melhor Envio</span>
        </div>
      </div>

      {/* =========================================================================
          2. PAREDE DE PRODUTOS ESTILO NIKE.COM.BR (/nav/ofertas/emoferta)
          ========================================================================= */}
      <main
        id="catalogo"
        className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8"
      >
        {/* Breadcrumb + Cabeçalho Estilo Nike */}
        <div className="mb-6">
          <div className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <span>Início</span>
            <span>/</span>
            <span>Ofertas</span>
            <span>/</span>
            <strong style={{ color: 'var(--text-primary)' }}>{selectedCategory}</strong>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {selectedCategory === 'Todas as Categorias'
                  ? `Mantos Oficiais em Oferta (${filteredProducts.length})`
                  : `${selectedCategory} (${filteredProducts.length})`}
              </h1>
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {selectedCategory === 'Grades (12 Peças)'
                  ? 'Pacotes fechados de 12 camisas iguais com tamanhos pré-definidos pelo administrador.'
                  : 'Qualidade Tailandesa 1:1 com escudos bordados ou TPU, pronta entrega e pré-venda oficial.'}
              </p>
            </div>

            {/* Busca Estilo Pílula Nike (#F5F5F5) */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-secondary)' }}
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar clube, seleção ou ano..."
                className="w-full h-10 pl-10 pr-4 rounded-full text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-white transition-all"
                style={{
                  backgroundColor: 'var(--bg-studio)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Barra de Filtros em Pílulas Estilo Nike.com.br */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ borderColor: 'var(--border-crisp)' }}
        >
          {CATEGORIES.map((cat) => {
            const isPreSaleTab = cat === 'Pré-Venda';
            const isGradeTab = cat === 'Grades (12 Peças)';
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-zinc-950'
                    : 'hover:opacity-80'
                }`}
                style={
                  !isSelected
                    ? {
                        backgroundColor: 'var(--bg-studio)',
                        color: 'var(--text-primary)',
                      }
                    : undefined
                }
              >
                {isPreSaleTab && <Clock className="w-3.5 h-3.5" />}
                {isGradeTab && <Layers className="w-3.5 h-3.5" />}
                <span>
                  {cat === 'Todas as Categorias'
                    ? `Todos (${regularProducts.length})`
                    : cat}
                </span>
                {isGradeTab && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-950'
                        : 'bg-black/10 dark:bg-white/10'
                    }`}
                  >
                    {gradeProducts.length}
                  </span>
                )}
                {isPreSaleTab && preSaleProducts.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-950'
                        : 'bg-black/10 dark:bg-white/10'
                    }`}
                  >
                    {preSaleProducts.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Barra Contextual quando filtra por Grades (12 Peças) */}
        {selectedCategory === 'Grades (12 Peças)' && (
          <div className="mt-5 sm:mt-6 p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase shrink-0 whitespace-nowrap">
                📦 Grade 12 Peças
              </span>
              <p className="text-xs sm:text-sm font-medium">
                Na modalidade <strong>Grade Fechada</strong>, você adquire um pacote com <strong>12 camisas iguais</strong> de tamanhos variados já pré-definidos pelo administrador com condição especial de atacado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('Todas as Categorias')}
              className="text-xs font-bold underline shrink-0 self-start sm:self-auto"
            >
              Ver camisas avulsas
            </button>
          </div>
        )}

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
              {selectedCategory === 'Grades (12 Peças)'
                ? 'Nenhuma grade fechada de 12 peças cadastrada no momento'
                : selectedCategory === 'Pré-Venda'
                ? 'Nenhum modelo em pré-venda cadastrado no momento'
                : 'Nenhum manto encontrado para este filtro'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {selectedCategory === 'Grades (12 Peças)'
                ? 'As grades fechadas com 12 peças e tamanhos pré-definidos aparecerão nesta aba assim que cadastradas pelo administrador.'
                : selectedCategory === 'Pré-Venda'
                ? 'Assim que novos lotes estiverem em trânsito, aparecerão aqui para reserva antecipada.'
                : 'Tente buscar por outro clube ou limpar o filtro selecionado.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Todas as Categorias');
              }}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#111111] text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:opacity-85 transition-opacity"
            >
              Ver Todos os Mantos
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {visibleCount < filteredProducts.length && (
              <div ref={loadMoreRef} className="mt-10 flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredProducts.length))
                  }
                  className="px-7 py-3 rounded-full bg-[#111111] text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:opacity-85 transition-opacity"
                >
                  Carregar mais produtos ({filteredProducts.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            2.5 SEÇÃO EDITORIAL: GRADES FECHADAS (12 PEÇAS IGUAIS)
            ========================================================================= */}
        <section
          id="grades"
          className="mt-14 sm:mt-20 pt-8 sm:pt-12 border-t"
          style={{ borderColor: 'var(--border-crisp)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#007d48] dark:text-emerald-400">
                Atacado • Pacote 12 Peças
              </span>
              <h2
                className="mt-1 text-xl sm:text-2xl font-black tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Grades Fechadas (12 Peças Iguais)
              </h2>
              <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Pacotes com 12 camisas do mesmo modelo e distribuição de tamanhos pré-definida para revenda imediata.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Grades (12 Peças)');
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="self-start sm:self-auto px-5 py-2.5 rounded-full bg-[#111111] hover:bg-[#333333] text-white dark:bg-white dark:text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Ver Grades ({gradeProducts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {gradeProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
              {gradeProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl border p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{
                backgroundColor: 'var(--bg-studio)',
                borderColor: 'var(--border-crisp)',
              }}
            >
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Grades Fechadas de 12 Peças
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Confira na aba de Grades os pacotes de 12 peças com numeração sortida definida pelo administrador.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Grades (12 Peças)');
                  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-full bg-[#111111] text-white dark:bg-white dark:text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Abrir Aba de Grades</span>
              </button>
            </div>
          )}
        </section>

        {/* =========================================================================
            3. SEÇÃO EDITORIAL: PRÉ-VENDA (MODELOS QUE IRÃO CHEGAR)
            ========================================================================= */}
        <section
          id="pre-venda"
          className="mt-14 sm:mt-20 pt-8 sm:pt-12 border-t"
          style={{ borderColor: 'var(--border-crisp)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#9e3500] dark:text-amber-400">
                Drops em Trânsito • Reserva Antecipada
              </span>
              <h2
                className="mt-1 text-xl sm:text-2xl font-black tracking-tight"
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
              className="self-start sm:self-auto px-5 py-2.5 rounded-full bg-[#111111] hover:bg-[#333333] text-white dark:bg-white dark:text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Filtrar Pré-Venda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {preSaleProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
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

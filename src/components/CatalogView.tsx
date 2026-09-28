'use client';

import React, { useState, useMemo } from 'react';
import { Search, Flame, Truck, Sparkles } from 'lucide-react';
import { Product } from '@/lib/types';
import ProductCard from './ProductCard';

interface Props {
  initialProducts: Product[];
}

const CATEGORIES = [
  'Todas as Categorias',
  'Brasileirão',
  'Premier League',
  'La Liga',
  'Champions League',
  'Seleções',
  'Retrô',
  'Feminina',
];

export default function CatalogView({ initialProducts }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas as Categorias');

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.club && product.club.toLowerCase().includes(query)) ||
        (product.league && product.league.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === 'Todas as Categorias' ||
        product.league.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        product.type.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === 'Feminina' && product.type === 'FEMININA') ||
        (selectedCategory === 'Retrô' && (product.type === 'RETRO' || product.league.toLowerCase().includes('retrô')));

      return matchesSearch && matchesCategory;
    });
  }, [initialProducts, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      
      {/* SEÇÃO PRINCIPAL DE BUSCA E CATEGORIAS NO TOPO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* BARRA DE CATEGORIAS ACIMA */}
        <div className="mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 border ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/60 scale-[1.02]'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* LUPA E BARRA DE BUSCA POR NOME */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-rose-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar camisa por nome, clube, seleção ou edição..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-12 pr-4 py-3 sm:py-3.5 text-xs sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white bg-zinc-800 px-2 py-1 rounded-md"
              >
                Limpar
              </button>
            )}
          </div>

          {/* FAIXA RESUMO DE CONDIÇÕES COMERCIAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800/80 text-[11px] sm:text-xs">
            <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300">
              <Truck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Menos de 10 camisas: <strong>Frete R$ 30 fixo</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>A partir de 10 camisas: <strong className="text-emerald-400">Frete 100% Grátis</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300">
              <Flame className="w-4 h-4 text-rose-400 shrink-0" />
              <span>A partir de 50 camisas: <strong className="text-rose-300">R$ 55,00 / un</strong></span>
            </div>
          </div>
        </div>

      </section>

      {/* LISTAGEM DE PRODUTOS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              Catálogo de Peças Pronta Entrega
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Exibindo <strong>{filteredProducts.length}</strong> camisas disponíveis para despacho imediato
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
              Valor Base: <strong className="text-white">R$ 60,00</strong> • 50+ peças: <strong className="text-emerald-400">R$ 55,00</strong>
            </span>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
            <p className="font-bold text-lg text-zinc-300">Nenhuma camisa encontrada</p>
            <p className="text-xs text-zinc-500 mt-1">
              Tente buscar por outro termo ou selecione &ldquo;Todas as Categorias&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Todas as Categorias');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Search, Filter, Flame, Sparkles } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import ProductCardWholesale from './ProductCardWholesale';
import ProductCardRetail from './ProductCardRetail';
import ModeSelector from './ModeSelector';

interface Props {
  initialProducts: Product[];
}

const LEAGUES = ['Todas as Ligas', 'Brasileirão', 'Premier League', 'La Liga', 'Seleções', 'Retrô'];
const TYPES = ['Todos os Modelos', 'TORCEDOR', 'JOGADOR', 'RETRO', 'FEMININA'];

export default function CatalogView({ initialProducts }: Props) {
  const { selectedMode } = useCartStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('Todas as Ligas');
  const [selectedType, setSelectedType] = useState('Todos os Modelos');

  const filteredProducts = initialProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.club.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.league.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLeague =
      selectedLeague === 'Todas as Ligas' || product.league === selectedLeague;

    const matchesType =
      selectedType === 'Todos os Modelos' || product.type === selectedType;

    return matchesSearch && matchesLeague && matchesType;
  });

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      
      <ModeSelector />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por clube, liga ou edição..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {LEAGUES.map((league) => (
              <button
                key={league}
                onClick={() => setSelectedLeague(league)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedLeague === league
                    ? 'bg-zinc-200 text-black shadow'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {league}
              </button>
            ))}
          </div>

        </div>

        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-400" /> Modelo:
          </span>
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                selectedType === t
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t === 'Todos os Modelos' ? 'Todos' : t}
            </button>
          ))}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              {selectedMode === 'wholesale' ? (
                <>
                  <Flame className="w-5 h-5 text-emerald-400" />
                  Catálogo de Atacado (Grade Rápida)
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Catálogo de Varejo (Unidade com Valor Agregado)
                </>
              )}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Exibindo <strong>{filteredProducts.length}</strong> camisas prontas para despacho imediato
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-zinc-400">
              {selectedMode === 'wholesale'
                ? 'Selecione as quantidades na grade do card e envie ao carrinho'
                : 'Selecione o tamanho e compre avulso com opção de estampa oficial'}
            </span>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
            <p className="font-bold text-lg text-zinc-300">Nenhum modelo encontrado</p>
            <p className="text-xs text-zinc-500 mt-1">Tente remover alguns filtros ou buscar por outro termo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) =>
              selectedMode === 'wholesale' ? (
                <ProductCardWholesale key={product.id} product={product} />
              ) : (
                <ProductCardRetail key={product.id} product={product} />
              )
            )}
          </div>
        )}
      </main>

    </div>
  );
}

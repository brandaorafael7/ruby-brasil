'use client';

import React from 'react';
import { Flame, ShoppingBag, Zap, Truck, Layers } from 'lucide-react';
import { useCartStore } from '@/lib/store';

export default function ModeSelector() {
  const { selectedMode, setSelectedMode } = useCartStore();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        
        {/* Card Atacado */}
        <div
          id="wholesale-mode-card"
          onClick={() => setSelectedMode('wholesale')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 transition-all duration-300 border-2 relative overflow-hidden ${
            selectedMode === 'wholesale'
              ? 'bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-950 border-emerald-500 shadow-xl shadow-emerald-950/40'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 opacity-75 hover:opacity-100'
          }`}
        >
          {selectedMode === 'wholesale' && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Aba Selecionada (Fábrica)
            </div>
          )}

          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl ${selectedMode === 'wholesale' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-emerald-400'}`}>
              <Flame className="w-6 h-6 fill-current" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Ambiente de Atacado & Revenda
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  10+ peças
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1">
                Grade rápida de tamanhos (P, M, G, GG no mesmo card), preços decrescentes por volume e <strong>Frete Grátis</strong> no Lote de 6.000 camisas.
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-semibold">
                <span className="bg-zinc-800/80 text-zinc-300 px-2 py-1 rounded-md border border-zinc-700/60 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  10-29 un: <strong>R$ 65,00</strong>
                </span>
                <span className="bg-zinc-800/80 text-zinc-300 px-2 py-1 rounded-md border border-zinc-700/60 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  30-59 un: <strong>R$ 55,00</strong>
                </span>
                <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded-md border border-amber-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  60+ un: <strong>R$ 48,00</strong>
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-emerald-400" />
                  Frete Grátis Ativo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Varejo */}
        <div
          id="retail-mode-card"
          onClick={() => setSelectedMode('retail')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 transition-all duration-300 border-2 relative overflow-hidden ${
            selectedMode === 'retail'
              ? 'bg-gradient-to-br from-amber-950/60 via-zinc-900 to-zinc-950 border-amber-500 shadow-xl shadow-amber-950/30'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 opacity-75 hover:opacity-100'
          }`}
        >
          {selectedMode === 'retail' && (
            <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Aba Selecionada (Varejo)
            </div>
          )}

          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl ${selectedMode === 'retail' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-amber-400'}`}>
              <ShoppingBag className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Compre no Varejo / Amostras
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  1 a 9 peças
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1">
                Ideal para compras individuais, presentes ou para conferir a qualidade das camisas antes de fechar o lote de revenda.
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-semibold">
                <span className="bg-zinc-800/80 text-zinc-300 px-2 py-1 rounded-md border border-zinc-700/60">
                  A partir de <strong>R$ 139,90/un</strong>
                </span>
                <span className="bg-zinc-800/80 text-zinc-300 px-2 py-1 rounded-md border border-zinc-700/60">
                  Sem Pedido Mínimo
                </span>
                <span className="bg-zinc-800/80 text-zinc-300 px-2 py-1 rounded-md border border-zinc-700/60">
                  Personalização Opcional (+R$ 15)
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

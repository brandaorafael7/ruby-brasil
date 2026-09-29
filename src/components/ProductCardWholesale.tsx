'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Minus, Check, Layers, Flame } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

interface Props {
  product: Product;
}

export default function ProductCardWholesale({ product }: Props) {
  const { addGrid } = useCartStore();
  const [grid, setGrid] = useState<Record<string, number>>({
    P: 0,
    M: 0,
    G: 0,
    GG: 0,
    XG: 0,
    '3XL': 0,
    '4XL': 0,
  });
  const [justAdded, setJustAdded] = useState(false);

  const totalSelected = Object.values(grid).reduce((acc, qty) => acc + qty, 0);

  const handleQtyChange = (size: string, delta: number) => {
    setGrid((prev) => {
      const current = prev[size] || 0;
      const nextVal = Math.max(0, current + delta);
      return { ...prev, [size]: nextVal };
    });
  };

  const handleAddGrid = () => {
    if (totalSelected === 0) return;
    addGrid(product, grid);
    setJustAdded(true);
    setGrid({ P: 0, M: 0, G: 0, GG: 0, XG: 0, '3XL': 0, '4XL': 0 });
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 flex flex-col group shadow-lg shadow-black/40">
      
      <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          unoptimized={product.imageUrl?.startsWith('data:')}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40" />

        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          <span className="bg-emerald-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow backdrop-blur-sm">
            {product.league}
          </span>
          <span className="bg-zinc-900/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/30 backdrop-blur-sm">
            {product.season}
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="bg-black/80 text-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-zinc-700">
            {product.type}
          </span>
        </div>

        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-zinc-950/90 backdrop-blur-md rounded-xl p-2 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Preço Fábrica no Atacado</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-emerald-400">R$ 48,00</span>
              <span className="text-[11px] text-zinc-500 line-through">Varejo: {formatCurrency(product.retailPrice)}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
            Até 70% Margem
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-emerald-300 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
            {product.description || 'Tecido respirável de alta tecnologia, escudos bordados e acabamento oficial.'}
          </p>

          <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800/80 my-3 text-[10px] text-center font-medium">
            <div className="p-1 rounded bg-zinc-900/60">
              <span className="text-zinc-400 block">10 a 29 un</span>
              <strong className="text-white">R$ 65,00</strong>
            </div>
            <div className="p-1 rounded bg-zinc-900/60">
              <span className="text-zinc-400 block">30 a 59 un</span>
              <strong className="text-emerald-400">R$ 55,00</strong>
            </div>
            <div className="p-1 rounded bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-300 block">60+ un</span>
              <strong className="text-amber-400">R$ 48,00</strong>
            </div>
          </div>
        </div>

        <div className="mt-2 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-zinc-200 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Grade de Tamanhos:
            </span>
            <span className="text-zinc-400 text-[11px]">
              Selecionados: <strong className="text-emerald-400 font-bold">{totalSelected}</strong>
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {['P', 'M', 'G', 'GG', 'XG', '3XL', '4XL'].map((size) => {
              const count = grid[size] || 0;
              return (
                <div
                  key={size}
                  className={`flex flex-col items-center justify-between p-1.5 rounded-xl border text-center transition-all ${
                    count > 0
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800'
                  }`}
                >
                  <span className="text-xs font-black text-zinc-300">{size}</span>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(size, -1)}
                      className="w-5 h-5 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 disabled:opacity-30 disabled:pointer-events-none"
                      disabled={count === 0}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    
                    <span className="w-5 text-xs font-bold text-white text-center">
                      {count}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleQtyChange(size, 1)}
                      className="w-5 h-5 rounded-md bg-zinc-800 hover:bg-emerald-600 flex items-center justify-center text-zinc-300 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddGrid}
            disabled={totalSelected === 0}
            className={`w-full mt-3 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
              totalSelected > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 cursor-pointer active:scale-95'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                Grade Adicionada!
              </>
            ) : totalSelected > 0 ? (
              <>
                <Flame className="w-4 h-4 text-amber-300" />
                Adicionar Grade ({totalSelected} {totalSelected === 1 ? 'camisa' : 'camisas'})
              </>
            ) : (
              'Selecione os tamanhos'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

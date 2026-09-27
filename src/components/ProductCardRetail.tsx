'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, Shirt, Check, ArrowRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import CustomizationModal from './CustomizationModal';

interface Props {
  product: Product;
}

export default function ProductCardRetail({ product }: Props) {
  const { addItem, setSelectedMode } = useCartStore();
  const [selectedSize, setSelectedSize] = useState('M');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleBuy = () => {
    addItem(product, selectedSize, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleCustomConfirm = (name: string, number: string) => {
    addItem(product, selectedSize, 1, name, number);
  };

  return (
    <>
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 flex flex-col group shadow-lg shadow-black/40">
        
        <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40" />

          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
            <span className="bg-amber-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow backdrop-blur-sm">
              {product.league}
            </span>
            <span className="bg-zinc-900/90 text-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-zinc-700 backdrop-blur-sm">
              {product.season}
            </span>
          </div>

          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="bg-black/80 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
              Varejo Oficial
            </span>
          </div>

          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-zinc-950/90 backdrop-blur-md rounded-xl p-2.5 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Preço Unitário (Varejo)</span>
              <span className="text-lg font-black text-amber-400">
                {formatCurrency(product.retailPrice)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">em até 3x de</span>
              <span className="text-xs font-bold text-white">
                {formatCurrency(product.retailPrice / 3)} s/ juros
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-amber-300 transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
              {product.description || 'Padrão torcedor oficial com detalhes bordados e tecnologia de secagem rápida.'}
            </p>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-300">Escolha o Tamanho:</span>
                <span className="text-[11px] text-emerald-400 font-medium">Em Estoque</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {['P', 'M', 'G', 'GG'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      selectedSize === size
                        ? 'bg-amber-500 border-amber-400 text-black shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCustomOpen(true)}
              className="w-full mt-2.5 py-1.5 px-3 rounded-lg border border-dashed border-zinc-700 hover:border-amber-500/60 bg-zinc-950/60 text-zinc-300 hover:text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Shirt className="w-3.5 h-3.5 text-amber-400" />
              Personalizar Nome e Número (+ R$ 15,00)
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800/80">
            <div
              onClick={() => setSelectedMode('wholesale')}
              className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-1.5 mb-2.5 text-[10px] text-zinc-300 flex items-center justify-between cursor-pointer hover:bg-emerald-950/50 transition-colors"
            >
              <span>
                Comprando <strong className="text-emerald-400">10+ peças</strong> sai a <strong className="text-amber-300">R$ 65,00</strong> com Frete Grátis!
              </span>
              <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
            </div>

            <button
              type="button"
              data-testid="buy-retail-btn"
              onClick={handleBuy}
              className="buy-retail-btn w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-950/50"
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  Adicionado ao Carrinho!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  Comprar 1 Peça ({selectedSize})
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      <CustomizationModal
        isOpen={isCustomOpen}
        onClose={() => setIsCustomOpen(false)}
        product={product}
        selectedSize={selectedSize}
        onConfirm={handleCustomConfirm}
      />
    </>
  );
}

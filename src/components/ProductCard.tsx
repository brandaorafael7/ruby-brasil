'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, Shirt, Check, Sparkles } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { formatCurrency, getSizeSurcharge } from '@/lib/utils';
import CustomizationModal from './CustomizationModal';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCartStore();

  const isKids =
    product.type === 'INFANTIL' ||
    product.league?.toLowerCase().includes('infantil') ||
    product.name?.toLowerCase().includes('infantil') ||
    product.name?.toLowerCase().includes('kids');

  const ADULT_SIZES = ['P', 'M', 'G', 'GG', 'XG', '3XL', '4XL'];
  const KIDS_SIZES = ['16', '18', '20', '22', '24', '26', '28'];

  const availableSizes = isKids ? KIDS_SIZES : ADULT_SIZES;

  const [selectedSize, setSelectedSize] = useState(() =>
    isKids
      ? availableSizes.includes('22')
        ? '22'
        : availableSizes[0]
      : availableSizes.includes('M')
      ? 'M'
      : availableSizes[0]
  );
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const basePrice = product.retailPrice || 60.0;
  const surcharge = getSizeSurcharge(selectedSize);
  const currentPrice = basePrice + surcharge;

  const handleBuy = () => {
    addItem(product, selectedSize, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const handleCustomConfirm = (name: string, number: string) => {
    addItem(product, selectedSize, 1, name, number);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <>
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden hover:border-rose-500/50 transition-all duration-300 flex flex-col group shadow-lg shadow-black/40 hover:shadow-rose-950/20">
        
        {/* IMAGEM E TAGS */}
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

          {/* BADGES NO TOPO */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
            {isKids ? (
              <span className="bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow backdrop-blur-sm">
                👶 Kit Infantil (Camisa + Calção)
              </span>
            ) : (
              <span className="bg-rose-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow backdrop-blur-sm">
                {product.league || 'Tailandesa 1:1'}
              </span>
            )}
            {product.season && (
              <span className="bg-zinc-900/90 text-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-zinc-700 backdrop-blur-sm">
                {product.season}
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="bg-black/80 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
              Pronta Entrega
            </span>
          </div>

          {/* FAIXA DE PREÇO */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-zinc-950/90 backdrop-blur-md rounded-xl p-2.5 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Valor Unitário</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white">
                  {formatCurrency(currentPrice)}
                </span>
                {surcharge > 0 && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    +{formatCurrency(surcharge)} ({selectedSize})
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {surcharge > 0 ? `${formatCurrency(55 + surcharge)} (50+ un)` : 'R$ 55 (50+ un)'}
              </span>
            </div>
          </div>
        </div>

        {/* CORPO DO CARD */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-rose-300 transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
              {product.description || (isKids ? 'Kit infantil com camisa oficial e calção com cordão elástico.' : 'Padrão torcedor oficial com detalhes bordados e tecnologia de secagem rápida.')}
            </p>

            {/* SELETOR DE TAMANHO */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-300">
                  {isKids ? 'Idade / Tamanho Infantil:' : 'Escolha o Tamanho:'}
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">Em Estoque</span>
              </div>
              <div className={`grid ${availableSizes.length > 5 ? 'grid-cols-7' : 'grid-cols-5'} gap-1`}>
                {availableSizes.map((size) => {
                  const sizeExtra = getSizeSurcharge(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`py-1.5 px-0.5 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                        selectedSize === size
                          ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-950/50'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span className="leading-tight">{size}</span>
                      {sizeExtra > 0 && (
                        <span className={`text-[8px] font-semibold leading-none mt-0.5 ${selectedSize === size ? 'text-rose-200' : 'text-amber-400'}`}>
                          +{sizeExtra}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={handleBuy}
              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-lg shadow-rose-950/60 active:scale-95'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Adicionado ao Carrinho!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  Comprar ({selectedSize})
                </>
              )}
            </button>

            {product.allowCustom && (
              <button
                type="button"
                onClick={() => setIsCustomOpen(true)}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Shirt className="w-3.5 h-3.5 text-amber-400" />
                Personalizar Nome e Número (+ R$ 15)
              </button>
            )}
          </div>
        </div>

      </div>

      {product.allowCustom && (
        <CustomizationModal
          isOpen={isCustomOpen}
          onClose={() => setIsCustomOpen(false)}
          product={product}
          selectedSize={selectedSize}
          onConfirm={handleCustomConfirm}
        />
      )}
    </>
  );
}

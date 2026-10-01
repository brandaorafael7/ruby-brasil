'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Shirt, Check, Sparkles, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store';
import { formatCurrency, getSizeSurcharge, getStandardSizesForProduct } from '@/lib/utils';
import CustomizationModal from './CustomizationModal';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { items, addItem, openCart } = useCartStore();

  const isKids =
    product.type === 'INFANTIL' ||
    product.league?.toLowerCase().includes('infantil') ||
    product.name?.toLowerCase().includes('infantil') ||
    product.name?.toLowerCase().includes('kids');

  const standardSizes = getStandardSizesForProduct(product);

  const sizeInfoList = standardSizes.map((size) => {
    const variant = product.variants?.find((v) => v.size === size);
    // Respect stockQuantity from product.variants if loaded; fallback to available if product has no variants defined
    const stock = variant !== undefined ? variant.stockQuantity : (product.variants?.length ? 0 : 50);
    const inStock = stock > 0;
    const surcharge = getSizeSurcharge(size);
    return {
      size,
      stock,
      inStock,
      surcharge,
    };
  });

  const [selectedSize, setSelectedSize] = useState(() => {
    const preferred = isKids ? '22' : 'M';
    const preferredInfo = sizeInfoList.find((s) => s.size === preferred);
    if (preferredInfo && preferredInfo.inStock) {
      return preferred;
    }
    const firstInStock = sizeInfoList.find((s) => s.inStock);
    if (firstInStock) {
      return firstInStock.size;
    }
    return standardSizes[0] || 'M';
  });

  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedInfo = sizeInfoList.find((s) => s.size === selectedSize);
  const inCartForSelectedSize = items
    .filter((i) => i.productId === product.id && i.size === selectedSize)
    .reduce((sum, i) => sum + i.quantity, 0);
  const remainingStock = Math.max(0, (selectedInfo?.stock || 0) - inCartForSelectedSize);
  const isAvailableToAdd = (selectedInfo?.inStock || false) && remainingStock > 0;

  const basePrice = product.retailPrice || 60.0;
  const surcharge = getSizeSurcharge(selectedSize);
  const currentPrice = basePrice + surcharge;

  const handleBuy = () => {
    if (!isAvailableToAdd) return;
    const res = addItem(product, selectedSize, 1);
    if (res.success) {
      setJustAdded(true);
      openCart();
      setTimeout(() => setJustAdded(false), 1800);
    }
  };

  const handleCustomConfirm = (name: string, number: string) => {
    if (!isAvailableToAdd) return;
    const res = addItem(product, selectedSize, 1, name, number);
    if (res.success) {
      setJustAdded(true);
      openCart();
      setTimeout(() => setJustAdded(false), 1800);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/produto/${product.slug}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <>
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden hover:border-rose-500/50 transition-all duration-300 flex flex-col group shadow-lg shadow-black/40 hover:shadow-rose-950/20">
        
        {/* IMAGEM E TAGS */}
        <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
          <Link
            href={`/produto/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Clique para abrir esta camisa em uma nova aba"
            className="block w-full h-full cursor-pointer"
          >
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              unoptimized={product.imageUrl?.startsWith('data:')}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40" />
          </Link>

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

          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
            <span className="bg-black/80 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
              Pronta Entrega
            </span>
            <Link
              href={`/produto/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir em nova aba"
              className="p-1 rounded-md bg-black/80 hover:bg-rose-600 text-zinc-300 hover:text-white border border-zinc-700/80 transition-all flex items-center justify-center shadow-md"
            >
              <ExternalLink className="w-3 h-3" />
            </Link>
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
            <div className="flex items-start justify-between gap-1.5">
              <Link
                href={`/produto/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir em nova aba"
                className="text-sm font-bold text-white line-clamp-2 hover:text-rose-400 transition-colors flex-1"
              >
                {product.name}
              </Link>
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copiar link deste item para enviar ao cliente"
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors shrink-0"
              >
                {copiedLink ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
              {product.description || (isKids ? 'Kit infantil com camisa oficial e calção com cordão elástico.' : 'Padrão torcedor oficial com detalhes bordados e tecnologia de secagem rápida.')}
            </p>

            {/* SELETOR DE TAMANHO */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-300">
                  {isKids ? 'Idade / Tamanho Infantil:' : 'Escolha o Tamanho:'}
                </span>
                {!selectedInfo?.inStock ? (
                  <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Esgotado
                  </span>
                ) : remainingStock === 0 ? (
                  <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Máximo no Carrinho
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Em Estoque ({remainingStock} un)
                  </span>
                )}
              </div>
              <div className={`grid ${standardSizes.length > 5 ? 'grid-cols-7' : 'grid-cols-5'} gap-1`}>
                {sizeInfoList.map((info) => {
                  const isSelected = selectedSize === info.size;
                  const inCartForThisSize = items
                    .filter((i) => i.productId === product.id && i.size === info.size)
                    .reduce((sum, i) => sum + i.quantity, 0);
                  const remForThisSize = Math.max(0, info.stock - inCartForThisSize);
                  const isSoldOut = !info.inStock;
                  const isMaxInCart = !isSoldOut && remForThisSize === 0;

                  return (
                    <button
                      key={info.size}
                      type="button"
                      onClick={() => setSelectedSize(info.size)}
                      className={`py-1.5 px-0.5 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center relative ${
                        isSelected
                          ? !isSoldOut && !isMaxInCart
                            ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-950/50'
                            : 'bg-zinc-800 border-rose-500/80 text-rose-300'
                          : isSoldOut || isMaxInCart
                          ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-600 hover:border-zinc-700'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span className={`leading-tight ${isSoldOut ? 'line-through opacity-60 text-zinc-500' : ''}`}>
                        {info.size}
                      </span>
                      {info.surcharge > 0 && !isSoldOut && (
                        <span
                          className={`text-[8px] font-semibold leading-none mt-0.5 ${
                            isSelected ? 'text-rose-200' : 'text-amber-400'
                          }`}
                        >
                          +{info.surcharge}
                        </span>
                      )}
                      {isSoldOut ? (
                        <span className="text-[7px] text-rose-400/90 font-semibold leading-none mt-0.5">
                          Esgotado
                        </span>
                      ) : isMaxInCart ? (
                        <span className="text-[7px] text-amber-400/90 font-semibold leading-none mt-0.5">
                          No Carrinho
                        </span>
                      ) : null}
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
              disabled={!isAvailableToAdd}
              onClick={handleBuy}
              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : !isAvailableToAdd
                  ? 'bg-zinc-800/80 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-lg shadow-rose-950/60 active:scale-95'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Adicionado ao Carrinho!
                </>
              ) : !selectedInfo?.inStock ? (
                <>Tamanho {selectedSize} Esgotado</>
              ) : remainingStock === 0 ? (
                <>Limite no Carrinho ({selectedInfo?.stock} un)</>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  Adicionar ao Carrinho ({selectedSize})
                </>
              )}
            </button>

            {product.allowCustom && (
              <button
                type="button"
                disabled={!isAvailableToAdd}
                onClick={() => isAvailableToAdd && setIsCustomOpen(true)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                  !isAvailableToAdd
                    ? 'opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-600'
                    : 'text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800'
                }`}
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

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Check,
  Copy,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store';
import {
  formatCurrency,
  getSizeSurcharge,
  getStandardSizesForProduct,
  getProductPreSaleInfo,
} from '@/lib/utils';
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

  const { isPreSale, preSaleEta } = getProductPreSaleInfo(product);

  const standardSizes = getStandardSizesForProduct(product);

  const sizeInfoList = standardSizes.map((size) => {
    const variant = product.variants?.find((v) => v.size === size);
    const stock =
      variant !== undefined
        ? variant.stockQuantity
        : product.variants?.length
        ? 0
        : 50;
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
  const [imgError, setImgError] = useState(false);

  const selectedInfo = sizeInfoList.find((s) => s.size === selectedSize);
  const inCartForSelectedSize = items
    .filter((i) => i.productId === product.id && i.size === selectedSize)
    .reduce((sum, i) => sum + i.quantity, 0);
  const remainingStock = Math.max(
    0,
    (selectedInfo?.stock || 0) - inCartForSelectedSize
  );
  const isAvailableToAdd =
    (selectedInfo?.inStock || false) && remainingStock > 0;

  const basePrice = product.retailPrice || 60.0;
  const surcharge = getSizeSurcharge(selectedSize);
  const currentPrice = basePrice + surcharge;

  const handleBuy = () => {
    if (!isAvailableToAdd) return;
    const res = addItem(product, selectedSize, 1);
    if (res.success) {
      setJustAdded(true);
      openCart();
      setTimeout(() => setJustAdded(false), 1600);
    }
  };

  const handleCustomConfirm = (name: string, number: string) => {
    if (!isAvailableToAdd) return;
    const res = addItem(product, selectedSize, 1, name, number);
    if (res.success) {
      setJustAdded(true);
      openCart();
      setTimeout(() => setJustAdded(false), 1600);
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

  const versionLabel = isKids
    ? 'KIT INFANTIL'
    : product.type === 'JOGADOR'
    ? 'VERSÃO JOGADOR'
    : product.type === 'RETRO'
    ? 'ARQUIVO RETRÔ'
    : 'TORCEDOR 1:1';

  return (
    <>
      <article
        className="group rounded-2xl border overflow-hidden flex flex-col justify-between tactile"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: isPreSale ? 'rgba(245, 158, 11, 0.45)' : 'var(--border-crisp)',
        }}
      >
        <div>
          {/* MOLDURA DE ESTÚDIO 4:5 (Estilo END. Clothing / Nike) */}
          <div
            className="relative aspect-[4/5] overflow-hidden border-b flex flex-col justify-between p-3.5 sm:p-4"
            style={{
              backgroundColor: 'var(--bg-studio)',
              borderColor: 'var(--border-crisp)',
            }}
          >
            {/* Imagem Oficial da Camisa ou Fallback Vetorial */}
            <Link
              href={`/produto/${product.slug}`}
              className="absolute inset-0 block cursor-pointer overflow-hidden"
              title={product.name}
            >
              {!imgError && product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  unoptimized={product.imageUrl?.startsWith('data:')}
                  onError={() => setImgError(true)}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover jersey-zoom"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-10 jersey-zoom">
                  <img
                    src="/ruby-brasil-icon.png"
                    alt={product.name}
                    className="w-28 h-28 object-contain opacity-80 ruby-icon-adaptive"
                  />
                </div>
              )}
            </Link>

            {/* Linha Superior Discreta: Status Pré-Venda ou Versão + Personalizar */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              {isPreSale ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-sm inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <Clock className="w-3 h-3 stroke-[2.5] shrink-0" />
                  <span>Pré-Venda</span>
                </span>
              ) : (
                <span
                  className="px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shrink-0 whitespace-nowrap"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--bg-surface) 90%, transparent)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {versionLabel}
                </span>
              )}

              {product.allowCustom !== false && (
                <button
                  type="button"
                  disabled={!isAvailableToAdd}
                  onClick={() => isAvailableToAdd && setIsCustomOpen(true)}
                  className="px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider backdrop-blur-md hover:border-rose-600 hover:text-rose-600 tactile disabled:opacity-40 shrink-0 whitespace-nowrap"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--bg-surface) 90%, transparent)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-primary)',
                  }}
                  title="Personalizar Nome e Número (+ R$ 15)"
                >
                  Personalizar ✎
                </button>
              )}
            </div>

            {/* Rodapé Discreto da Moldura: Clube/Liga & Temporada */}
            <div className="relative z-10 flex items-center justify-between gap-2 pointer-events-none">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase backdrop-blur-md border truncate max-w-[70%]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--bg-surface) 88%, transparent)',
                  borderColor: 'var(--border-crisp)',
                  color: 'var(--text-secondary)',
                }}
              >
                {product.club || product.league || 'Oficial 1:1'}
              </span>
              {product.season && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold backdrop-blur-md border shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--bg-surface) 88%, transparent)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {product.season}
                </span>
              )}
            </div>
          </div>

          {/* INFORMAÇÕES EDITORIAIS E SELETOR TÁTIL DE TAMANHO */}
          <div className="p-4 space-y-3">
            <div>
              {isPreSale && preSaleEta && (
                <div className="mb-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400 truncate">
                  ⏳ {preSaleEta}
                </div>
              )}

              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/produto/${product.slug}`}
                  className="text-sm font-bold leading-snug line-clamp-2 hover:text-rose-600 tactile flex-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {product.name}
                </Link>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copiar link desta camisa"
                  className="p-1 rounded-md border tactile shrink-0 hover:opacity-80"
                  style={{
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {copiedLink ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="mt-1.5 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-lg font-black font-mono tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {formatCurrency(currentPrice)}
                  </span>
                  {surcharge > 0 && (
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                      +{formatCurrency(surcharge)} ({selectedSize})
                    </span>
                  )}
                </div>
                <span
                  className="text-[11px] font-mono font-semibold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Tailandesa 1:1
                </span>
              </div>
            </div>

            {/* Seletor de Grade Direto */}
            <div>
              <div
                className="flex items-center justify-between text-[11px] font-mono mb-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>
                  TAM: <strong style={{ color: 'var(--text-primary)' }}>{selectedSize}</strong>
                </span>
                {!selectedInfo?.inStock ? (
                  <span className="text-rose-600 font-bold">Esgotado</span>
                ) : remainingStock === 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    Limite na Sacola
                  </span>
                ) : isPreSale ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Reserva ({remainingStock} un)
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Disponível ({remainingStock} un)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
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
                      className={`h-7 min-w-[34px] px-1.5 rounded-md font-mono text-xs font-bold border tactile ${
                        isSelected
                          ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white'
                          : isSoldOut || isMaxInCart
                          ? 'opacity-40 line-through'
                          : 'hover:border-zinc-500'
                      }`}
                      style={
                        !isSelected
                          ? {
                              backgroundColor: 'var(--bg-canvas)',
                              borderColor: 'var(--border-crisp)',
                              color: 'var(--text-secondary)',
                            }
                          : undefined
                      }
                    >
                      {info.size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Principal */}
        <div className="px-4 pb-4">
          <button
            type="button"
            disabled={!isAvailableToAdd}
            onClick={handleBuy}
            className={`w-full h-10 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tactile ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : !isAvailableToAdd
                ? 'opacity-40 cursor-not-allowed bg-zinc-500 text-white'
                : isPreSale
                ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>{isPreSale ? 'Reserva Adicionada!' : 'Adicionado à Sacola!'}</span>
              </>
            ) : !selectedInfo?.inStock ? (
              <span>Tamanho {selectedSize} Esgotado</span>
            ) : remainingStock === 0 ? (
              <span>Limite na Sacola ({selectedInfo?.stock} un)</span>
            ) : isPreSale ? (
              <span>⏳ Reservar Pré-Venda ({selectedSize})</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Adicionar à Sacola ({selectedSize})</span>
              </>
            )}
          </button>
        </div>
      </article>

      {product.allowCustom !== false && (
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

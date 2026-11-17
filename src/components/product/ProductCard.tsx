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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store';
import {
  formatCurrency,
  getSizeSurcharge,
  getStandardSizesForProduct,
  getProductPreSaleInfo,
  getProductGalleryImages,
  getEnglishSizeInfo,
  formatBilingualSize,
  isGradeProduct,
  getProductGradeInfo,
} from '@/lib/utils';
import CustomizationModal from './CustomizationModal';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { items, addItem, openCart } = useCartStore();

  const isGrade = isGradeProduct(product);
  const gradeInfo = isGrade ? getProductGradeInfo(product) : null;

  const isKids =
    !isGrade &&
    (product.type === 'INFANTIL' ||
      product.league?.toLowerCase().includes('infantil') ||
      product.name?.toLowerCase().includes('infantil') ||
      product.name?.toLowerCase().includes('kids'));

  const { isPreSale, preSaleEta } = getProductPreSaleInfo(product);
  const galleryImages = getProductGalleryImages(product);

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

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Pré-carrega todas as fotos da galeria no browser para troca instantânea (0ms)
  React.useEffect(() => {
    if (galleryImages.length > 1 && typeof window !== 'undefined') {
      galleryImages.slice(1).forEach((src) => {
        if (!src) return;
        const img = new window.Image();
        img.src = src;
      });
    }
  }, [galleryImages]);

  const handlePreloadImages = () => {
    if (galleryImages.length > 1 && typeof window !== 'undefined') {
      galleryImages.forEach((src) => {
        if (!src) return;
        const img = new window.Image();
        img.src = src;
      });
    }
  };

  const currentImageUrl =
    galleryImages[activeImageIdx] || galleryImages[0] || product.imageUrl || '';

  const selectedInfo = sizeInfoList.find((s) => s.size === selectedSize);
  const inCartForSelectedSize = items
    .filter((i) =>
      isGrade
        ? i.productId === product.id
        : i.productId === product.id && i.size === selectedSize
    )
    .reduce((sum, i) => sum + i.quantity, 0);
  const totalStockForSelected = isGrade
    ? gradeInfo?.gradeStock ?? 0
    : selectedInfo?.stock || 0;
  const remainingStock = Math.max(0, totalStockForSelected - inCartForSelectedSize);
  const isAvailableToAdd =
    (isGrade ? totalStockForSelected > 0 : selectedInfo?.inStock || false) &&
    remainingStock > 0;

  const basePrice = product.retailPrice || 60.0;
  const surcharge = isGrade ? 0 : getSizeSurcharge(selectedSize);
  const currentPrice = basePrice + surcharge;

  const handleBuy = () => {
    if (!isAvailableToAdd) return;
    const targetSize = isGrade && gradeInfo ? gradeInfo.compactLabel : selectedSize;
    const res = addItem(product, targetSize, 1);
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

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgError(false);
    setActiveImageIdx((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgError(false);
    setActiveImageIdx((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };

  const versionLabel = isGrade
    ? 'Grade Fechada (12 Peças)'
    : isKids
    ? 'Kit Infantil Oficial'
    : product.type === 'JOGADOR'
    ? 'Versão Jogador (Slim Fit)'
    : product.type === 'RETRO'
    ? 'Arquivo Retrô Clássico'
    : product.type === 'FEMININA'
    ? 'Modelagem Feminina'
    : 'Camisa Torcedor 1:1';

  const retailRefPrice = isGrade
    ? Math.max(currentPrice * 1.45, 960)
    : Math.max(currentPrice * 2.2, 149.9);
  const discountPct = Math.round(((retailRefPrice - currentPrice) / retailRefPrice) * 100);

  return (
    <>
      <article
        onMouseEnter={handlePreloadImages}
        className="group flex flex-col justify-between"
      >
        <div>
          {/* TILE DE IMAGEM ESTILO NIKE.COM.BR (Quadrado/Retrato Limpo em #F5F5F5 sem borda pesada) */}
          <div
            className="relative aspect-square overflow-hidden flex flex-col justify-between p-3"
            style={{
              backgroundColor: 'var(--bg-studio)',
            }}
          >
            {/* Imagem Oficial da Camisa com troca instantânea */}
            <Link
              href={`/produto/${product.slug}`}
              prefetch={false}
              className="absolute inset-0 block cursor-pointer overflow-hidden"
              title={product.name}
            >
              {!imgError && galleryImages.length > 0 ? (
                galleryImages.map((imgUrl, idx) => {
                  const isCurrent = idx === activeImageIdx;
                  return (
                    <Image
                      key={imgUrl || idx}
                      src={imgUrl}
                      alt={`${product.name} - Foto ${idx + 1}`}
                      fill
                      unoptimized
                      priority={idx === 0}
                      loading={idx === 0 ? 'lazy' : 'eager'}
                      onError={() => {
                        if (idx === 0) setImgError(true);
                      }}
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className={`object-cover jersey-zoom transition-opacity duration-200 ease-out ${
                        isCurrent
                          ? 'opacity-100 z-10'
                          : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    />
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center p-10 jersey-zoom">
                  <img
                    src="/ruby-brasil-icon.png"
                    alt={product.name}
                    className="w-24 h-24 object-contain opacity-75"
                  />
                </div>
              )}
            </Link>

            {/* Controles de Galeria Múltipla (quando houver 2+ fotos) */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Foto anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#111111] flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Próxima foto"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#111111] flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Topo do Tile: Selo Minimalista Estilo Nike + Botão Personalizar */}
            <div className="relative z-10 flex items-center justify-between gap-1.5">
              {isPreSale ? (
                <span className="px-2.5 py-1 rounded-sm bg-[#111111] text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>Pré-Venda</span>
                </span>
              ) : isGrade ? (
                <span className="px-2.5 py-1 rounded-sm bg-[#007d48] text-white text-[10px] font-bold uppercase tracking-wider shrink-0">
                  Grade 12 Peças
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-sm bg-white/95 text-[#111111] text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-sm">
                  -{discountPct}%
                </span>
              )}

              {!isGrade && product.allowCustom !== false && (
                <button
                  type="button"
                  disabled={!isAvailableToAdd}
                  onClick={() => isAvailableToAdd && setIsCustomOpen(true)}
                  className="px-2.5 py-1 rounded-full bg-white/95 hover:bg-[#111111] text-[#111111] hover:text-white text-[10px] font-bold transition-colors shadow-sm disabled:opacity-40 shrink-0"
                  title="Personalizar Nome e Número (+ R$ 15)"
                >
                  Personalizar ✎
                </button>
              )}
            </div>

            {/* Indicador de Fotos Discreto na Base da Imagem */}
            <div className="relative z-10 flex items-center justify-between gap-2 pointer-events-none">
              <span />
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-sm pointer-events-auto">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImgError(false);
                        setActiveImageIdx(idx);
                      }}
                      onMouseEnter={() => {
                        setImgError(false);
                        setActiveImageIdx(idx);
                      }}
                      aria-label={`Ver foto ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === activeImageIdx
                          ? 'w-3.5 bg-white'
                          : 'w-1.5 bg-white/45 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copiar link desta camisa"
                className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#111111] flex items-center justify-center pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                {copiedLink ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007d48]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* INFORMAÇÕES ABAIXO DA FOTO NO PADRÃO NIKE.COM.BR */}
          <div className="pt-3 space-y-2">
            <div>
              {/* Linha de Destaque Nike (Cor #9E3500) */}
              <div className="text-xs font-semibold text-[#9e3500] dark:text-amber-400 truncate">
                {isGrade
                  ? `Atacado • Grade Fechada (${gradeInfo?.totalPieces || 12} Peças)`
                  : isPreSale
                  ? `Pré-Venda • ${preSaleEta || 'Reserva Antecipada'}`
                  : 'Em Oferta • Direto de Fábrica'}
              </div>

              {/* Nome da Camisa */}
              <Link
                href={`/produto/${product.slug}`}
                prefetch={false}
                className="mt-0.5 text-sm sm:text-[15px] font-semibold leading-snug line-clamp-1 hover:opacity-75 transition-opacity block"
                style={{ color: 'var(--text-primary)' }}
              >
                {product.name}
              </Link>

              {/* Subtítulo / Categoria Estilo Nike (#707072) */}
              <p
                className="text-xs sm:text-[13px] truncate mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {versionLabel} • {product.club || product.league} {product.season ? `(${product.season})` : ''}
              </p>

              {/* Bloco de Preço Estilo Nike Ofertas */}
              <div className="mt-2 flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                <span
                  className="text-sm sm:text-base font-bold tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatCurrency(currentPrice)}
                </span>
                {isGrade ? (
                  <span className="text-xs font-bold text-[#007d48] dark:text-emerald-400">
                    ({formatCurrency(currentPrice / (gradeInfo?.totalPieces || 12))}/peça)
                  </span>
                ) : (
                  <>
                    <span
                      className="text-xs line-through tabular-nums"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {formatCurrency(retailRefPrice)}
                    </span>
                    <span className="text-xs font-bold text-[#007d48] dark:text-emerald-400">
                      {discountPct}% off
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Seletor de Tamanho Compacto ou Composição Fixa da Grade (12 Peças) */}
            {isGrade && gradeInfo ? (
              <div
                className="p-2.5 rounded-lg border space-y-1.5"
                style={{
                  backgroundColor: 'var(--bg-studio)',
                  borderColor: 'var(--border-crisp)',
                }}
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Tamanhos na Grade ({gradeInfo.totalPieces} un):
                  </span>
                  {totalStockForSelected <= 0 ? (
                    <span className="text-rose-600 font-bold">Esgotada</span>
                  ) : (
                    <span className="text-[#007d48] dark:text-emerald-400 font-bold">
                      {remainingStock} disp.
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {gradeInfo.entries.map((entry) => (
                    <span
                      key={entry.size}
                      className="px-2 py-0.5 rounded border text-[11px] font-semibold"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-crisp)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <strong>{entry.quantity}x</strong> {entry.size}
                      {entry.enCode !== entry.size ? `(${entry.enCode})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-1">
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
                        title={`Tamanho ${info.size} (EN: ${getEnglishSizeInfo(info.size).enCode})`}
                        className={`h-7 min-w-[32px] px-1.5 rounded text-[11px] font-semibold border transition-colors ${
                          isSelected
                            ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-zinc-950 dark:border-white'
                            : isSoldOut || isMaxInCart
                            ? 'opacity-35 line-through'
                            : 'hover:border-[#111111] dark:hover:border-white'
                        }`}
                        style={
                          !isSelected
                            ? {
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-crisp)',
                                color: 'var(--text-primary)',
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
            )}
          </div>
        </div>

        {/* Botão Pílula Preto Estilo Nike.com.br */}
        <div className="pt-3">
          <button
            type="button"
            disabled={!isAvailableToAdd}
            onClick={handleBuy}
            className={`w-full h-10 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
              justAdded
                ? 'bg-[#007d48] text-white'
                : !isAvailableToAdd
                ? 'opacity-40 cursor-not-allowed bg-zinc-400 text-white'
                : 'bg-[#111111] hover:bg-[#333333] text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>{isGrade ? 'Grade Adicionada' : 'Adicionado à Sacola'}</span>
              </>
            ) : isGrade ? (
              totalStockForSelected <= 0 ? (
                <span>Grade Esgotada</span>
              ) : remainingStock === 0 ? (
                <span>Limite na Sacola</span>
              ) : (
                <span>Adicionar Grade (12 Peças)</span>
              )
            ) : !selectedInfo?.inStock ? (
              <span>Tamanho {selectedSize} Indisponível</span>
            ) : remainingStock === 0 ? (
              <span>Limite na Sacola ({selectedInfo?.stock} un)</span>
            ) : isPreSale ? (
              <span>Reservar Pré-Venda ({formatBilingualSize(selectedSize)})</span>
            ) : (
              <span>Adicionar à Sacola ({formatBilingualSize(selectedSize)})</span>
            )}
          </button>
        </div>
      </article>

      {!isGrade && product.allowCustom !== false && (
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

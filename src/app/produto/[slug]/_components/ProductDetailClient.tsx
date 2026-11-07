'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Shirt,
  Check,
  Sparkles,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Copy,
  ExternalLink,
  MessageCircle,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  CalendarClock,
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
} from '@/lib/utils';
import CustomizationModal from '@/components/product/CustomizationModal';
import ProductCard from '@/components/product/ProductCard';

interface Props {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({ product, relatedProducts }: Props) {
  const { items, addItem, openCart, getTotalPieces } = useCartStore();

  const isKids =
    product.type === 'INFANTIL' ||
    product.league?.toLowerCase().includes('infantil') ||
    product.name?.toLowerCase().includes('infantil') ||
    product.name?.toLowerCase().includes('kids');

  const { isPreSale, preSaleEta } = getProductPreSaleInfo(product);
  const galleryImages = getProductGalleryImages(product);

  const standardSizes = getStandardSizesForProduct(product);

  const sizeInfoList = standardSizes.map((size) => {
    const variant = product.variants?.find((v) => v.size === size);
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

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Pré-carrega todas as fotos da galeria no browser para troca instantânea (0ms)
  React.useEffect(() => {
    if (galleryImages.length > 1 && typeof window !== 'undefined') {
      galleryImages.forEach((src) => {
        if (!src) return;
        const img = new window.Image();
        img.src = src;
      });
    }
  }, [galleryImages]);

  const currentImageUrl =
    galleryImages[activeImageIdx] || galleryImages[0] || product.imageUrl || '';

  const selectedInfo = sizeInfoList.find((s) => s.size === selectedSize);
  const inCartForSelectedSize = items
    .filter((i) => i.productId === product.id && i.size === selectedSize)
    .reduce((sum, i) => sum + i.quantity, 0);
  const maxAvailable = Math.max(0, (selectedInfo?.stock || 0) - inCartForSelectedSize);
  const isAvailableToAdd = (selectedInfo?.inStock || false) && maxAvailable > 0;

  React.useEffect(() => {
    if (maxAvailable > 0 && quantity > maxAvailable) {
      setQuantity(maxAvailable);
    } else if (maxAvailable === 0 && quantity > 1) {
      setQuantity(1);
    }
  }, [selectedSize, maxAvailable, quantity]);

  const basePrice = product.retailPrice || 60.0;
  const surcharge = getSizeSurcharge(selectedSize);
  const currentUnitPrice = basePrice + surcharge;
  const totalPrice = currentUnitPrice * quantity;

  const handleBuy = () => {
    if (!isAvailableToAdd) return;
    const qtyToAdd = Math.min(quantity, maxAvailable);
    const res = addItem(product, selectedSize, qtyToAdd);
    if (res.success) {
      setJustAdded(true);
      openCart();
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (!isAvailableToAdd) return;
    const qtyToAdd = Math.min(quantity, maxAvailable);
    const res = addItem(product, selectedSize, qtyToAdd);
    if (res.success) {
      openCart();
    }
  };

  const handleCustomConfirm = (name: string, number: string) => {
    if (!isAvailableToAdd) return;
    const qtyToAdd = Math.min(quantity, maxAvailable);
    const res = addItem(product, selectedSize, qtyToAdd, name, number);
    if (res.success) {
      setJustAdded(true);
      openCart();
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== 'undefined') {
      const pageUrl = window.location.href;
      const prefix = isPreSale ? `[PRÉ-VENDA] ` : '';
      const text = `Confira a camisa ${prefix}*${product.name}* na Ruby Brasil:\n${pageUrl}`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* NAVEGAÇÃO / BREADCRUMB */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-900">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-rose-400" />
            Voltar ao Catálogo Completo
          </Link>

          {/* BOTÕES DE COMPARTILHAMENTO DESTE ITEM */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm"
              title="Copiar link para enviar ao cliente"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all shadow-sm"
              title="Compartilhar no WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Enviar no WhatsApp</span>
            </button>
          </div>
        </div>

        {/* CONTAINER PRINCIPAL DO PRODUTO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-4 sm:p-8 backdrop-blur-sm shadow-2xl">
          {/* COLUNA ESQUERDA: FOTO GRANDE DA PEÇA + MINIATURAS DA GALERIA */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="relative aspect-[4/3] sm:aspect-square w-full rounded-2xl bg-zinc-950 overflow-hidden border border-zinc-800 shadow-inner group">
              {galleryImages.length > 0 ? (
                galleryImages.map((imgUrl, idx) => {
                  const isCurrent = idx === activeImageIdx;
                  return (
                    <Image
                      key={imgUrl || idx}
                      src={imgUrl}
                      alt={`${product.name} - Foto ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      loading={idx === 0 ? undefined : 'eager'}
                      unoptimized
                      className={`object-cover transition-opacity duration-200 ease-out group-hover:scale-105 transition-transform duration-700 ${
                        isCurrent
                          ? 'opacity-100 z-10'
                          : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    />
                  );
                })
              ) : (
                <Image
                  src={currentImageUrl || '/ruby-brasil-icon.png'}
                  alt={product.name}
                  fill
                  priority
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-black/20 pointer-events-none z-10" />

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev === 0 ? galleryImages.length - 1 : prev - 1
                      )
                    }
                    aria-label="Foto anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-zinc-950/80 hover:bg-zinc-900 text-white border border-white/15 flex items-center justify-center transition-all shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev === galleryImages.length - 1 ? 0 : prev + 1
                      )
                    }
                    aria-label="Próxima foto"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-zinc-950/80 hover:bg-zinc-900 text-white border border-white/15 flex items-center justify-center transition-all shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* BADGES NO TOPO DA IMAGEM */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                {isKids ? (
                  <span className="bg-amber-500 text-black text-xs font-black uppercase px-3 py-1 rounded-lg shadow-md">
                    👶 Kit Infantil (Camisa + Calção)
                  </span>
                ) : (
                  <span className="bg-rose-600 text-white text-xs font-black uppercase px-3 py-1 rounded-lg shadow-md">
                    {product.league || 'Tailandesa 1:1'}
                  </span>
                )}
                {product.season && (
                  <span className="bg-zinc-900/90 text-zinc-300 text-xs font-semibold px-2.5 py-1 rounded-lg border border-zinc-700 backdrop-blur-sm">
                    {product.season}
                  </span>
                )}
              </div>

              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                {galleryImages.length > 1 && (
                  <span className="bg-zinc-950/90 text-zinc-200 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border border-zinc-700 shadow-md">
                    {activeImageIdx + 1} / {galleryImages.length}
                  </span>
                )}
                {isPreSale ? (
                  <span className="bg-amber-500 text-zinc-950 text-xs font-black uppercase px-3 py-1 rounded-lg border border-amber-300 shadow-md inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                    Pré-Venda Oficial
                  </span>
                ) : (
                  <span className="bg-zinc-950/90 text-emerald-400 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-500/40 shadow-md">
                    ✓ Pronta Entrega
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-xs text-zinc-400 bg-zinc-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Padrão Oficial 1:1 com etiquetas e bordados
                </span>
                <span className="font-mono text-zinc-300 font-bold uppercase text-[10px]">
                  {product.type}
                </span>
              </div>
            </div>

            {/* MINIATURAS DA GALERIA (QUANDO HOUVER 2 OU MAIS FOTOS) */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {galleryImages.map((imgUrl, idx) => {
                  const isSelected = idx === activeImageIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      onMouseEnter={() => setActiveImageIdx(idx)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        isSelected
                          ? 'border-rose-500 ring-2 ring-rose-500/40 scale-[1.03]'
                          : 'border-zinc-800 opacity-65 hover:opacity-100 hover:border-zinc-600'
                      }`}
                    >
                      <Image
                        src={imgUrl}
                        alt={`${product.name} - Miniatura ${idx + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* BARRA DE VANTAGENS */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-bold text-white block">Melhor Envio</span>
                  <span className="text-[10px] text-zinc-400">Correios e Loggi</span>
                </div>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-bold text-white block">Qualidade 1:1</span>
                  <span className="text-[10px] text-zinc-400">Padrão Tailandesa</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: DADOS E AÇÕES */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              {/* CATEGORIA E CLUBE */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
                <span>{product.league}</span>
                <span>•</span>
                <span>{product.club}</span>
                <span>•</span>
                <span className="text-rose-400 font-bold">{product.season}</span>
                {isPreSale && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">PRÉ-VENDA</span>
                  </>
                )}
              </div>

              {/* TÍTULO */}
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                {product.name}
              </h1>

              {/* BANNER EXPLICATIVO SE FOR PRÉ-VENDA */}
              {isPreSale && (
                <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <CalendarClock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-amber-300 font-black uppercase tracking-wide">
                        Modelo em Pré-Venda (Lote a Caminho)
                      </strong>
                      {preSaleEta && (
                        <span className="bg-amber-500/20 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          {preSaleEta}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-300 mt-1 leading-relaxed">
                      Este modelo está confirmado para chegar no próximo lote. Você já pode reservar os tamanhos desejados agora para garantir prioridade de despacho assim que o lote der entrada!
                    </p>
                  </div>
                </div>
              )}

              {/* DESCRIÇÃO */}
              <p className="text-xs sm:text-sm text-zinc-400 mt-3 leading-relaxed">
                {product.description ||
                  (isPreSale
                    ? 'Modelo oficial padrão Tailandês 1:1 disponível para reserva antecipada. Garanta suas unidades antes do esgotamento da grade.'
                    : isKids
                    ? 'Kit infantil completo oficial acompanha camisa tailandesa 1:1 e calção com elástico regulável. Tecido leve e respirável para total conforto dos pequenos.'
                    : 'Camisa confeccionada em tecido de alta tecnologia dry-fit, acabamento impecável, escudo e logos bordados com perfeição e etiquetas oficiais de fábrica.')}
              </p>

              {/* BLOCO DE PREÇOS */}
              <div className="mt-6 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-zinc-400 uppercase font-semibold block">
                    {isPreSale ? 'Valor de Pré-Venda' : 'Valor Unitário'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-white">
                      {formatCurrency(currentUnitPrice)}
                    </span>
                    {surcharge > 0 && (
                      <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        +{formatCurrency(surcharge)} ({selectedSize})
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right border-l border-zinc-800 pl-4">
                  <span className="text-[11px] text-zinc-400 block">Disponibilidade</span>
                  {isPreSale ? (
                    <>
                      <span className="text-sm font-bold text-amber-400 block mt-0.5">
                        ⏳ Pré-Venda
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {preSaleEta || 'Lote a Caminho'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                        Pronta Entrega
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Estoque no Brasil
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* SELEÇÃO DE TAMANHO COM CONTROLE DE ESTOQUE */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-white">
                    {isKids ? 'Tamanho / Idade Infantil:' : 'Selecione o Tamanho:'}
                  </span>
                  {!selectedInfo?.inStock ? (
                    <span className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Tamanho Esgotado
                    </span>
                  ) : maxAvailable === 0 ? (
                    <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Todas as {selectedInfo?.stock} peças já estão no seu carrinho
                    </span>
                  ) : isPreSale ? (
                    <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Disponível p/ Reserva ({maxAvailable} {maxAvailable === 1 ? 'vaga' : 'vagas'})
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Em Estoque ({maxAvailable} {maxAvailable === 1 ? 'disponível' : 'disponíveis'})
                    </span>
                  )}
                </div>

                <div className={`grid ${standardSizes.length > 5 ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-5'} gap-2`}>
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
                        className={`py-3 px-1 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center relative ${
                          isSelected
                            ? !isSoldOut && !isMaxInCart
                              ? isPreSale
                                ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow-lg shadow-amber-950/60 scale-[1.03]'
                                : 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950/60 scale-[1.03]'
                              : 'bg-zinc-800 border-rose-500/80 text-rose-300 scale-[1.03]'
                            : isSoldOut || isMaxInCart
                            ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-600 hover:border-zinc-700'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                      >
                        <span className={`text-sm ${isSoldOut ? 'line-through opacity-60 text-zinc-500' : ''}`}>
                          {info.size}
                        </span>
                        {info.surcharge > 0 && !isSoldOut && (
                          <span
                            className={`text-[9px] font-semibold leading-none mt-1 ${
                              isSelected
                                ? isPreSale
                                  ? 'text-zinc-900'
                                  : 'text-rose-200'
                                : 'text-amber-400'
                            }`}
                          >
                            +{info.surcharge}
                          </span>
                        )}
                        {isSoldOut ? (
                          <span className="text-[8px] text-rose-400 font-semibold leading-none mt-1">
                            Esgotado
                          </span>
                        ) : isMaxInCart ? (
                          <span className="text-[8px] text-amber-400 font-semibold leading-none mt-1">
                            No Carrinho
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SELETOR DE QUANTIDADE */}
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-zinc-300 block">Quantidade de Peças:</span>
                    {maxAvailable > 0 && (
                      <span className="text-[10px] text-zinc-500">
                        Máximo disponível para {isPreSale ? 'reservar' : 'adicionar'}: {maxAvailable} un
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || !isAvailableToAdd}
                      className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-mono font-black text-base text-white">
                      {isAvailableToAdd ? quantity : 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
                      disabled={!isAvailableToAdd || quantity >= maxAvailable}
                      className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {selectedInfo?.inStock && maxAvailable === 0 && (
                  <p className="text-[11px] text-amber-400 font-medium px-1">
                    ⚠️ Limite atingido: você já adicionou todas as {selectedInfo.stock} unidades deste tamanho ao seu carrinho.
                  </p>
                )}
              </div>
            </div>

            {/* BOTÕES DE COMPRA E AÇÃO */}
            <div className="space-y-3 pt-4 border-t border-zinc-900">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!isAvailableToAdd}
                  onClick={handleBuy}
                  className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                    justAdded
                      ? 'bg-emerald-600 text-white'
                      : !isAvailableToAdd
                      ? 'bg-zinc-800/80 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                      : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white active:scale-95'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      {isPreSale ? 'Reserva Adicionada!' : 'Adicionado ao Carrinho!'}
                    </>
                  ) : !selectedInfo?.inStock ? (
                    <>Tamanho Esgotado</>
                  ) : maxAvailable === 0 ? (
                    <>Limite no Carrinho ({selectedInfo.stock} un)</>
                  ) : isPreSale ? (
                    <>
                      <Clock className="w-4 h-4 text-amber-400" />
                      Reservar no Carrinho
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-rose-400" />
                      Adicionar ao Carrinho
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!isAvailableToAdd}
                  onClick={handleBuyNow}
                  className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                    !isAvailableToAdd
                      ? 'bg-zinc-800/50 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                      : isPreSale
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-950/60 active:scale-95'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 active:scale-95'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${isPreSale ? 'text-zinc-950' : 'text-amber-300'}`} />
                  {isPreSale
                    ? `Reservar Agora (${formatCurrency(totalPrice)})`
                    : `Comprar Agora (${formatCurrency(totalPrice)})`}
                </button>
              </div>

              {product.allowCustom && (
                <button
                  type="button"
                  disabled={!isAvailableToAdd}
                  onClick={() => isAvailableToAdd && setIsCustomOpen(true)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-colors ${
                    !isAvailableToAdd
                      ? 'opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-600'
                      : 'text-zinc-300 hover:text-white bg-zinc-950 hover:bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <Shirt className="w-4 h-4 text-amber-400" />
                  Personalizar com Nome e Número Oficial (+ R$ 15,00)
                </button>
              )}

              <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white font-bold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                  Continuar escolhendo outras camisas
                </Link>
                {getTotalPieces() > 0 && (
                  <button
                    type="button"
                    onClick={openCart}
                    className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                  >
                    Ver Carrinho ({getTotalPieces()} {getTotalPieces() === 1 ? 'peça' : 'peças'})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* OUTROS MODELOS DO CATÁLOGO (RECOMENDADOS) */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-zinc-900">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Mais Camisas em Destaque
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Confira outros mantos disponíveis em nosso catálogo para todo o Brasil.
                </p>
              </div>
              <Link
                href="/"
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                Ver Todas <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
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
    </div>
  );
}

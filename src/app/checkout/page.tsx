'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Truck,
  MessageCircle,
  Sparkles,
  ShoppingBag,
  Loader2,
  RotateCcw,
  Copy,
  Download,
  Image as ImageIcon,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useCartStore } from '@/store';
import {
  formatCurrency,
  buildWhatsAppOrderMessage,
  getSizeSurcharge,
  formatCPFOrCNPJ,
  isValidCPF,
  toAbsoluteUrl,
  formatBilingualSize,
  getEnglishSizeInfo,
  getModelTypeBilingual,
  SIZE_LEGEND_EN_ITEMS,
  MODEL_LEGEND_EN_ITEMS,
} from '@/lib/utils';
import { CheckoutForm, ShippingOption } from '@/types';
import { sanitizePostalCode } from '@/lib/melhor-envio';
import {
  copyOrderImageToClipboard,
  downloadOrderImageFile,
  copySingleProductImageToClipboard,
  generateOrderCardBlob,
  OrderImageData,
} from '@/lib/order-image';

export default function CheckoutPage() {
  const {
    items,
    getTotalPieces,
    isWholesale,
    getCurrentTier,
    getItemUnitPrice,
    getSubtotal,
    getSavings,
    getShippingFee,
    getFinalTotal,
    clearCart,
    selectedShippingOption,
    setSelectedShippingOption,
    shippingZipCode,
    setShippingZipCode,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyingImage, setCopyingImage] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [copyingSingleIdx, setCopyingSingleIdx] = useState<number | null>(null);
  const [singleCopiedIdx, setSingleCopiedIdx] = useState<number | null>(null);

  const initialLoadedRef = useRef(false);

  // Estados de cálculo de frete Melhor Envio
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [shippingNotice, setShippingNotice] = useState<string | null>(null);

  const [form, setForm] = useState<CheckoutForm>({
    customerType: 'PF',
    document: '',
    customerName: '',
    email: '',
    phone: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    paymentMethod: 'WHATSAPP_ASSISTED',
  });

  const totalPieces = getTotalPieces();
  const wholesaleActive = isWholesale();
  const currentTier = getCurrentTier();
  const subtotal = getSubtotal();
  const savings = getSavings();
  const shippingFee = getShippingFee();
  const finalTotal = getFinalTotal();

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5579988542410';
  const whatsappDisplay = '(79) 98854-2410';

  /**
   * Consulta a API do Melhor Envio e busca opções de frete
   */
  const fetchShippingQuotes = useCallback(
    async (cep: string, pieces: number) => {
      const cleanCep = sanitizePostalCode(cep);
      if (cleanCep.length !== 8) return;

      setIsLoadingShipping(true);
      setShippingNotice(null);

      try {
        const state = useCartStore.getState();
        const currentSubtotal = state.getSubtotal();
        const currentItems = (state.items || []).map((item) => ({
          productId: item.productId,
          name: item.name,
          type: item.type,
          league: item.league,
          size: item.size,
          quantity: item.quantity,
        }));
        const res = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipCode: cleanCep,
            totalPieces: Math.max(1, pieces),
            items: currentItems,
            orderValue: currentSubtotal,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.options)) {
          setShippingOptions(data.options);
          if (data.message) {
            setShippingNotice(data.message);
          }

          // Se já havia uma opção selecionada e ela existe na lista, preserva;
          // caso contrário, pré-seleciona a primeira (mais econômica)
          const currentSelected = useCartStore.getState().selectedShippingOption;
          const match = data.options.find(
            (opt: ShippingOption) => opt.id === currentSelected?.id
          );
          if (match) {
            setSelectedShippingOption(match);
          } else if (data.options.length > 0) {
            setSelectedShippingOption(data.options[0]);
          }
        } else {
          setShippingOptions([]);
          setShippingNotice(data.error || 'Nenhuma opção de frete encontrada para este CEP.');
        }
      } catch (err) {
        console.error('Erro ao calcular frete no Melhor Envio:', err);
        setShippingNotice('Não foi possível obter as cotações de frete no momento.');
      } finally {
        setIsLoadingShipping(false);
      }
    },
    [setSelectedShippingOption]
  );

  /**
   * Consulta endereço via ViaCEP para autopreencher os campos de endereço
   */
  const fetchAddressViaCep = useCallback(
    async (cleanCep: string) => {
      if (cleanCep.length !== 8) return;
      setIsLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (res.ok) {
          const data = await res.json();
          if (!data.erro) {
            setForm((prev) => ({
              ...prev,
              street: data.logradouro || prev.street,
              neighborhood: data.bairro || prev.neighborhood,
              city: data.localidade || prev.city,
              state: data.uf || prev.state,
            }));
          }
        }
      } catch (err) {
        console.warn('ViaCEP indisponível:', err);
      } finally {
        setIsLoadingCep(false);
      }
    },
    []
  );

  /**
   * Monitora a digitação do CEP e dispara o cálculo automaticamente ao atingir 8 dígitos
   */
  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    // Aplica máscara 00000-000 para exibição
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }

    setForm((prev) => ({ ...prev, zipCode: formatted }));

    if (raw.length === 8) {
      setShippingZipCode(raw);
      fetchAddressViaCep(raw);
      fetchShippingQuotes(raw, totalPieces);
    } else {
      if (shippingOptions.length > 0) {
        setShippingOptions([]);
      }
      if (selectedShippingOption) {
        setSelectedShippingOption(null);
      }
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPFOrCNPJ(e.target.value, form.customerType);
    setForm((prev) => ({ ...prev, document: formatted }));
  };

  const cartWeightSignature = items
    .map((i) => `${i.productId}:${i.size}:${i.quantity}:${i.type || ''}`)
    .join('|');

  useEffect(() => {
    setMounted(true);
    // Executa apenas uma vez no carregamento da página
    if (!initialLoadedRef.current) {
      initialLoadedRef.current = true;
      const initialZip = useCartStore.getState().shippingZipCode;
      if (initialZip && initialZip.length === 8) {
        const formatted = `${initialZip.slice(0, 5)}-${initialZip.slice(5)}`;
        setForm((prev) => ({ ...prev, zipCode: formatted }));
        fetchAddressViaCep(initialZip);
        fetchShippingQuotes(initialZip, totalPieces);
      }
      return;
    }

    const activeZip = sanitizePostalCode(form.zipCode || useCartStore.getState().shippingZipCode);
    if (activeZip.length === 8 && totalPieces > 0) {
      fetchShippingQuotes(activeZip, totalPieces);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartWeightSignature]);

  if (!mounted) return null;

  if (items.length === 0 && !completedOrder) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBag className="w-16 h-16 text-zinc-600 mb-4" />
        <h2 className="text-xl font-bold text-white">Seu carrinho está vazio</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-6">
          Adicione itens ao carrinho antes de prosseguir para o checkout.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors"
        >
          Voltar para o Catálogo
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Validação estrita: CPF / CNPJ obrigatório para entrega
    const cleanDoc = (form.document || '').replace(/\D/g, '');
    if (form.customerType === 'PJ') {
      if (cleanDoc.length !== 14) {
        const msg =
          'É obrigatório informar um CNPJ válido com 14 dígitos para a emissão do envio e entrega.';
        setErrorMessage(msg);
        alert(msg);
        setIsSubmitting(false);
        return;
      }
    } else {
      if (cleanDoc.length !== 11) {
        const msg =
          'É obrigatório informar um CPF válido com 11 dígitos para a entrega e emissão da etiqueta de envio.';
        setErrorMessage(msg);
        alert(msg);
        setIsSubmitting(false);
        return;
      }
      if (!isValidCPF(cleanDoc)) {
        const msg =
          'O CPF informado é inválido. Por favor, confira os números digitados para prosseguir.';
        setErrorMessage(msg);
        alert(msg);
        setIsSubmitting(false);
        return;
      }
    }

    // Validação estrita: Endereço de entrega completo obrigatório no momento da compra
    const cleanCep = sanitizePostalCode(form.zipCode);
    if (
      cleanCep.length !== 8 ||
      !form.street?.trim() ||
      !form.number?.trim() ||
      !form.neighborhood?.trim() ||
      !form.city?.trim() ||
      !form.state?.trim()
    ) {
      const msg =
        'É obrigatório informar o endereço de entrega completo (CEP válido, Rua, Número, Bairro, Cidade e Estado) no momento da compra.';
      setErrorMessage(msg);
      alert(msg);
      setIsSubmitting(false);
      return;
    }

    // Validação obrigatória da seleção de frete
    if (!selectedShippingOption) {
      const msg = 'Por favor, informe seu CEP e selecione uma opção de frete antes de finalizar.';
      setErrorMessage(msg);
      alert(msg);
      setIsSubmitting(false);
      return;
    }

    try {
      const shippingServiceName = `${selectedShippingOption.name} - ${selectedShippingOption.company}`;
      const payloadForm: CheckoutForm = {
        ...form,
        paymentMethod: 'WHATSAPP_ASSISTED',
        shippingOption: selectedShippingOption,
        shippingService: shippingServiceName,
        shippingCost: selectedShippingOption.price,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: payloadForm,
          items,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const enrichedItems = items.map((item, idx) => {
          const saved = Array.isArray(data.savedItems) ? data.savedItems[idx] : null;
          return {
            ...item,
            name: item.name || saved?.productName || 'Camisa Ruby Brasil',
            imageUrl:
              item.imageUrl ||
              saved?.imageUrl ||
              (item.productId ? `/api/products/${item.productId}/image` : ''),
          };
        });

        // Enviar dados para o WhatsApp oficial com detalhes do Melhor Envio
        const message = buildWhatsAppOrderMessage({
          items: enrichedItems,
          form: payloadForm,
          totalPieces,
          isWholesale: wholesaleActive,
          currentTier,
          subtotal,
          savings,
          shippingFee: selectedShippingOption.price,
          shippingService: `${shippingServiceName} (${selectedShippingOption.deliveryTime} dias úteis)`,
          finalTotal: subtotal + selectedShippingOption.price,
        });

        setCompletedOrder({
          ...data,
          items: enrichedItems,
          form: payloadForm,
          subtotal,
          savings,
          shippingCost: selectedShippingOption.price,
          shippingService: `${shippingServiceName} (${selectedShippingOption.deliveryTime} dias úteis)`,
          whatsappMessage: message,
        });
        clearCart();

        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      } else {
        setErrorMessage(data.error || 'Erro ao finalizar pedido.');
        alert(data.error || 'Erro ao finalizar pedido.');
      }
    } catch (err) {
      console.error(err);
      const msg = 'Ocorreu um erro ao comunicar com o servidor.';
      setErrorMessage(msg);
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderImage = async () => {
    if (!completedOrder) return;
    setCopyingImage(true);
    try {
      const orderData: OrderImageData = {
        orderNumber: completedOrder.orderNumber,
        createdAt: new Date(),
        customerName: completedOrder.form?.customerName || 'Cliente Ruby Brasil',
        customerCity: completedOrder.form?.city,
        customerState: completedOrder.form?.state,
        customerPhone: completedOrder.form?.phone,
        totalQuantity: (completedOrder.items || []).reduce(
          (acc: number, item: any) => acc + (item.quantity || 1),
          0
        ),
        subtotal: completedOrder.subtotal || 0,
        shippingCost: completedOrder.shippingCost || 0,
        shippingService: completedOrder.shippingService,
        finalTotal: completedOrder.finalTotal || 0,
        items: (completedOrder.items || []).map((it: any) => ({
          productId: it.productId,
          name: it.name,
          club: it.club,
          league: it.league,
          size: it.size,
          quantity: it.quantity,
          imageUrl: it.imageUrl || (it.productId ? `/api/products/${it.productId}/image` : ''),
          customName: it.customName,
          customNumber: it.customNumber,
          isPreSale: it.isPreSale,
          preSaleEta: it.preSaleEta,
          totalItemPrice: it.retailPrice ? it.retailPrice * it.quantity : undefined,
        })),
      };

      const result = await copyOrderImageToClipboard(orderData);
      if (result.success) {
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 5000);
      } else if (result.fallbackBlob) {
        downloadOrderImageFile(result.fallbackBlob, `pedido-${completedOrder.orderNumber}.png`);
        alert('A imagem oficial do pedido foi baixada em PNG! Você pode anexá-la na conversa do WhatsApp.');
      } else {
        alert(result.error || 'Não foi possível copiar a imagem do pedido.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao processar imagem do pedido.');
    } finally {
      setCopyingImage(false);
    }
  };

  const handleDownloadOrderImage = async () => {
    if (!completedOrder) return;
    setCopyingImage(true);
    try {
      const orderData: OrderImageData = {
        orderNumber: completedOrder.orderNumber,
        createdAt: new Date(),
        customerName: completedOrder.form?.customerName || 'Cliente Ruby Brasil',
        customerCity: completedOrder.form?.city,
        customerState: completedOrder.form?.state,
        customerPhone: completedOrder.form?.phone,
        totalQuantity: (completedOrder.items || []).reduce(
          (acc: number, item: any) => acc + (item.quantity || 1),
          0
        ),
        subtotal: completedOrder.subtotal || 0,
        shippingCost: completedOrder.shippingCost || 0,
        shippingService: completedOrder.shippingService,
        finalTotal: completedOrder.finalTotal || 0,
        items: (completedOrder.items || []).map((it: any) => ({
          productId: it.productId,
          name: it.name,
          club: it.club,
          league: it.league,
          size: it.size,
          quantity: it.quantity,
          imageUrl: it.imageUrl || (it.productId ? `/api/products/${it.productId}/image` : ''),
          customName: it.customName,
          customNumber: it.customNumber,
          isPreSale: it.isPreSale,
          preSaleEta: it.preSaleEta,
          totalItemPrice: it.retailPrice ? it.retailPrice * it.quantity : undefined,
        })),
      };

      const blob = await generateOrderCardBlob(orderData);
      downloadOrderImageFile(blob, `pedido-${completedOrder.orderNumber}.png`);
    } catch (err) {
      console.error(err);
      alert('Erro ao baixar imagem do pedido.');
    } finally {
      setCopyingImage(false);
    }
  };

  const handleCopySingleItem = async (imageUrl?: string, idx?: number) => {
    if (!imageUrl || idx === undefined) return;
    setCopyingSingleIdx(idx);
    try {
      const res = await copySingleProductImageToClipboard(imageUrl);
      if (res.success) {
        setSingleCopiedIdx(idx);
        setTimeout(() => setSingleCopiedIdx(null), 3500);
      } else {
        window.open(toAbsoluteUrl(imageUrl), '_blank');
      }
    } catch {
      window.open(toAbsoluteUrl(imageUrl), '_blank');
    } finally {
      setCopyingSingleIdx(null);
    }
  };

  if (completedOrder) {
    const orderItems: any[] = completedOrder.items || [];
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
      completedOrder.whatsappMessage || ''
    )}`;

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Pedido Gerado com Sucesso!
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-white mt-3">
          Pedido #{completedOrder.orderNumber}
        </h1>

        <p className="text-sm text-zinc-300 mt-2 max-w-lg mx-auto">
          Os dados do seu pedido e a cotação de frete foram preparados com fotos em alta definição das camisas escolhidas.
        </p>

        {/* CARD PRINCIPAL DE IDENTIFICAÇÃO VISUAL & COPIAR IMAGEM */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-emerald-500/30 text-left shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-white text-base font-bold">
                  Imagem do Pedido para o WhatsApp
                </strong>
                <span className="text-xs text-zinc-400">
                  Envie o cartão visual com as fotos para o atendente identificar as camisas
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 w-fit">
              Pronto para colar
            </span>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleCopyOrderImage}
              disabled={copyingImage}
              className={`w-full sm:flex-1 px-5 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                imageCopied
                  ? 'bg-emerald-600 text-white border border-emerald-400'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 active:scale-[0.98]'
              }`}
            >
              {copyingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando Imagem...</span>
                </>
              ) : imageCopied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Imagem Copiada! Cole (Ctrl+V) no Zap</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Imagem do Pedido</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadOrderImage}
              disabled={copyingImage}
              className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              title="Baixar arquivo PNG da imagem do pedido"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PNG</span>
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Abrir WhatsApp</span>
            </a>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>💡 Como enviar a imagem junto com o pedido:</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              <strong>1.</strong> Clique no botão verde <strong>Copiar Imagem do Pedido</strong> acima.<br />
              <strong>2.</strong> Clique em <strong>Abrir WhatsApp</strong> para iniciar a conversa.<br />
              <strong>3.</strong> Na caixa de mensagem do WhatsApp, pressione <strong>Ctrl + V</strong> (ou toque e segure <strong>Colar</strong> no celular). A imagem completa com as fotos das camisas será colada e enviada!
            </p>
          </div>
        </div>

        {/* LISTAGEM VISUAL DE CAMISAS ESCOLHIDAS */}
        {orderItems.length > 0 && (
          <div className="mt-8 text-left">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <span>Camisas Escolhidas ({orderItems.reduce((acc, it) => acc + (it.quantity || 1), 0)} un)</span>
              </h3>
              <span className="text-xs text-zinc-500">
                Fotos incluídas nos links da mensagem
              </span>
            </div>

            <div className="space-y-2.5">
              {orderItems.map((item, idx) => {
                const photoSrc = item.imageUrl || '/placeholder.png';
                const isSingleCopied = singleCopiedIdx === idx;
                const isSingleCopying = copyingSingleIdx === idx;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-zinc-600" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <strong className="block text-white text-xs sm:text-sm font-bold truncate">
                          {item.name}
                        </strong>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono font-bold">
                            Size: {formatBilingualSize(item.size)} ({getEnglishSizeInfo(item.size).enName})
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-emerald-400 font-mono font-bold">
                            {getModelTypeBilingual(item).en}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                            Qtd: {item.quantity}
                          </span>
                          {item.isPreSale && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold uppercase text-[10px]">
                              ⏳ Pré-Venda
                            </span>
                          )}
                        </div>
                        {item.customName && (
                          <span className="block text-[11px] text-amber-400 mt-1 font-mono">
                            Personalização / Custom Print: {item.customName} #{item.customNumber || 'S/N'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.imageUrl && (
                        <button
                          type="button"
                          onClick={() => handleCopySingleItem(item.imageUrl, idx)}
                          disabled={isSingleCopying}
                          className="px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Copiar apenas a foto desta camisa"
                        >
                          {isSingleCopying ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isSingleCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="hidden sm:inline text-emerald-400">Foto Copiada</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-zinc-400" />
                              <span className="hidden sm:inline">Copiar Foto</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LEGENDA DE TAMANHOS & MODELOS EM INGLÊS (SUPPLIER REFERENCE) */}
            <div className="mt-4 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  🌐 Size & Model Legend (BR ➔ English / Supplier Reference)
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  International Standard
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SIZE_LEGEND_EN_ITEMS.map((sz) => (
                  <span
                    key={sz.br}
                    className="px-2 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300"
                  >
                    <strong className="text-white">{sz.br}</strong> ={' '}
                    <strong className="text-emerald-400">{sz.en}</strong>{' '}
                    <span className="text-zinc-500">({sz.desc})</span>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-800/80">
                {MODEL_LEGEND_EN_ITEMS.map((md) => (
                  <span
                    key={md.pt}
                    className="px-2 py-0.5 rounded bg-zinc-950/70 border border-zinc-800/80 text-[10px] font-mono text-zinc-400"
                  >
                    <strong className="text-zinc-200">{md.pt}</strong> ={' '}
                    <strong className="text-amber-400">{md.en}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DETALHES DE ENTREGA E VALOR */}
        <div className="mt-8 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-left space-y-3">
          <div className="flex justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
            <span>Número do Pedido:</span>
            <strong className="text-white font-mono">{completedOrder.orderNumber}</strong>
          </div>
          {completedOrder.form?.customerName && (
            <div className="flex justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
              <span>Cliente:</span>
              <strong className="text-white">{completedOrder.form.customerName}</strong>
            </div>
          )}
          {completedOrder.shippingService && (
            <div className="flex justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
              <span>Modalidade de Frete:</span>
              <strong className="text-zinc-200">{completedOrder.shippingService}</strong>
            </div>
          )}
          <div className="flex justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
            <span>Total com Frete:</span>
            <strong className="text-emerald-400 text-sm font-black">
              {formatCurrency(completedOrder.finalTotal)}
            </strong>
          </div>
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Atendimento:</span>
            <strong className="text-white">{whatsappDisplay}</strong>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-sm transition-colors"
          >
            Voltar para a Loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-xs font-bold text-zinc-200 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            Continuar Comprando (Adicionar mais peças)
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Ambiente Seguro • Atendimento WhatsApp Oficial</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-sm flex items-start gap-3 shadow-xl animate-in fade-in">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="flex-1">
              <strong className="block font-black text-white text-sm mb-1">
                Aviso sobre o Pedido:
              </strong>
              <p className="text-xs text-rose-200 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* AVISO DE ENDEREÇO DE ENTREGA OBRIGATÓRIO NO MOMENTO DA COMPRA */}
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 shadow-lg">
          <Truck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <strong className="block text-emerald-300 font-bold text-sm mb-0.5">
              Endereço de Entrega Obrigatório no Momento da Compra
            </strong>
            <p className="text-zinc-300 leading-relaxed">
              Para calcular as cotações de frete via <strong className="text-white">Melhor Envio (PAC, SEDEX e Loggi)</strong> e despachar sua encomenda com código de rastreamento, o preenchimento do endereço de entrega completo é indispensável.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. DADOS DE IDENTIFICAÇÃO */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                Seus Dados de Contato
              </h2>

              <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, customerType: 'PF' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    form.customerType === 'PF'
                      ? 'bg-zinc-800 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Pessoa Física (CPF)
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, customerType: 'PJ' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    form.customerType === 'PJ'
                      ? 'bg-zinc-800 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Pessoa Jurídica (CNPJ)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {form.customerType === 'PJ' ? 'Razão Social / Nome da Empresa' : 'Nome Completo'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder={form.customerType === 'PJ' ? 'Ex: Ruby Atacado LTDA' : 'Ex: João da Silva'}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center justify-between">
                    <span>{form.customerType === 'PJ' ? 'CNPJ' : 'CPF'} <strong className="text-rose-400">*</strong></span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Obrigatório p/ Entrega
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={form.customerType === 'PJ' ? 18 : 14}
                    value={form.document}
                    onChange={handleDocumentChange}
                    placeholder={form.customerType === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    WhatsApp de Contato
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. ENDEREÇO DE ENTREGA & CÁLCULO MELHOR ENVIO */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
              <h2 className="text-base font-black text-white flex items-center justify-between gap-2 mb-4">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                  Endereço de Entrega & Cotação de Frete
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Obrigatório no Checkout
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center justify-between">
                    <span>CEP</span>
                    {isLoadingCep && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-normal">
                        <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    value={form.zipCode}
                    onChange={handleZipCodeChange}
                    placeholder="00000-000"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Rua / Avenida</label>
                  <input
                    type="text"
                    required
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Ex: Av. Principal"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Número</label>
                  <input
                    type="text"
                    required
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="120"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Complemento (opcional)</label>
                  <input
                    type="text"
                    value={form.complement || ''}
                    onChange={(e) => setForm({ ...form, complement: e.target.value })}
                    placeholder="Apto, Sala, Casa 2..."
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Bairro</label>
                  <input
                    type="text"
                    required
                    value={form.neighborhood}
                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    placeholder="Bairro"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Cidade</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Cidade"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                    placeholder="SE"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>

              {/* OPÇÕES DE ENVIO (MELHOR ENVIO) */}
              <div className="mt-5 pt-5 border-t border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Opções de Envio (Melhor Envio)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] bg-zinc-950 text-zinc-300 font-medium px-2.5 py-1 rounded-lg border border-zinc-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      Envio com Rastreio Oficial • Direto de Fábrica
                    </span>
                    {shippingOptions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => fetchShippingQuotes(form.zipCode, totalPieces)}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                        title="Recalcular Frete"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Recalcular
                      </button>
                    )}
                  </div>
                </div>

                {isLoadingShipping ? (
                  <div className="p-5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-center gap-2.5 text-xs text-zinc-300">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span>Consultando melhores tarifas em tempo real (PAC, SEDEX & Loggi)...</span>
                  </div>
                ) : shippingOptions.length > 0 ? (
                  <div className="space-y-2">
                    {shippingOptions.map((opt) => {
                      const isSelected = selectedShippingOption?.id === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedShippingOption(opt)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500/70 ring-1 ring-emerald-500/40 shadow-md shadow-emerald-950/40'
                              : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'border-emerald-400 bg-emerald-500'
                                  : 'border-zinc-600 bg-zinc-900'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs sm:text-sm text-white">
                                  {opt.name}
                                </span>
                                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-300 font-semibold border border-zinc-700">
                                  {opt.company}
                                </span>
                              </div>
                              <span className="text-[11px] text-zinc-400 block mt-0.5">
                                Prazo estimado: <strong>{opt.deliveryTime} {opt.deliveryTime === 1 ? 'dia útil' : 'dias úteis'}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-sm sm:text-base text-emerald-400">
                              {formatCurrency(opt.price)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {shippingNotice && (
                      <p className="text-[11px] text-zinc-400 italic pt-1 text-center">
                        ℹ️ {shippingNotice}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-dashed border-zinc-800 text-center text-xs text-zinc-400">
                    <p>
                      Informe um CEP válido com 8 dígitos acima para carregar as opções de frete disponíveis para o seu endereço.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. ATENDIMENTO E PAGAMENTO VIA WHATSAPP */}
            <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl p-5 shadow-lg bg-gradient-to-br from-emerald-950/20 via-zinc-900 to-zinc-900">
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">3</span>
                Atendimento e Pagamento
              </h2>

              <div className="p-4 rounded-xl bg-zinc-950/90 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
                  <MessageCircle className="w-6 h-6 fill-current" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Finalização Direta no WhatsApp</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      Oficial
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1">
                    Número cadastrado: <strong className="text-emerald-400 font-bold">{whatsappDisplay}</strong>. Ao enviar o pedido, nosso consultor confirmará os modelos e fornecerá os dados para pagamento via Pix.
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-5 space-y-4">
            
            {/* STATUS DO FRETE (MELHOR ENVIO) */}
            <div className="p-4 rounded-2xl border bg-zinc-900 border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm text-white">Frete Seguro (Melhor Envio)</h3>
              </div>

              {selectedShippingOption ? (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      {selectedShippingOption.name} - {selectedShippingOption.company}
                    </span>
                    <span className="text-emerald-400">{formatCurrency(selectedShippingOption.price)}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Prazo em até <strong>{selectedShippingOption.deliveryTime} dias úteis</strong> com código de rastreamento e seguro oficial.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-zinc-300">
                    Pedido atual: <strong>{totalPieces} {totalPieces === 1 ? 'camisa' : 'camisas'}</strong>.
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Digite seu CEP no formulário ao lado para selecionar a transportadora e a melhor tarifa.
                  </p>
                </div>
              )}
            </div>

            {/* RESUMO DO PEDIDO */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-black text-white">Resumo do Pedido ({totalPieces} peças)</h3>

              <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 text-xs divide-y divide-zinc-800/80">
                {items.map((item) => {
                  const appliedUnit = getItemUnitPrice(item);
                  const customExtra = item.customName ? 15.0 : 0.0;
                  const surcharge = getSizeSurcharge(item.size);
                  const thumbSrc =
                    item.imageUrl ||
                    (item.productId ? `/api/products/${item.productId}/image` : '');
                  return (
                    <div key={item.cartItemId} className="pt-2.5 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {thumbSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumbSrc}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white line-clamp-1">{item.name}</p>
                          <p className="text-[11px] text-zinc-400">
                            Tam: <strong className="text-zinc-200">{formatBilingualSize(item.size)}</strong>{surcharge > 0 && <span className="text-amber-400 font-bold ml-1">(+{formatCurrency(surcharge)} Especial)</span>} • Qtd: {item.quantity} un
                            {item.customName && ` • [${item.customName} #${item.customNumber || '10'}]`}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-white shrink-0">
                        {formatCurrency((appliedUnit + customExtra) * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-3 border-t border-zinc-800 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Subtotal ({totalPieces} peças)</span>
                  <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-zinc-300">
                  <span>Frete {selectedShippingOption ? `(${selectedShippingOption.name})` : '(Melhor Envio)'}</span>
                  {selectedShippingOption ? (
                    <span className="font-bold text-white">{formatCurrency(selectedShippingOption.price)}</span>
                  ) : (
                    <span className="text-zinc-400 italic">Digite o CEP para calcular</span>
                  )}
                </div>

                <div className="border-t border-zinc-800 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total do Pedido</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                id="submit-order-button"
                disabled={isSubmitting || !selectedShippingOption}
                className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/70 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                {isSubmitting ? (
                  <span>Gerando Pedido...</span>
                ) : !selectedShippingOption ? (
                  <span>Selecione uma opção de frete acima</span>
                ) : (
                  <span>Enviar Pedido para o WhatsApp {whatsappDisplay}</span>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Atendimento humanizado direto no WhatsApp oficial</span>
              </div>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
}

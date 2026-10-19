'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useCartStore } from '@/store';
import { formatCurrency, buildWhatsAppOrderMessage, getSizeSurcharge } from '@/lib/utils';
import { CheckoutForm, ShippingOption } from '@/types';
import { sanitizePostalCode } from '@/lib/melhor-envio';

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
        const res = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipCode: cleanCep,
            totalPieces: Math.max(1, pieces),
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
          const currentSelected = selectedShippingOption;
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
    [selectedShippingOption, setSelectedShippingOption]
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

  useEffect(() => {
    setMounted(true);
    // Se já havia CEP salvo no carrinho, recupera e recalcula
    if (shippingZipCode && shippingZipCode.length === 8) {
      const formatted = `${shippingZipCode.slice(0, 5)}-${shippingZipCode.slice(5)}`;
      setForm((prev) => ({ ...prev, zipCode: formatted }));
      fetchAddressViaCep(shippingZipCode);
      fetchShippingQuotes(shippingZipCode, totalPieces);
    }
  }, [shippingZipCode, totalPieces, fetchAddressViaCep, fetchShippingQuotes]);

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
        setCompletedOrder(data);
        clearCart();

        // Enviar dados para o WhatsApp oficial com detalhes do Melhor Envio
        const message = buildWhatsAppOrderMessage({
          items,
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

  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Pedido Gerado com Sucesso!
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-white mt-3">
          Pedido #{completedOrder.orderNumber}
        </h1>

        <p className="text-sm text-zinc-300 mt-2 max-w-md mx-auto">
          Os dados do seu pedido e a cotação de frete foram preparados. Finalize agora com nosso consultor no WhatsApp oficial para confirmar o estoque e efetuar o pagamento.
        </p>

        <div className="mt-8 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-left max-w-md mx-auto space-y-3">
          <div className="flex justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
            <span>Número do Pedido:</span>
            <strong className="text-white font-mono">{completedOrder.orderNumber}</strong>
          </div>
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
          <button
            type="button"
            onClick={() => {
              const cleanNumber = whatsappNumber.replace(/\D/g, '');
              window.open(`https://wa.me/${cleanNumber}`, '_blank');
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            Abrir Conversa no WhatsApp
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-sm"
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
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {form.customerType === 'PJ' ? 'CNPJ' : 'CPF'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.document}
                    onChange={(e) => setForm({ ...form, document: e.target.value })}
                    placeholder={form.customerType === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
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
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                Endereço de Entrega & Cotação de Frete
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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Opções de Envio (Melhor Envio)
                    </span>
                  </div>
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

                {isLoadingShipping ? (
                  <div className="p-5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-center gap-2.5 text-xs text-zinc-300">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span>Consultando melhores tarifas em tempo real (Correios & Jadlog)...</span>
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

              {totalPieces >= 50 && (
                <div className="mt-2.5 pt-2 border-t border-emerald-500/30 flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Preço Atacado Especial: R$ 55,00 / unidade!
                </div>
              )}
            </div>

            {/* RESUMO DO PEDIDO */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-black text-white">Resumo do Pedido ({totalPieces} peças)</h3>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs divide-y divide-zinc-800/80">
                {items.map((item) => {
                  const appliedUnit = getItemUnitPrice(item);
                  const customExtra = item.customName ? 15.0 : 0.0;
                  const surcharge = getSizeSurcharge(item.size);
                  return (
                    <div key={item.cartItemId} className="pt-2 flex justify-between gap-2">
                      <div>
                        <p className="font-bold text-white line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-zinc-400">
                          Tam: <strong className="text-zinc-200">{item.size}</strong>{surcharge > 0 && <span className="text-amber-400 font-bold ml-1">(+{formatCurrency(surcharge)} Especial)</span>} • Qtd: {item.quantity} un
                          {item.customName && ` • [${item.customName} #${item.customNumber || '10'}]`}
                        </p>
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

                {savings > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/20">
                    <span>Desconto Atacado 50+ peças:</span>
                    <span>- {formatCurrency(savings)}</span>
                  </div>
                )}

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

'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  MessageCircle,
  Eye,
  Copy,
  Check,
  Image as ImageIcon,
  Loader2,
  Layers,
  Users,
  MapPin,
  PlusCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  formatCurrency,
  getProductPreSaleInfo,
  getProductGalleryImages,
  formatBilingualSize,
  getModelTypeBilingual,
} from '@/lib/utils';

export function isOrderItemPreSale(item: any, catalogProducts?: any[]): {
  isPreSale: boolean;
  preSaleEta: string | null;
} {
  if (!item) return { isPreSale: false, preSaleEta: null };

  // 1. Flag persistida diretamente no item do pedido no momento da compra
  if (item.isPreSale === true) {
    const prodInfo = item.product ? getProductPreSaleInfo(item.product) : null;
    return {
      isPreSale: true,
      preSaleEta: item.preSaleEta || prodInfo?.preSaleEta || null,
    };
  }

  // 2. Produto vinculado ao item do pedido está marcado como Pré-Venda
  if (item.product) {
    const info = getProductPreSaleInfo(item.product);
    if (info.isPreSale) return info;
  }

  // 3. Busca no catálogo atual pelo productId
  if (catalogProducts && item.productId) {
    const found = catalogProducts.find((p) => p.id === item.productId);
    if (found) {
      const info = getProductPreSaleInfo(found);
      if (info.isPreSale) return info;
    }
  }

  // 4. Nome do produto menciona pré-venda
  if (
    typeof item.productName === 'string' &&
    /pr[eé][-\s]?venda/i.test(item.productName)
  ) {
    return { isPreSale: true, preSaleEta: null };
  }

  return { isPreSale: false, preSaleEta: null };
}

export function isPreSaleOrder(order: any, catalogProducts?: any[]): boolean {
  if (!order) return false;
  const st = (order.status || '').toUpperCase().trim();
  if (st === 'AGUARDANDO_CHEGADA' || st === 'PRONTO_PARA_ENVIO') {
    return true;
  }
  const items = Array.isArray(order.items) ? order.items : [];
  return items.some((it: any) => isOrderItemPreSale(it, catalogProducts).isPreSale);
}

interface AdminPreSaleOrdersTabProps {
  orders: any[];
  products: any[];
  updatingOrderId: string | null;
  copiedKey: string | null;
  copyingOrderImageId: string | null;
  copiedOrderImageId: string | null;
  isRefreshingOrders: boolean;
  onRefreshOrders: () => void;
  onUpdateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
  onSelectOrder: (order: any) => void;
  onCopyWhatsAppReport: (order: any) => void;
  onCopyOrderCardImage: (order: any, keyId: string) => void;
  onOrdersMutated: (updatedOrders: any[]) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  getStatusInfo: (status: string) => {
    label: string;
    badge: string;
    border: string;
    color: string;
    emoji: string;
  };
}

export default function AdminPreSaleOrdersTab({
  orders,
  products,
  updatingOrderId,
  copiedKey,
  copyingOrderImageId,
  copiedOrderImageId,
  isRefreshingOrders,
  onRefreshOrders,
  onUpdateOrderStatus,
  onSelectOrder,
  onCopyWhatsAppReport,
  onCopyOrderCardImage,
  onOrdersMutated,
  showToast,
  getStatusInfo,
}: AdminPreSaleOrdersTabProps) {
  const [viewMode, setViewMode] = useState<'orders' | 'by_shirt'>('orders');
  const [queueFilter, setQueueFilter] = useState<
    'WAITING' | 'READY_TO_SHIP' | 'SHIPPED' | 'ALL'
  >('WAITING');
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkLoadingProductId, setBulkLoadingProductId] = useState<string | null>(null);
  const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);
  const [togglingOrderId, setTogglingOrderId] = useState<string | null>(null);

  // Todos os pedidos que possuem camisas de pré-venda ou status de pré-venda
  const preSaleOrders = useMemo(() => {
    return orders.filter((o) => isPreSaleOrder(o, products));
  }, [orders, products]);

  // Pedidos regulares (que ainda não estão na aba de pré-venda, caso o admin queira mover manualmente)
  const nonPreSaleOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        !isPreSaleOrder(o, products) &&
        (o.status || '').toUpperCase() !== 'CANCELADO'
    );
  }, [orders, products]);

  // Estatísticas da fila de Pré-Venda
  const preSaleStats = useMemo(() => {
    const waitingOrders = preSaleOrders.filter((o) => {
      const st = (o.status || 'PENDING').toUpperCase();
      return !['ENVIADO', 'ENTREGUE', 'CANCELADO'].includes(st);
    });

    const readyToShipOrders = preSaleOrders.filter(
      (o) => (o.status || '').toUpperCase() === 'PRONTO_PARA_ENVIO'
    );

    const shippedOrders = preSaleOrders.filter((o) =>
      ['ENVIADO', 'ENTREGUE'].includes((o.status || '').toUpperCase())
    );

    let pendingPreSalePieces = 0;
    let totalPreSaleRevenue = 0;

    waitingOrders.forEach((order) => {
      totalPreSaleRevenue += Number(order.finalTotal) || 0;
      (order.items || []).forEach((it: any) => {
        if (isOrderItemPreSale(it, products).isPreSale || isPreSaleOrder(order, products)) {
          pendingPreSalePieces += Number(it.quantity) || 1;
        }
      });
    });

    return {
      totalPreSaleOrders: preSaleOrders.length,
      waitingCount: waitingOrders.length,
      readyToShipCount: readyToShipOrders.length,
      shippedCount: shippedOrders.length,
      pendingPreSalePieces,
      totalPreSaleRevenue,
    };
  }, [preSaleOrders, products]);

  // Filtragem de pedidos na Visão 1
  const filteredPreSaleOrders = useMemo(() => {
    return preSaleOrders.filter((order) => {
      const st = (order.status || 'PENDING').toUpperCase();

      if (queueFilter === 'WAITING') {
        if (['ENVIADO', 'ENTREGUE', 'CANCELADO'].includes(st)) return false;
      } else if (queueFilter === 'READY_TO_SHIP') {
        if (st !== 'PRONTO_PARA_ENVIO') return false;
      } else if (queueFilter === 'SHIPPED') {
        if (!['ENVIADO', 'ENTREGUE'].includes(st)) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const matchesOrder =
        order.orderNumber?.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q) ||
        order.phone?.toLowerCase().includes(q) ||
        order.city?.toLowerCase().includes(q) ||
        order.state?.toLowerCase().includes(q) ||
        (order.items || []).some(
          (it: any) =>
            it.productName?.toLowerCase().includes(q) ||
            it.product?.name?.toLowerCase().includes(q) ||
            it.product?.club?.toLowerCase().includes(q)
        );

      return matchesOrder;
    });
  }, [preSaleOrders, queueFilter, searchQuery]);

  // Agrupamento consolidado por Camisa / Modelo de Pré-Venda (Visão 2: Mapa de Separação)
  const consolidatedByShirt = useMemo(() => {
    const map = new Map<
      string,
      {
        productId: string;
        productName: string;
        club: string;
        imageUrl: string;
        preSaleEta: string | null;
        totalUnitsWaiting: number;
        sizesBreakdown: Record<string, number>;
        customerOrders: Array<{
          orderId: string;
          orderNumber: string;
          customerName: string;
          phone: string;
          city: string;
          state: string;
          status: string;
          size: string;
          quantity: number;
          customName?: string | null;
          customNumber?: string | null;
          createdAt: string;
        }>;
      }
    >();

    // Considera todos os pedidos de pré-venda que ainda aguardam envio
    const activeWaitingOrders = preSaleOrders.filter((o) => {
      const st = (o.status || 'PENDING').toUpperCase();
      return !['ENVIADO', 'ENTREGUE', 'CANCELADO'].includes(st);
    });

    activeWaitingOrders.forEach((order) => {
      (order.items || []).forEach((it: any) => {
        const preInfo = isOrderItemPreSale(it, products);
        // Se o pedido está marcado como pré-venda, inclui os itens de pré-venda (ou todos caso tenha sido movido manualmente)
        const allItemsAreNormal = !(order.items || []).some(
          (x: any) => isOrderItemPreSale(x, products).isPreSale
        );
        if (!preInfo.isPreSale && !allItemsAreNormal) return;

        const pid = it.productId || it.product?.id || it.productName || 'presale-item';
        const matchedProd = products.find((p) => p.id === pid);
        const name =
          it.productName || it.product?.name || matchedProd?.name || 'Camisa Pré-Venda';
        const club = it.product?.club || matchedProd?.club || '';
        const gallery = getProductGalleryImages(it.product || matchedProd);
        const img =
          it.imageUrl ||
          it.product?.imageUrl ||
          gallery[0] ||
          matchedProd?.imageUrl ||
          '';

        if (!map.has(pid)) {
          map.set(pid, {
            productId: pid,
            productName: name,
            club,
            imageUrl: img,
            preSaleEta: preInfo.preSaleEta || 'Em trânsito',
            totalUnitsWaiting: 0,
            sizesBreakdown: {},
            customerOrders: [],
          });
        }

        const entry = map.get(pid)!;
        const qty = Number(it.quantity) || 1;
        const sz = String(it.size || 'M');
        entry.totalUnitsWaiting += qty;
        entry.sizesBreakdown[sz] = (entry.sizesBreakdown[sz] || 0) + qty;
        entry.customerOrders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          phone: order.phone,
          city: order.city,
          state: order.state,
          status: order.status,
          size: sz,
          quantity: qty,
          customName: it.customName,
          customNumber: it.customNumber,
          createdAt: order.createdAt,
        });
      });
    });

    return Array.from(map.values()).sort(
      (a, b) => b.totalUnitsWaiting - a.totalUnitsWaiting
    );
  }, [preSaleOrders, products]);

  // Marca todos os pedidos que aguardam uma determinada camisa como PRONTO_PARA_ENVIO
  const handleMarkShirtBatchArrived = async (
    productId: string,
    productName: string,
    orderIds: string[]
  ) => {
    const uniqueOrderIds = Array.from(new Set(orderIds));
    if (uniqueOrderIds.length === 0) return;

    setBulkLoadingProductId(productId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BULK_STATUS_UPDATE',
          orderIds: uniqueOrderIds,
          newStatus: 'PRONTO_PARA_ENVIO',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextOrders = orders.map((o) =>
          uniqueOrderIds.includes(o.id)
            ? { ...o, status: 'PRONTO_PARA_ENVIO', updatedAt: new Date().toISOString() }
            : o
        );
        onOrdersMutated(nextOrders);
        showToast(
          `Peças de "${productName}" marcadas como chegaram! ${uniqueOrderIds.length} pedido(s) prontos para envio.`
        );
      } else {
        alert(data.error || 'Erro ao atualizar lote de pedidos.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao atualizar pedidos.');
    } finally {
      setBulkLoadingProductId(null);
    }
  };

  // Vincula ou desvincula manualmente um pedido da fila de Pré-Venda
  const handleToggleOrderPreSale = async (
    order: any,
    makePreSale: boolean
  ) => {
    setTogglingOrderId(order.id);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_ORDER_PRESALE',
          orderId: order.id,
          isPreSale: makePreSale,
          preSaleEta: makePreSale ? 'Reserva Pré-Venda' : null,
          newStatus: makePreSale ? 'AGUARDANDO_CHEGADA' : 'PENDING',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextOrders = orders.map((o) => {
          if (o.id !== order.id) return o;
          return {
            ...o,
            status: makePreSale ? 'AGUARDANDO_CHEGADA' : 'PENDING',
            items: (o.items || []).map((it: any) => ({
              ...it,
              isPreSale: makePreSale,
              preSaleEta: makePreSale ? 'Reserva Pré-Venda' : null,
            })),
          };
        });
        onOrdersMutated(nextOrders);
        showToast(data.message || 'Pedido atualizado na fila de Pré-Venda!');
        setIsAddExistingOpen(false);
      } else {
        alert(data.error || 'Erro ao mover pedido.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    } finally {
      setTogglingOrderId(null);
    }
  };

  // Gera link do WhatsApp avisando ao cliente que as camisas da pré-venda chegaram
  const buildArrivalWhatsAppUrl = (order: any) => {
    const cleanPhone = (order.phone || '').replace(/\D/g, '');
    if (!cleanPhone) return null;

    const preSaleItemsList = (order.items || [])
      .map((it: any) => `• ${it.quantity}x ${it.productName || it.product?.name || 'Camisa'} (Tam: ${it.size})`)
      .join('\n');

    const msg =
      `Olá *${order.customerName}*, tudo bem? Aqui é da equipe *Ruby Brasil*!\n\n` +
      `🎉 Passando para avisar que as suas camisas compradas na *Pré-Venda* do pedido *#${order.orderNumber}* já chegaram em nosso estoque:\n\n` +
      `${preSaleItemsList}\n\n` +
      `📍 Estamos preparando a embalagem para envio ao seu endereço (${order.street}, ${order.number} - ${order.city}/${order.state}). Assim que for postado te enviamos o código de rastreio! 🚀`;

    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-6">
      {/* CARDS DE KPIS DA FILA DE PRÉ-VENDA (ANTI-ESQUECIMENTO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          className="p-4 sm:p-5 rounded-2xl border tactile"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <span
            className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
            Clientes Aguardando Envio
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {preSaleStats.waitingCount}
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              {preSaleStats.waitingCount === 1 ? 'pedido salvo' : 'pedidos salvos'}
            </span>
          </div>
          <span className="text-[11px] mt-1 block" style={{ color: 'var(--text-muted)' }}>
            Ficam salvos aqui até serem enviados
          </span>
        </div>

        <div
          className="p-4 sm:p-5 rounded-2xl border tactile"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <span
            className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <Package className="w-3.5 h-3.5 text-emerald-500" />
            Peças Chegaram (Pronto p/ Envio)
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {preSaleStats.readyToShipCount}
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              prontos p/ postar
            </span>
          </div>
          <span className="text-[11px] mt-1 block" style={{ color: 'var(--text-muted)' }}>
            Aguardando apenas postagem nos Correios/Loggi
          </span>
        </div>

        <div
          className="p-4 sm:p-5 rounded-2xl border tactile"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <span
            className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider block"
            style={{ color: 'var(--text-muted)' }}
          >
            Camisas Reservadas (Pendentes)
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span
              className="text-2xl sm:text-3xl font-black font-mono tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {preSaleStats.pendingPreSalePieces}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
              camisas
            </span>
          </div>
          <span className="text-[11px] mt-1 block" style={{ color: 'var(--text-muted)' }}>
            Em {consolidatedByShirt.length} modelo(s) de pré-venda
          </span>
        </div>

        <div
          className="p-4 sm:p-5 rounded-2xl border tactile"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <span
            className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider block"
            style={{ color: 'var(--text-muted)' }}
          >
            Pré-Vendas Já Enviadas
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span
              className="text-2xl sm:text-3xl font-black font-mono tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {preSaleStats.shippedCount}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              concluídas
            </span>
          </div>
          <span className="text-[11px] mt-1 block" style={{ color: 'var(--text-muted)' }}>
            Valor pendente: {formatCurrency(preSaleStats.totalPreSaleRevenue)}
          </span>
        </div>
      </div>

      {/* PAINEL PRINCIPAL DE CONTROLE DE RESERVAS DE PRÉ-VENDA */}
      <div
        className="rounded-2xl border p-4 sm:p-6 shadow-sm overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-crisp)',
        }}
      >
        {/* CABEÇALHO + ALTERNADOR DE VISÃO */}
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b"
          style={{ borderColor: 'var(--border-crisp)' }}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="text-lg sm:text-xl font-black flex items-center gap-2 tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                <CalendarClock className="w-5 h-5 text-amber-500" />
                Controle de Pedidos de Pré-Venda (Aguardando Chegada)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Anti-Esquecimento Ativo
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Todos os pedidos com camisas compradas na Pré-Venda ficam salvos automaticamente aqui até que as peças cheguem e sejam enviadas aos clientes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Alternador: Por Pedido vs Mapa de Camisas */}
            <div
              className="inline-flex rounded-xl p-1 border"
              style={{
                backgroundColor: 'var(--bg-studio)',
                borderColor: 'var(--border-crisp)',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('orders')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 tactile ${
                  viewMode === 'orders'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Fila de Pedidos ({preSaleStats.waitingCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('by_shirt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 tactile ${
                  viewMode === 'by_shirt'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Resumo por Camisa ({consolidatedByShirt.length})</span>
              </button>
            </div>

            {nonPreSaleOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAddExistingOpen(!isAddExistingOpen)}
                className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 tactile bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                title="Incluir manualmente um pedido existente na fila de Pré-Venda"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Vincular Pedido</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRefreshOrders}
              disabled={isRefreshingOrders}
              className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 tactile border-[var(--border-crisp)] bg-[var(--bg-surface)] hover:bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshingOrders ? 'animate-spin text-amber-500' : ''
                }`}
              />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* SELETOR RÁPIDO PARA VINCULAR UM PEDIDO EXISTENTE MANUALMENTE À PRÉ-VENDA */}
        {isAddExistingOpen && (
          <div
            className="mb-6 p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: 'var(--bg-studio)',
              borderColor: 'var(--border-crisp)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4
                  className="text-xs font-black uppercase tracking-wider"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Salvar Pedido Existente na Fila de Pré-Venda
                </h4>
                <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  Selecione qualquer pedido abaixo para guardá-lo na aba de Pré-Venda até as peças chegarem:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExistingOpen(false)}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Fechar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pt-1">
              {nonPreSaleOrders.slice(0, 18).map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 rounded-xl border flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-crisp)',
                  }}
                >
                  <div className="min-w-0">
                    <span
                      className="font-mono font-bold text-xs block truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      #{ord.orderNumber} — {ord.customerName}
                    </span>
                    <span
                      className="text-[10px] font-mono block"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {ord.totalQuantity} peça(s) • {formatCurrency(ord.finalTotal)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={togglingOrderId === ord.id}
                    onClick={() => handleToggleOrderPreSale(ord, true)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-[11px] shrink-0 tactile hover:bg-amber-400 disabled:opacity-50"
                  >
                    {togglingOrderId === ord.id ? '...' : '+ Salvar aqui'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISÃO 1: FILA DE CLIENTES & PEDIDOS DE PRÉ-VENDA */}
        {viewMode === 'orders' && (
          <div>
            {/* PÍLULAS DE FILTRO DA FILA */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {[
                {
                  key: 'WAITING' as const,
                  label: `⏳ Aguardando Chegada / Envio (${preSaleStats.waitingCount})`,
                },
                {
                  key: 'READY_TO_SHIP' as const,
                  label: `📦 Peças Chegaram — Prontos p/ Postar (${preSaleStats.readyToShipCount})`,
                },
                {
                  key: 'SHIPPED' as const,
                  label: `🚚 Já Enviados / Entregues (${preSaleStats.shippedCount})`,
                },
                {
                  key: 'ALL' as const,
                  label: `Todos de Pré-Venda (${preSaleStats.totalPreSaleOrders})`,
                },
              ].map((pill) => {
                const active = queueFilter === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setQueueFilter(pill.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border tactile ${
                      active
                        ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                        : 'hover:opacity-80'
                    }`}
                    style={
                      !active
                        ? {
                            backgroundColor: 'var(--bg-studio)',
                            borderColor: 'var(--border-crisp)',
                            color: 'var(--text-secondary)',
                          }
                        : undefined
                    }
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* BARRA DE BUSCA */}
            <div
              className="rounded-2xl border p-3 mb-6"
              style={{
                backgroundColor: 'var(--bg-studio)',
                borderColor: 'var(--border-crisp)',
              }}
            >
              <div className="relative w-full">
                <Search
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar reserva por nome do cliente, #pedido, WhatsApp, cidade ou modelo da camisa..."
                  className="w-full rounded-xl pl-10 pr-20 py-2.5 text-xs sm:text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-amber-500 tactile"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-primary)',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md border border-[var(--border-crisp)] bg-[var(--bg-studio)] text-[var(--text-secondary)]"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* LISTA DE PEDIDOS DE PRÉ-VENDA */}
            {filteredPreSaleOrders.length === 0 ? (
              <div
                className="py-14 px-4 text-center rounded-2xl border"
                style={{
                  backgroundColor: 'var(--bg-studio)',
                  borderColor: 'var(--border-crisp)',
                  color: 'var(--text-muted)',
                }}
              >
                <CalendarClock className="w-12 h-12 mx-auto mb-3 text-amber-500/50" />
                <p
                  className="font-bold text-sm sm:text-base"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {queueFilter === 'WAITING'
                    ? 'Nenhum pedido de Pré-Venda aguardando envio no momento'
                    : 'Nenhum pedido encontrado neste filtro'}
                </p>
                <p
                  className="text-xs mt-1 max-w-md mx-auto"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Assim que um cliente comprar qualquer camisa marcada como Pré-Venda na loja, o pedido ficará salvo automaticamente nesta fila até você despachar as peças.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPreSaleOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const st = (order.status || 'PENDING').toUpperCase();
                  const isReady = st === 'PRONTO_PARA_ENVIO';
                  const isShipped = st === 'ENVIADO' || st === 'ENTREGUE';
                  const isUpdating = updatingOrderId === order.id;

                  const createdDate = new Date(order.createdAt);
                  const daysWaiting = Math.max(
                    0,
                    Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
                  );
                  const dateFormatted = createdDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const arrivalWaUrl = buildArrivalWhatsAppUrl(order);

                  return (
                    <div
                      key={order.id}
                      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                        isReady
                          ? 'border-emerald-500/50 bg-emerald-500/5'
                          : isShipped
                          ? 'opacity-80'
                          : 'border-amber-500/35'
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                      }}
                    >
                      {/* Topo do Card do Pedido */}
                      <div
                        className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b"
                        style={{ borderColor: 'var(--border-crisp)' }}
                      >
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span
                            className="font-mono font-black text-sm sm:text-base"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            #{order.orderNumber}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.badge}`}
                          >
                            {statusInfo.emoji} {statusInfo.label}
                          </span>

                          {!isShipped && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {daysWaiting === 0
                                ? 'Reservado hoje'
                                : `Reservado há ${daysWaiting} ${
                                    daysWaiting === 1 ? 'dia' : 'dias'
                                  }`}
                            </span>
                          )}

                          <span
                            className="text-xs font-mono"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            ({dateFormatted})
                          </span>
                        </div>

                        {/* Botões Rápidos de Fluxo de Pré-Venda */}
                        <div className="flex flex-wrap items-center gap-2">
                          {!isReady && !isShipped && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                onUpdateOrderStatus(order.id, 'PRONTO_PARA_ENVIO')
                              }
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm tactile disabled:opacity-50"
                              title="Marcar que as camisas desta pré-venda chegaram e o pedido já pode ser embalado"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>📦 Peças Chegaram</span>
                            </button>
                          )}

                          {!isShipped && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => onUpdateOrderStatus(order.id, 'ENVIADO')}
                              className="px-3 py-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm tactile hover:opacity-90 disabled:opacity-50"
                              title="Marcar pedido como Enviado após despachar para o cliente"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>🚚 Marcar como Enviado</span>
                            </button>
                          )}

                          {arrivalWaUrl && (
                            <a
                              href={arrivalWaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs inline-flex items-center gap-1.5 tactile"
                              title="Enviar mensagem no WhatsApp avisando que as camisas da pré-venda chegaram"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Avisar Chegada no Zap</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectOrder(order)}
                            className="px-2.5 py-1.5 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-studio)] hover:opacity-80 text-xs font-bold inline-flex items-center gap-1 tactile"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalhes</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onCopyWhatsAppReport(order)}
                            className="px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center gap-1 tactile"
                            title="Copiar resumo do pedido para WhatsApp"
                          >
                            {copiedKey === `order-${order.id}` ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>Relatório</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onCopyOrderCardImage(order, `presale-img-${order.id}`)
                            }
                            disabled={copyingOrderImageId === order.id}
                            className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-bold inline-flex items-center gap-1 tactile"
                            title="Gerar card com foto das camisas para WhatsApp"
                          >
                            {copyingOrderImageId === order.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : copiedOrderImageId === `presale-img-${order.id}` ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5" />
                            )}
                            <span>Foto</span>
                          </button>
                        </div>
                      </div>

                      {/* Dados do Cliente + Endereço de Envio + Valor */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3.5 text-xs">
                        <div>
                          <span
                            className="text-[10px] font-mono uppercase font-bold block"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Cliente & Contato
                          </span>
                          <strong
                            className="text-sm font-bold block mt-0.5"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {order.customerName}
                          </strong>
                          <span
                            className="font-mono text-[11px] block mt-0.5"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            📱 {order.phone || 'Sem telefone'} • Doc: {order.document || 'N/A'}
                          </span>
                        </div>

                        <div>
                          <span
                            className="text-[10px] font-mono uppercase font-bold block"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Endereço Salvo para Envio
                          </span>
                          <p
                            className="font-medium mt-0.5 leading-snug"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <MapPin className="w-3.5 h-3.5 inline mr-1 text-rose-500" />
                            {order.street}, {order.number}
                            {order.complement ? ` (${order.complement})` : ''} —{' '}
                            {order.neighborhood}
                          </p>
                          <span
                            className="font-mono text-[11px] block mt-0.5"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {order.city}/{order.state} • CEP: {order.zipCode}
                          </span>
                        </div>

                        <div className="md:text-right">
                          <span
                            className="text-[10px] font-mono uppercase font-bold block"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Total & Modalidade de Frete
                          </span>
                          <strong className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">
                            {formatCurrency(order.finalTotal)} ({order.totalQuantity} un)
                          </strong>
                          <span
                            className="font-mono text-[11px] block mt-0.5"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            🚚 {order.shippingService || 'Melhor Envio'} (
                            {formatCurrency(order.shippingCost || 0)})
                          </span>
                        </div>
                      </div>

                      {/* Camisas do Pedido (Destacando as Peças de Pré-Venda) */}
                      <div
                        className="pt-3 border-t"
                        style={{ borderColor: 'var(--border-crisp)' }}
                      >
                        <span
                          className="text-[10px] font-mono uppercase font-bold block mb-2"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Camisas Reservadas neste Pedido ({(order.items || []).length} item/itens):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {(order.items || []).map((it: any, idx: number) => {
                            const preInfo = isOrderItemPreSale(it, products);
                            const gallery = getProductGalleryImages(it.product);
                            const imgSrc =
                              it.imageUrl ||
                              it.product?.imageUrl ||
                              gallery[0] ||
                              (it.productId ? `/api/products/${it.productId}/image` : '');
                            const itemName =
                              it.productName || it.product?.name || 'Camisa Ruby Brasil';
                            const modelInfo = getModelTypeBilingual({
                              type: it.product?.type,
                              league: it.product?.league,
                              name: itemName,
                            });

                            return (
                              <div
                                key={it.id || idx}
                                className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                                  preInfo.isPreSale
                                    ? 'border-amber-500/40 bg-amber-500/5'
                                    : ''
                                }`}
                                style={
                                  !preInfo.isPreSale
                                    ? {
                                        backgroundColor: 'var(--bg-studio)',
                                        borderColor: 'var(--border-crisp)',
                                      }
                                    : undefined
                                }
                              >
                                <div
                                  className="w-12 h-12 rounded-lg border overflow-hidden shrink-0 flex items-center justify-center"
                                  style={{
                                    backgroundColor: 'var(--bg-studio)',
                                    borderColor: 'var(--border-crisp)',
                                  }}
                                >
                                  {imgSrc ? (
                                    <img
                                      src={imgSrc}
                                      alt={itemName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-5 h-5 opacity-40" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 text-xs">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <strong
                                      className="font-bold truncate block"
                                      style={{ color: 'var(--text-primary)' }}
                                    >
                                      {itemName}
                                    </strong>
                                    {preInfo.isPreSale ? (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 font-black text-[9px] uppercase">
                                        ⏳ Pré-Venda
                                        {preInfo.preSaleEta ? ` • ${preInfo.preSaleEta}` : ''}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[9px] uppercase">
                                        Pronta Entrega
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className="font-mono text-[11px] mt-0.5"
                                    style={{ color: 'var(--text-secondary)' }}
                                  >
                                    Tam: <strong>{formatBilingualSize(it.size)}</strong> • Qtd:{' '}
                                    <strong>{it.quantity}un</strong> ({modelInfo.pt})
                                  </div>
                                  {it.customName && (
                                    <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                      ✎ Personalizada: {it.customName} #{it.customNumber || 'S/N'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VISÃO 2: RESUMO CONSOLIDADO POR CAMISA DE PRÉ-VENDA (MAPA DE SEPARAÇÃO) */}
        {viewMode === 'by_shirt' && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              style={{
                backgroundColor: 'var(--bg-studio)',
                borderColor: 'var(--border-crisp)',
                color: 'var(--text-secondary)',
              }}
            >
              <span>
                📋 <strong>Mapa de Recebimento & Separação:</strong> Veja abaixo o total de peças vendidas na Pré-Venda agrupadas por camisa e tamanho, e quais clientes estão aguardando cada modelo.
              </span>
            </div>

            {consolidatedByShirt.length === 0 ? (
              <div
                className="py-14 px-4 text-center rounded-2xl border"
                style={{
                  backgroundColor: 'var(--bg-studio)',
                  borderColor: 'var(--border-crisp)',
                  color: 'var(--text-muted)',
                }}
              >
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p
                  className="font-bold text-sm sm:text-base"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Nenhuma camisa de Pré-Venda pendente de chegada
                </p>
                <p className="text-xs mt-1">
                  Todas as reservas de pré-venda já foram enviadas ou ainda não há reservas abertas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {consolidatedByShirt.map((shirt) => {
                  const uniqueOrderIds = Array.from(
                    new Set(shirt.customerOrders.map((co) => co.orderId))
                  );
                  const isBulkUpdating = bulkLoadingProductId === shirt.productId;

                  return (
                    <div
                      key={shirt.productId}
                      className="rounded-2xl border p-4 sm:p-5"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-crisp)',
                      }}
                    >
                      <div
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b"
                        style={{ borderColor: 'var(--border-crisp)' }}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-14 h-14 rounded-xl border overflow-hidden shrink-0 flex items-center justify-center"
                            style={{
                              backgroundColor: 'var(--bg-studio)',
                              borderColor: 'var(--border-crisp)',
                            }}
                          >
                            {shirt.imageUrl ? (
                              <img
                                src={shirt.imageUrl}
                                alt={shirt.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 opacity-40" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                className="font-black text-sm sm:text-base"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {shirt.productName}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                                ⏳ {shirt.preSaleEta || 'Pré-Venda'}
                              </span>
                            </div>
                            <p
                              className="text-xs font-mono mt-1"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Total Reservado:{' '}
                              <strong className="text-amber-600 dark:text-amber-400">
                                {shirt.totalUnitsWaiting} camisa(s)
                              </strong>{' '}
                              para <strong>{uniqueOrderIds.length} cliente(s)</strong>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isBulkUpdating}
                          onClick={() =>
                            handleMarkShirtBatchArrived(
                              shirt.productId,
                              shirt.productName,
                              uniqueOrderIds
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm tactile shrink-0 disabled:opacity-50"
                        >
                          {isBulkUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>
                            📦 Lote desta Camisa Chegou (Liberar {uniqueOrderIds.length}{' '}
                            {uniqueOrderIds.length === 1 ? 'Pedido' : 'Pedidos'})
                          </span>
                        </button>
                      </div>

                      {/* Grade de Tamanhos Reservados deste Modelo */}
                      <div className="py-3 flex flex-wrap items-center gap-2">
                        <span
                          className="text-[11px] font-mono font-bold uppercase mr-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Tamanhos a Separar:
                        </span>
                        {Object.entries(shirt.sizesBreakdown).map(([sz, qty]) => (
                          <span
                            key={sz}
                            className="px-2.5 py-1 rounded-lg border text-xs font-mono font-bold"
                            style={{
                              backgroundColor: 'var(--bg-studio)',
                              borderColor: 'var(--border-crisp)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <strong className="text-amber-600 dark:text-amber-400">
                              {qty}x
                            </strong>{' '}
                            {formatBilingualSize(sz)}
                          </span>
                        ))}
                      </div>

                      {/* Lista de Clientes Aguardando esta Camisa */}
                      <div
                        className="pt-3 border-t"
                        style={{ borderColor: 'var(--border-crisp)' }}
                      >
                        <span
                          className="text-[10px] font-mono uppercase font-bold block mb-2"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Clientes que compraram este modelo:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {shirt.customerOrders.map((co, cIdx) => {
                            const stInfo = getStatusInfo(co.status);
                            return (
                              <div
                                key={`${co.orderId}-${cIdx}`}
                                className="p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2"
                                style={{
                                  backgroundColor: 'var(--bg-studio)',
                                  borderColor: 'var(--border-crisp)',
                                }}
                              >
                                <div className="min-w-0">
                                  <strong
                                    className="font-bold block truncate"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {co.customerName} (#{co.orderNumber})
                                  </strong>
                                  <span
                                    className="text-[11px] font-mono block"
                                    style={{ color: 'var(--text-secondary)' }}
                                  >
                                    {co.quantity}x Tam: <strong>{co.size}</strong> •{' '}
                                    {co.city}/{co.state}
                                  </span>
                                  {co.customName && (
                                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 block">
                                      ✎ {co.customName} #{co.customNumber || 'S/N'}
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${stInfo.badge}`}
                                >
                                  {stInfo.emoji}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

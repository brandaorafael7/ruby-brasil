'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  Users,
  Eye,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Smartphone,
  Monitor,
  Globe,
  MapPin,
  Layers,
  Award,
  Activity,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { formatCurrency, getProductGalleryImages, isGradeProduct } from '@/lib/utils';

interface AdminAnalyticsTabProps {
  products: any[];
  orders: any[];
}

interface AnalyticsApiData {
  summary: {
    totalPageViews: number;
    uniqueVisitors: number;
    onlineNow: number;
    visitorsToday: number;
    productViews: number;
    addToCartCount: number;
    checkoutClicks: number;
    searchCount: number;
  };
  daily: Array<{
    date: string;
    views: number;
    visitors: number;
    cartAdds: number;
  }>;
  devices: Array<{
    device: string;
    count: number;
  }>;
  referrers: Array<{
    referrer: string;
    count: number;
  }>;
  topEventProducts: Array<{
    productId: string;
    productName: string;
    views: number;
    cartAdds: number;
  }>;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    path: string;
    productId: string | null;
    productName: string | null;
    category: string | null;
    device: string;
    referrer: string;
    createdAt: string;
  }>;
}

const EVENT_LABELS: Record<string, { label: string; badge: string }> = {
  PAGE_VIEW: {
    label: 'Acesso ao Catálogo',
    badge: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
  },
  PRODUCT_VIEW: {
    label: 'Visualizou Produto',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25',
  },
  CATEGORY_FILTER: {
    label: 'Filtrou Categoria',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  ADD_TO_CART: {
    label: 'Adicionou à Sacola',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  CHECKOUT_START: {
    label: 'Iniciou Checkout',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  WHATSAPP_CLICK: {
    label: 'Pedido WhatsApp',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35',
  },
  SEARCH: {
    label: 'Pesquisa no Site',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25',
  },
};

export default function AdminAnalyticsTab({ products, orders }: AdminAnalyticsTabProps) {
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<AnalyticsApiData>({
    summary: {
      totalPageViews: 0,
      uniqueVisitors: 0,
      onlineNow: 0,
      visitorsToday: 0,
      productViews: 0,
      addToCartCount: 0,
      checkoutClicks: 0,
      searchCount: 0,
    },
    daily: [],
    devices: [],
    referrers: [],
    topEventProducts: [],
    topCategories: [],
    recentEvents: [],
  });

  const fetchAnalytics = useCallback(async (selectedDays: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${selectedDays}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(daysFilter);
  }, [daysFilter, fetchAnalytics]);

  // Filtra pedidos dentro da janela de tempo selecionada
  const periodOrders = useMemo(() => {
    const cutoff = Date.now() - daysFilter * 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      if (!o.createdAt) return true;
      const t = new Date(o.createdAt).getTime();
      return !isNaN(t) ? t >= cutoff : true;
    });
  }, [orders, daysFilter]);

  // Métricas comerciais calculadas a partir dos pedidos reais
  const commercialStats = useMemo(() => {
    const validOrders = periodOrders.filter(
      (o) => (o.status || 'PENDING').toUpperCase() !== 'CANCELADO'
    );
    const totalOrdersCount = validOrders.length;
    const totalRevenue = validOrders.reduce((acc, o) => acc + (Number(o.finalTotal) || 0), 0);
    const confirmedRevenue = validOrders
      .filter((o) =>
        ['PAGAMENTO_CONFIRMADO', 'ENVIADO', 'ENTREGUE'].includes(
          (o.status || '').toUpperCase()
        )
      )
      .reduce((acc, o) => acc + (Number(o.finalTotal) || 0), 0);

    const totalPieces = validOrders.reduce(
      (acc, o) =>
        acc +
        (Number(o.totalQuantity) ||
          (o.items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 1), 0)),
      0
    );

    const avgTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
    const avgPiecesPerOrder = totalOrdersCount > 0 ? totalPieces / totalOrdersCount : 0;

    const wholesaleOrders = validOrders.filter(
      (o) => o.isWholesale || (Number(o.totalQuantity) || 0) >= 10
    ).length;
    const wholesaleShare =
      totalOrdersCount > 0 ? Math.round((wholesaleOrders / totalOrdersCount) * 100) : 0;

    // Distribuição por tamanho
    const sizeCounts: Record<string, number> = {};
    // Distribuição por estado (UF)
    const stateStats: Record<string, { orders: number; revenue: number; pieces: number }> = {};
    // Desempenho por produto nos pedidos
    const productSales: Record<
      string,
      {
        productId: string;
        name: string;
        club: string;
        league: string;
        imageUrl: string;
        unitsSold: number;
        revenue: number;
        ordersCount: number;
      }
    > = {};
    // Desempenho por liga/categoria nos pedidos
    const leagueSales: Record<string, { units: number; revenue: number }> = {};

    validOrders.forEach((order) => {
      const uf = (order.state || 'SP').toUpperCase().trim().slice(0, 2) || 'SP';
      if (!stateStats[uf]) {
        stateStats[uf] = { orders: 0, revenue: 0, pieces: 0 };
      }
      stateStats[uf].orders += 1;
      stateStats[uf].revenue += Number(order.finalTotal) || 0;
      stateStats[uf].pieces += Number(order.totalQuantity) || 0;

      (order.items || []).forEach((item: any) => {
        const qty = Number(item.quantity) || 1;
        const rawSize = String(item.size || 'M').trim();
        const sizeKey = rawSize.startsWith('GRADE') ? 'GRADE 12UN' : rawSize;
        sizeCounts[sizeKey] = (sizeCounts[sizeKey] || 0) + qty;

        const pid = item.productId || item.product?.id || item.productName || 'unknown';
        const matchedProduct = products.find((p) => p.id === pid);
        const pName =
          item.productName || item.product?.name || matchedProduct?.name || 'Camisa Ruby Brasil';
        const pClub = item.product?.club || matchedProduct?.club || '';
        const pLeague =
          item.product?.league || matchedProduct?.league || 'Catálogo Geral';
        const pImg =
          item.imageUrl ||
          item.product?.imageUrl ||
          (matchedProduct ? getProductGalleryImages(matchedProduct)[0] : '') ||
          '';

        if (!productSales[pid]) {
          productSales[pid] = {
            productId: pid,
            name: pName,
            club: pClub,
            league: pLeague,
            imageUrl: pImg,
            unitsSold: 0,
            revenue: 0,
            ordersCount: 0,
          };
        }
        productSales[pid].unitsSold += qty;
        productSales[pid].revenue += Number(item.totalItemPrice) || 0;
        productSales[pid].ordersCount += 1;

        if (!leagueSales[pLeague]) {
          leagueSales[pLeague] = { units: 0, revenue: 0 };
        }
        leagueSales[pLeague].units += qty;
        leagueSales[pLeague].revenue += Number(item.totalItemPrice) || 0;
      });
    });

    const sortedSizes = Object.entries(sizeCounts)
      .map(([size, count]) => ({
        size,
        count,
        percent: totalPieces > 0 ? Math.round((count / totalPieces) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const sortedStates = Object.entries(stateStats)
      .map(([uf, data]) => ({
        uf,
        ...data,
        percent: totalOrdersCount > 0 ? Math.round((data.orders / totalOrdersCount) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const sortedLeagues = Object.entries(leagueSales)
      .map(([league, data]) => ({
        league,
        ...data,
      }))
      .sort((a, b) => b.units - a.units);

    return {
      totalOrdersCount,
      totalRevenue,
      confirmedRevenue,
      totalPieces,
      avgTicket,
      avgPiecesPerOrder,
      wholesaleOrders,
      wholesaleShare,
      sortedSizes,
      sortedStates,
      productSales,
      sortedLeagues,
    };
  }, [periodOrders, products]);

  // Combina produtos mais clicados (eventos) com produtos mais vendidos (pedidos)
  const combinedTopProducts = useMemo(() => {
    const map = new Map<
      string,
      {
        productId: string;
        name: string;
        club: string;
        league: string;
        imageUrl: string;
        views: number;
        cartAdds: number;
        unitsSold: number;
        revenue: number;
      }
    >();

    Object.values(commercialStats.productSales).forEach((ps) => {
      map.set(ps.productId, {
        productId: ps.productId,
        name: ps.name,
        club: ps.club,
        league: ps.league,
        imageUrl: ps.imageUrl,
        views: 0,
        cartAdds: 0,
        unitsSold: ps.unitsSold,
        revenue: ps.revenue,
      });
    });

    analytics.topEventProducts.forEach((ep) => {
      const existing = map.get(ep.productId);
      const matchedProduct = products.find((p) => p.id === ep.productId);
      if (existing) {
        existing.views += ep.views || 0;
        existing.cartAdds += ep.cartAdds || 0;
      } else {
        map.set(ep.productId, {
          productId: ep.productId,
          name: ep.productName || matchedProduct?.name || 'Peça do Catálogo',
          club: matchedProduct?.club || '',
          league: matchedProduct?.league || 'Catálogo',
          imageUrl: matchedProduct ? getProductGalleryImages(matchedProduct)[0] || matchedProduct.imageUrl : '',
          views: ep.views || 0,
          cartAdds: ep.cartAdds || 0,
          unitsSold: 0,
          revenue: 0,
        });
      }
    });

    // Se ainda houver poucos itens, preenche com produtos em destaque do catálogo
    if (map.size < 5) {
      products.slice(0, 6).forEach((p) => {
        if (!map.has(p.id)) {
          map.set(p.id, {
            productId: p.id,
            name: p.name,
            club: p.club || '',
            league: isGradeProduct(p) ? 'Grades (12un)' : p.league || 'Catálogo',
            imageUrl: getProductGalleryImages(p)[0] || p.imageUrl || '',
            views: 0,
            cartAdds: 0,
            unitsSold: 0,
            revenue: 0,
          });
        }
      });
    }

    return Array.from(map.values())
      .sort((a, b) => {
        if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
        if (b.cartAdds !== a.cartAdds) return b.cartAdds - a.cartAdds;
        return b.views - a.views;
      })
      .slice(0, 8);
  }, [commercialStats.productSales, analytics.topEventProducts, products]);

  // Série diária dos últimos 14 dias combinando acessos + pedidos por dia
  const last14DaysChart = useMemo(() => {
    const result: Array<{
      dateKey: string;
      label: string;
      views: number;
      visitors: number;
      cartAdds: number;
      orders: number;
      revenue: number;
    }> = [];

    const dailyMap = new Map<string, { views: number; visitors: number; cartAdds: number }>();
    analytics.daily.forEach((d) => {
      dailyMap.set(d.date, {
        views: Number(d.views) || 0,
        visitors: Number(d.visitors) || 0,
        cartAdds: Number(d.cartAdds) || 0,
      });
    });

    const ordersByDate = new Map<string, { count: number; revenue: number }>();
    orders.forEach((o) => {
      if (!o.createdAt || (o.status || '').toUpperCase() === 'CANCELADO') return;
      const d = new Date(o.createdAt);
      if (isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      const curr = ordersByDate.get(key) || { count: 0, revenue: 0 };
      curr.count += 1;
      curr.revenue += Number(o.finalTotal) || 0;
      ordersByDate.set(key, curr);
    });

    for (let i = 13; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const label = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const ev = dailyMap.get(key) || { views: 0, visitors: 0, cartAdds: 0 };
      const ord = ordersByDate.get(key) || { count: 0, revenue: 0 };

      result.push({
        dateKey: key,
        label,
        views: ev.views,
        visitors: ev.visitors,
        cartAdds: ev.cartAdds,
        orders: ord.count,
        revenue: ord.revenue,
      });
    }

    return result;
  }, [analytics.daily, orders]);

  const maxDailyValue = useMemo(() => {
    const maxV = Math.max(
      ...last14DaysChart.map((d) => Math.max(d.views, d.cartAdds, d.orders * 3)),
      1
    );
    return maxV;
  }, [last14DaysChart]);

  // Taxas e Funil
  const totalVisitors = Math.max(
    analytics.summary.uniqueVisitors,
    commercialStats.totalOrdersCount
  );
  const totalViews = Math.max(
    analytics.summary.totalPageViews,
    totalVisitors
  );
  const totalCartAdds = Math.max(
    analytics.summary.addToCartCount,
    commercialStats.totalOrdersCount
  );
  const conversionRate =
    totalVisitors > 0
      ? ((commercialStats.totalOrdersCount / totalVisitors) * 100).toFixed(1)
      : '0.0';
  const cartRate =
    totalVisitors > 0
      ? Math.min(100, Math.round((totalCartAdds / totalVisitors) * 100))
      : 0;

  const totalDeviceVisitors = useMemo(() => {
    return analytics.devices.reduce((acc, d) => acc + d.count, 0) || 1;
  }, [analytics.devices]);

  const totalReferrerVisitors = useMemo(() => {
    return analytics.referrers.reduce((acc, r) => acc + r.count, 0) || 1;
  }, [analytics.referrers]);

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA ABA DE MÉTRICAS & FILTRO DE PERÍODO */}
      <div
        className="rounded-2xl border p-4 sm:p-6 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-crisp)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                className="text-lg sm:text-xl font-black flex items-center gap-2 tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                <BarChart3 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                Métricas de Acesso & Inteligência de Vendas
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {analytics.summary.onlineNow} online agora
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Acompanhe em tempo real o tráfego de visitantes, adições à sacola, conversão de pedidos, tamanhos mais vendidos e estados compradores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Hoje', value: 1 },
              { label: '7 dias', value: 7 },
              { label: '30 dias', value: 30 },
              { label: '90 dias', value: 90 },
              { label: '12 meses', value: 365 },
            ].map((period) => (
              <button
                key={period.value}
                type="button"
                onClick={() => setDaysFilter(period.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border tactile ${
                  daysFilter === period.value
                    ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white'
                    : 'hover:opacity-80'
                }`}
                style={
                  daysFilter !== period.value
                    ? {
                        backgroundColor: 'var(--bg-studio)',
                        borderColor: 'var(--border-crisp)',
                        color: 'var(--text-secondary)',
                      }
                    : undefined
                }
              >
                {period.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => fetchAnalytics(daysFilter)}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold border tactile inline-flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-crisp)',
                color: 'var(--text-primary)',
              }}
              title="Atualizar métricas agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-500' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* BLOCO 1: KPIS DE TRÁFEGO E COMPORTAMENTO DO VISITANTE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-mono font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Visitantes Únicos
            </span>
            <Users className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className="text-3xl font-black font-mono tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {totalVisitors.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              sessões
            </span>
          </div>
          <p className="text-[11px] mt-1.5 font-mono" style={{ color: 'var(--text-secondary)' }}>
            Hoje: <strong>{analytics.summary.visitorsToday}</strong> visitante(s)
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-mono font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Visualizações (Pageviews)
            </span>
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className="text-3xl font-black font-mono tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {totalViews.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              páginas
            </span>
          </div>
          <p className="text-[11px] mt-1.5 font-mono" style={{ color: 'var(--text-secondary)' }}>
            Média:{' '}
            <strong>
              {totalVisitors > 0 ? (totalViews / totalVisitors).toFixed(1) : '1.0'}x
            </strong>{' '}
            por visitante
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-mono font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Adições à Sacola
            </span>
            <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className="text-3xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400"
            >
              {totalCartAdds.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              cliques
            </span>
          </div>
          <p className="text-[11px] mt-1.5 font-mono" style={{ color: 'var(--text-secondary)' }}>
            Engajamento de sacola: <strong>{cartRate}%</strong>
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-mono font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Taxa de Conversão
            </span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className="text-3xl font-black font-mono tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {conversionRate}%
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              em pedidos
            </span>
          </div>
          <p className="text-[11px] mt-1.5 font-mono" style={{ color: 'var(--text-secondary)' }}>
            <strong>{commercialStats.totalOrdersCount}</strong> pedido(s) no período
          </p>
        </div>
      </div>

      {/* BLOCO 2: KPIS COMERCIAIS E FINANCEIROS DO PERÍODO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <span
            className="text-[11px] font-mono font-bold uppercase tracking-wider block"
            style={{ color: 'var(--text-muted)' }}
          >
            Receita Gerada no Período
          </span>
          <div className="mt-2">
            <span
              className="text-2xl sm:text-3xl font-black font-mono tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {formatCurrency(commercialStats.totalRevenue)}
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1.5 block">
            Confirmado/Pago: {formatCurrency(commercialStats.confirmedRevenue)}
          </span>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <span
            className="text-[11px] font-mono font-bold uppercase tracking-wider block"
            style={{ color: 'var(--text-muted)' }}
          >
            Ticket Médio por Pedido
          </span>
          <div className="mt-2">
            <span
              className="text-2xl sm:text-3xl font-black font-mono tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {formatCurrency(commercialStats.avgTicket)}
            </span>
          </div>
          <span className="text-[11px] font-mono mt-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            Média de <strong>{commercialStats.avgPiecesPerOrder.toFixed(1)} peças</strong> / pedido
          </span>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <span
            className="text-[11px] font-mono font-bold uppercase tracking-wider block"
            style={{ color: 'var(--text-muted)' }}
          >
            Volume de Camisas Vendidas
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {commercialStats.totalPieces.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              unidades
            </span>
          </div>
          <span className="text-[11px] font-mono mt-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            Em {commercialStats.totalOrdersCount} pedido(s) válido(s)
          </span>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <span
            className="text-[11px] font-mono font-bold uppercase tracking-wider block"
            style={{ color: 'var(--text-muted)' }}
          >
            Perfil Atacado / Grades
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {commercialStats.wholesaleShare}%
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              dos pedidos
            </span>
          </div>
          <span className="text-[11px] font-mono mt-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            {commercialStats.wholesaleOrders} pedido(s) com 10+ peças ou Grade
          </span>
        </div>
      </div>

      {/* BLOCO 3: GRÁFICO DE EVOLUÇÃO DIÁRIA (14 DIAS) + FUNIL DE CONVERSÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Evolução Diária */}
        <div
          className="lg:col-span-2 rounded-2xl border p-5 sm:p-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3
                className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Evolução Diária de Acessos & Sacola (Últimos 14 Dias)
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Comparativo diário de páginas vistas, adições à sacola e pedidos gerados
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-zinc-900 dark:bg-zinc-200 inline-block" />
                Acessos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                Sacola
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 inline-block" />
                Pedidos
              </span>
            </div>
          </div>

          <div className="h-52 flex items-end justify-between gap-1.5 sm:gap-2.5 pt-6 pb-2 px-1 border-b" style={{ borderColor: 'var(--border-crisp)' }}>
            {last14DaysChart.map((day) => {
              const viewsHeight = Math.max(
                day.views > 0 ? 10 : 3,
                Math.round((day.views / maxDailyValue) * 150)
              );
              const cartHeight = Math.max(
                day.cartAdds > 0 ? 8 : 0,
                Math.round((day.cartAdds / maxDailyValue) * 150)
              );
              const ordersHeight = Math.max(
                day.orders > 0 ? 12 : 0,
                Math.round(((day.orders * 3) / maxDailyValue) * 150)
              );

              return (
                <div
                  key={day.dateKey}
                  className="flex-1 flex flex-col items-center group relative"
                >
                  {/* Tooltip no Hover */}
                  <div
                    className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-20 z-20 px-2.5 py-1.5 rounded-xl border shadow-lg text-[10px] font-mono whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div className="font-bold">{day.label}</div>
                    <div>👁️ Acessos: {day.views} ({day.visitors} visit.)</div>
                    <div>🛍️ Sacola: {day.cartAdds}</div>
                    <div>
                      📦 Pedidos: {day.orders} ({formatCurrency(day.revenue)})
                    </div>
                  </div>

                  <div className="w-full flex items-end justify-center gap-0.5 h-40">
                    <div
                      className="w-2 sm:w-2.5 rounded-t bg-zinc-900 dark:bg-zinc-200 transition-all"
                      style={{ height: `${viewsHeight}px` }}
                    />
                    {cartHeight > 0 && (
                      <div
                        className="w-2 sm:w-2.5 rounded-t bg-emerald-500 transition-all"
                        style={{ height: `${cartHeight}px` }}
                      />
                    )}
                    {ordersHeight > 0 && (
                      <div
                        className="w-2 sm:w-2.5 rounded-t bg-rose-600 transition-all"
                        style={{ height: `${ordersHeight}px` }}
                      />
                    )}
                  </div>
                  <span
                    className="text-[9px] sm:text-[10px] font-mono mt-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Funil de Conversão do E-commerce */}
        <div
          className="rounded-2xl border p-5 sm:p-6 flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <div>
            <h3
              className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Funil de Jornada do Cliente
            </h3>
            <p className="text-xs mt-0.5 mb-5" style={{ color: 'var(--text-secondary)' }}>
              Conversão etapa por etapa no catálogo
            </p>

            <div className="space-y-4">
              {[
                {
                  step: '1. Visitantes no Site',
                  count: totalVisitors,
                  pct: 100,
                  barClass: 'bg-zinc-900 dark:bg-zinc-100',
                },
                {
                  step: '2. Páginas & Filtros Vistos',
                  count: totalViews,
                  pct: totalVisitors > 0 ? Math.min(100, Math.round((totalViews / Math.max(totalViews, 1)) * 100)) : 100,
                  barClass: 'bg-blue-600',
                },
                {
                  step: '3. Adicionaram na Sacola',
                  count: totalCartAdds,
                  pct: totalVisitors > 0 ? Math.min(100, Math.max(8, Math.round((totalCartAdds / totalVisitors) * 100))) : 0,
                  barClass: 'bg-emerald-600',
                },
                {
                  step: '4. Pedidos Concluídos',
                  count: commercialStats.totalOrdersCount,
                  pct:
                    totalVisitors > 0
                      ? Math.min(
                          100,
                          Math.max(
                            commercialStats.totalOrdersCount > 0 ? 5 : 0,
                            Math.round((commercialStats.totalOrdersCount / totalVisitors) * 100)
                          )
                        )
                      : 0,
                  barClass: 'bg-rose-600',
                },
              ].map((item) => (
                <div key={item.step} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {item.step}
                    </span>
                    <span className="font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>
                      {item.count.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div
                    className="w-full h-2.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-studio)' }}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.barClass}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-6 p-3.5 rounded-xl border text-xs"
            style={{
              backgroundColor: 'var(--bg-studio)',
              borderColor: 'var(--border-crisp)',
              color: 'var(--text-secondary)',
            }}
          >
            <div className="flex items-center justify-between font-mono">
              <span>Taxa Visitante ➔ Sacola:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{cartRate}%</strong>
            </div>
            <div className="flex items-center justify-between font-mono mt-1">
              <span>Taxa Visitante ➔ Pedido:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">{conversionRate}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 4: RANKING DE PRODUTOS MAIS POPULARES + CURVA DE TAMANHOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Produtos Mais Procurados e Vendidos */}
        <div
          className="lg:col-span-2 rounded-2xl border p-5 sm:p-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Award className="w-4 h-4 text-amber-500" />
                Modelos & Grades Mais Populares
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Peças com maior volume de vendas e cliques de adição à sacola
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="border-b text-[10px] font-mono uppercase tracking-wider"
                  style={{
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th className="py-2.5 pr-3">Modelo / Clube</th>
                  <th className="py-2.5 px-3 text-center">Na Sacola</th>
                  <th className="py-2.5 px-3 text-center">Vendidas</th>
                  <th className="py-2.5 pl-3 text-right">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs" style={{ borderColor: 'var(--border-crisp)' }}>
                {combinedTopProducts.map((prod, idx) => (
                  <tr key={prod.productId} className="hover:opacity-90">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-5 text-[11px] font-mono font-bold text-center"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          #{idx + 1}
                        </span>
                        <div
                          className="w-10 h-10 rounded-lg border overflow-hidden shrink-0 flex items-center justify-center"
                          style={{
                            backgroundColor: 'var(--bg-studio)',
                            borderColor: 'var(--border-crisp)',
                          }}
                        >
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="w-4 h-4 opacity-40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-bold truncate max-w-[200px] sm:max-w-[280px]"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {prod.name}
                          </p>
                          <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            {prod.club ? `${prod.club} • ` : ''}
                            {prod.league}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                        {prod.cartAdds}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                      {prod.unitsSold} un
                    </td>
                    <td className="py-3 pl-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(prod.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Curva de Tamanhos Mais Vendidos */}
        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <h3
            className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Layers className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Demanda por Tamanho
          </h3>
          <p className="text-xs mt-0.5 mb-5" style={{ color: 'var(--text-secondary)' }}>
            Proporção real de tamanhos pedidos para guiar a compra de estoque e Grades
          </p>

          {commercialStats.sortedSizes.length === 0 ? (
            <p className="text-xs py-8 text-center font-mono" style={{ color: 'var(--text-muted)' }}>
              Ainda sem pedidos registrados no período selecionado.
            </p>
          ) : (
            <div className="space-y-3.5">
              {commercialStats.sortedSizes.slice(0, 8).map((item) => (
                <div key={item.size} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      Tam. {item.size}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <strong>{item.count} un</strong> ({item.percent}%)
                    </span>
                  </div>
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-studio)' }}
                  >
                    <div
                      className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                      style={{ width: `${Math.max(item.percent, 6)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BLOCO 5: DISPOSITIVOS, ORIGEM DE TRÁFEGO E ESTADOS (UFS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dispositivos */}
        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <h3
            className="text-sm font-black tracking-tight flex items-center gap-2 mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Dispositivos de Acesso
          </h3>

          {analytics.devices.length === 0 ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Mobile (Celular)
                </span>
                <strong>--</strong>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="inline-flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" /> Desktop (Computador)
                </span>
                <strong>--</strong>
              </div>
              <p className="text-[11px] pt-2" style={{ color: 'var(--text-muted)' }}>
                Os acessos por celular e computador aparecem automaticamente conforme os clientes navegam na loja.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {analytics.devices.map((d) => {
                const pct = Math.round((d.count / totalDeviceVisitors) * 100);
                return (
                  <div key={d.device} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        {d.device === 'Desktop' ? (
                          <Monitor className="w-3.5 h-3.5 text-zinc-500" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        {d.device}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {d.count} ({pct}%)
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-studio)' }}
                    >
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Origem de Tráfego (Referrers) & Categorias Clicadas */}
        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <h3
            className="text-sm font-black tracking-tight flex items-center gap-2 mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Origem dos Visitantes & Ligas
          </h3>

          <div className="space-y-3">
            {analytics.referrers.length > 0 ? (
              analytics.referrers.map((ref) => {
                const pct = Math.round((ref.count / totalReferrerVisitors) * 100);
                return (
                  <div key={ref.referrer} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {ref.referrer}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {ref.count} visit. ({pct}%)
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-studio)' }}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              commercialStats.sortedLeagues.slice(0, 5).map((lg) => (
                <div key={lg.league} className="flex items-center justify-between text-xs font-mono py-1 border-b last:border-b-0" style={{ borderColor: 'var(--border-crisp)' }}>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {lg.league}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {lg.units} un • {formatCurrency(lg.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Estados (UFs) que Mais Compram */}
        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          <h3
            className="text-sm font-black tracking-tight flex items-center gap-2 mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Estados que Mais Compram (UF)
          </h3>

          {commercialStats.sortedStates.length === 0 ? (
            <p className="text-xs py-6 text-center font-mono" style={{ color: 'var(--text-muted)' }}>
              Nenhum estado registrado no período.
            </p>
          ) : (
            <div className="space-y-3">
              {commercialStats.sortedStates.slice(0, 6).map((st) => (
                <div
                  key={st.uf}
                  className="flex items-center justify-between text-xs py-1.5 border-b last:border-b-0"
                  style={{ borderColor: 'var(--border-crisp)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-bold text-[11px]">
                      {st.uf}
                    </span>
                    <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {st.orders} ped. ({st.pieces} un)
                    </span>
                  </div>
                  <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(st.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BLOCO 6: ATIVIDADE EM TEMPO REAL (ÚLTIMOS ACESSOS E INTERAÇÕES NO SITE) */}
      <div
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-crisp)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Atividade Recente de Clientes no Site (Ao Vivo)
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Últimas 25 ações registradas (visitas ao catálogo, filtros de categoria e adições à sacola)
            </p>
          </div>
        </div>

        {analytics.recentEvents.length === 0 ? (
          <div
            className="p-8 rounded-xl border text-center text-xs font-mono"
            style={{
              backgroundColor: 'var(--bg-studio)',
              borderColor: 'var(--border-crisp)',
              color: 'var(--text-muted)',
            }}
          >
            O rastreador de acessos está ativo. Assim que clientes navegarem pela vitrine, os eventos em tempo real serão listados aqui.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className="border-b text-[10px] font-mono uppercase tracking-wider"
                  style={{
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th className="py-2.5 pr-3">Horário</th>
                  <th className="py-2.5 px-3">Ação do Cliente</th>
                  <th className="py-2.5 px-3">Detalhe / Produto / Categoria</th>
                  <th className="py-2.5 px-3">Dispositivo</th>
                  <th className="py-2.5 pl-3 text-right">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-crisp)' }}>
                {analytics.recentEvents.map((ev) => {
                  const info = EVENT_LABELS[ev.eventType] || {
                    label: ev.eventType,
                    badge: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
                  };
                  const dt = ev.createdAt ? new Date(ev.createdAt) : null;
                  const timeStr =
                    dt && !isNaN(dt.getTime())
                      ? dt.toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Agora';

                  return (
                    <tr key={ev.id} className="hover:opacity-90">
                      <td className="py-2.5 pr-3 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {timeStr}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${info.badge}`}
                        >
                          {info.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {ev.productName || ev.category || ev.path || '/'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {ev.device || 'Mobile'}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {ev.referrer || 'Direto'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

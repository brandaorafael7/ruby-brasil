'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Flame,
  Settings,
  RefreshCw,
  Save,
  CheckCircle,
  Layers,
  Package,
  ArrowLeft,
  ShoppingBag,
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Image as ImageIcon,
  LogOut,
  User,
  Search,
  UploadCloud,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  Copy,
  ExternalLink,
  MessageCircle,
  Send,
  Check,
  Filter,
} from 'lucide-react';
import { formatCurrency, getStandardSizesForProduct } from '@/lib/utils';
import { PromotionalBatch, WholesaleTier } from '@/lib/types';

export const ORDER_STATUS_MAP: Record<
  string,
  { label: string; badge: string; border: string; color: string; emoji: string }
> = {
  PENDING: {
    label: 'Pendente',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    border: 'border-amber-500/40',
    color: '#fbbf24',
    emoji: '⏳',
  },
  PROCESSAMENTO: {
    label: 'Em Processamento',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    border: 'border-blue-500/40',
    color: '#60a5fa',
    emoji: '⚙️',
  },
  PAGAMENTO_CONFIRMADO: {
    label: 'Pagamento Confirmado',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    border: 'border-emerald-500/40',
    color: '#34d399',
    emoji: '✅',
  },
  ENVIADO: {
    label: 'Enviado',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    border: 'border-purple-500/40',
    color: '#c084fc',
    emoji: '🚚',
  },
  ENTREGUE: {
    label: 'Entregue',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    border: 'border-teal-500/40',
    color: '#2dd4bf',
    emoji: '📦',
  },
  CANCELADO: {
    label: 'Cancelado',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    border: 'border-rose-500/40',
    color: '#f87171',
    emoji: '❌',
  },
};

export function getStatusInfo(status: string) {
  const normalized = status ? status.toUpperCase().trim() : 'PENDING';
  return (
    ORDER_STATUS_MAP[normalized] || {
      label: normalized,
      badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      border: 'border-zinc-700',
      color: '#9ca3af',
      emoji: '📄',
    }
  );
}

export function buildOrderWhatsAppReport(order: any): string {
  const statusInfo = getStatusInfo(order.status);
  const itemsText = (order.items || [])
    .map((item: any, idx: number) => {
      const custom = item.customName
        ? ` (Personalizada: ${item.customName} #${item.customNumber || 'S/N'})`
        : '';
      return `  ${idx + 1}. *${item.product?.name || 'Camisa'}* [Tam: ${item.size}] x ${item.quantity}un - ${formatCurrency(item.totalItemPrice || 0)}${custom}`;
    })
    .join('\n');

  let text = `📦 *ATUALIZAÇÃO DE PEDIDO - RUBY BRASIL*\n\n`;
  text += `Olá, *${order.customerName}*!\n`;
  text += `Aqui está o status atualizado do seu pedido:\n\n`;
  text += `🔢 *Número do Pedido:* #${order.orderNumber}\n`;
  text += `📌 *Status:* ${statusInfo.emoji} *${statusInfo.label.toUpperCase()}*\n`;
  text += `👕 *Total de Peças:* ${order.totalQuantity} camisa(s)\n`;
  const shippingText = order.isFreeShipping
    ? 'Frete Grátis'
    : `Frete ${formatCurrency(order.shippingFee || 30)}`;
  text += `💰 *Valor Total:* ${formatCurrency(order.finalTotal)} (${shippingText})\n\n`;
  text += `📋 *Itens do Pedido:*\n${itemsText || '  Nenhum item registrado'}\n\n`;
  text += `📍 *Endereço de Entrega:*\n`;
  text += `• ${order.street}, ${order.number}${order.complement ? ` (${order.complement})` : ''}\n`;
  text += `• ${order.neighborhood} - ${order.city}/${order.state} | CEP: ${order.zipCode}\n\n`;
  text += `Qualquer dúvida estamos à disposição! 🚀`;

  return text;
}

export function buildGeneralOrdersReport(ordersList: any[]): string {
  const totalOrders = ordersList.length;
  const totalRevenue = ordersList.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
  const totalPieces = ordersList.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);

  const pending = ordersList.filter((o) => (o.status || 'PENDING').toUpperCase() === 'PENDING').length;
  const processing = ordersList.filter((o) => (o.status || '').toUpperCase() === 'PROCESSAMENTO').length;
  const paid = ordersList.filter((o) => (o.status || '').toUpperCase() === 'PAGAMENTO_CONFIRMADO').length;
  const shipped = ordersList.filter((o) => (o.status || '').toUpperCase() === 'ENVIADO').length;
  const delivered = ordersList.filter((o) => (o.status || '').toUpperCase() === 'ENTREGUE').length;

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let text = `📊 *RELATÓRIO DE PEDIDOS - RUBY BRASIL*\n`;
  text += `📅 *Gerado em:* ${dateStr} às ${timeStr}\n\n`;
  text += `💰 *Faturamento Total:* ${formatCurrency(totalRevenue)}\n`;
  text += `📦 *Total de Pedidos:* ${totalOrders}\n`;
  text += `👕 *Total de Camisas:* ${totalPieces} peças\n\n`;
  text += `📌 *DISTRIBUIÇÃO POR STATUS:*\n`;
  text += `• ⏳ Pendentes: ${pending}\n`;
  text += `• ⚙️ Em Processamento: ${processing}\n`;
  text += `• ✅ Pagamento Confirmado: ${paid}\n`;
  text += `• 🚚 Enviados: ${shipped}\n`;
  text += `• 📦 Entregues: ${delivered}\n\n`;
  text += `📋 *RELAÇÃO DOS PEDIDOS:*\n`;
  ordersList.slice(0, 30).forEach((o, i) => {
    const s = getStatusInfo(o.status);
    text += `${i + 1}. #${o.orderNumber} - ${o.customerName} (${o.totalQuantity} un) -> ${formatCurrency(o.finalTotal)} [${s.emoji} ${s.label}]\n`;
  });

  return text;
}

// Otimiza e converte foto do computador/celular para WebP comprimido (Data URL)
async function compressAndConvertImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Falha ao processar canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', 0.82);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao carregar arquivo de imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo selecionado'));
    reader.readAsDataURL(file);
  });
}

interface Props {
  initialBatch: PromotionalBatch | null;
  initialTiers: WholesaleTier[];
  initialProducts: any[];
  initialOrders: any[];
}

export default function AdminDashboardClient({
  initialBatch,
  initialTiers,
  initialProducts,
  initialOrders,
}: Props) {
  const [adminEmail, setAdminEmail] = useState<string>('admin@rubybr.com.br');
  const [activeTab, setActiveTab] = useState<'products' | 'batch' | 'orders'>('products');

  // Estados do Lote
  const [batch, setBatch] = useState<PromotionalBatch | null>(initialBatch);
  const [remainingQuotaInput, setRemainingQuotaInput] = useState(
    initialBatch ? String(initialBatch.remainingQuota) : '5842'
  );
  const [totalQuotaInput, setTotalQuotaInput] = useState(
    initialBatch ? String(initialBatch.totalQuota) : '6000'
  );
  const [minPiecesInput, setMinPiecesInput] = useState(
    initialBatch ? String(initialBatch.minPiecesForFreeShip) : '10'
  );
  const [fixedShippingFeeInput, setFixedShippingFeeInput] = useState(
    initialBatch ? String(initialBatch.fixedShippingFee ?? '30.00') : '30.00'
  );
  const [isUpdatingBatch, setIsUpdatingBatch] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');

  // Estados dos Produtos
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('TODAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productFeedback, setProductFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados de Pedidos
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [isGeneralReportModalOpen, setIsGeneralReportModalOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Estados de Upload de Imagem
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma foto de até 25MB.');
      return;
    }

    setIsProcessingImage(true);
    try {
      const compressed = await compressAndConvertImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: compressed }));
    } catch (err) {
      console.error(err);
      alert('Erro ao processar imagem no navegador. Tente outra foto.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Formulário de Peça
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    club: '',
    league: 'Brasileirão',
    season: '24/25',
    type: 'TORCEDOR',
    imageUrl: '',
    retailPrice: '60.00',
    description: '',
    isActive: true,
    allowCustom: true,
    customPrice: '15.00',
    variants: [
      { size: 'P', stockQuantity: 50 },
      { size: 'M', stockQuantity: 100 },
      { size: 'G', stockQuantity: 100 },
      { size: 'GG', stockQuantity: 50 },
      { size: 'XG', stockQuantity: 20 },
      { size: '3XL', stockQuantity: 20 },
      { size: '4XL', stockQuantity: 10 },
    ],
  });

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.email) setAdminEmail(data.email);
      })
      .catch(() => {});
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setProductFeedback({ type, message });
    setTimeout(() => setProductFeedback(null), 4000);
  };

  const handleLogout = async () => {
    if (confirm('Deseja realmente encerrar a sessão de administrador?')) {
      try {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        window.location.href = '/admin/login';
      } catch {
        window.location.href = '/admin/login';
      }
    }
  };

  // Handlers e Métodos de Pedidos
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: newStatus, updatedAt: new Date().toISOString() }
              : o
          )
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev: any) => ({
            ...prev,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          }));
        }
        const label = getStatusInfo(newStatus).label;
        showToast(`Status atualizado para: ${label}`);
      } else {
        alert(data.error || 'Erro ao atualizar status do pedido.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao atualizar status do pedido.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
        showToast('Lista de pedidos atualizada!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Relatório copiado para a área de transferência!');
    setTimeout(() => {
      setCopiedKey(null);
    }, 3000);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = orderSearch.toLowerCase().trim();
      const matchesSearch =
        !query ||
        order.orderNumber?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.phone?.toLowerCase().includes(query) ||
        order.city?.toLowerCase().includes(query) ||
        order.state?.toLowerCase().includes(query) ||
        order.document?.toLowerCase().includes(query);

      const normalizedStatus = (order.status || 'PENDING').toUpperCase();
      const matchesStatus =
        orderStatusFilter === 'ALL' || normalizedStatus === orderStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const orderStats = useMemo(() => {
    const total = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
    const totalPieces = orders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);
    const pending = orders.filter((o) => (o.status || 'PENDING').toUpperCase() === 'PENDING').length;
    const processing = orders.filter((o) => (o.status || '').toUpperCase() === 'PROCESSAMENTO').length;
    const confirmed = orders.filter((o) => (o.status || '').toUpperCase() === 'PAGAMENTO_CONFIRMADO').length;
    const shipped = orders.filter((o) => (o.status || '').toUpperCase() === 'ENVIADO').length;
    const delivered = orders.filter((o) => (o.status || '').toUpperCase() === 'ENTREGUE').length;

    return { total, totalRevenue, totalPieces, pending, processing, confirmed, shipped, delivered };
  }, [orders]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setImageUploadMode('file');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormData({
      id: '',
      name: '',
      club: '',
      league: 'Brasileirão',
      season: '24/25',
      type: 'TORCEDOR',
      imageUrl: '',
      retailPrice: '60.00',
      description: '',
      isActive: true,
      allowCustom: true,
      customPrice: '15.00',
      variants: [
        { size: 'P', stockQuantity: 50 },
        { size: 'M', stockQuantity: 100 },
        { size: 'G', stockQuantity: 100 },
        { size: 'GG', stockQuantity: 50 },
        { size: 'XG', stockQuantity: 20 },
        { size: '3XL', stockQuantity: 20 },
        { size: '4XL', stockQuantity: 10 },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: any) => {
    setIsEditing(true);
    if (p.imageUrl?.startsWith('data:')) {
      setImageUploadMode('file');
    } else if (p.imageUrl?.startsWith('http')) {
      setImageUploadMode('url');
    } else {
      setImageUploadMode('file');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    const standardSizes = getStandardSizesForProduct(p);
    const currentVariants = standardSizes.map((size) => {
      const found = p.variants?.find((v: any) => v.size === size);
      return { size, stockQuantity: found ? found.stockQuantity : 0 };
    });

    setFormData({
      id: p.id,
      name: p.name,
      club: p.club || '',
      league: p.league || 'Brasileirão',
      season: p.season || '24/25',
      type: p.type || 'TORCEDOR',
      imageUrl: p.imageUrl || '',
      retailPrice: String(p.retailPrice || '60.00'),
      description: p.description || '',
      isActive: p.isActive,
      allowCustom: p.allowCustom ?? true,
      customPrice: String(p.customPrice || '15.00'),
      variants: currentVariants,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageUrl || formData.imageUrl.trim() === '') {
      alert('Por favor adicione uma foto para a peça (enviando um arquivo local ou inserindo um link).');
      return;
    }

    setIsSavingProduct(true);

    try {
      const url = '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        if (isEditing) {
          setProducts((prev) => prev.map((item) => (item.id === data.id ? data : item)));
          showToast('Peça atualizada com sucesso no banco Neon!');
        } else {
          setProducts((prev) => [data, ...prev]);
          showToast('Nova peça cadastrada com sucesso no catálogo!');
        }
        setIsModalOpen(false);
      } else {
        alert(data.error || 'Erro ao salvar produto.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar produto.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleToggleActive = async (p: any) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, isActive: !p.isActive } : item)));
        showToast(p.isActive ? 'Peça pausada (oculta no catálogo).' : 'Peça ativada na loja!');
      }
    } catch (err) {
      alert('Erro ao alterar status.');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a peça "${name}" do catálogo?`)) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setProducts((prev) => prev.filter((item) => item.id !== id));
        showToast('Peça removida com sucesso!');
      } else {
        alert(data.error || 'Erro ao excluir peça.');
      }
    } catch (err) {
      alert('Erro de conexão ao excluir.');
    }
  };

  const handleUpdateBatch = async (newRemaining?: number, newTotal?: number) => {
    if (!batch) return;
    setIsUpdatingBatch(true);
    setBatchSuccessMsg('');

    try {
      const res = await fetch('/api/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          remainingQuota: newRemaining !== undefined ? newRemaining : Number(remainingQuotaInput),
          totalQuota: newTotal !== undefined ? newTotal : Number(totalQuotaInput),
          minPiecesForFreeShip: Number(minPiecesInput),
          fixedShippingFee: Number(fixedShippingFeeInput),
          isActive: batch.isActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBatch(data);
        setRemainingQuotaInput(String(data.remainingQuota));
        setTotalQuotaInput(String(data.totalQuota));
        setMinPiecesInput(String(data.minPiecesForFreeShip));
        setFixedShippingFeeInput(String(data.fixedShippingFee ?? '30.00'));
        setBatchSuccessMsg('Lote promocional atualizado com sucesso!');
        setTimeout(() => setBatchSuccessMsg(''), 3000);
      } else {
        alert(data.error || 'Erro ao atualizar lote.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao atualizar lote.');
    } finally {
      setIsUpdatingBatch(false);
    }
  };

  const handleResetTo6000 = () => {
    if (confirm('Deseja resetar a cota do lote para 6.000 peças disponíveis?')) {
      handleUpdateBatch(6000, 6000);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.club?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.league?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLeague = selectedLeague === 'TODAS' || p.league === selectedLeague;

    return matchesSearch && matchesLeague;
  });

  const totalSold = batch ? batch.totalQuota - batch.remainingQuota : 0;
  const percentUsed = batch ? ((totalSold / batch.totalQuota) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* TOAST FEEDBACK */}
      {productFeedback && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all animate-bounce ${
            productFeedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/60 text-rose-200'
          }`}
        >
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          {productFeedback.message}
        </div>
      )}

      {/* TOPBAR ADMINISTRATIVO */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800/80 transition-colors"
              title="Voltar para a Loja Virtual"
            >
              <ArrowLeft className="w-5 h-5 text-rose-500" />
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/60 border border-rose-400/30">
                <span className="text-xl">💎</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-white leading-none">
                    RUBY <span className="text-rose-500">BRASIL</span>
                  </h1>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium mt-0.5 hidden sm:block">
                  Painel de Controle • Banco Neon PostgreSQL
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* BOTÃO ADICIONAR NOVA PEÇA NO TOPO */}
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Adicionar Peça</span>
            </button>

            {/* BADGE DE USUÁRIO */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-mono text-[11px] text-zinc-300 font-semibold">{adminEmail}</span>
            </div>

            {/* BOTÃO VER LOJA */}
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Ver Loja</span>
            </Link>

            {/* BOTÃO LOGOUT */}
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-xs font-bold text-rose-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              title="Encerrar sessão com segurança"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* CARDS DE KPIS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Catálogo Ativo</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{products.length}</span>
              <span className="text-xs text-rose-400 font-bold">modelos</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Peças cadastradas</span>
          </div>

          <div className="bg-gradient-to-br from-rose-950/40 via-zinc-900 to-zinc-900 border border-rose-500/30 rounded-2xl p-5 shadow-lg">
            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Cota do Lote
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">
                {batch?.remainingQuota.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-zinc-400">peças</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${batch ? (batch.remainingQuota / batch.totalQuota) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Peças Bonificadas</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {totalSold.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-zinc-400">({percentUsed}%)</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Consumidas no lote</span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Total de Pedidos</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{orders.length}</span>
              <span className="text-xs text-emerald-400 font-bold">pedidos</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Registrados no Neon</span>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'products'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Package className="w-4 h-4" />
            Catálogo de Peças ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'batch'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            Lote Promocional & Metas
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'orders'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Gestão de Pedidos ({orders.length})
          </button>
        </div>

        {/* ABA 1: CATÁLOGO DE PEÇAS */}
        {activeTab === 'products' && (
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-5 border-b border-zinc-800">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Package className="w-6 h-6 text-rose-500" />
                  Gerenciamento de Peças e Camisas
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Cadastre novas camisas, atualize preços de varejo, fotos e controle estoque por tamanho.
                </p>
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                Adicionar Nova Peça
              </button>
            </div>

            {/* FILTROS E BUSCA */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por time, camisa ou liga..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-2 sm:pb-0">
                {['TODAS', 'Infantil', 'Brasileirão', 'Premier League', 'La Liga', 'Seleções', 'Retrô'].map((league) => (
                  <button
                    key={league}
                    onClick={() => setSelectedLeague(league)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                      selectedLeague === league
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {league}
                  </button>
                ))}
              </div>
            </div>

            {/* TABELA DE PRODUTOS */}
            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/50">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">Foto</th>
                    <th className="py-3.5 px-4">Camisa / Clube</th>
                    <th className="py-3.5 px-3">Liga / Tipo</th>
                    <th className="py-3.5 px-3">Preço Varejo</th>
                    <th className="py-3.5 px-3">Grade de Tamanhos</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        Nenhuma peça encontrada com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-11 h-11 object-cover rounded-xl bg-zinc-900 border border-zinc-700/80 shadow-sm"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 border border-zinc-800">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          <a
                            href={`/produto/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-extrabold hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group/link"
                            title="Abrir página desta camisa em nova aba"
                          >
                            <span>{p.name}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-500 group-hover/link:text-rose-400 opacity-60 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                          <span className="text-[11px] font-normal text-zinc-400 block mt-0.5">
                            {p.club} • {p.season}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-200 mr-1 border border-zinc-700">
                            {p.league}
                          </span>
                          <span className="text-zinc-400 text-[10px] block mt-1 font-mono">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-black text-amber-400 text-sm">
                          {formatCurrency(p.retailPrice)}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
                            {(() => {
                              const standardSizes = getStandardSizesForProduct(p);
                              const relevantVariants = (p.variants || []).filter((v: any) => {
                                if (standardSizes.includes(v.size)) return true;
                                return v.stockQuantity > 0;
                              });
                              const sortedVariants = [...relevantVariants].sort((a: any, b: any) => {
                                const idxA = standardSizes.indexOf(a.size);
                                const idxB = standardSizes.indexOf(b.size);
                                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                if (idxA !== -1) return -1;
                                if (idxB !== -1) return 1;
                                return a.size.localeCompare(b.size);
                              });
                              return sortedVariants.map((v: any) => (
                                <span
                                  key={v.id || v.size}
                                  className={`px-2 py-0.5 rounded border ${
                                    v.stockQuantity > 0
                                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                                      : 'bg-rose-950/40 border-rose-900/50 text-rose-400'
                                  }`}
                                >
                                  {v.size}: <strong className="text-white">{v.stockQuantity}</strong>
                                </span>
                              ));
                            })()}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleActive(p)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[10px] border transition-all ${
                              p.isActive
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                            }`}
                            title={p.isActive ? 'Clique para pausar esta camisa' : 'Clique para reativar'}
                          >
                            {p.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {p.isActive ? 'Ativo' : 'Pausado'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof window !== 'undefined') {
                                  const url = `${window.location.origin}/produto/${p.slug}`;
                                  navigator.clipboard.writeText(url);
                                  alert(`✓ Link copiado com sucesso para a área de transferência:\n${url}`);
                                }
                              }}
                              className="p-2 rounded-xl bg-zinc-800 hover:bg-emerald-950/70 border border-transparent hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-400 transition-colors"
                              title="Copiar link desta camisa para enviar ao cliente"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <a
                              href={`/produto/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center justify-center"
                              title="Abrir página desta camisa em uma nova aba"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors"
                              title="Editar peça"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950/70 border border-transparent hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 transition-colors"
                              title="Excluir peça"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 2: LOTE PROMOCIONAL & METAS */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Flame className="w-6 h-6 text-amber-400" />
                    Controle do Lote Promocional ({batch?.code || 'LOTE-6000'})
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Defina o saldo de peças promocionais exibido no topo da loja.
                  </p>
                </div>

                <button
                  onClick={handleResetTo6000}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-amber-600/30 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resetar para 6.000 Camisas
                </button>
              </div>

              {batchSuccessMsg && (
                <div className="mb-4 p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {batchSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Cota Restante no Contador (Peças)
                  </label>
                  <input
                    type="number"
                    value={remainingQuotaInput}
                    onChange={(e) => setRemainingQuotaInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-rose-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Cota Total Contratada (Peças)
                  </label>
                  <input
                    type="number"
                    value={totalQuotaInput}
                    onChange={(e) => setTotalQuotaInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-rose-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Mínimo Peças p/ Frete Grátis
                  </label>
                  <input
                    type="number"
                    value={minPiecesInput}
                    onChange={(e) => setMinPiecesInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-rose-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Valor Frete Fixo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fixedShippingFeeInput}
                    onChange={(e) => setFixedShippingFeeInput(e.target.value)}
                    placeholder="30.00"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-rose-500 font-bold"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => handleUpdateBatch()}
                  disabled={isUpdatingBatch}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {isUpdatingBatch ? 'Salvando...' : 'Salvar Alterações do Lote'}
                </button>
              </div>
            </div>

            {/* TABELA DE FAIXAS DE ATACADO */}
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
                <Layers className="w-5 h-5 text-rose-500" />
                Tabela de Faixas de Preço de Atacado
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {initialTiers.map((tier, idx) => (
                  <div
                    key={tier.id || idx}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                        <span className="font-bold uppercase tracking-wider">Faixa {idx + 1}</span>
                        <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono text-[10px]">
                          {tier.minQuantity} a {tier.maxQuantity || '∞'} peças
                        </span>
                      </div>
                      <h4 className="text-3xl font-black text-white mt-2">
                        {formatCurrency(tier.unitPrice)}
                        <span className="text-xs font-normal text-zinc-400 ml-1">/ unidade</span>
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: PEDIDOS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* CARDS DE RESUMO FINANCEIRO DOS PEDIDOS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Faturamento de Pedidos
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {formatCurrency(orderStats.totalRevenue)}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Total acumulado de pedidos
                </span>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Total de Camisas
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {orderStats.totalPieces.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-rose-400 font-bold">peças</span>
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Somatório de todos os pedidos
                </span>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Total de Pedidos
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {orderStats.total}
                  </span>
                  <span className="text-xs text-amber-400 font-bold">registrados</span>
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  {orderStats.delivered} entregues • {orderStats.shipped} enviados
                </span>
              </div>
            </div>

            {/* TABELA PRINCIPAL DE GESTÃO DE PEDIDOS */}
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-5 border-b border-zinc-800">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Layers className="w-6 h-6 text-emerald-400" />
                    Gestão & Controle de Pedidos
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Acompanhe pedidos, altere status em tempo real e gere relatórios prontos para WhatsApp.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsGeneralReportModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all hover:scale-[1.02]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Relatório Geral (WhatsApp)
                  </button>

                  <button
                    type="button"
                    onClick={handleRefreshOrders}
                    disabled={isRefreshingOrders}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-zinc-700"
                    title="Atualizar lista de pedidos"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingOrders ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>Atualizar</span>
                  </button>
                </div>
              </div>

              {/* FILTROS POR STATUS (PILLS / TABS) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                    orderStatusFilter === 'ALL'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  Todos ({orders.length})
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('PENDING')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                    orderStatusFilter === 'PENDING'
                      ? 'bg-amber-500/30 text-amber-200 border-amber-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-amber-300 hover:border-amber-500/40'
                  }`}
                >
                  ⏳ Pendentes ({orderStats.pending})
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('PROCESSAMENTO')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                    orderStatusFilter === 'PROCESSAMENTO'
                      ? 'bg-blue-500/30 text-blue-200 border-blue-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-blue-300 hover:border-blue-500/40'
                  }`}
                >
                  ⚙️ Em Processamento ({orderStats.processing})
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('PAGAMENTO_CONFIRMADO')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                    orderStatusFilter === 'PAGAMENTO_CONFIRMADO'
                      ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-emerald-300 hover:border-emerald-500/40'
                  }`}
                >
                  ✅ Pagamento Confirmado ({orderStats.confirmed})
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('ENVIADO')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                    orderStatusFilter === 'ENVIADO'
                      ? 'bg-purple-500/30 text-purple-200 border-purple-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-purple-300 hover:border-purple-500/40'
                  }`}
                >
                  🚚 Enviados ({orderStats.shipped})
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('ENTREGUE')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                    orderStatusFilter === 'ENTREGUE'
                      ? 'bg-teal-500/30 text-teal-200 border-teal-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-teal-300 hover:border-teal-500/40'
                  }`}
                >
                  📦 Entregues ({orderStats.delivered})
                </button>
              </div>

              {/* BUSCA DE PEDIDOS */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 mb-6">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Buscar pedido por número (#RUBY...), nome do cliente, WhatsApp, CPF ou cidade..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-20 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {orderSearch && (
                    <button
                      type="button"
                      onClick={() => setOrderSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white bg-zinc-800 px-2 py-1 rounded-md"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 px-1">
                  <span>
                    Exibindo <strong className="text-white">{filteredOrders.length}</strong> de <strong className="text-white">{orders.length}</strong> pedidos
                  </span>
                  {orderStatusFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('ALL')}
                      className="text-rose-400 hover:underline"
                    >
                      Remover filtro de status
                    </button>
                  )}
                </div>
              </div>

              {/* TABELA DE PEDIDOS */}
              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 bg-zinc-950/40 rounded-2xl border border-zinc-800/60">
                  <Package className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                  <p className="font-bold text-base text-zinc-300">Nenhum pedido encontrado</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    {orderSearch || orderStatusFilter !== 'ALL'
                      ? 'Tente ajustar os filtros ou o termo de busca para visualizar os pedidos.'
                      : 'Nenhum pedido foi registrado ainda no banco de dados.'}
                  </p>
                  {(orderSearch || orderStatusFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrderSearch('');
                        setOrderStatusFilter('ALL');
                      }}
                      className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="py-3.5 px-4">Pedido # & Data</th>
                        <th className="py-3.5 px-4">Cliente & Local</th>
                        <th className="py-3.5 px-3">WhatsApp</th>
                        <th className="py-3.5 px-3 text-center">Peças</th>
                        <th className="py-3.5 px-3">Total</th>
                        <th className="py-3.5 px-3">Mudar Status</th>
                        <th className="py-3.5 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {filteredOrders.map((order) => {
                        const statusInfo = getStatusInfo(order.status);
                        const cleanPhone = (order.phone || '').replace(/\D/g, '');
                        const waUrl = cleanPhone
                          ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                              `Olá ${order.customerName}, tudo bem? Sou da equipe Ruby Brasil sobre o seu pedido #${order.orderNumber}.`
                            )}`
                          : null;
                        const dateFormatted = new Date(order.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        const isUpdating = updatingOrderId === order.id;

                        return (
                          <tr key={order.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-white block">
                                #{order.orderNumber}
                              </span>
                              <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-zinc-600" />
                                {dateFormatted}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <strong className="text-white block font-bold">
                                {order.customerName}
                              </strong>
                              <span className="text-[10px] text-zinc-400 block font-normal">
                                {order.city ? `${order.city}/${order.state}` : 'Local não informado'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              {waUrl ? (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold border border-emerald-500/20 transition-colors"
                                  title="Conversar com o cliente no WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{order.phone}</span>
                                </a>
                              ) : (
                                <span className="font-mono text-zinc-500 text-[11px]">
                                  {order.phone || 'S/N'}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span className="font-black text-white text-xs block">
                                {order.totalQuantity} un
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                                  order.isWholesale
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {order.isWholesale ? 'Atacado' : 'Varejo'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="font-mono font-black text-emerald-400 text-sm block">
                                {formatCurrency(order.finalTotal)}
                              </span>
                              <span className="text-[10px] text-zinc-500 block">
                                {order.isFreeShipping ? 'Frete Grátis' : 'Frete R$ 30'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <div className="relative inline-flex items-center gap-1.5">
                                <select
                                  value={order.status || 'PENDING'}
                                  disabled={isUpdating}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border appearance-none pr-7 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-zinc-950 transition-all ${
                                    statusInfo.badge
                                  } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                  <option value="PROCESSAMENTO" className="bg-zinc-900 text-blue-300">
                                    ⚙️ Em Processamento
                                  </option>
                                  <option value="PAGAMENTO_CONFIRMADO" className="bg-zinc-900 text-emerald-300">
                                    ✅ Pagamento Confirmado
                                  </option>
                                  <option value="ENVIADO" className="bg-zinc-900 text-purple-300">
                                    🚚 Enviado
                                  </option>
                                  <option value="ENTREGUE" className="bg-zinc-900 text-teal-300">
                                    📦 Entregue
                                  </option>
                                  <option value="PENDING" className="bg-zinc-900 text-amber-300">
                                    ⏳ Pendente
                                  </option>
                                  <option value="CANCELADO" className="bg-zinc-900 text-rose-300">
                                    ❌ Cancelado
                                  </option>
                                </select>
                                {isUpdating && (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors border border-zinc-700"
                                  title="Ver todos os detalhes deste pedido"
                                >
                                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>Detalhes</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const report = buildOrderWhatsAppReport(order);
                                    copyToClipboard(report, `order-${order.id}`);
                                  }}
                                  className="px-2 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors"
                                  title="Copiar relatório formatado para WhatsApp"
                                >
                                  {copiedKey === `order-${order.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                                  )}
                                  <span className="hidden sm:inline">Zap</span>
                                </button>
                              </div>
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
        )}
      </main>

      {/* MODAL ADICIONAR / EDITAR PEÇA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1">
              <Package className="w-6 h-6 text-rose-500" />
              {isEditing ? 'Editar Peça' : 'Adicionar Nova Camisa ao Catálogo'}
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Preencha os dados da camisa para gravar diretamente no banco Neon.
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nome da Camisa / Peça *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Camisa Real Madrid I 24/25 - Torcedor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Clube / Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Real Madrid, Flamengo, Brasil"
                    value={formData.club}
                    onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Liga / Categoria *</label>
                  <select
                    value={formData.league}
                    onChange={(e) => setFormData({ ...formData, league: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Brasileirão">Brasileirão</option>
                    <option value="Premier League">Premier League</option>
                    <option value="La Liga">La Liga</option>
                    <option value="Champions League">Champions League</option>
                    <option value="Seleções">Seleções</option>
                    <option value="Infantil">Infantil (Kids)</option>
                    <option value="Retrô">Retrô</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Temporada *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 24/25 ou 1998"
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Tipo de Modelo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const standardSizes = getStandardSizesForProduct(newType);
                      const currentMap = new Map(formData.variants.map((v) => [v.size, v.stockQuantity]));
                      const updatedVariants = standardSizes.map((size) => ({
                        size,
                        stockQuantity: currentMap.has(size)
                          ? currentMap.get(size)!
                          : newType === 'INFANTIL'
                          ? 20
                          : size === '3XL' || size === '4XL'
                          ? 10
                          : 50,
                      }));
                      setFormData({ ...formData, type: newType, variants: updatedVariants });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="TORCEDOR">Torcedor (Standard)</option>
                    <option value="JOGADOR">Jogador (Player Version)</option>
                    <option value="INFANTIL">Infantil (Kids / Conjunto)</option>
                    <option value="RETRO">Retrô Clássica</option>
                    <option value="FEMININA">Feminina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Preço Base Unitário (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="60.00"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Valor Personalização (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15.00"
                    value={formData.customPrice}
                    onChange={(e) => setFormData({ ...formData, customPrice: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* UPLOAD DA IMAGEM DA PEÇA */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-zinc-300">
                      Foto da Peça *
                    </label>
                    <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('file')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                          imageUploadMode === 'file'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Subir Foto Local
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('url')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                          imageUploadMode === 'url'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Colar Link
                      </button>
                    </div>
                  </div>

                  {imageUploadMode === 'file' ? (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/webp, image/jpg"
                        className="hidden"
                      />

                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                          isDragging
                            ? 'border-rose-500 bg-rose-500/10'
                            : formData.imageUrl
                            ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-950/70'
                            : 'border-zinc-800 hover:border-rose-500/60 hover:bg-zinc-950/90 bg-zinc-950/40'
                        }`}
                      >
                        {isProcessingImage ? (
                          <div className="flex flex-col items-center justify-center py-4">
                            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-2" />
                            <p className="text-xs font-bold text-white">Otimizando e comprimindo foto...</p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">Preparando imagem para carregamento ultra rápido</p>
                          </div>
                        ) : formData.imageUrl ? (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={formData.imageUrl}
                                alt="Preview"
                                className="w-16 h-16 object-cover rounded-xl border border-zinc-700 shadow-md bg-zinc-900"
                              />
                              <div className="text-left">
                                <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Imagem Carregada com Sucesso
                                </span>
                                <span className="text-[11px] text-zinc-400 block mt-0.5">
                                  Clique ou solte outro arquivo para trocar a foto
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {formData.imageUrl.startsWith('data:') ? '✓ Formato WebP otimizado (salvo localmente)' : '✓ Imagem vinculada'}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData({ ...formData, imageUrl: '' });
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-1 self-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remover
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-400 mb-2 group-hover:scale-110 transition-transform shadow-inner">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-white mb-0.5">
                              Clique para escolher a foto do computador ou celular
                            </p>
                            <p className="text-[11px] text-zinc-400">
                              Ou arraste e solte o arquivo aqui (JPG, PNG ou WEBP)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="https://exemplo.com/foto-camisa.jpg"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                      {formData.imageUrl && (
                        <div className="mt-2 p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-3">
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-12 h-12 object-cover rounded-lg border border-zinc-700 bg-zinc-900"
                            onError={(e) => ((e.target as any).style.display = 'none')}
                          />
                          <div className="text-xs text-zinc-400 flex-1">
                            <span className="font-bold text-white block">Preview da Imagem</span>
                            URL informada e pronta para cadastro
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                          >
                            Limpar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* GRADE DE ESTOQUE POR TAMANHO */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-zinc-300 mb-2">
                  Grade de Estoque por Tamanho (Unidades):
                </label>
                <div className={`grid ${formData.variants.length > 5 ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-5'} gap-2`}>
                  {formData.variants.map((v, idx) => (
                    <div key={v.size} className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 text-center">
                      <span className="font-black text-xs text-rose-400 block mb-1">
                        {v.size}
                        {v.size === '3XL' && <span className="text-[9px] text-amber-300 block font-normal leading-tight">+R$6</span>}
                        {v.size === '4XL' && <span className="text-[9px] text-amber-300 block font-normal leading-tight">+R$12</span>}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={v.stockQuantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const next = [...formData.variants];
                          next[idx].stockQuantity = val;
                          setFormData({ ...formData, variants: next });
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-1 text-center text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded bg-zinc-950 border-zinc-700 text-rose-500 focus:ring-0 w-4 h-4"
                  />
                  Peça Ativa no Catálogo
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.allowCustom}
                    onChange={(e) => setFormData({ ...formData, allowCustom: e.target.checked })}
                    className="rounded bg-zinc-950 border-zinc-700 text-rose-500 focus:ring-0 w-4 h-4"
                  />
                  Permitir Personalização (Nome + Número)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct || isProcessingImage}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando Imagem...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isSavingProduct ? 'Salvando no Neon...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Peça'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DO PEDIDO (VISUALIZAÇÃO, STATUS & WHATSAPP) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 text-zinc-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* CABEÇALHO DO MODAL */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Pedido #{selectedOrder.orderNumber}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      getStatusInfo(selectedOrder.status).badge
                    }`}
                  >
                    {getStatusInfo(selectedOrder.status).emoji}{' '}
                    {getStatusInfo(selectedOrder.status).label}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Realizado em:{' '}
                  {new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="text-right sm:pr-8">
                <span className="text-xs text-zinc-400 block">Total do Pedido</span>
                <span className="text-xl font-black text-emerald-400">
                  {formatCurrency(selectedOrder.finalTotal)}
                </span>
              </div>
            </div>

            {/* SELETOR RÁPIDO DE STATUS */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 mb-6">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-3">
                Alterar Status do Pedido:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'PROCESSAMENTO', label: 'Em Processamento', emoji: '⚙️' },
                  { key: 'PAGAMENTO_CONFIRMADO', label: 'Pagamento Confirmado', emoji: '✅' },
                  { key: 'ENVIADO', label: 'Enviado', emoji: '🚚' },
                  { key: 'ENTREGUE', label: 'Entregue', emoji: '📦' },
                ].map((s) => {
                  const isCurrent = (selectedOrder.status || '').toUpperCase() === s.key;
                  const isUpdating = updatingOrderId === selectedOrder.id;

                  return (
                    <button
                      key={s.key}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, s.key)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                        isCurrent
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-500/50 scale-[1.02]'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <span>{s.emoji}</span>
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DADOS DO CLIENTE E ENTREGA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* CLIENTE */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80">
                <span className="text-[11px] font-black uppercase text-rose-400 tracking-wider block mb-2.5">
                  Dados do Cliente
                </span>
                <div className="space-y-1.5 text-xs">
                  <p>
                    <span className="text-zinc-500">Nome:</span>{' '}
                    <strong className="text-white font-bold">{selectedOrder.customerName}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-500">Documento:</span>{' '}
                    <span className="text-zinc-300 font-mono">
                      {selectedOrder.document || 'Não informado'} ({selectedOrder.customerType || 'PF'})
                    </span>
                  </p>
                  <p>
                    <span className="text-zinc-500">E-mail:</span>{' '}
                    <span className="text-zinc-300">{selectedOrder.email || 'Não informado'}</span>
                  </p>
                  <div className="pt-1.5 flex items-center justify-between">
                    <span className="text-zinc-500">WhatsApp:</span>
                    <a
                      href={`https://wa.me/55${(selectedOrder.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${selectedOrder.customerName}, sobre o seu pedido #${selectedOrder.orderNumber} na Ruby Brasil:`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold border border-emerald-500/30 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{selectedOrder.phone}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* ENTREGA */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80">
                <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block mb-2.5">
                  Endereço de Entrega
                </span>
                <div className="space-y-1.5 text-xs text-zinc-300">
                  <p>
                    {selectedOrder.street}, {selectedOrder.number}
                    {selectedOrder.complement ? ` (${selectedOrder.complement})` : ''}
                  </p>
                  <p>Bairro: {selectedOrder.neighborhood || 'Não informado'}</p>
                  <p>
                    {selectedOrder.city} - {selectedOrder.state}
                  </p>
                  <p className="font-mono text-zinc-400">CEP: {selectedOrder.zipCode || 'Não informado'}</p>
                </div>
              </div>
            </div>

            {/* ITENS DO PEDIDO */}
            <div className="mb-6">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-3">
                Grade de Camisas ({selectedOrder.totalQuantity} peças):
              </span>
              <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">Camisa</th>
                      <th className="py-2.5 px-2 text-center">Tam</th>
                      <th className="py-2.5 px-2 text-center">Qtd</th>
                      <th className="py-2.5 px-3 text-right">Unitário</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {(selectedOrder.items || []).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-900/50">
                        <td className="py-2.5 px-3">
                          <strong className="text-white block font-bold">
                            {item.product?.name || 'Camisa de Futebol'}
                          </strong>
                          {item.customName && (
                            <span className="text-[10px] text-amber-300 font-mono block">
                              Personalizada: {item.customName} #{item.customNumber || 'S/N'} (+R$ 15,00)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-zinc-200">
                          {item.size}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-white">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                          {formatCurrency(item.unitPriceApplied)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(item.totalItemPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* RESUMO DE VALORES */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 mt-3 text-xs space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal de Camisas:</span>
                  <span className="font-mono text-white">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Frete:</span>
                  <span className="font-mono text-emerald-400">
                    {selectedOrder.isFreeShipping ? 'Grátis (10+ peças)' : 'R$ 30,00'}
                  </span>
                </div>
                <div className="flex justify-between font-black text-sm text-white pt-2 border-t border-zinc-800">
                  <span>Total Final:</span>
                  <span className="font-mono text-emerald-400">
                    {formatCurrency(selectedOrder.finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* SEÇÃO RELATÓRIO DO PEDIDO PARA WHATSAPP */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Relatório para Envio via WhatsApp
                </span>
                <span className="text-[10px] text-zinc-500">Mensagem pronta com status e dados</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono text-zinc-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {buildOrderWhatsAppReport(selectedOrder)}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 mt-3 pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => {
                    const report = buildOrderWhatsAppReport(selectedOrder);
                    copyToClipboard(report, `modal-order-${selectedOrder.id}`);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
                >
                  {copiedKey === `modal-order-${selectedOrder.id}` ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-zinc-300" />
                      <span>Copiar Relatório</span>
                    </>
                  )}
                </button>

                {selectedOrder.phone && (
                  <a
                    href={`https://wa.me/55${selectedOrder.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      buildOrderWhatsAppReport(selectedOrder)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-950/60"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar para WhatsApp do Cliente</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-5 mt-6 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RELATÓRIO GERAL DE PEDIDOS (WHATSAPP) */}
      {isGeneralReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 text-zinc-100">
            <button
              onClick={() => setIsGeneralReportModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Relatório Geral para WhatsApp</h3>
                <p className="text-xs text-zinc-400">
                  Resumo de faturamento, peças e contagem por status para compartilhar.
                </p>
              </div>
            </div>

            {/* PREVIEW DO TEXTO */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 my-4 font-mono text-xs text-zinc-300 max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {buildGeneralOrdersReport(orders)}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsGeneralReportModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition-colors"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => {
                  const report = buildGeneralOrdersReport(orders);
                  copyToClipboard(report, 'general-report');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
              >
                {copiedKey === 'general-report' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-300" />
                    <span>Copiar Relatório</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(buildGeneralOrdersReport(orders))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-950/60"
              >
                <Send className="w-4 h-4" />
                <span>Abrir no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

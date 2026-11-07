'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Flame,
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
  Clock,
  CalendarClock,
  FileText,
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  Send,
  Check,
  Sun,
  Moon,
} from 'lucide-react';
import {
  formatCurrency,
  getStandardSizesForProduct,
  getProductPreSaleInfo,
  getProductGalleryImages,
  toAbsoluteUrl,
} from '@/lib/utils';
import { PromotionalBatch, WholesaleTier } from '@/types';
import {
  copyOrderImageToClipboard,
  downloadOrderImageFile,
  copySingleProductImageToClipboard,
  generateOrderCardBlob,
  OrderImageData,
} from '@/lib/order-image';

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
      const preSale = getProductPreSaleInfo(item.product);
      const preSaleLabel = preSale.isPreSale
        ? ` [⏳ PRÉ-VENDA${preSale.preSaleEta ? `: ${preSale.preSaleEta}` : ''}]`
        : '';
      const rawImg =
        item.product?.imageUrl ||
        (item.product?.gallery ? getProductGalleryImages(item.product)[0] : '');
      const photoUrl = toAbsoluteUrl(rawImg);
      const photoLine = photoUrl ? `\n     ↳ 📸 Foto: ${photoUrl}` : '';
      return `  ${idx + 1}. *${item.product?.name || 'Camisa'}*${preSaleLabel} [Tam: ${item.size}] x ${item.quantity}un - ${formatCurrency(item.totalItemPrice || 0)}${custom}${photoLine}`;
    })
    .join('\n');

  let text = `📦 *ATUALIZAÇÃO DE PEDIDO - RUBY BRASIL*\n\n`;
  text += `Olá, *${order.customerName}*!\n`;
  text += `Aqui está o status atualizado do seu pedido:\n\n`;
  text += `🔢 *Número do Pedido:* #${order.orderNumber}\n`;
  text += `📌 *Status:* ${statusInfo.emoji} *${statusInfo.label.toUpperCase()}*\n`;
  const shippingText = order.shippingService
    ? `${order.shippingService}: ${formatCurrency(order.shippingCost || order.shippingFee || 0)}`
    : `Frete ${formatCurrency(order.shippingCost || order.shippingFee || 0)}`;
  text += `💰 *Valor Total:* ${formatCurrency(order.finalTotal)} (${shippingText})\n\n`;
  text += `📋 *Itens do Pedido:*\n${itemsText || '  Nenhum item registrado'}\n\n`;
  text += `📍 *Endereço de Entrega:*\n`;
  text += `• ${order.street}, ${order.number}${order.complement ? ` (${order.complement})` : ''}\n`;
  text += `• ${order.neighborhood} - ${order.city}/${order.state} | CEP: ${order.zipCode}\n\n`;
  text += `Qualquer dúvida estamos à disposição! 🚀`;

  return text;
}

export function mapOrderToImageData(order: any): OrderImageData {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    customerName: order.customerName,
    customerCity: order.city,
    customerState: order.state,
    customerPhone: order.phone,
    totalQuantity:
      order.totalQuantity ||
      (order.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 1), 0),
    subtotal: order.subtotal || order.finalTotal,
    shippingCost: order.shippingCost || order.shippingFee || 0,
    shippingService: order.shippingService,
    finalTotal: order.finalTotal,
    items: (order.items || []).map((it: any) => {
      const preSale = getProductPreSaleInfo(it.product);
      const gallery = getProductGalleryImages(it.product);
      return {
        name: it.product?.name || 'Camisa Ruby Brasil',
        club: it.product?.club,
        size: it.size,
        quantity: it.quantity,
        imageUrl: it.product?.imageUrl || gallery[0] || '',
        customName: it.customName,
        customNumber: it.customNumber,
        isPreSale: preSale.isPreSale,
        preSaleEta: preSale.preSaleEta,
        totalItemPrice: it.totalItemPrice,
      };
    }),
  };
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
        const MAX_DIMENSION = 800; // Otimizado para reduzir tráfego Base64
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

        let dataUrl = canvas.toDataURL('image/webp', 0.72);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.75);
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
  initialProducts,
  initialOrders,
}: Props) {
  const [adminEmail, setAdminEmail] = useState<string>('admin@rubybr.com.br');
  const [activeTab, setActiveTab] = useState<'products' | 'batch' | 'orders'>('products');
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('ruby-theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ruby-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ruby-theme', 'light');
    }
  };

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
  const [copyingOrderImageId, setCopyingOrderImageId] = useState<string | null>(null);
  const [copiedOrderImageId, setCopiedOrderImageId] = useState<string | null>(null);
  const [copyingItemPhotoIdx, setCopyingItemPhotoIdx] = useState<number | null>(null);
  const [copiedItemPhotoIdx, setCopiedItemPhotoIdx] = useState<number | null>(null);

  const handleCopyOrderCardImage = async (order: any, keyId = `order-card-${order.id}`) => {
    setCopyingOrderImageId(order.id);
    try {
      const data = mapOrderToImageData(order);
      const res = await copyOrderImageToClipboard(data);
      if (res.success) {
        setCopiedOrderImageId(keyId);
        setTimeout(() => setCopiedOrderImageId(null), 4000);
      } else if (res.fallbackBlob) {
        downloadOrderImageFile(res.fallbackBlob, `pedido-${order.orderNumber}.png`);
        alert('A imagem do pedido foi baixada em PNG para você anexar no WhatsApp!');
      } else {
        alert(res.error || 'Não foi possível copiar a imagem do pedido.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao processar imagem do pedido.');
    } finally {
      setCopyingOrderImageId(null);
    }
  };

  const handleDownloadOrderCardImage = async (order: any) => {
    setCopyingOrderImageId(order.id);
    try {
      const data = mapOrderToImageData(order);
      const blob = await generateOrderCardBlob(data);
      downloadOrderImageFile(blob, `pedido-${order.orderNumber}.png`);
    } catch (err) {
      console.error(err);
      alert('Erro ao baixar imagem do pedido.');
    } finally {
      setCopyingOrderImageId(null);
    }
  };

  const handleCopyProductItemImage = async (imgUrl: string, idx: number) => {
    if (!imgUrl) return;
    setCopyingItemPhotoIdx(idx);
    try {
      const res = await copySingleProductImageToClipboard(imgUrl);
      if (res.success) {
        setCopiedItemPhotoIdx(idx);
        setTimeout(() => setCopiedItemPhotoIdx(null), 3000);
      } else {
        window.open(toAbsoluteUrl(imgUrl), '_blank');
      }
    } catch {
      window.open(toAbsoluteUrl(imgUrl), '_blank');
    } finally {
      setCopyingItemPhotoIdx(null);
    }
  };

  // Estados de Upload de Imagem (Suporta 1 ou mais fotos por produto)
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`O arquivo "${file.name}" não é uma imagem válida (PNG, JPG, WEBP).`);
        return false;
      }
      if (file.size > 25 * 1024 * 1024) {
        alert(`A imagem "${file.name}" é muito grande (máx 25MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsProcessingImage(true);
    try {
      const compressedList = await Promise.all(
        validFiles.map((file) => compressAndConvertImage(file))
      );
      setFormData((prev) => {
        const nextImages = [...(prev.images || []), ...compressedList];
        return {
          ...prev,
          images: nextImages,
          imageUrl: nextImages[0] || '',
        };
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao processar imagem no navegador. Tente outra foto.');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFiles(e.target.files);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFiles(e.dataTransfer.files);
    }
  };

  const handleAddImageUrl = () => {
    const clean = newImageUrlInput.trim();
    if (!clean) return;
    setFormData((prev) => {
      const nextImages = prev.images.includes(clean)
        ? prev.images
        : [...prev.images, clean];
      return {
        ...prev,
        images: nextImages,
        imageUrl: nextImages[0] || '',
      };
    });
    setNewImageUrlInput('');
  };

  const handleRemoveGalleryImage = (idxToRemove: number) => {
    setFormData((prev) => {
      const nextImages = prev.images.filter((_, idx) => idx !== idxToRemove);
      return {
        ...prev,
        images: nextImages,
        imageUrl: nextImages[0] || '',
      };
    });
  };

  const handleSetMainGalleryImage = (idxToPromote: number) => {
    if (idxToPromote <= 0) return;
    setFormData((prev) => {
      const chosen = prev.images[idxToPromote];
      if (!chosen) return prev;
      const rest = prev.images.filter((_, idx) => idx !== idxToPromote);
      const nextImages = [chosen, ...rest];
      return {
        ...prev,
        images: nextImages,
        imageUrl: nextImages[0] || '',
      };
    });
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
    images: [] as string[],
    retailPrice: '60.00',
    description: '',
    isActive: true,
    allowCustom: true,
    customPrice: '15.00',
    isPreSale: false,
    preSaleEta: '',
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

  const handleOpenCreateModal = (defaultPreSale = false) => {
    setIsEditing(false);
    setImageUploadMode('file');
    setNewImageUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormData({
      id: '',
      name: '',
      club: '',
      league: 'Brasileirão',
      season: '25/26',
      type: 'TORCEDOR',
      imageUrl: '',
      images: [],
      retailPrice: '60.00',
      description: '',
      isActive: true,
      allowCustom: true,
      customPrice: '15.00',
      isPreSale: defaultPreSale,
      preSaleEta: defaultPreSale ? 'Chega em 15 dias' : '',
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
    setImageUploadMode('file');
    setNewImageUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    const standardSizes = getStandardSizesForProduct(p);
    const currentVariants = standardSizes.map((size) => {
      const found = p.variants?.find((v: any) => v.size === size);
      return { size, stockQuantity: found ? found.stockQuantity : 0 };
    });

    const preSaleInfo = getProductPreSaleInfo(p);
    const existingImages = getProductGalleryImages(p);

    setFormData({
      id: p.id,
      name: p.name,
      club: p.club || '',
      league: p.league || 'Brasileirão',
      season: p.season || '24/25',
      type: p.type || 'TORCEDOR',
      imageUrl: existingImages[0] || p.imageUrl || '',
      images: existingImages,
      retailPrice: String(p.retailPrice || '60.00'),
      description: p.description || '',
      isActive: p.isActive,
      allowCustom: p.allowCustom ?? true,
      customPrice: String(p.customPrice || '15.00'),
      isPreSale: preSaleInfo.isPreSale,
      preSaleEta: preSaleInfo.preSaleEta,
      variants: currentVariants,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalImages =
      formData.images && formData.images.length > 0
        ? formData.images
        : formData.imageUrl && formData.imageUrl.trim() !== ''
        ? [formData.imageUrl.trim()]
        : [];

    if (finalImages.length === 0) {
      alert('Por favor adicione pelo menos uma foto para a peça (enviando arquivo local ou inserindo link).');
      return;
    }

    setIsSavingProduct(true);

    try {
      const url = '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl: finalImages[0],
          images: finalImages,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (isEditing) {
          setProducts((prev) => prev.map((item) => (item.id === data.id ? data : item)));
          showToast('Peça atualizada com sucesso no catálogo!');
        } else {
          setProducts((prev) => [data, ...prev]);
          showToast(
            formData.isPreSale
              ? 'Novo modelo em Pré-Venda adicionado com sucesso!'
              : 'Nova peça cadastrada com sucesso no catálogo!'
          );
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
      if (res.ok) {
        setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, isActive: !p.isActive } : item)));
        showToast(p.isActive ? 'Peça pausada (oculta no catálogo).' : 'Peça ativada na loja!');
      }
    } catch {
      alert('Erro ao alterar status.');
    }
  };

  const handleTogglePreSale = async (p: any) => {
    const current = getProductPreSaleInfo(p);
    const nextIsPreSale = !current.isPreSale;
    const nextEta = nextIsPreSale ? current.preSaleEta || 'Chega em breve' : '';

    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: p.id,
          isPreSale: nextIsPreSale,
          preSaleEta: nextEta,
        }),
      });
      const data = await res.json();
      if (res.ok && data) {
        setProducts((prev) => prev.map((item) => (item.id === p.id ? data : item)));
        showToast(
          nextIsPreSale
            ? 'Peça marcada como Pré-Venda (Modelo que irá chegar)!'
            : 'Peça alterada para Pronta Entrega!'
        );
      }
    } catch {
      alert('Erro ao alterar modo de Pré-Venda.');
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
    } catch {
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

  const preSaleCount = useMemo(() => {
    return products.filter((p) => getProductPreSaleInfo(p).isPreSale).length;
  }, [products]);

  const filteredProducts = products.filter((p) => {
    const preSaleInfo = getProductPreSaleInfo(p);
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.club?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.league?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLeague =
      selectedLeague === 'TODAS' ||
      (selectedLeague === 'Pré-Venda' && preSaleInfo.isPreSale) ||
      p.league === selectedLeague;

    return matchesSearch && matchesLeague;
  });

  const totalSold = batch ? batch.totalQuota - batch.remainingQuota : 0;
  const percentUsed = batch ? ((totalSold / batch.totalQuota) * 100).toFixed(1) : '0';

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-rose-500 selection:text-white"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* TOAST FEEDBACK */}
      {productFeedback && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all ${
            productFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-300'
          }`}
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          {productFeedback.message}
        </div>
      )}

      {/* TOPBAR ADMINISTRATIVO NO MODELO DO NAVBAR DO CLIENTE */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
          borderColor: 'var(--border-crisp)',
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-14 sm:h-16 py-2 sm:py-0 flex items-center justify-between gap-2 sm:gap-4">
          {/* Marca + Ícone Oficial Ruby Brasil */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3 min-w-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 rounded"
              title="Ir para a Loja Virtual"
            >
              <div
                className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl border flex items-center justify-center p-1 overflow-hidden tactile group-hover:scale-105"
                style={{
                  borderColor: 'var(--border-crisp)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <img
                  src="/ruby-brasil-icon.png"
                  alt="Ícone Oficial Ruby Brasil"
                  className="w-full h-full object-contain ruby-icon-adaptive"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-black text-sm sm:text-base tracking-tighter block leading-none whitespace-nowrap"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    RUBY BRASIL
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    ADMIN
                  </span>
                </div>
                <span
                  className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider sm:tracking-widest block mt-0.5 whitespace-nowrap truncate"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span className="sm:hidden">PAINEL DE GESTÃO 1:1</span>
                  <span className="hidden sm:inline">PAINEL DE GESTÃO & CONTROLE ATELIER 1:1</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Ações e Controles */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Alternador de Tema Claro / Escuro */}
            <button
              onClick={toggleTheme}
              type="button"
              className="p-2 sm:p-2.5 rounded-xl border tactile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
              style={{
                borderColor: 'var(--border-crisp)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
              }}
              aria-label={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
              title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

            {/* BOTÃO ADICIONAR PRÉ-VENDA */}
            <button
              onClick={() => handleOpenCreateModal(true)}
              className="px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold border tactile flex items-center gap-1.5 shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
              title="Cadastrar modelo que irá chegar (Pré-Venda)"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Adicionar Pré-Venda</span>
              <span className="md:hidden">Pré-Venda</span>
            </button>

            {/* BOTÃO ADICIONAR NOVA PEÇA NO TOPO */}
            <button
              onClick={() => handleOpenCreateModal(false)}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs flex items-center gap-1.5 border border-zinc-950 dark:border-white shadow-sm tactile hover:opacity-90 shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Adicionar Peça</span>
              <span className="sm:hidden">Peça</span>
            </button>

            {/* BADGE DE USUÁRIO */}
            <div
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
              style={{
                borderColor: 'var(--border-crisp)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
              }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <User className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span className="font-mono text-[11px] font-medium">{adminEmail}</span>
            </div>

            {/* BOTÃO VER LOJA */}
            <Link
              href="/"
              className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 tactile"
              style={{
                borderColor: 'var(--border-crisp)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
              }}
              title="Ver Loja no modo cliente"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden sm:inline">Ver Loja</span>
            </Link>

            {/* BOTÃO LOGOUT */}
            <button
              onClick={handleLogout}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 tactile"
              title="Encerrar sessão de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* CARDS DE KPIS NO ESTILO EDITORIAL DO CLIENTE */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            className="p-4 sm:p-5 rounded-2xl border tactile"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-crisp)',
            }}
          >
            <span
              className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider block truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              Catálogo Ativo
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span
                className="text-2xl sm:text-3xl font-black font-mono tabular-nums"
                style={{ color: 'var(--text-primary)' }}
              >
                {products.length}
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">modelos</span>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 block truncate">
              {preSaleCount} em Pré-Venda
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
              className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Cota do Lote
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span
                className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400"
              >
                {batch?.remainingQuota?.toLocaleString('pt-BR')}
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: 'var(--text-muted)' }}
              >
                peças
              </span>
            </div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden mt-3"
              style={{ backgroundColor: 'var(--bg-studio)' }}
            >
              <div
                className="bg-rose-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${batch ? (batch.remainingQuota / batch.totalQuota) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div
            className="p-4 sm:p-5 rounded-2xl border tactile"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-crisp)',
            }}
          >
            <span
              className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider block truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              Peças Bonificadas
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {totalSold.toLocaleString('pt-BR')}
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: 'var(--text-muted)' }}
              >
                ({percentUsed}%)
              </span>
            </div>
            <span
              className="text-[11px] font-mono mt-1 block truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              Consumidas no lote
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
              className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider block truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              Total de Pedidos
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span
                className="text-2xl sm:text-3xl font-black font-mono tabular-nums"
                style={{ color: 'var(--text-primary)' }}
              >
                {orders.length}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">pedidos</span>
            </div>
            <span
              className="text-[11px] mt-1 block truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              Registrados no sistema
            </span>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS NO FORMATO DE PÍLULAS DO CLIENTE */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-2 border-b -mx-3 px-3 sm:mx-0 sm:px-0"
          style={{ borderColor: 'var(--border-crisp)' }}
        >
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap tactile inline-flex items-center gap-2 border shrink-0 ${
              activeTab === 'products'
                ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white shadow-sm'
                : 'hover:opacity-80'
            }`}
            style={
              activeTab !== 'products'
                ? {
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-secondary)',
                  }
                : undefined
            }
          >
            <Package className="w-3.5 h-3.5" />
            <span>Catálogo & Pré-Venda</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                activeTab === 'products'
                  ? 'bg-white/20 dark:bg-zinc-900/20'
                  : 'bg-[var(--bg-studio)]'
              }`}
            >
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap tactile inline-flex items-center gap-2 border shrink-0 ${
              activeTab === 'batch'
                ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white shadow-sm'
                : 'hover:opacity-80'
            }`}
            style={
              activeTab !== 'batch'
                ? {
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-secondary)',
                  }
                : undefined
            }
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Lote Promocional & Metas</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap tactile inline-flex items-center gap-2 border shrink-0 ${
              activeTab === 'orders'
                ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white shadow-sm'
                : 'hover:opacity-80'
            }`}
            style={
              activeTab !== 'orders'
                ? {
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-secondary)',
                  }
                : undefined
            }
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Gestão de Pedidos</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                activeTab === 'orders'
                  ? 'bg-white/20 dark:bg-zinc-900/20'
                  : 'bg-[var(--bg-studio)]'
              }`}
            >
              {orders.length}
            </span>
          </button>
        </div>

        {/* ABA 1: CATÁLOGO DE PEÇAS */}
        {activeTab === 'products' && (
          <div
            className="rounded-2xl border p-4 sm:p-6 shadow-sm overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-crisp)',
            }}
          >
            <div
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-5 border-b"
              style={{ borderColor: 'var(--border-crisp)' }}
            >
              <div>
                <h2
                  className="text-lg sm:text-xl font-black flex items-center gap-2 tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Package className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  Gerenciamento de Peças & Pré-Venda
                </h2>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cadastre camisas a pronta entrega ou adicione modelos em Pré-Venda (que irão chegar) para reserva antecipada.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenCreateModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border tactile flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                >
                  <CalendarClock className="w-4 h-4" />
                  <span>Adicionar Pré-Venda</span>
                </button>

                <button
                  onClick={() => handleOpenCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 border border-zinc-950 dark:border-white shadow-sm tactile hover:opacity-90"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Adicionar Pronta Entrega</span>
                </button>
              </div>
            </div>

            {/* FILTROS E BUSCA */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
              <div className="relative w-full sm:w-80">
                <Search
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="Buscar por time, camisa ou liga..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-full border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                  style={{
                    backgroundColor: 'var(--bg-studio)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-2 sm:pb-0">
                {[
                  'TODAS',
                  'Pré-Venda',
                  'Infantil',
                  'Brasileirão',
                  'Premier League',
                  'La Liga',
                  'Seleções',
                  'Retrô',
                ].map((league) => {
                  const isPreSaleFilter = league === 'Pré-Venda';
                  const isSelected = selectedLeague === league;
                  return (
                    <button
                      key={league}
                      onClick={() => setSelectedLeague(league)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap tactile inline-flex items-center gap-1.5 border shrink-0 ${
                        isSelected
                          ? isPreSaleFilter
                            ? 'bg-amber-400 text-zinc-950 border-amber-400'
                            : 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white'
                          : isPreSaleFilter
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                          : 'hover:opacity-80'
                      }`}
                      style={
                        !isSelected && !isPreSaleFilter
                          ? {
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-crisp)',
                              color: 'var(--text-secondary)',
                            }
                          : undefined
                      }
                    >
                      {isPreSaleFilter && <Clock className="w-3 h-3" />}
                      <span>{league}</span>
                      {isPreSaleFilter && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? 'bg-zinc-950 text-amber-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {preSaleCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TABELA DE PRODUTOS */}
            <div
              className="overflow-x-auto rounded-2xl border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-crisp)',
              }}
            >
              <table className="w-full text-left text-xs">
                <thead
                  className="uppercase text-[10px] font-mono font-bold tracking-wider border-b"
                  style={{
                    backgroundColor: 'var(--bg-studio)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <tr>
                    <th className="py-3 px-4">Foto</th>
                    <th className="py-3 px-4">Camisa / Clube</th>
                    <th className="py-3 px-3">Liga / Modalidade</th>
                    <th className="py-3 px-3">Preço Base</th>
                    <th className="py-3 px-3">Grade de Tamanhos</th>
                    <th className="py-3 px-3 text-center">Status & Modo</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ borderColor: 'var(--border-crisp)' }}
                >
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Nenhuma peça encontrada com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const preSaleInfo = getProductPreSaleInfo(p);
                      const productImages = getProductGalleryImages(p);
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-[var(--bg-studio)] transition-colors"
                        >
                          <td className="py-3 px-4">
                            {p.imageUrl ? (
                              <div className="relative w-11 h-11 shrink-0">
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-11 h-11 object-cover rounded-xl border shadow-sm"
                                  style={{
                                    borderColor: 'var(--border-crisp)',
                                    backgroundColor: 'var(--bg-studio)',
                                  }}
                                />
                                {productImages.length > 1 && (
                                  <span
                                    title={`${productImages.length} fotos cadastradas`}
                                    className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-rose-600 text-white font-mono font-black text-[9px] border shadow"
                                    style={{ borderColor: 'var(--bg-surface)' }}
                                  >
                                    +{productImages.length - 1}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center border"
                                style={{
                                  borderColor: 'var(--border-crisp)',
                                  backgroundColor: 'var(--bg-studio)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <a
                                href={`/produto/${p.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm font-black hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group/link"
                                style={{ color: 'var(--text-primary)' }}
                                title="Abrir página desta camisa em nova aba"
                              >
                                <span>{p.name}</span>
                                <ExternalLink
                                  className="w-3 h-3 opacity-60 group-hover/link:opacity-100 transition-opacity"
                                  style={{ color: 'var(--text-muted)' }}
                                />
                              </a>
                              {preSaleInfo.isPreSale && (
                                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  Pré-Venda
                                </span>
                              )}
                            </div>
                            <span
                              className="text-[11px] font-normal block mt-0.5"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {p.club} • {p.season}
                              {preSaleInfo.isPreSale && preSaleInfo.preSaleEta && (
                                <span className="text-amber-600 dark:text-amber-300 font-semibold ml-1.5">
                                  ({preSaleInfo.preSaleEta})
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold border mr-1 inline-block"
                              style={{
                                backgroundColor: 'var(--bg-studio)',
                                borderColor: 'var(--border-crisp)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {p.league}
                            </span>
                            <span
                              className="text-[10px] block mt-1 font-mono uppercase"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {p.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-sm">
                            <span style={{ color: 'var(--text-primary)' }}>
                              {formatCurrency(p.retailPrice)}
                            </span>
                          </td>
                          <td className="py-3 px-3">
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
                                    className={`px-1.5 py-0.5 rounded border ${
                                      v.stockQuantity > 0
                                        ? 'border-[var(--border-crisp)] bg-[var(--bg-studio)] text-[var(--text-secondary)]'
                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                    }`}
                                  >
                                    {v.size}: <strong style={{ color: 'var(--text-primary)' }}>{v.stockQuantity}</strong>
                                  </span>
                                ));
                              })()}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <button
                                onClick={() => handleToggleActive(p)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] border tactile ${
                                  p.isActive
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                                    : 'border-[var(--border-crisp)] bg-[var(--bg-studio)] text-[var(--text-muted)] hover:opacity-80'
                                }`}
                                title={p.isActive ? 'Clique para pausar esta camisa' : 'Clique para reativar'}
                              >
                                {p.isActive ? <Eye className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <EyeOff className="w-3 h-3" />}
                                {p.isActive ? 'Ativo' : 'Pausado'}
                              </button>

                              <button
                                onClick={() => handleTogglePreSale(p)}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border tactile ${
                                  preSaleInfo.isPreSale
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                                    : 'border-[var(--border-crisp)] bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:opacity-80'
                                }`}
                                title={
                                  preSaleInfo.isPreSale
                                    ? 'Clique para mudar para Pronta Entrega (Lote chegou)'
                                    : 'Clique para colocar em Pré-Venda (Modelo que irá chegar)'
                                }
                              >
                                <Clock className="w-2.5 h-2.5" />
                                {preSaleInfo.isPreSale ? 'Pré-Venda' : 'Pronta Entrega'}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
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
                                className="p-2 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-surface)] hover:bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] tactile"
                                title="Copiar link desta camisa para enviar ao cliente"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={`/produto/${p.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-surface)] hover:bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] tactile flex items-center justify-center"
                                title="Abrir página desta camisa em uma nova aba"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="p-2 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-surface)] hover:bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] tactile"
                                title="Editar peça"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 tactile"
                                title="Excluir peça"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 2: LOTE PROMOCIONAL & METAS */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div
              className="rounded-2xl border p-5 sm:p-6 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-crisp)',
              }}
            >
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b"
                style={{ borderColor: 'var(--border-crisp)' }}
              >
                <div>
                  <h2
                    className="text-lg sm:text-xl font-black flex items-center gap-2 uppercase tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Flame className="w-5 h-5 text-amber-500" />
                    Controle do Lote Promocional ({batch?.code || 'LOTE-6000'})
                  </h2>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Defina o saldo de peças promocionais exibido no topo da loja.
                  </p>
                </div>

                <button
                  onClick={handleResetTo6000}
                  className="px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 tactile bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resetar para 6.000 Camisas
                </button>
              </div>

              {batchSuccessMsg && (
                <div
                  className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {batchSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-bold mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Cota Restante no Contador (Peças)
                  </label>
                  <input
                    type="number"
                    value={remainingQuotaInput}
                    onChange={(e) => setRemainingQuotaInput(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Exibido na barra promocional do topo da loja.
                  </p>
                </div>

                <div>
                  <label
                    className="block text-xs font-bold mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Cota Total do Lote (Peças)
                  </label>
                  <input
                    type="number"
                    value={totalQuotaInput}
                    onChange={(e) => setTotalQuotaInput(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Cota total de referência do lote promocional.
                  </p>
                </div>
              </div>

              <div
                className="mt-6 pt-4 border-t flex justify-end"
                style={{ borderColor: 'var(--border-crisp)' }}
              >
                <button
                  onClick={() => handleUpdateBatch()}
                  disabled={isUpdatingBatch}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 border border-zinc-950 dark:border-white shadow-sm tactile hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isUpdatingBatch ? 'Salvando...' : 'Salvar Alterações do Lote'}
                </button>
              </div>
            </div>

            {/* INFORMAÇÕES DE PREÇO */}
            <div
              className="rounded-2xl border p-5 sm:p-6 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-crisp)',
              }}
            >
              <h3
                className="text-base sm:text-lg font-black flex items-center gap-2 mb-4 pb-3 border-b tracking-tight"
                style={{
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-crisp)',
                }}
              >
                <Layers className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                Política de Preços (Direto de Fábrica)
              </h3>

              <div
                className="rounded-xl border p-4 sm:p-5"
                style={{
                  backgroundColor: 'var(--bg-studio)',
                  borderColor: 'var(--border-crisp)',
                }}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span
                    className="font-bold uppercase tracking-wider text-[11px]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Preço Cadastrado do Produto
                  </span>
                  <span
                    className="px-2 py-0.5 rounded font-mono text-[10px] border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Sem desconto por quantidade
                  </span>
                </div>
                <h4
                  className="text-xl sm:text-2xl font-black mt-2 font-mono tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Preço Individual Mantido
                </h4>
                <p
                  className="text-xs mt-2 leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cada modelo cobra seu preço cadastrado específico (ex: Versões Torcedor R$ 60, Jogador R$ 80, etc.). Não há redução automática para R$ 55 ao atingir 50 peças.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: PEDIDOS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* CARDS DE RESUMO FINANCEIRO DOS PEDIDOS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
                  Faturamento de Pedidos
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(orderStats.totalRevenue)}
                  </span>
                </div>
                <span
                  className="text-[11px] mt-1 block"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Total acumulado de pedidos
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
                  Total de Camisas
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span
                    className="text-2xl sm:text-3xl font-black font-mono tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {orderStats.totalPieces.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">peças</span>
                </div>
                <span
                  className="text-[11px] mt-1 block"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Somatório de todos os pedidos
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
                  Total de Pedidos
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span
                    className="text-2xl sm:text-3xl font-black font-mono tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {orderStats.total}
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">registrados</span>
                </div>
                <span
                  className="text-[11px] mt-1 block"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {orderStats.delivered} entregues • {orderStats.shipped} enviados
                </span>
              </div>
            </div>

            {/* TABELA PRINCIPAL DE GESTÃO DE PEDIDOS */}
            <div
              className="rounded-2xl border p-4 sm:p-6 shadow-sm overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-crisp)',
              }}
            >
              <div
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-5 border-b"
                style={{ borderColor: 'var(--border-crisp)' }}
              >
                <div>
                  <h2
                    className="text-lg sm:text-xl font-black flex items-center gap-2 uppercase tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Gestão & Controle de Pedidos
                  </h2>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Acompanhe pedidos, altere status em tempo real e gere relatórios prontos para WhatsApp.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGeneralReportModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border tactile flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Relatório Geral (WhatsApp)
                  </button>

                  <button
                    type="button"
                    onClick={handleRefreshOrders}
                    disabled={isRefreshingOrders}
                    className="px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 tactile border-[var(--border-crisp)] bg-[var(--bg-surface)] hover:bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    title="Atualizar lista de pedidos"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin text-emerald-500' : ''}`} />
                    <span>Atualizar</span>
                  </button>
                </div>
              </div>

              {/* FILTROS POR STATUS NO MODELO DE PÍLULAS */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
                {[
                  { key: 'ALL', label: `Todos (${orders.length})` },
                  { key: 'PENDING', label: `⏳ Pendentes (${orderStats.pending})` },
                  { key: 'PROCESSAMENTO', label: `⚙️ Processamento (${orderStats.processing})` },
                  { key: 'PAGAMENTO_CONFIRMADO', label: `✅ Pagos (${orderStats.confirmed})` },
                  { key: 'ENVIADO', label: `🚚 Enviados (${orderStats.shipped})` },
                  { key: 'ENTREGUE', label: `📦 Entregues (${orderStats.delivered})` },
                ].map((s) => {
                  const isSelected = orderStatusFilter === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setOrderStatusFilter(s.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap tactile border shrink-0 ${
                        isSelected
                          ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white shadow-sm'
                          : 'hover:opacity-80'
                      }`}
                      style={
                        !isSelected
                          ? {
                              backgroundColor: 'var(--bg-studio)',
                              borderColor: 'var(--border-crisp)',
                              color: 'var(--text-secondary)',
                            }
                          : undefined
                      }
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* BUSCA DE PEDIDOS */}
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
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Buscar pedido por número (#RUBY...), nome do cliente, WhatsApp, CPF ou cidade..."
                    className="w-full rounded-xl pl-10 pr-20 py-2.5 text-xs sm:text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  {orderSearch && (
                    <button
                      type="button"
                      onClick={() => setOrderSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md border border-[var(--border-crisp)] bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div
                  className="flex items-center justify-between text-[11px] mt-2 px-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>
                    Exibindo <strong style={{ color: 'var(--text-primary)' }}>{filteredOrders.length}</strong> de <strong style={{ color: 'var(--text-primary)' }}>{orders.length}</strong> pedidos
                  </span>
                  {orderStatusFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('ALL')}
                      className="text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                    >
                      Remover filtro de status
                    </button>
                  )}
                </div>
              </div>

              {/* TABELA DE PEDIDOS */}
              {filteredOrders.length === 0 ? (
                <div
                  className="py-16 text-center rounded-2xl border"
                  style={{
                    backgroundColor: 'var(--bg-studio)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p
                    className="font-bold text-sm sm:text-base"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Nenhum pedido encontrado
                  </p>
                  <p
                    className="text-xs mt-1 max-w-sm mx-auto"
                    style={{ color: 'var(--text-secondary)' }}
                  >
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
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-crisp)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-studio)] tactile"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="overflow-x-auto rounded-2xl border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-crisp)',
                  }}
                >
                  <table className="w-full text-left text-xs">
                    <thead
                      className="uppercase text-[10px] font-mono font-bold tracking-wider border-b"
                      style={{
                        backgroundColor: 'var(--bg-studio)',
                        borderColor: 'var(--border-crisp)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <tr>
                        <th className="py-3 px-4">Pedido # & Data</th>
                        <th className="py-3 px-4">Cliente & Local</th>
                        <th className="py-3 px-3">WhatsApp</th>
                        <th className="py-3 px-3 text-center">Peças</th>
                        <th className="py-3 px-3">Total</th>
                        <th className="py-3 px-3">Mudar Status</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody
                      className="divide-y"
                      style={{ borderColor: 'var(--border-crisp)' }}
                    >
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
                          <tr
                            key={order.id}
                            className="hover:bg-[var(--bg-studio)] transition-colors"
                          >
                            <td className="py-3 px-4">
                              <span
                                className="font-mono font-bold block"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                #{order.orderNumber}
                              </span>
                              <span
                                className="text-[10px] flex items-center gap-1 mt-0.5 font-mono"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                <Clock className="w-3 h-3" />
                                {dateFormatted}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <strong
                                className="block font-bold"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {order.customerName}
                              </strong>
                              <span
                                className="text-[10px] block font-normal mt-0.5"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {order.city ? `${order.city}/${order.state}` : 'Local não informado'}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              {waUrl ? (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-semibold border border-emerald-500/20 transition-colors"
                                  title="Conversar com o cliente no WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>{order.phone}</span>
                                </a>
                              ) : (
                                <span
                                  className="font-mono text-[11px]"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {order.phone || 'S/N'}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span
                                className="font-bold font-mono text-xs block"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {order.totalQuantity} un
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                                  order.isWholesale
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                    : 'border border-[var(--border-crisp)] bg-[var(--bg-studio)] text-[var(--text-muted)]'
                                }`}
                              >
                                {order.isWholesale ? 'Atacado' : 'Varejo'}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm block">
                                {formatCurrency(order.finalTotal)}
                              </span>
                              <span
                                className="text-[10px] block truncate max-w-[140px]"
                                style={{ color: 'var(--text-muted)' }}
                                title={order.shippingService || 'Melhor Envio'}
                              >
                                {order.shippingService ? `${order.shippingService} (${formatCurrency(order.shippingCost || 0)})` : `Frete ${formatCurrency(order.shippingCost || 0)}`}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <div className="relative inline-flex items-center gap-1.5">
                                <select
                                  value={order.status || 'PENDING'}
                                  disabled={isUpdating}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border appearance-none pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-600 tactile ${
                                    statusInfo.badge
                                  } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                                  style={{ backgroundColor: 'var(--bg-surface)' }}
                                >
                                  <option value="PROCESSAMENTO">
                                    ⚙️ Em Processamento
                                  </option>
                                  <option value="PAGAMENTO_CONFIRMADO">
                                    ✅ Pagamento Confirmado
                                  </option>
                                  <option value="ENVIADO">
                                    🚚 Enviado
                                  </option>
                                  <option value="ENTREGUE">
                                    📦 Entregue
                                  </option>
                                  <option value="PENDING">
                                    ⏳ Pendente
                                  </option>
                                  <option value="CANCELADO">
                                    ❌ Cancelado
                                  </option>
                                </select>
                                {isUpdating && (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="px-2.5 py-1.5 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-surface)] hover:bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold flex items-center gap-1 tactile"
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
                                  className="px-2 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 tactile"
                                  title="Copiar relatório formatado para WhatsApp"
                                >
                                  {copiedKey === `order-${order.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  )}
                                  <span className="hidden sm:inline">Zap</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopyOrderCardImage(order, `order-img-${order.id}`)}
                                  disabled={copyingOrderImageId === order.id}
                                  className="px-2 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 tactile"
                                  title="Copiar imagem oficial com fotos das camisas para colar no WhatsApp"
                                >
                                  {copyingOrderImageId === order.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                                  ) : copiedOrderImageId === `order-img-${order.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <ImageIcon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  )}
                                  <span className="hidden sm:inline">Foto</span>
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

      {/* MODAL ADICIONAR / EDITAR PEÇA NO MODELO BOUTIQUE CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="border rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-crisp)',
              color: 'var(--text-primary)',
            }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] tactile"
              aria-label="Fechar modal"
            >
              <X className="w-4 h-4" />
            </button>

            <h3
              className="text-lg sm:text-xl font-black flex items-center gap-2 mb-1 tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {formData.isPreSale ? (
                <CalendarClock className="w-5 h-5 text-amber-500" />
              ) : (
                <Package className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              )}
              {isEditing
                ? 'Editar Peça'
                : formData.isPreSale
                ? 'Adicionar Modelo em Pré-Venda (Irá Chegar)'
                : 'Adicionar Nova Camisa ao Catálogo'}
            </h3>
            <p
              className="text-xs mb-5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {formData.isPreSale
                ? 'Cadastre um lançamento ou reposição que irá chegar para liberar reservas antecipadas na loja.'
                : 'Preencha os dados da camisa para disponibilizar no catálogo oficial.'}
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* SELETOR DE MODO: PRONTA ENTREGA vs PRÉ-VENDA */}
              <div
                className="p-3.5 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-studio)',
                  borderColor: 'var(--border-crisp)',
                }}
              >
                <label
                  className="block text-xs font-bold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Disponibilidade do Modelo:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPreSale: false })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border tactile ${
                      !formData.isPreSale
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'border-[var(--border-crisp)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Pronta Entrega</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        isPreSale: true,
                        preSaleEta: formData.preSaleEta || 'Chega em 15 dias',
                      })
                    }
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border tactile ${
                      formData.isPreSale
                        ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-sm'
                        : 'border-[var(--border-crisp)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-amber-600 dark:hover:text-amber-300'
                    }`}
                  >
                    <CalendarClock className="w-4 h-4" />
                    <span>Pré-Venda</span>
                  </button>
                </div>

                {formData.isPreSale && (
                  <div
                    className="pt-2 border-t"
                    style={{ borderColor: 'var(--border-crisp)' }}
                  >
                    <label className="block text-xs font-bold text-amber-700 dark:text-amber-300 mb-1">
                      Previsão de Chegada / Aviso da Pré-Venda (Exibido para o cliente)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Chega em 15 dias, Lote de Novembro, Em trânsito..."
                      value={formData.preSaleEta}
                      onChange={(e) => setFormData({ ...formData, preSaleEta: e.target.value })}
                      className="w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500 tactile"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-crisp)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label
                    className="block text-xs font-bold mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Nome da Camisa / Peça *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Camisa Real Madrid I 25/26 - Torcedor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-bold mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Clube / Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Real Madrid, Flamengo, Brasil"
                    value={formData.club}
                    onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-bold mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Liga / Categoria *
                  </label>
                  <select
                    value={formData.league}
                    onChange={(e) => setFormData({ ...formData, league: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
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
                  <label
                    className="block text-xs font-bold mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Temporada *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 25/26 ou 1998"
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-bold mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Tipo de Modelo
                  </label>
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
                    className="w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="TORCEDOR">Torcedor (Standard)</option>
                    <option value="JOGADOR">Jogador (Player Version)</option>
                    <option value="INFANTIL">Infantil (Kids / Conjunto)</option>
                    <option value="RETRO">Retrô Clássica</option>
                    <option value="FEMININA">Feminina</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-xs font-bold mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Preço Base Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="60.00"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2 text-xs font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-bold mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Valor Personalização (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15.00"
                    value={formData.customPrice}
                    onChange={(e) => setFormData({ ...formData, customPrice: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2 text-xs font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* UPLOAD DE UMA OU MAIS IMAGENS DA PEÇA */}
                <div className="sm:col-span-2 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <label
                        className="block text-xs font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Fotos da Peça *{' '}
                        <span className="text-rose-600 dark:text-rose-400 font-mono">
                          ({formData.images.length}{' '}
                          {formData.images.length === 1 ? 'foto adicionada' : 'fotos adicionadas'})
                        </span>
                      </label>
                      <span
                        className="text-[11px] block mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Adicione uma ou mais fotos (frente, costas, detalhes). A primeira foto será a capa principal.
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1 p-0.5 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-studio)',
                        borderColor: 'var(--border-crisp)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('file')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                          imageUploadMode === 'file'
                            ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                            : 'hover:opacity-80'
                        }`}
                        style={imageUploadMode !== 'file' ? { color: 'var(--text-secondary)' } : undefined}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Fotos Locais
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('url')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                          imageUploadMode === 'url'
                            ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                            : 'hover:opacity-80'
                        }`}
                        style={imageUploadMode !== 'url' ? { color: 'var(--text-secondary)' } : undefined}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Por Link
                      </button>
                    </div>
                  </div>

                  {/* GRADE DE FOTOS JÁ ADICIONADAS */}
                  {formData.images.length > 0 && (
                    <div
                      className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl border"
                      style={{
                        backgroundColor: 'var(--bg-studio)',
                        borderColor: 'var(--border-crisp)',
                      }}
                    >
                      {formData.images.map((imgUrl, idx) => {
                        const isMain = idx === 0;
                        return (
                          <div
                            key={`${idx}-${imgUrl.slice(0, 24)}`}
                            className={`relative group rounded-xl overflow-hidden border flex flex-col justify-between ${
                              isMain
                                ? 'border-rose-600 ring-2 ring-rose-600/30'
                                : 'border-[var(--border-crisp)]'
                            }`}
                            style={{ backgroundColor: 'var(--bg-surface)' }}
                          >
                            <div className="relative aspect-[4/5] w-full overflow-hidden">
                              <img
                                src={imgUrl}
                                alt={`Foto ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <span
                                className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow ${
                                  isMain
                                    ? 'bg-rose-600 text-white'
                                    : 'border border-[var(--border-crisp)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                                }`}
                              >
                                {isMain ? '★ Capa' : `Foto #${idx + 1}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(idx)}
                                title="Remover esta foto"
                                className="absolute top-2 right-2 w-6 h-6 rounded-lg border border-[var(--border-crisp)] bg-[var(--bg-surface)] hover:bg-rose-600 hover:text-white text-[var(--text-secondary)] flex items-center justify-center transition-colors shadow"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {!isMain && (
                              <button
                                type="button"
                                onClick={() => handleSetMainGalleryImage(idx)}
                                className="w-full py-1.5 px-2 text-[10px] font-bold border-t border-[var(--border-crisp)] bg-[var(--bg-surface)] hover:bg-amber-400 hover:text-zinc-950 text-amber-600 dark:text-amber-300 transition-colors"
                              >
                                Definir como Capa
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {imageUploadMode === 'file' ? (
                    <div>
                      <input
                        type="file"
                        multiple
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
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                          isDragging
                            ? 'border-rose-600 bg-rose-500/10'
                            : 'border-[var(--border-crisp)] hover:border-rose-500/60 bg-[var(--bg-studio)]'
                        }`}
                      >
                        {isProcessingImage ? (
                          <div className="flex flex-col items-center justify-center py-3">
                            <Loader2 className="w-6 h-6 text-rose-600 animate-spin mb-2" />
                            <p
                              className="text-xs font-bold"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              Otimizando e comprimindo foto(s)...
                            </p>
                            <p
                              className="text-[11px] mt-0.5"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Convertendo para WebP de carregamento instantâneo
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-2 group">
                            <div
                              className="w-9 h-9 rounded-xl border flex items-center justify-center mb-2 group-hover:scale-105 transition-transform"
                              style={{
                                borderColor: 'var(--border-crisp)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--accent)',
                              }}
                            >
                              <PlusCircle className="w-4 h-4" />
                            </div>
                            <p
                              className="text-xs font-bold mb-0.5"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {formData.images.length > 0
                                ? 'Clique para adicionar mais fotos desta camisa'
                                : 'Clique para escolher uma ou mais fotos do dispositivo'}
                            </p>
                            <p
                              className="text-[11px]"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Você pode selecionar várias fotos de uma vez ou arrastar aqui (JPG, PNG, WEBP)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://exemplo.com/foto-camisa.jpg"
                        value={newImageUrlInput}
                        onChange={(e) => setNewImageUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImageUrl();
                          }
                        }}
                        className="flex-1 rounded-xl px-3.5 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                        style={{
                          backgroundColor: 'var(--bg-studio)',
                          borderColor: 'var(--border-crisp)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        disabled={!newImageUrlInput.trim()}
                        className="px-3.5 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-opacity tactile"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Adicionar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* GRADE DE ESTOQUE POR TAMANHO */}
              <div className="pt-2">
                <label
                  className="block text-xs font-bold mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {formData.isPreSale
                    ? 'Grade de Vagas / Unidades p/ Reserva na Pré-Venda:'
                    : 'Grade de Estoque por Tamanho (Unidades):'}
                </label>
                <div className={`grid ${formData.variants.length > 5 ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-5'} gap-2`}>
                  {formData.variants.map((v, idx) => (
                    <div
                      key={v.size}
                      className="p-2 rounded-xl border text-center"
                      style={{
                        backgroundColor: 'var(--bg-studio)',
                        borderColor: 'var(--border-crisp)',
                      }}
                    >
                      <span className="font-black text-xs text-rose-600 dark:text-rose-400 block mb-1">
                        {v.size}
                        {v.size === '3XL' && <span className="text-[9px] text-amber-600 dark:text-amber-300 block font-normal leading-tight">+R$6</span>}
                        {v.size === '4XL' && <span className="text-[9px] text-amber-600 dark:text-amber-300 block font-normal leading-tight">+R$12</span>}
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
                        className="w-full border rounded-lg py-1 px-1 text-center text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-600"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-crisp)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label
                  className="flex items-center gap-2 cursor-pointer text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-[var(--border-crisp)] text-rose-600 focus:ring-0 w-4 h-4"
                  />
                  Peça Ativa no Catálogo
                </label>

                <label
                  className="flex items-center gap-2 cursor-pointer text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <input
                    type="checkbox"
                    checked={formData.allowCustom}
                    onChange={(e) => setFormData({ ...formData, allowCustom: e.target.checked })}
                    className="rounded border-[var(--border-crisp)] text-rose-600 focus:ring-0 w-4 h-4"
                  />
                  Permitir Personalização (Nome + Número)
                </label>
              </div>

              <div
                className="flex justify-end gap-3 pt-4 border-t"
                style={{ borderColor: 'var(--border-crisp)' }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-studio)] hover:bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] tactile"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct || isProcessingImage}
                  className={`px-5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 border shadow-sm tactile disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.isPreSale
                      ? 'bg-amber-400 text-zinc-950 border-amber-400 hover:bg-amber-300'
                      : 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white hover:opacity-90'
                  }`}
                >
                  {isProcessingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando Imagem...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isSavingProduct
                        ? 'Salvando...'
                        : isEditing
                        ? 'Salvar Alterações'
                        : formData.isPreSale
                        ? 'Cadastrar na Pré-Venda'
                        : 'Cadastrar Peça'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DO PEDIDO NO MODELO CLIENTE */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="border rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-crisp)',
              color: 'var(--text-primary)',
            }}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] tactile"
              aria-label="Fechar modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* CABEÇALHO DO MODAL */}
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 mb-5"
              style={{ borderColor: 'var(--border-crisp)' }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className="text-lg sm:text-xl font-black font-mono tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
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
                <p
                  className="text-xs mt-1 flex items-center gap-1.5 font-mono"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Clock className="w-3.5 h-3.5" />
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

              <div className="text-left sm:text-right sm:pr-8">
                <span
                  className="text-[11px] block font-mono uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Total do Pedido
                </span>
                <span className="text-xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedOrder.finalTotal)}
                </span>
              </div>
            </div>

            {/* SELETOR RÁPIDO DE STATUS */}
            <div
              className="p-3.5 rounded-xl border mb-5"
              style={{
                backgroundColor: 'var(--bg-studio)',
                borderColor: 'var(--border-crisp)',
              }}
            >
              <span
                className="text-xs font-bold uppercase tracking-wider block mb-2.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Alterar Status do Pedido:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'PROCESSAMENTO', label: 'Processamento', emoji: '⚙️' },
                  { key: 'PAGAMENTO_CONFIRMADO', label: 'Pago', emoji: '✅' },
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
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border tactile ${
                        isCurrent
                          ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white shadow-sm'
                          : 'border-[var(--border-crisp)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-studio)]'
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-5">
              <div
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-studio)',
                  borderColor: 'var(--border-crisp)',
                }}
              >
                <span
                  className="text-[11px] font-mono font-bold uppercase tracking-wider block mb-2 text-rose-600 dark:text-rose-400"
                >
                  Dados do Cliente
                </span>
                <div className="space-y-1.5 text-xs">
                  <p>
                    <span style={{ color: 'var(--text-muted)' }}>Nome:</span>{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedOrder.customerName}</strong>
                  </p>
                  <p>
                    <span style={{ color: 'var(--text-muted)' }}>Documento:</span>{' '}
                    <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {selectedOrder.document || 'Não informado'} ({selectedOrder.customerType || 'PF'})
                    </span>
                  </p>
                  <p>
                    <span style={{ color: 'var(--text-muted)' }}>E-mail:</span>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedOrder.email || 'Não informado'}</span>
                  </p>
                  <div className="pt-1.5 flex items-center justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>WhatsApp:</span>
                    <a
                      href={`https://wa.me/55${(selectedOrder.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${selectedOrder.customerName}, sobre o seu pedido #${selectedOrder.orderNumber} na Ruby Brasil:`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 transition-colors text-xs font-mono"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{selectedOrder.phone}</span>
                    </a>
                  </div>
                </div>
              </div>

              <div
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-studio)',
                  borderColor: 'var(--border-crisp)',
                }}
              >
                <span
                  className="text-[11px] font-mono font-bold uppercase tracking-wider block mb-2 text-amber-600 dark:text-amber-400"
                >
                  Endereço de Entrega
                </span>
                <div
                  className="space-y-1.5 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <p>
                    {selectedOrder.street}, {selectedOrder.number}
                    {selectedOrder.complement ? ` (${selectedOrder.complement})` : ''}
                  </p>
                  <p>Bairro: {selectedOrder.neighborhood || 'Não informado'}</p>
                  <p>
                    {selectedOrder.city} - {selectedOrder.state}
                  </p>
                  <p className="font-mono">CEP: {selectedOrder.zipCode || 'Não informado'}</p>
                </div>
              </div>
            </div>

            {/* ITENS DO PEDIDO */}
            <div className="mb-5">
              <span
                className="text-xs font-bold uppercase tracking-wider block mb-2.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Grade de Camisas ({selectedOrder.totalQuantity} peças):
              </span>
              <div
                className="overflow-x-auto rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-crisp)',
                }}
              >
                <table className="w-full text-left text-xs">
                  <thead
                    className="uppercase text-[10px] font-mono font-bold border-b"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <tr>
                      <th className="py-2.5 px-3">Camisa</th>
                      <th className="py-2.5 px-2 text-center">Tam</th>
                      <th className="py-2.5 px-2 text-center">Qtd</th>
                      <th className="py-2.5 px-3 text-right">Unitário</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody
                    className="divide-y"
                    style={{ borderColor: 'var(--border-crisp)' }}
                  >
                    {(selectedOrder.items || []).map((item: any, idx: number) => {
                      const preSaleInfo = getProductPreSaleInfo(item.product);
                      const itemGallery = getProductGalleryImages(item.product);
                      const itemImg = item.product?.imageUrl || itemGallery[0] || '';

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-[var(--bg-studio)] transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              {itemImg ? (
                                <div className="w-10 h-10 rounded-lg bg-[var(--bg-studio)] border border-[var(--border-crisp)] overflow-hidden shrink-0 flex items-center justify-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={itemImg}
                                    alt={item.product?.name || 'Camisa'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-[var(--bg-studio)] border border-[var(--border-crisp)] flex items-center justify-center text-zinc-500 shrink-0">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <strong style={{ color: 'var(--text-primary)' }}>
                                    {item.product?.name || 'Camisa de Futebol'}
                                  </strong>
                                  {preSaleInfo.isPreSale && (
                                    <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                                      ⏳ Pré-Venda
                                    </span>
                                  )}
                                </div>
                                {item.customName && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-300 font-mono block mt-0.5">
                                    Personalizada: {item.customName} #{item.customNumber || 'S/N'} (+R$ 15,00)
                                  </span>
                                )}
                              </div>
                              {itemImg && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyProductItemImage(itemImg, idx)}
                                  disabled={copyingItemPhotoIdx === idx}
                                  className="p-1.5 rounded-lg border border-[var(--border-crisp)] hover:border-zinc-500 bg-[var(--bg-studio)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[10px] tactile shrink-0"
                                  title="Copiar foto desta camisa para a área de transferência"
                                >
                                  {copyingItemPhotoIdx === idx ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : copiedItemPhotoIdx === idx ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td
                            className="py-2.5 px-2 text-center font-bold font-mono"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {item.size}
                          </td>
                          <td
                            className="py-2.5 px-2 text-center font-bold font-mono"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.quantity}
                          </td>
                          <td
                            className="py-2.5 px-3 text-right font-mono"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {formatCurrency(item.unitPriceApplied)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.totalItemPrice)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* RESUMO DE VALORES */}
              <div
                className="p-3.5 rounded-xl border mt-3 text-xs space-y-1.5"
                style={{
                  backgroundColor: 'var(--bg-studio)',
                  borderColor: 'var(--border-crisp)',
                }}
              >
                <div
                  className="flex justify-between"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span>Subtotal de Camisas:</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(selectedOrder.subtotal)}
                  </span>
                </div>
                <div
                  className="flex justify-between"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span>Frete ({selectedOrder.shippingService || 'Melhor Envio'}):</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedOrder.shippingCost || 0)}
                  </span>
                </div>
                <div
                  className="flex justify-between font-black text-sm pt-2 border-t"
                  style={{
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>Total Final:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedOrder.finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* SEÇÃO RELATÓRIO DO PEDIDO PARA WHATSAPP */}
            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-studio)',
                borderColor: 'var(--border-crisp)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Relatório para Envio via WhatsApp
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Mensagem pronta com status e dados
                </span>
              </div>

              <div
                className="border rounded-xl p-3 text-[11px] font-mono max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-crisp)',
                  color: 'var(--text-secondary)',
                }}
              >
                {buildOrderWhatsAppReport(selectedOrder)}
              </div>

              <div
                className="flex flex-col sm:flex-row flex-wrap items-center justify-end gap-2 mt-3 pt-3 border-t"
                style={{ borderColor: 'var(--border-crisp)' }}
              >
                <button
                  type="button"
                  onClick={() => handleCopyOrderCardImage(selectedOrder, 'modal-order-card')}
                  disabled={copyingOrderImageId === selectedOrder.id}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 tactile"
                  title="Copiar imagem oficial com fotos das camisas para a área de transferência"
                >
                  {copyingOrderImageId === selectedOrder.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      <span>Gerando Imagem...</span>
                    </>
                  ) : copiedOrderImageId === 'modal-order-card' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Imagem Copiada (Ctrl+V)!</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Copiar Imagem do Pedido</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadOrderCardImage(selectedOrder)}
                  disabled={copyingOrderImageId === selectedOrder.id}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-surface)] hover:bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold flex items-center justify-center gap-1.5 tactile"
                  title="Baixar imagem oficial em PNG"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const report = buildOrderWhatsAppReport(selectedOrder);
                    copyToClipboard(report, `modal-order-${selectedOrder.id}`);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-surface)] hover:bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold flex items-center justify-center gap-1.5 tactile"
                >
                  {copiedKey === `modal-order-${selectedOrder.id}` ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
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
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm tactile"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar para WhatsApp do Cliente</span>
                  </a>
                )}
              </div>
            </div>

            <div
              className="flex justify-end pt-4 mt-5 border-t"
              style={{ borderColor: 'var(--border-crisp)' }}
            >
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-studio)] hover:bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] tactile"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RELATÓRIO GERAL DE PEDIDOS (WHATSAPP) */}
      {isGeneralReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="border rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-8"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-crisp)',
              color: 'var(--text-primary)',
            }}
          >
            <button
              onClick={() => setIsGeneralReportModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] tactile"
              aria-label="Fechar modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className="text-lg font-black tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Relatório Geral para WhatsApp
                </h3>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Resumo de faturamento, peças e contagem por status para compartilhar.
                </p>
              </div>
            </div>

            <div
              className="border rounded-xl p-4 my-4 font-mono text-xs max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner"
              style={{
                backgroundColor: 'var(--bg-studio)',
                borderColor: 'var(--border-crisp)',
                color: 'var(--text-secondary)',
              }}
            >
              {buildGeneralOrdersReport(orders)}
            </div>

            <div
              className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t"
              style={{ borderColor: 'var(--border-crisp)' }}
            >
              <button
                type="button"
                onClick={() => setIsGeneralReportModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-studio)] hover:bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] tactile"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => {
                  const report = buildGeneralOrdersReport(orders);
                  copyToClipboard(report, 'general-report');
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[var(--border-crisp)] bg-[var(--bg-surface)] hover:bg-[var(--bg-studio)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold flex items-center justify-center gap-1.5 tactile"
              >
                {copiedKey === 'general-report' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Relatório</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(buildGeneralOrdersReport(orders))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm tactile"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Abrir no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

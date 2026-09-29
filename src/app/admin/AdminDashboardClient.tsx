'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PromotionalBatch, WholesaleTier } from '@/lib/types';

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
    const isKids =
      p.type === 'INFANTIL' ||
      p.league?.toLowerCase().includes('infantil') ||
      p.name?.toLowerCase().includes('infantil');
    const standardSizes = isKids
      ? ['16', '18', '20', '22', '24', '26', '28']
      : ['P', 'M', 'G', 'GG', 'XG', '3XL', '4XL'];
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
          isActive: batch.isActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBatch(data);
        setRemainingQuotaInput(String(data.remainingQuota));
        setTotalQuotaInput(String(data.totalQuota));
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
              <span className="text-2xl sm:text-3xl font-black text-white">{initialOrders.length}</span>
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
            Pedidos Recentes ({initialOrders.length})
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
                          <div className="text-sm font-extrabold">{p.name}</div>
                          <span className="text-[11px] font-normal text-zinc-400">
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
                            {p.variants?.map((v: any) => (
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
                            ))}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    Mínimo de Peças p/ Frete Grátis
                  </label>
                  <input
                    type="number"
                    value={minPiecesInput}
                    onChange={(e) => setMinPiecesInput(e.target.value)}
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
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl overflow-hidden">
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4 pb-4 border-b border-zinc-800">
              <Layers className="w-6 h-6 text-emerald-400" />
              Pedidos Registrados no Banco Neon
            </h2>

            {initialOrders.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                Nenhum pedido registrado até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4">Pedido #</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-3">WhatsApp</th>
                      <th className="py-3 px-3">Qtd Peças</th>
                      <th className="py-3 px-3">Total</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {initialOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {order.customerName}
                          <span className="text-[10px] text-zinc-400 block font-normal">{order.city} - {order.state}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-300">
                          {order.phone}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">
                          {order.totalQuantity} peças
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-white">
                          {formatCurrency(order.finalTotal)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
    </div>
  );
}

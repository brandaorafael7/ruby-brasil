'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PromotionalBatch, WholesaleTier } from '@/lib/types';

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
    if (confirm('Deseja resetar a cota do lote para 6.000 camisas disponíveis?')) {
      handleUpdateBatch(6000, 6000);
    }
  };

  const totalSold = batch ? batch.totalQuota - batch.remainingQuota : 0;
  const percentUsed = batch ? ((totalSold / batch.totalQuota) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Voltar para a Loja"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <Settings className="w-7 h-7 text-emerald-400" />
                Painel Administrativo Ruby Brasil
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 ml-8">
              Gestão de campanhas, lote promocional de 6.000 peças, faixas de preços de atacado e estoque físico.
            </p>
          </div>

          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Ver Loja Virtual
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Lote Total Fornecedor</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {batch?.totalQuota.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-zinc-400">peças</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Teto garantido pelo contrato</span>
          </div>

          <div className="bg-gradient-to-br from-emerald-950/80 to-zinc-900 border border-emerald-500/40 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Restantes no Lote Ativo
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">
                {batch?.remainingQuota.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-zinc-300">peças</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-emerald-400 h-full rounded-full"
                style={{ width: `${batch ? (batch.remainingQuota / batch.totalQuota) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Peças Bonificadas</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {totalSold.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-zinc-400">({percentUsed}%)</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Consumidas com Frete Grátis</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Pedidos Registrados</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {initialOrders.length}
              </span>
              <span className="text-xs text-emerald-400 font-bold">pedidos</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Histórico do banco de dados</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Controle Manual da Cota do Fornecedor ({batch?.code})
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Altere a contagem regressiva em tempo real. Cada venda confirmada desconta automaticamente deste saldo.
              </p>
            </div>

            <button
              onClick={handleResetTo6000}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-amber-600/30 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resetar para 6.000 Camisas
            </button>
          </div>

          {batchSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2">
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
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
            <button
              onClick={() => handleUpdateBatch()}
              disabled={isUpdatingBatch}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all"
            >
              <Save className="w-4 h-4" />
              {isUpdatingBatch ? 'Salvando...' : 'Salvar Alterações do Lote'}
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Tabela Vigente de Faixas de Preço de Atacado
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {initialTiers.map((tier, idx) => (
              <div
                key={tier.id || idx}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="font-bold uppercase tracking-wider">Faixa {idx + 1}</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px]">
                      {tier.minQuantity} a {tier.maxQuantity || '∞'} peças
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-2">
                    {formatCurrency(tier.unitPrice)}
                    <span className="text-xs font-normal text-zinc-400 ml-1">/ unidade</span>
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                Catálogo de Camisas e Estoque por Tamanho
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Camisa / Clube</th>
                  <th className="py-3 px-3">Liga / Tipo</th>
                  <th className="py-3 px-3">Varejo (Cheio)</th>
                  <th className="py-3 px-3">Grade P/M/G/GG</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {initialProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {p.name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-300 mr-1">
                        {p.league}
                      </span>
                      <span className="text-zinc-400 text-[10px]">{p.type}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {formatCurrency(p.retailPrice)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        {p.variants?.map((v: any) => (
                          <span
                            key={v.id}
                            className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-300"
                          >
                            {v.size}: <strong className="text-white">{v.stockQuantity}</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Flame,
  Truck,
  Sparkles,
  ShieldCheck,
  Star,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Zap,
  Award,
  Users,
  ShoppingCart,
  CheckCircle2,
  HelpCircle,
  Clock,
  Phone,
  Layers,
} from 'lucide-react';
import { Product } from '@/lib/types';
import ProductCard from './ProductCard';

interface Props {
  initialProducts: Product[];
}

const CATEGORIES = [
  'Todas as Categorias',
  'Infantil',
  'Brasileirão',
  'Premier League',
  'La Liga',
  'Champions League',
  'Seleções',
  'Retrô',
  'Feminina',
];

const FAQS = [
  {
    question: 'Qual o valor unitário das camisas no varejo e no atacado?',
    answer:
      'No varejo, o valor unitário é de R$ 60,00 por camisa. Para pedidos no atacado a partir de 50 camisas, o valor cai automaticamente para apenas R$ 55,00 por unidade!',
  },
  {
    question: 'Como funciona o cálculo do frete?',
    answer:
      'Para pedidos com menos de 10 camisas, o frete é fixado em apenas R$ 30,00 para qualquer lugar do Brasil. Já para pedidos com 10 camisas ou mais, o FRETE É 100% GRÁTIS!',
  },
  {
    question: 'Posso mesclar times, modelos e tamanhos diferentes no mesmo pedido?',
    answer:
      'Sim, com certeza! Você pode misturar qualquer clube do Brasileirão, times europeus, seleções e edições retrô em qualquer tamanho (P, M, G, GG, XG) para atingir as metas de frete grátis (10 un) ou atacado (50 un).',
  },
  {
    question: 'Qual é o padrão de qualidade das camisas?',
    answer:
      'Trabalhamos exclusivamente com o padrão Tailandês 1:1, a melhor qualidade do mercado internacional. São camisas com tecido tecnológico Dri-Fit/AEROREADY, escudos bordados de alta definição, etiquetas internas e externas oficiais e saquinho com fecho zip da marca.',
  },
  {
    question: 'É possível personalizar as camisas com nome e número?',
    answer:
      'Sim! É possível solicitar personalização com qualquer nome e número oficial pelo valor adicional de apenas R$ 15,00 por camisa.',
  },
  {
    question: 'Como finalizo meu pedido e recebo o rastreamento?',
    answer:
      'Você escolhe as camisas aqui no site, e ao clicar em "Finalizar no WhatsApp", o sistema gera a lista completa e formatada direto no WhatsApp oficial de atendimento (79) 98854-2410 com o João Felipe. Enviamos foto do pedido embalado e o código de rastreamento dos Correios/transportadora.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Marcos Vinícius',
    role: 'Revendedor em Salvador - BA',
    comment:
      'Peguei 50 camisas para revender na minha cidade pelo atacado a R$ 55. A qualidade Tailandesa 1:1 é surreal de perfeita, vendi todas em menos de 10 dias. Já montei meu segundo pedido!',
    rating: 5,
    tag: 'Pedido Atacado (50 un)',
  },
  {
    name: 'Rodrigo Alencar',
    role: 'Cliente em Belo Horizonte - MG',
    comment:
      'Juntei com o pessoal da pelada e pedimos 14 camisas para pegar o frete grátis. Chegou tudo certinho, tecidos impecáveis com todos os detalhes e etiquetas. Melhor fornecedor do Brasil!',
    rating: 5,
    tag: 'Pedido Coletivo (14 un)',
  },
  {
    name: 'Matheus Fontes',
    role: 'Cliente em Aracaju - SE',
    comment:
      'Atendimento no WhatsApp do João Felipe é nota 10. Tirou minhas dúvidas de tamanho, confirmou o pedido super rápido e me mandou o código de rastreio. Recomendo muito!',
    rating: 5,
    tag: 'Cliente Satisfeito',
  },
];

export default function CatalogView({ initialProducts }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas as Categorias');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const kidsProducts = useMemo(() => {
    return initialProducts.filter(
      (p) =>
        p.type === 'INFANTIL' ||
        p.league?.toLowerCase().includes('infantil') ||
        p.name?.toLowerCase().includes('infantil') ||
        p.name?.toLowerCase().includes('kids') ||
        p.description?.toLowerCase().includes('infantil')
    );
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.club && product.club.toLowerCase().includes(query)) ||
        (product.league && product.league.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === 'Todas as Categorias' ||
        (selectedCategory === 'Infantil' && (
          product.type === 'INFANTIL' ||
          product.league.toLowerCase().includes('infantil') ||
          product.name.toLowerCase().includes('infantil') ||
          product.name.toLowerCase().includes('kids') ||
          product.description?.toLowerCase().includes('infantil')
        )) ||
        product.league.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        product.type.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === 'Feminina' && product.type === 'FEMININA') ||
        (selectedCategory === 'Retrô' && (product.type === 'RETRO' || product.league.toLowerCase().includes('retrô')));

      return matchesSearch && matchesCategory;
    });
  }, [initialProducts, searchTerm, selectedCategory]);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      
      {/* 1. HERO SECTION (ESTILO MOBIRISE MODERNO) */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-20 border-b border-zinc-900 bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950">
        
        {/* Glow de fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-rose-600/10 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            
            {/* Badge de Destaque */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black tracking-wider uppercase mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fornecedor Oficial • Camisas Tailandesas 1:1</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] uppercase">
              Camisas de Futebol <br />
              <span className="bg-gradient-to-r from-rose-500 via-amber-400 to-rose-400 bg-clip-text text-transparent">
                Direto de Fábrica
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto font-medium">
              Padrão oficial Tailandês 1:1 com tecido tecnológico Dri-Fit, bordados impecáveis e etiquetas autênticas. Compre no varejo ou lucre alto revendendo no atacado.
            </p>

            {/* FAIXA DE CONDIÇÕES COMERCIAIS */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl max-w-2xl mx-auto">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <Truck className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-left text-xs">
                  <span className="text-zinc-400 block text-[10px]">Menos de 10 camisas</span>
                  <strong className="text-white font-black">Frete R$ 30 Fixo</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/80 border border-emerald-500/30 shadow-sm shadow-emerald-950/30">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-left text-xs">
                  <span className="text-zinc-400 block text-[10px]">A partir de 10 camisas</span>
                  <strong className="text-emerald-400 font-black">Frete 100% Grátis</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/80 border border-rose-500/30 shadow-sm shadow-rose-950/30">
                <Flame className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="text-left text-xs">
                  <span className="text-zinc-400 block text-[10px]">Atacado 50+ camisas</span>
                  <strong className="text-rose-300 font-black">R$ 55,00 / un</strong>
                </div>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO HERO */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <a
                href="#catalogo"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.02]"
              >
                <ShoppingCart className="w-5 h-5" />
                Explorar Catálogo de Peças
              </a>
              <a
                href="https://wa.me/5579988542410?text=Ol%C3%A1%20Jo%C3%A3o%20Felipe%2C%20vim%20pelo%20site%20da%20Ruby%20Brasil%20e%20gostaria%20de%20fazer%20um%20pedido%21"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all hover:border-zinc-500"
              >
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                WhatsApp: (79) 98854-2410
              </a>
            </div>

            {/* MINI BADGES DE CONFIANÇA */}
            <div className="mt-10 pt-8 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="block text-xl sm:text-2xl font-black text-white">+12.000</span>
                <span className="text-[11px] text-zinc-400 font-medium">Camisas Entregues</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-black text-rose-400">1:1 Oficial</span>
                <span className="text-[11px] text-zinc-400 font-medium">Padrão Tailandês</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-black text-emerald-400">4.9 ★★★★★</span>
                <span className="text-[11px] text-zinc-400 font-medium">Avaliação dos Clientes</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-black text-amber-400">100% Seguro</span>
                <span className="text-[11px] text-zinc-400 font-medium">Envio com Rastreio</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. BARRA DE BENEFÍCIOS (MOBIRISE FEATURES BLOCK) */}
      <section className="py-12 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-rose-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white">Frete R$ 30 ou Grátis</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Menos de 10 camisas: frete fixo de R$ 30. A partir de 10 camisas o frete é 100% por nossa conta!
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white">Atacado a R$ 55,00</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                A partir de 50 camisas o valor unitário cai para R$ 55,00 com margem excelente de revenda.
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white">Padrão Tailandês 1:1</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Tecido tecnológico respirável, escudos e bordados precisos e todas as etiquetas oficiais.
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white">Atendimento Direto</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Tire dúvidas, personalize peças e feche seu pedido direto no WhatsApp com o João Felipe.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. SEÇÃO PRINCIPAL DE CATÁLOGO E BUSCA */}
      <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex-1 w-full">
        
        {/* Cabeçalho do Catálogo */}
        <div className="mb-6">
          <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 block mb-1">
            Pronta Entrega • Despacho Rápido
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Catálogo Completo de Peças
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Escolha seus modelos, selecione os tamanhos desejados e adicione ao carrinho.
          </p>
        </div>

        {/* BARRA DE CATEGORIAS ACIMA */}
        <div className="mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 border ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/60 scale-[1.02]'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* LUPA E BARRA DE BUSCA POR NOME */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xl mb-8">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-rose-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar camisa por nome, clube, seleção ou edição..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-12 pr-4 py-3 sm:py-3.5 text-xs sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white bg-zinc-800 px-2 py-1 rounded-md"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800/80">
            <span>
              Mostrando <strong className="text-white">{filteredProducts.length}</strong> peças encontradas
            </span>
            <span className="hidden sm:inline">
              Preço Base: <strong className="text-rose-400">R$ 60,00</strong> • 50+ peças: <strong className="text-emerald-400">R$ 55,00</strong>
            </span>
          </div>
        </div>

        {/* LISTAGEM DE PRODUTOS */}
        {filteredProducts.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
            <p className="font-bold text-lg text-zinc-300">Nenhuma camisa encontrada</p>
            <p className="text-xs text-zinc-500 mt-1">
              Tente buscar por outro termo ou selecione &ldquo;Todas as Categorias&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Todas as Categorias');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </section>

      {/* SEÇÃO EXCLUSIVA: CAMISAS & KITS INFANTIS */}
      <section id="infantil" className="py-16 bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950 border-t border-b border-zinc-900 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-rose-600/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider uppercase mb-3 shadow-sm">
                <span>👶 Linha Infantil & Juvenil</span>
                <span className="text-zinc-500">•</span>
                <span className="text-white">Kits Completos (Camisa + Calção)</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Camisas & Kits Infantis 1:1
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                Vista os pequenos campeões com o mesmo padrão oficial Tailandês 1:1 dos adultos. Nossos kits infantis acompanham camisa e calção oficial, disponíveis nos tamanhos 16 ao 28 (16, 18, 20, 22, 24, 26, 28).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Infantil');
                  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02]"
              >
                <span>Filtrar no Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://wa.me/5579988542410?text=Ol%C3%A1%20Jo%C3%A3o%20Felipe%2C%20gostaria%20de%20consultar%20modelos%20e%20tamanhos%20de%20camisas%20e%20kits%20infantis%21"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Pedir no Zap</span>
              </a>
            </div>
          </div>

          {/* CARDS DE DESTAQUE DA LINHA INFANTIL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-black text-white block">Kit Completo Oficial</strong>
                <span className="text-[11px] text-zinc-400">Camisa oficial + calção com elástico regulador</span>
              </div>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-black text-white block">Tamanhos Kids: 16 ao 28</strong>
                <span className="text-[11px] text-zinc-400">Grade padrão: 16, 18, 20, 22, 24, 26 e 28</span>
              </div>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-black text-white block">Frete Grátis acima de 10 un</strong>
                <span className="text-[11px] text-zinc-400">Entra na contagem geral de frete e atacado R$ 55</span>
              </div>
            </div>
          </div>

          {/* VITRINE DE PRODUTOS INFANTIS */}
          {kidsProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {kidsProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center max-w-3xl mx-auto shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <PackageCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white">
                Kits Infantis dos Maiores Clubes do Mundo
              </h3>
              <p className="text-xs text-zinc-300 mt-2 max-w-lg mx-auto leading-relaxed">
                Temos kits infantis (camisa + short) de times como Flamengo, Real Madrid, Brasil, Barcelona, Corinthians, Palmeiras, PSG e muito mais. Consulte os modelos e tamanhos disponíveis para envio imediato!
              </p>
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://wa.me/5579988542410?text=Ol%C3%A1%20Jo%C3%A3o%20Felipe%2C%20quais%20modelos%20e%20tamanhos%20de%20kits%20infantis%20voc%C3%AA%20tem%20dispon%C3%ADveis%3F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Consultar Modelos Infantis no WhatsApp: (79) 98854-2410</span>
                </a>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 4. COMO FUNCIONA O PEDIDO (MOBIRISE STEP-BY-STEP) */}
      <section className="py-14 bg-zinc-900/40 border-t border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 block mb-1">
              Passo a Passo Simples
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Como Funciona a Sua Compra
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Processo 100% transparente com confirmação e suporte humano no WhatsApp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 relative group hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-600/10 border border-rose-600/30 flex items-center justify-center text-rose-400 font-black text-lg mb-4">
                01
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">
                1. Monte seu Carrinho
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Navegue pelas camisas nacionais, europeias e retrôs. Selecione os tamanhos (P ao XG) e adicione tudo ao seu carrinho com total flexibilidade.
              </p>
            </div>

            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 relative group hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg mb-4">
                02
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">
                2. Descontos Automáticos
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ao atingir 10 peças, o frete vira 100% grátis! Com 50 peças ou mais, o preço de cada camisa cai automaticamente para R$ 55,00 no atacado.
              </p>
            </div>

            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 relative group hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg mb-4">
                03
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">
                3. Finalize no WhatsApp
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Clique em &ldquo;Finalizar no WhatsApp&rdquo; para enviar seu pedido pronto para o João Felipe no (79) 98854-2410. Confirmamos tudo e despachamos com código de rastreio!
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. DIFERENCIAIS DA QUALIDADE TAILANDESA 1:1 (MOBIRISE QUALITY BLOCK) */}
      <section className="py-14 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 block mb-1">
              Garantia de Qualidade
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Por que a Ruby Brasil é Referência?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Não aceite réplicas de baixa qualidade. Nossas peças seguem o rigoroso padrão Tailandês 1:1.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <ShieldCheck className="w-8 h-8 text-rose-500 mb-3" />
              <h4 className="text-sm font-extrabold text-white">Tecido Dri-Fit Tecnológico</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Tecido 100% respirável com microperfurações que proporcionam caimento perfeito e secagem rápida.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <Award className="w-8 h-8 text-amber-400 mb-3" />
              <h4 className="text-sm font-extrabold text-white">Escudos e Bordados Oficiais</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Bordados de alta definição e termocolantes aplicados com precisão cirúrgica sem desbotar.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <PackageCheck className="w-8 h-8 text-emerald-400 mb-3" />
              <h4 className="text-sm font-extrabold text-white">Etiquetas & Embalagem Lacrada</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Todas as etiquetas internas e externas de autenticidade, em saquinhos plásticos lacrados com zip.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <Zap className="w-8 h-8 text-blue-400 mb-3" />
              <h4 className="text-sm font-extrabold text-white">Envio Ágil com Rastreamento</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Postagem rápida para todo o território nacional com código de rastreio direto no seu WhatsApp.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. DEPOIMENTOS (MOBIRISE TESTIMONIALS BLOCK) */}
      <section className="py-14 bg-zinc-900/30 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 block mb-1">
              Prova Social
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              O que Dizem Nossos Clientes e Revendedores
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Mais de 12.000 camisas entregues com nota 4.9/5 em satisfação
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between shadow-lg shadow-black/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {t.tag}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 italic leading-relaxed">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-900">
                  <span className="font-extrabold text-sm text-white block">{t.name}</span>
                  <span className="text-[11px] text-zinc-400">{t.role}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. PERGUNTAS FREQUENTES (MOBIRISE ACCORDION FAQ BLOCK) */}
      <section className="py-14 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 block mb-1">
              Dúvidas Comuns
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Perguntas Frequentes (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Tudo o que você precisa saber antes de fazer seu pedido
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 text-sm sm:text-base font-bold text-white hover:text-rose-400 transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-rose-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 8. BANNER FINAL CALL-TO-ACTION (MOBIRISE CTA BLOCK) */}
      <section className="py-16 bg-gradient-to-t from-zinc-950 via-zinc-900 to-zinc-950 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Lote de Fábrica Ativo com Condições Promocionais
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Pronto para Montar seu Pedido ou Revender?
          </h2>
          <p className="mt-3 text-xs sm:text-base text-zinc-300 max-w-xl mx-auto">
            Aproveite o preço especial de R$ 60 no varejo ou R$ 55 no atacado (50+ peças) com frete grátis a partir de 10 camisas!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#catalogo"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.02]"
            >
              <ShoppingCart className="w-5 h-5" />
              Escolher Peças no Catálogo
            </a>
            <a
              href="https://wa.me/5579988542410?text=Ol%C3%A1%20Jo%C3%A3o%20Felipe%2C%20gostaria%20de%20tirar%20algumas%20d%C3%BAvidas%20antes%20de%20fechar%20meu%20pedido%21"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-5 h-5" />
              Falar com João Felipe: (79) 98854-2410
            </a>
          </div>

        </div>
      </section>

    </div>
  );
}

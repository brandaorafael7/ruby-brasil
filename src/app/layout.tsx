import type { Metadata } from 'next';
import './globals.css';
import PromotionalTopBar from '@/components/PromotionalTopBar';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import FloatingCartBar from '@/components/FloatingCartBar';

export const metadata: Metadata = {
  title: 'RUBY BRASIL | Camisas de Futebol Direto de Fábrica B2B & Varejo',
  description:
    'Plataforma oficial Ruby Brasil de distribuição de camisas de futebol com modelo híbrido de Atacado B2B e Varejo. Frete Grátis a partir de 10 peças no Lote Promocional de 6.000 camisas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-black">
        <PromotionalTopBar />
        <Navbar />
        <div className="flex-1">{children}</div>
        <CartDrawer />
        <FloatingCartBar />
        <footer className="bg-zinc-950 border-t border-zinc-900 pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-xs text-zinc-400">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            
            {/* Coluna 1: Marca */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-md">
                  <span className="font-black text-sm text-white">💎</span>
                </div>
                <span className="text-lg font-black text-white tracking-tight">
                  RUBY <span className="text-rose-400">BRASIL</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                Distribuição oficial de camisas de futebol tailandesas 1:1 direto de fábrica. Qualidade impecável para uso pessoal no varejo e alto lucro para lojistas no atacado.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Atendimento Ativo • Despachos Rápidos para Todo o Brasil
              </div>
            </div>

            {/* Coluna 2: Regras Comerciais */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-white tracking-wider">
                Condições Comerciais
              </h4>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li>• Varejo: <strong className="text-white">R$ 60,00</strong> / unidade</li>
                <li>• Atacado (50+ un): <strong className="text-rose-300">R$ 55,00</strong> / unidade</li>
                <li>• Menos de 10 camisas: <strong className="text-white">Frete R$ 30 fixo</strong></li>
                <li>• 10+ camisas: <strong className="text-emerald-400">Frete 100% Grátis</strong></li>
                <li>• Personalização: <strong className="text-white">+ R$ 15,00</strong> / peça</li>
              </ul>
            </div>

            {/* Coluna 3: Atendimento Oficial */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-white tracking-wider">
                Atendimento & Suporte
              </h4>
              <p className="text-xs text-zinc-400">
                Finalize seu pedido diretamente pelo carrinho ou checkout para suporte exclusivo da nossa equipe:
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 font-bold text-xs">
                <span>💬 Atendimento Direto no Carrinho</span>
              </div>
              <p className="text-[11px] text-zinc-500 pt-1">
                Segunda a Sábado • Confirmação de pedidos em tempo real
              </p>
            </div>

          </div>

          <div className="max-w-7xl mx-auto pt-6 border-t border-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
            <p>© {new Date().getFullYear()} RUBY BRASIL. Todos os direitos reservados.</p>
            <p>Camisas Tailandesas 1:1 com Padrão Oficial de Jogo e Torcedor.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

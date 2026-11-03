import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import CartDrawer from '@/components/cart/CartDrawer';
import FloatingCartBar from '@/components/cart/FloatingCartBar';

export const metadata: Metadata = {
  title: 'RUBY BRASIL | Football Archive & Atelier 1:1 — Atacado & Varejo',
  description:
    'Mantos oficiais, lançamentos em pré-venda e arquivo histórico retrô com padrão Tailandês 1:1 direto de fábrica. Envio de Campinas/SP para todo o Brasil via Melhor Envio.',
  icons: {
    icon: '/ruby-brasil-icon.png',
    shortcut: '/ruby-brasil-icon.png',
    apple: '/ruby-brasil-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased selection:bg-rose-600 selection:text-white">
        <Navbar />
        <div className="flex-1">{children}</div>
        <CartDrawer />
        <FloatingCartBar />
        <footer
          className="border-t pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-xs"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
            color: 'var(--text-secondary)',
          }}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Coluna 1: Marca + Ícone Camisa-Diamante */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border flex items-center justify-center p-1 overflow-hidden"
                  style={{
                    borderColor: 'var(--border-crisp)',
                    backgroundColor: 'var(--bg-studio)',
                  }}
                >
                  <img
                    src="/ruby-brasil-icon.png"
                    alt="Ícone Oficial Ruby Brasil"
                    className="w-full h-full object-contain ruby-icon-adaptive"
                  />
                </div>
                <div>
                  <span
                    className="font-black text-base tracking-tighter block leading-none"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    RUBY BRASIL
                  </span>
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest block mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    FOOTBALL ARCHIVE & ATELIER 1:1
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed max-w-md" style={{ color: 'var(--text-secondary)' }}>
                Distribuição oficial de camisas de futebol tailandesas 1:1 direto de fábrica. Bordados de alta definição, versões Jogador e Torcedor, arquivo retrô e pré-venda exclusiva.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                Operação Campinas/SP • Despachos Rápidos para Todo o Brasil
              </div>
            </div>

            {/* Coluna 2: Regras Comerciais */}
            <div className="space-y-2">
              <h4
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Condições Comerciais
              </h4>
              <ul className="space-y-1.5 text-xs">
                <li>
                  • Preço Base:{' '}
                  <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>
                    R$ 60,00
                  </strong>{' '}
                  / un
                </li>
                <li>
                  • Qualidade:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>Padrão Tailandês 1:1</strong>
                </li>
                <li>
                  • Envio:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    Melhor Envio Oficial
                  </strong>
                </li>
                <li>
                  • Transportadoras:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    Correios (PAC/SEDEX) & Loggi
                  </strong>
                </li>
                <li>
                  • Personalização Oficial:{' '}
                  <strong className="font-mono text-rose-600">+ R$ 15,00</strong> / peça
                </li>
              </ul>
            </div>

            {/* Coluna 3: Atendimento Oficial */}
            <div className="space-y-2">
              <h4
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Atendimento & Suporte
              </h4>
              <p className="text-xs leading-relaxed">
                Finalize seu pedido diretamente pela sacola para confirmação imediata de estoque, reserva de pré-venda e código de rastreio:
              </p>
              <div
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-emerald-600 dark:text-emerald-400 font-bold text-xs"
                style={{
                  backgroundColor: 'var(--bg-studio)',
                  borderColor: 'var(--border-crisp)',
                }}
              >
                <span>💬 Fechamento Direto via WhatsApp</span>
              </div>
              <p className="text-[11px] pt-1" style={{ color: 'var(--text-muted)' }}>
                Segunda a Sábado • Confirmação de pedidos em tempo real
              </p>
            </div>
          </div>

          <div
            className="max-w-7xl mx-auto pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]"
            style={{ borderColor: 'var(--border-crisp)', color: 'var(--text-muted)' }}
          >
            <p>© {new Date().getFullYear()} RUBY BRASIL. Todos os direitos reservados.</p>
            <p className="font-mono">PADRÃO TAILANDÊS 1:1 • JOGADOR • TORCEDOR • RETRÔ • KIDS</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

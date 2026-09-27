import type { Metadata } from 'next';
import './globals.css';
import PromotionalTopBar from '@/components/PromotionalTopBar';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';

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
        <footer className="bg-zinc-950 border-t border-zinc-900 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} RUBY BRASIL B2B & Varejo. Todos os direitos reservados.</p>
            <p className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              Servidor Operacional • Lote Promocional de Fábrica Ativo
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

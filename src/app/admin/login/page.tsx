'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('/api/admin/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setInfoMsg(`Código de 6 dígitos enviado para ${email}. Verifique a caixa de entrada e spam.`);
        setStep('otp');
        setResendCooldown(60);
      } else {
        setErrorMsg(data.error || 'Erro ao enviar código de acesso.');
      }
    } catch {
      setErrorMsg('Falha na comunicação com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setErrorMsg('O código precisa ter exatamente 6 dígitos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'Código incorreto ou expirado. Tente novamente.');
      }
    } catch {
      setErrorMsg('Falha ao validar sessão. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-zinc-100 font-sans selection:bg-rose-500 selection:text-white">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 border border-zinc-800 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 text-rose-500" />
          Voltar para a Loja
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10 my-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 mx-auto flex items-center justify-center shadow-2xl shadow-rose-950/70 mb-4 border border-rose-400/30">
            <span className="text-3xl">💎</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            RUBY <span className="text-rose-500">BRASIL</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-bold flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-rose-400" />
            Painel Administrativo Seguro
          </p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-medium flex items-center gap-2.5 shadow-inner">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-5 p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2.5 shadow-inner">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{infoMsg}</span>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  E-mail do Administrador
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="admin@rubybr.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-medium"
                  />
                </div>
                <span className="text-[11px] text-zinc-500 mt-2 block leading-relaxed">
                  Insira o seu e-mail cadastrado na lista restrita. Enviaremos um código temporário de 6 dígitos via Gmail SMTP.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full mt-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Enviando código via Gmail...
                  </>
                ) : (
                  <>
                    Enviar Código de Acesso
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Código de 6 Dígitos
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {email}
                  </span>
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-3 text-center text-2xl tracking-[0.4em] font-mono font-black text-white placeholder-zinc-700 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
                <span className="text-[11px] text-zinc-500 mt-2 block text-center">
                  ⏱️ O código expira em 15 minutos.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Validando acesso...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Confirmar e Entrar
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setErrorMsg('');
                  }}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Alterar e-mail
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={() => handleRequestOtp()}
                  className="text-rose-400 hover:text-rose-300 font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Acesso restrito para administradores autorizados Ruby Brasil (rubybr.com.br).
        </p>
      </div>
    </div>
  );
}

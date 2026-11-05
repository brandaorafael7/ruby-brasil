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
    // Sincroniza tema salvo pelo cliente
    const savedTheme = localStorage.getItem('ruby-theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-rose-500 selection:text-white"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold border px-3.5 py-2 rounded-xl tactile shadow-sm"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>Voltar para a Loja</span>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10 my-8">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl border flex items-center justify-center p-1.5 mx-auto mb-3.5 shadow-sm tactile"
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
          <div className="flex items-center justify-center gap-2">
            <h1
              className="text-2xl sm:text-3xl font-black tracking-tight uppercase"
              style={{ color: 'var(--text-primary)' }}
            >
              RUBY BRASIL
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              ADMIN
            </span>
          </div>
          <p
            className="text-[10px] font-mono uppercase tracking-widest mt-1 font-bold flex items-center justify-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <Lock className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Painel Administrativo Seguro
          </p>
        </div>

        <div
          className="border rounded-2xl p-6 sm:p-8 shadow-sm backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-crisp)',
          }}
        >
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-300 font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{infoMsg}</span>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  E-mail do Administrador
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 absolute left-3.5 top-3.5 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="admin@rubybr.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile font-medium"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <span
                  className="text-[11px] mt-2 block leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Insira o seu e-mail cadastrado na lista restrita. Enviaremos um código temporário de 6 dígitos via Gmail SMTP.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-zinc-950 dark:border-white shadow-sm tactile hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-current" />
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
                  <label
                    className="block text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Código de 6 Dígitos
                  </label>
                  <span
                    className="text-[11px] font-mono"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {email}
                  </span>
                </div>

                <div className="relative">
                  <KeyRound
                    className="w-4 h-4 absolute left-3.5 top-3.5 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-center text-2xl tracking-[0.4em] font-mono font-black border focus:outline-none focus:ring-2 focus:ring-rose-600 tactile"
                    style={{
                      backgroundColor: 'var(--bg-studio)',
                      borderColor: 'var(--border-crisp)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <span
                  className="text-[11px] mt-2 block text-center font-mono"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ⏱️ O código expira em 15 minutos.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-zinc-950 dark:border-white shadow-sm tactile hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-current" />
                    Validando acesso...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Confirmar e Entrar
                  </>
                )}
              </button>

              <div
                className="flex items-center justify-between pt-3 border-t text-xs"
                style={{ borderColor: 'var(--border-crisp)' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setErrorMsg('');
                  }}
                  className="hover:underline transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Alterar e-mail
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={() => handleRequestOtp()}
                  className="text-rose-600 dark:text-rose-400 font-bold hover:underline transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p
          className="text-center text-xs mt-6 font-mono"
          style={{ color: 'var(--text-muted)' }}
        >
          Acesso restrito para administradores autorizados Ruby Brasil (rubybr.com.br).
        </p>
      </div>
    </div>
  );
}

'use client';

import { authClient } from '@allotech/auth/client';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.error) {
        throw new Error(
          res.error.message || 'Identifiants invalides. Vérifiez votre email et mot de passe.',
        );
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Identifiants invalides. Vérifiez votre email et mot de passe.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Halo lumineux */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1B3A5C]/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#E07A3C]/20 blur-[130px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1B3A5C] to-[#E07A3C] flex items-center justify-center shadow-lg shadow-[#1B3A5C]/40">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Allo<span className="text-[#E07A3C]">Tech</span>
          </span>
        </div>

        <h1 className="text-center text-3xl font-extrabold tracking-tight text-white">
          Connexion Administrateur
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Accédez au cockpit de gestion des interventions de Douala
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-2xl border border-slate-800 shadow-2xl">
          {justRegistered && !error && (
            <div className="mb-6 rounded-xl bg-emerald-950/50 border border-emerald-800/80 p-4 flex items-start gap-3 text-emerald-200 text-sm">
              <CheckCircle2 className="w-5 h-5 text-[#2E8B57] flex-shrink-0 mt-0.5" />
              <span>
                Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.
              </span>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl bg-red-950/50 border border-red-800/80 p-4 flex items-start gap-3 text-red-200 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-[#C0392B] flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Email professionnel
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="admin@allotech.cm"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E07A3C] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                >
                  Mot de passe
                </label>
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-xs text-[#E07A3C] hover:text-[#e8905a] transition font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E07A3C] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label="Afficher ou masquer le mot de passe"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#1B3A5C] to-[#E07A3C] hover:opacity-95 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#E07A3C] focus:ring-offset-2 focus:ring-offset-slate-900 transition shadow-lg shadow-[#1B3A5C]/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              Nouveau sur la plateforme ?{' '}
              <Link
                href="/inscription"
                className="font-medium text-[#E07A3C] hover:text-[#e8905a] transition"
              >
                Créer un compte administrateur
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-[#E07A3C] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConnexionForm />
    </Suspense>
  );
}

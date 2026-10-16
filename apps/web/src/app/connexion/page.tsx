'use client';

import { AlloTechLogo } from '@/components/AlloTechLogo';
import { authClient } from '@allotech/auth/client';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function ConnexionForm() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Gestion du décompte de verrouillage
  useEffect(() => {
    if (!lockedUntil) return;

    const interval = setInterval(() => {
      const diff = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setLockedUntil(null);
        setRemainingSeconds(0);
        setAttempts(0);
        setError(null);
      } else {
        setRemainingSeconds(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lockedUntil) {
      setError(
        `Trop de tentatives échouées. Veuillez patienter encore ${remainingSeconds} seconde(s).`,
      );
      return;
    }

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
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (nextAttempts >= 5) {
          const lockTime = Date.now() + 60000;
          setLockedUntil(lockTime);
          setRemainingSeconds(60);
          throw new Error(
            'Compte temporairement bloqué pendant 60 secondes suite à 5 tentatives échouées consécutives.',
          );
        }

        throw new Error(
          `${res.error.message || 'Identifiants invalides.'} (Tentative ${nextAttempts}/5 - ${5 - nextAttempts} restante(s) avant verrouillage)`,
        );
      }

      // Réinitialisation en cas de succès et redirection garantie avec rechargement des cookies de session
      setAttempts(0);
      window.location.href = '/dashboard';
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
    <div className="min-h-screen bg-[#FAFAF8] text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Halos d'ambiance doux */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#B3DEE5]/30 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#FFA101]/15 blur-[130px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center mb-5">
          <Link href="/" className="flex items-center hover:opacity-90 transition">
            <AlloTechLogo size={46} showText={true} />
          </Link>
        </div>

        <h1 className="text-center text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
          Connexion Administrateur
        </h1>
        <p className="mt-2 text-center text-xs lg:text-sm text-slate-500 font-medium">
          Accédez au cockpit de gestion des interventions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50">
          {justRegistered && !error && (
            <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3 text-emerald-900 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.
              </span>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-red-900 text-xs font-bold">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {lockedUntil && remainingSeconds > 0 && (
            <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3 text-amber-900 text-xs font-bold">
              <Lock className="w-5 h-5 text-[#FFA101] shrink-0" />
              <span>
                Trop de tentatives. Réessayez dans{' '}
                <strong className="font-mono">{remainingSeconds}s</strong>.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Adresse email
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-[#FFA101] focus:ring-1 focus:ring-[#FFA101] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Mot de passe
                </label>
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-xs text-[#31525B] hover:text-[#FFA101] transition font-bold"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-[#FFA101] focus:ring-1 focus:ring-[#FFA101] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Afficher ou masquer le mot de passe"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || Boolean(lockedUntil && remainingSeconds > 0)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#31525B] hover:bg-[#233b41] active:scale-[0.99] transition shadow-md shadow-[#31525B]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs uppercase tracking-wider"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Accéder au cockpit</span>
                  <ArrowRight className="w-4 h-4 text-[#FFA101]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Nouveau sur la plateforme ?{' '}
              <Link
                href="/inscription"
                className="font-bold text-[#31525B] hover:text-[#FFA101] transition"
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
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center text-slate-900">
          <div className="w-8 h-8 border-2 border-[#FFA101] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConnexionForm />
    </Suspense>
  );
}

'use client';

import { AlloTechLogo } from '@/components/AlloTechLogo';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function MotDePasseOubliePage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ÉTAPE 1 : Demande de code OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'envoyer le code.");
      }

      setStep(2);
      setInfoMessage(
        'Un code de vérification à 6 chiffres a été envoyé dans votre boîte de réception.',
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue lors de l'envoi du code.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Renvoi d'un code OTP
  const handleResendOtp = async () => {
    setError(null);
    setInfoMessage(null);
    setResending(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Impossible de renvoyer le code.');
      }

      setInfoMessage('Un nouveau code à 6 chiffres a été envoyé.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du renvoi du code.');
    } finally {
      setResending(false);
    }
  };

  // ÉTAPE 2 : Validation du code OTP et changement du mot de passe
  const handleResetWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Veuillez renseigner le code de vérification à 6 chiffres.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Échec de la réinitialisation.');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Une erreur est survenue lors de la réinitialisation.',
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
          Réinitialisation du mot de passe
        </h1>
        <p className="mt-2 text-center text-xs lg:text-sm text-slate-500 font-medium">
          {step === 1
            ? 'Recevez un code de sécurité par email pour réinitialiser votre accès'
            : 'Saisissez le code reçu et définissez votre nouveau mot de passe'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50">
          {/* Messages d'erreur et d'information */}
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-red-900 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-6 rounded-2xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3 text-blue-900 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {success ? (
            /* SUCCÈS FINAL */
            <div className="text-center space-y-4 py-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-[#2E8B57]">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Mot de passe réinitialisé !</h2>
              <p className="text-sm text-slate-600">
                Votre mot de passe a été mis à jour avec succès. Vous pouvez dès à présent vous
                reconnecter avec vos nouveaux identifiants.
              </p>
              <div className="pt-4">
                <Link
                  href="/connexion"
                  className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl font-bold text-white bg-[#31525B] hover:bg-[#254148] transition shadow-lg shadow-[#31525B]/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span>Se connecter maintenant</span>
                </Link>
              </div>
            </div>
          ) : step === 1 ? (
            /* ÉTAPE 1 : Saisie Email & Envoi OTP */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Votre adresse email
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31525B] focus:border-transparent transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Un code de vérification à 6 chiffres vous sera envoyé par email.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#31525B] hover:bg-[#254148] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#FFA101] focus:ring-offset-2 transition shadow-lg shadow-[#31525B]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-[#FFA101]" />
                    <span>Envoyer le code de vérification</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ÉTAPE 2 : Saisie Code OTP & Nouveau Mot de Passe */
            <form onSubmit={handleResetWithOtp} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate max-w-[220px]">
                  Envoyé à : <strong className="text-slate-900">{email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-[#31525B] hover:text-[#FFA101] font-bold ml-2 transition"
                >
                  Modifier
                </button>
              </div>

              {/* Code OTP */}
              <div>
                <label
                  htmlFor="otp"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Code de sécurité (6 chiffres)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      setError(null);
                    }}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-lg font-mono tracking-widest text-center font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31525B] focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Nouveau Mot de passe */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Nouveau mot de passe (min. 8 car.)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31525B] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    aria-label="Afficher ou masquer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmer le Mot de passe */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31525B] focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#31525B] hover:bg-[#254148] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#FFA101] focus:ring-offset-2 transition shadow-lg shadow-[#31525B]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-[#FFA101]" />
                    <span>Valider et changer le mot de passe</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#31525B] transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${resending ? 'animate-spin text-[#FFA101]' : ''}`}
                  />
                  <span>Vous n'avez rien reçu ? Renvoyer un code</span>
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link
              href="/connexion"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#31525B] transition font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la connexion</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

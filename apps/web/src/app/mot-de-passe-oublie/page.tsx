'use client';

import { AlertCircle, ArrowLeft, CheckCircle2, Mail, Send, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Veuillez renseigner votre adresse email.');
      return;
    }

    setLoading(true);

    try {
      // Simulation / envoi réel selon configuration Resend
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue lors de l'envoi du lien.",
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
          Réinitialisation
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Recevez un lien sécurisé pour redéfinir votre mot de passe administrateur
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-2xl border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-6 rounded-xl bg-red-950/50 border border-red-800/80 p-4 flex items-start gap-3 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 text-[#C0392B] flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="text-center space-y-4 py-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-700/80 flex items-center justify-center mx-auto text-[#2E8B57]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-white">E-mail envoyé</h2>
              <p className="text-sm text-slate-300">
                Si un compte administrateur correspond à{' '}
                <strong className="text-white">{email}</strong>, un lien sécurisé de
                réinitialisation vous a été transmis.
              </p>
              <div className="pt-4">
                <Link
                  href="/connexion"
                  className="inline-flex items-center gap-2 text-sm text-[#E07A3C] hover:text-[#e8905a] transition font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retourner à la connexion</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Votre email professionnel
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#1B3A5C] to-[#E07A3C] hover:opacity-95 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#E07A3C] focus:ring-offset-2 focus:ring-offset-slate-900 transition shadow-lg shadow-[#1B3A5C]/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Envoyer les instructions</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-slate-800 text-center">
                <Link
                  href="/connexion"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour à la connexion</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

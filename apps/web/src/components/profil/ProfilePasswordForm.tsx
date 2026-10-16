'use client';

import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock } from 'lucide-react';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

interface ProfilePasswordFormProps {
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (fn: (prev: boolean) => boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (fn: (prev: boolean) => boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (fn: (prev: boolean) => boolean) => void;
  passwordSaving: boolean;
  passwordSuccess: boolean;
  passwordError: string | null;
  passwordStrength: PasswordStrength;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function ProfilePasswordForm({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordSaving,
  passwordSuccess,
  passwordError,
  passwordStrength,
  onSubmit,
}: ProfilePasswordFormProps) {
  const inputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center gap-2.5 mb-6">
        <KeyRound className="w-5 h-5 text-[#31525B]" />
        <div>
          <h2 className="text-base font-bold text-slate-900">Sécurité & Mot de passe</h2>
          <p className="text-xs text-slate-500">
            Modifiez votre mot de passe d'accès administrateur en toute sécurité.
          </p>
        </div>
      </div>

      {passwordError && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2 text-red-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{passwordError}</span>
        </div>
      )}

      {passwordSuccess && (
        <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Votre mot de passe a été modifié avec succès.</span>
        </div>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        {/* Mot de passe actuel */}
        <div>
          <label htmlFor="current-pw" className="block text-xs font-bold text-slate-600 mb-1.5">
            Mot de passe actuel *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="current-pw"
              type={showCurrentPassword ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1"
              aria-label={
                showCurrentPassword
                  ? 'Masquer le mot de passe actuel'
                  : 'Afficher le mot de passe actuel'
              }
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nouveau mot de passe & confirmation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="new-pw" className="block text-xs font-bold text-slate-600 mb-1.5">
              Nouveau mot de passe (min. 8 caractères) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="new-pw"
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1"
                aria-label={
                  showNewPassword
                    ? 'Masquer le nouveau mot de passe'
                    : 'Afficher le nouveau mot de passe'
                }
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Indicateur de force */}
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Force :</span>
                  <span className="font-bold text-slate-700">{passwordStrength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-full flex-1 rounded-full transition-all ${
                        passwordStrength.score >= level ? passwordStrength.color : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm-pw" className="block text-xs font-bold text-slate-600 mb-1.5">
              Confirmer le nouveau mot de passe *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="confirm-pw"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1"
                aria-label={
                  showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'
                }
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={passwordSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-[#31525B] hover:bg-[#254148] transition disabled:opacity-50 text-sm shadow-xs"
          >
            {passwordSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4 text-[#FFA101]" />
            )}
            <span>Changer le mot de passe</span>
          </button>
        </div>
      </form>
    </div>
  );
}

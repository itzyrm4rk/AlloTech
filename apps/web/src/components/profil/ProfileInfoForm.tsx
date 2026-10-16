'use client';

import { CheckCircle2, Loader2, Mail, Phone, Save, User } from 'lucide-react';

interface ProfileInfoFormProps {
  prenom: string;
  setPrenom: (v: string) => void;
  nom: string;
  setNom: (v: string) => void;
  telephone: string;
  setTelephone: (v: string) => void;
  userEmail: string;
  profileSaving: boolean;
  profileSuccess: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function ProfileInfoForm({
  prenom,
  setPrenom,
  nom,
  setNom,
  telephone,
  setTelephone,
  userEmail,
  profileSaving,
  profileSuccess,
  onSubmit,
}: ProfileInfoFormProps) {
  const inputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center gap-2.5 mb-6">
        <User className="w-5 h-5 text-[#31525B]" />
        <h2 className="text-base font-bold text-slate-900">Informations Personnelles</h2>
      </div>

      {profileSuccess && (
        <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Vos coordonnées ont été mises à jour avec succès.</span>
        </div>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        {/* Prénom & Nom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="profil-prenom"
              className="block text-xs font-bold text-slate-600 mb-1.5"
            >
              Prénom *
            </label>
            <input
              id="profil-prenom"
              type="text"
              required
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Votre prénom"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="profil-nom" className="block text-xs font-bold text-slate-600 mb-1.5">
              Nom *
            </label>
            <input
              id="profil-nom"
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom"
              className={inputClass}
            />
          </div>
        </div>

        {/* Email & Téléphone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profil-email" className="block text-xs font-bold text-slate-600 mb-1.5">
              Email du compte (non modifiable)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="profil-email"
                type="email"
                readOnly
                value={userEmail}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div>
            <label htmlFor="profil-tel" className="block text-xs font-bold text-slate-600 mb-1.5">
              Téléphone de contact
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="profil-tel"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+237 6XX XX XX XX"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={profileSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-[#FFA101] hover:bg-[#e69100] transition shadow-md shadow-[#FFA101]/25 hover:shadow-lg disabled:opacity-50 text-sm"
          >
            {profileSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Enregistrer les modifications</span>
          </button>
        </div>
      </form>
    </div>
  );
}

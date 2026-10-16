'use client';

import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { type ClientFormData, validateClientForm } from '@/components/clients/types';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NouveauClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<ClientFormData>({
    nom: '',
    typeClient: 'ENTREPRISE',
    telephone: '',
    email: '',
    adresse: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateClientForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom.trim(),
          typeClient: form.typeClient,
          telephone: form.telephone.trim(),
          email: form.email.trim() || null,
          adresse: form.adresse.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du client.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(
          data.client?.id ? `/dashboard/clients/${data.client.id}` : '/dashboard/clients',
        );
      }, 1000);
    } catch (err: unknown) {
      setErrors({
        global:
          err instanceof Error
            ? err.message
            : 'Une erreur est survenue lors de la création du client.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Navigation retour */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#31525B] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au répertoire clients
      </Link>

      {/* Bannière succès */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">Client enregistré avec succès !</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Redirection vers sa fiche détaillée...
            </p>
          </div>
        </div>
      )}

      {/* Erreur globale API */}
      {errors.global && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-bold">{errors.global}</p>
        </div>
      )}

      {/* Formulaire principal */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#31525B] flex items-center justify-center text-white shadow-xs">
            {form.typeClient === 'ENTREPRISE' ? (
              <Building2 className="w-6 h-6 text-[#FFA101]" />
            ) : (
              <User className="w-6 h-6 text-[#FFA101]" />
            )}
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
              Nouveau Client
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enregistrez une entreprise ou un particulier pour lui affecter des interventions et
              actifs CMDB.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sélection du type de client */}
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-2">
              Type de client <span className="text-red-500">*</span>
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, typeClient: 'ENTREPRISE' }))}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  form.typeClient === 'ENTREPRISE'
                    ? 'border-[#31525B] bg-[#31525B]/5 text-[#31525B] shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-[#31525B]" />
                Entreprise (B2B)
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, typeClient: 'PARTICULIER' }))}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  form.typeClient === 'PARTICULIER'
                    ? 'border-[#FFA101] bg-[#FFA101]/10 text-amber-800 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 text-[#FFA101]" />
                Particulier (B2C)
              </button>
            </div>
          </div>

          {/* Nom / Raison sociale */}
          <div>
            <label htmlFor="nouveau-nom" className="block text-xs font-bold text-slate-700 mb-1">
              {form.typeClient === 'ENTREPRISE' ? 'Raison sociale' : 'Nom complet'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="nouveau-nom"
              type="text"
              required
              value={form.nom}
              onChange={(e) => setForm((prev) => ({ ...prev, nom: e.target.value }))}
              placeholder={
                form.typeClient === 'ENTREPRISE'
                  ? 'Ex: Total Cameroun, MTN, Eneo...'
                  : 'Ex: Jean-Paul Mbianda'
              }
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#31525B]/20 ${
                errors.nom ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
              }`}
            />
            {errors.nom && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.nom}</p>
            )}
          </div>

          {/* Téléphone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nouveau-tel" className="block text-xs font-bold text-slate-700 mb-1">
                Téléphone principal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="nouveau-tel"
                  type="tel"
                  required
                  value={form.telephone}
                  onChange={(e) => setForm((prev) => ({ ...prev, telephone: e.target.value }))}
                  placeholder="+237 6XX XX XX XX"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#31525B]/20 ${
                    errors.telephone ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.telephone && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.telephone}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="nouveau-email"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Adresse e-mail (facultative)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="nouveau-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="direction@entreprise.cm"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#31525B]/20 ${
                    errors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Localisation / Site du client */}
          <div>
            <label
              htmlFor="nouveau-adresse"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Localisation géographique / Site <span className="text-red-500">*</span>
            </label>
            <AddressAutocomplete
              id="nouveau-adresse"
              value={form.adresse}
              onChange={(val) => setForm((prev) => ({ ...prev, adresse: val }))}
              placeholder="Ex: Akwa, Face Salle des Fêtes, Douala"
              error={errors.adresse}
            />
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#FFA101] shrink-0" />
              Cette adresse sera reprise automatiquement sur les tickets pour guider les techniciens
              sur le terrain.
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/dashboard/clients"
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isLoading || success}
              className="px-6 py-2.5 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FFA101]" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#FFA101]" />
                  <span>Enregistrer le client</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

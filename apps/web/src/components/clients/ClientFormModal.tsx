'use client';

import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { AlertCircle, Building2, Loader2, Mail, MapPin, Phone, Save, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type ClientDB, type ClientFormData, validateClientForm } from './types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: ClientDB, isEdit: boolean) => void;
  clientToEdit?: ClientDB | null;
}

const DEFAULT_FORM: ClientFormData = {
  nom: '',
  typeClient: 'ENTREPRISE',
  telephone: '',
  email: '',
  adresse: '',
};

export function ClientFormModal({
  isOpen,
  onClose,
  onSuccess,
  clientToEdit,
}: ClientFormModalProps) {
  const isEdit = Boolean(clientToEdit);

  const [form, setForm] = useState<ClientFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (clientToEdit) {
      setForm({
        nom: clientToEdit.nom || '',
        typeClient: clientToEdit.typeClient || 'ENTREPRISE',
        telephone: clientToEdit.telephone || '',
        email: clientToEdit.email || '',
        adresse: clientToEdit.adresse || '',
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
    setApiError(null);
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validateClientForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const url = isEdit ? `/api/clients/${clientToEdit?.id}` : '/api/clients';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
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
        throw new Error(data.error || 'Erreur lors de l’enregistrement du client.');
      }

      onSuccess(data.client, isEdit);
      onClose();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#31525B] flex items-center justify-center text-white shrink-0">
            {form.typeClient === 'ENTREPRISE' ? (
              <Building2 className="w-5 h-5 text-[#FFA101]" />
            ) : (
              <User className="w-5 h-5 text-[#FFA101]" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {isEdit ? 'Modifier le client' : 'Ajouter un nouveau client'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEdit
                ? 'Mettez à jour les coordonnées et l’adresse du client'
                : 'Créez un compte client pour lui rattacher des équipements et tickets'}
            </p>
          </div>
        </div>

        {apiError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold">{apiError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type de client */}
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-1.5">
              Type de client <span className="text-red-500">*</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, typeClient: 'ENTREPRISE' }))}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  form.typeClient === 'ENTREPRISE'
                    ? 'border-[#31525B] bg-[#31525B]/5 text-[#31525B]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Entreprise (B2B)
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, typeClient: 'PARTICULIER' }))}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  form.typeClient === 'PARTICULIER'
                    ? 'border-[#FFA101] bg-[#FFA101]/10 text-amber-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4" />
                Particulier (B2C)
              </button>
            </div>
          </div>

          {/* Nom / Raison sociale */}
          <div>
            <label
              htmlFor="client-modal-nom"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              {form.typeClient === 'ENTREPRISE' ? 'Raison sociale' : 'Nom complet'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="client-modal-nom"
              type="text"
              required
              value={form.nom}
              onChange={(e) => setForm((prev) => ({ ...prev, nom: e.target.value }))}
              placeholder={
                form.typeClient === 'ENTREPRISE'
                  ? 'Ex: Total Cameroun, MTN, Eneo...'
                  : 'Ex: Jean-Paul Mbianda'
              }
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#31525B]/20 ${
                errors.nom ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
              }`}
            />
            {errors.nom && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.nom}</p>
            )}
          </div>

          {/* Téléphone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="client-modal-tel"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Téléphone principal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="client-modal-tel"
                  type="tel"
                  required
                  value={form.telephone}
                  onChange={(e) => setForm((prev) => ({ ...prev, telephone: e.target.value }))}
                  placeholder="+237 6XX XX XX XX"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#31525B]/20 ${
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
                htmlFor="client-modal-email"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Adresse e-mail (facultative)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="client-modal-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@entreprise.cm"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#31525B]/20 ${
                    errors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Adresse géographique */}
          <div>
            <label
              htmlFor="client-modal-adresse"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Localisation / Site du client <span className="text-red-500">*</span>
            </label>
            <AddressAutocomplete
              id="client-modal-adresse"
              value={form.adresse}
              onChange={(val) => setForm((prev) => ({ ...prev, adresse: val }))}
              placeholder="Ex: Akwa, Face Salle des Fêtes, Douala"
              error={errors.adresse}
            />
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#FFA101]" />
              Adresse servant de repère aux techniciens pour le dispatch et calcul d'itinéraires.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FFA101]" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#FFA101]" />
                  <span>{isEdit ? 'Mettre à jour' : 'Créer le client'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

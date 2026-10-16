'use client';

import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import {
  AlertCircle,
  Building2,
  Calendar,
  Cpu,
  Layers,
  Loader2,
  MapPin,
  Save,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { type ClientSimple, type EquipementDB, STATUT_CONFIG } from './types';

interface EquipementEditModalProps {
  equipement: EquipementDB | null;
  onClose: () => void;
  clients: ClientSimple[];
  onSuccess: (updatedEq: EquipementDB) => void;
}

export function EquipementEditModal({
  equipement,
  onClose,
  clients,
  onSuccess,
}: EquipementEditModalProps) {
  const [form, setForm] = useState({
    clientId: '',
    modele: '',
    siteAdresse: '',
    dateInstallation: '',
    statut: 'EN_SERVICE' as 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME',
    editeur: '',
    version: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!equipement) return;
    setForm({
      clientId: equipement.clientId || '',
      modele: equipement.modele || '',
      siteAdresse: equipement.siteAdresse || '',
      dateInstallation: equipement.dateInstallation
        ? equipement.dateInstallation.split('T')[0]
        : '',
      statut: equipement.statut || 'EN_SERVICE',
      editeur: equipement.editeur || '',
      version: equipement.version || '',
    });
    setError(null);
  }, [equipement]);

  if (!equipement) return null;

  const isLogiciel = equipement.typeActif === 'LOGICIEL';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) {
      setError('Veuillez sélectionner un client.');
      return;
    }
    if (!form.modele.trim()) {
      setError('Le modèle / nom est obligatoire.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/equipements/${equipement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: form.clientId,
          modele: form.modele.trim(),
          siteAdresse: form.siteAdresse.trim() || null,
          dateInstallation: form.dateInstallation || null,
          statut: form.statut,
          editeur: isLogiciel ? form.editeur.trim() || null : null,
          version: isLogiciel ? form.version.trim() || null : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification');

      onSuccess(data.equipement);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#31525B]/10 flex items-center justify-center text-[#31525B]">
              {isLogiciel ? (
                <Layers className="w-5 h-5 text-[#FFA101]" />
              ) : (
                <Cpu className="w-5 h-5 text-[#FFA101]" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Modifier {isLogiciel ? 'le logiciel' : "l'équipement"}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {isLogiciel ? 'Licence :' : 'S/N :'}{' '}
                <span className="font-bold text-[#31525B]">{equipement.numeroSerie}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          {/* Client propriétaire */}
          <div>
            <label htmlFor="edit-eq-client" className="block text-xs font-bold text-slate-700 mb-1">
              Client propriétaire <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                id="edit-eq-client"
                value={form.clientId}
                onChange={(e) => {
                  const cId = e.target.value;
                  const cl = clients.find((c) => c.id === cId);
                  setForm((p) => ({
                    ...p,
                    clientId: cId,
                    siteAdresse: cl?.adresse || p.siteAdresse,
                  }));
                }}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101] transition"
              >
                <option value="">Sélectionner un client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modèle / Nom */}
          <div>
            <label htmlFor="edit-eq-modele" className="block text-xs font-bold text-slate-700 mb-1">
              {isLogiciel ? 'Nom du logiciel / de l’application' : 'Modèle de l’équipement'}{' '}
              <span className="text-rose-600">*</span>
            </label>
            <input
              id="edit-eq-modele"
              type="text"
              required
              value={form.modele}
              onChange={(e) => setForm((p) => ({ ...p, modele: e.target.value }))}
              placeholder={
                isLogiciel
                  ? 'Ex: Windows 11 Pro, Sage Paie, AutoCAD...'
                  : 'Ex: Dell Optiplex 7090, Imprimante HP LaserJet...'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101] transition"
            />
          </div>

          {/* Éditeur & Version si logiciel */}
          {isLogiciel && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-eq-editeur"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Éditeur / Développeur
                </label>
                <input
                  id="edit-eq-editeur"
                  type="text"
                  value={form.editeur}
                  onChange={(e) => setForm((p) => ({ ...p, editeur: e.target.value }))}
                  placeholder="Ex: Microsoft, Adobe, Sage..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101] transition"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-eq-version"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Version / Build
                </label>
                <input
                  id="edit-eq-version"
                  type="text"
                  value={form.version}
                  onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
                  placeholder="Ex: v24.2, 2026 Build 4..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101] transition"
                />
              </div>
            </div>
          )}

          {/* Statut opérationnel */}
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-1">
              Statut de l'actif <span className="text-rose-600">*</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['EN_SERVICE', 'EN_PANNE', 'EN_REFORME'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, statut: st }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    form.statut === st
                      ? `${STATUT_CONFIG[st].bg} ${STATUT_CONFIG[st].text} ${STATUT_CONFIG[st].border} ring-2 ring-[#FFA101]/40`
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{STATUT_CONFIG[st].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Adresse / Site */}
          <div>
            <label
              htmlFor="edit-eq-adresse"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FFA101]" />
                Site d'implantation / Bureau
              </span>
            </label>
            <AddressAutocomplete
              id="edit-eq-adresse"
              value={form.siteAdresse}
              onChange={(val) => setForm((p) => ({ ...p, siteAdresse: val }))}
              onSelectLocation={(loc) => setForm((p) => ({ ...p, siteAdresse: loc.address }))}
              placeholder="Ex: Siège Abidjan Plateau, Bureau 204..."
            />
          </div>

          {/* Date de mise en service */}
          <div>
            <label htmlFor="edit-eq-date" className="block text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date de mise en service / déploiement
              </span>
            </label>
            <input
              id="edit-eq-date"
              type="date"
              value={form.dateInstallation}
              onChange={(e) => setForm((p) => ({ ...p, dateInstallation: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101] transition"
            />
          </div>

          {/* Boutons d'action */}
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
              disabled={saving}
              className="px-5 py-2 bg-[#FFA101] hover:bg-[#e69100] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#FFA101]/20 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Enregistrer les modifications</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

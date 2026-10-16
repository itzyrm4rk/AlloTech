'use client';

import { AlertCircle, Cpu, FileCode, HardDrive, Layers, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import type { ClientSimple, EquipementDB } from './types';

interface EquipementCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientSimple[];
  onSuccess: (newEq: EquipementDB) => void;
}

export function EquipementCreateModal({
  isOpen,
  onClose,
  clients,
  onSuccess,
}: EquipementCreateModalProps) {
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientId: '',
    typeActif: 'MATERIEL' as 'MATERIEL' | 'LOGICIEL',
    modele: '',
    numeroSerie: '',
    editeur: '',
    version: '',
    siteAdresse: '',
    statut: 'EN_SERVICE' as 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME',
    dateInstallation: new Date().toISOString().split('T')[0],
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!form.clientId) {
      setCreateError('Veuillez sélectionner un client.');
      return;
    }
    if (!form.modele.trim()) {
      setCreateError('Le modèle ou nom est obligatoire.');
      return;
    }
    if (!form.numeroSerie.trim()) {
      setCreateError('Le numéro de série ou clé de licence est obligatoire.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/equipements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: form.clientId,
          typeActif: form.typeActif,
          modele: form.modele.trim(),
          numeroSerie: form.numeroSerie.trim().toUpperCase(),
          editeur: form.typeActif === 'LOGICIEL' ? form.editeur.trim() || null : null,
          version: form.typeActif === 'LOGICIEL' ? form.version.trim() || null : null,
          siteAdresse: form.siteAdresse.trim() || null,
          statut: form.statut,
          dateInstallation: form.dateInstallation || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');

      onSuccess(data.equipement);
      onClose();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#31525B] flex items-center justify-center text-white">
            {form.typeActif === 'LOGICIEL' ? (
              <Layers className="w-5 h-5 text-[#FFA101]" />
            ) : (
              <HardDrive className="w-5 h-5 text-[#FFA101]" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {form.typeActif === 'LOGICIEL'
                ? 'Nouveau logiciel / licence'
                : 'Nouvel équipement CMDB'}
            </h2>
            <p className="text-xs text-slate-500">
              {form.typeActif === 'LOGICIEL'
                ? 'Enregistrement d’un progiciel ou d’une licence client'
                : 'Ajout d’un matériel physique au parc informatique'}
            </p>
          </div>
        </div>

        {/* Sélecteur de type d'actif */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 mb-4">
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, typeActif: 'MATERIEL' }))}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              form.typeActif === 'MATERIEL'
                ? 'bg-[#31525B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-[#FFA101]" />
            <span>Matériel physique</span>
          </button>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, typeActif: 'LOGICIEL' }))}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              form.typeActif === 'LOGICIEL'
                ? 'bg-[#31525B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#FFA101]" />
            <span>Logiciel & Licence</span>
          </button>
        </div>

        {form.typeActif === 'LOGICIEL' && (
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-950 flex items-start gap-2 mb-4">
            <FileCode className="w-4 h-4 text-[#31525B] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Actif Logiciel :</strong> Enregistrez les licences logicielles sous contrat
              (Windows, Sage, Antivirus, suite bureautique...). Aucun QR code physique n'est requis,
              mais l'historique complet des interventions et pannes est conservé.
            </p>
          </div>
        )}

        {createError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{createError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="create-eq-clientId"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Client propriétaire *
            </label>
            <select
              id="create-eq-clientId"
              required
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101]"
            >
              <option value="">Sélectionnez un client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="create-eq-modele"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              {form.typeActif === 'LOGICIEL'
                ? 'Nom du logiciel / application *'
                : 'Modèle / Nom du matériel *'}
            </label>
            <input
              id="create-eq-modele"
              type="text"
              required
              value={form.modele}
              onChange={(e) => setForm((p) => ({ ...p, modele: e.target.value }))}
              placeholder={
                form.typeActif === 'LOGICIEL'
                  ? 'ex: Sage 100 Comptabilité, Microsoft 365, Kaspersky Endpoint'
                  : 'ex: Switch Cisco Catalyst 2960-X, Routeur MikroTik'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101]"
            />
          </div>

          {form.typeActif === 'LOGICIEL' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="create-eq-editeur"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Éditeur
                </label>
                <input
                  id="create-eq-editeur"
                  type="text"
                  value={form.editeur}
                  onChange={(e) => setForm((p) => ({ ...p, editeur: e.target.value }))}
                  placeholder="ex: Sage, Microsoft, ESET"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101]"
                />
              </div>
              <div>
                <label
                  htmlFor="create-eq-version"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Version / Édition
                </label>
                <input
                  id="create-eq-version"
                  type="text"
                  value={form.version}
                  onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
                  placeholder="ex: v2024, Standard, Cloud"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101]"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="create-eq-numeroSerie"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                {form.typeActif === 'LOGICIEL'
                  ? 'Clé de licence / N° Contrat *'
                  : 'N° de Série (Unique) *'}
              </label>
              <input
                id="create-eq-numeroSerie"
                type="text"
                required
                value={form.numeroSerie}
                onChange={(e) =>
                  setForm((p) => ({ ...p, numeroSerie: e.target.value.toUpperCase() }))
                }
                placeholder={form.typeActif === 'LOGICIEL' ? 'LIC-2026-XXXX' : 'SN-XXXX-12345'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101]"
              />
            </div>

            <div>
              <label
                htmlFor="create-eq-statut"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Statut
              </label>
              <select
                id="create-eq-statut"
                value={form.statut}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    statut: e.target.value as 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME',
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101]"
              >
                <option value="EN_SERVICE">En service</option>
                <option value="EN_PANNE">En panne</option>
                <option value="EN_REFORME">Mis au rebut / Expiré</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="create-eq-siteAdresse"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              {form.typeActif === 'LOGICIEL'
                ? 'Poste / Emplacement rattaché'
                : 'Site / Emplacement'}
            </label>
            <input
              id="create-eq-siteAdresse"
              type="text"
              value={form.siteAdresse}
              onChange={(e) => setForm((p) => ({ ...p, siteAdresse: e.target.value }))}
              placeholder="ex: Douala, Immeuble Akwa, Baie 2 / Serveur Principal"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101]"
            />
          </div>

          <div>
            <label
              htmlFor="create-eq-dateInstallation"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              {form.typeActif === 'LOGICIEL'
                ? 'Date d’activation / renouvellement'
                : 'Date d’installation'}
            </label>
            <input
              id="create-eq-dateInstallation"
              type="date"
              value={form.dateInstallation}
              onChange={(e) => setForm((p) => ({ ...p, dateInstallation: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFA101]" />}
              <span>
                {form.typeActif === 'LOGICIEL'
                  ? 'Enregistrer le logiciel'
                  : 'Enregistrer l’équipement'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

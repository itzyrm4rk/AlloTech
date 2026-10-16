'use client';

import { Check, ChevronDown, HardDrive, Laptop, Monitor, Package, Sparkles } from 'lucide-react';
import type React from 'react';
import {
  type Equipement,
  PRESETS_INSTALL_LOGICIEL,
  PRESETS_INSTALL_MATERIEL,
  SOUS_TYPE_LOG,
  SOUS_TYPE_MAT,
  type TicketFormState,
} from './types';

interface PanneInstallationFieldsProps {
  typeDemande: 'PANNE' | 'INSTALLATION';
  clientId: string;
  equipements: Equipement[];
  loadingEquipements: boolean;
  equipementId: string;
  onEquipementChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  equipementError?: string;
  categoriePanne: TicketFormState['categoriePanne'];
  setCategoriePanne: (cat: TicketFormState['categoriePanne']) => void;
  sousTypePanneMat: string;
  onSousTypePanneMatChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  sousTypePanneLog: string;
  onSousTypePanneLogChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  natureInstallation: 'MATERIEL' | 'LOGICIEL';
  setNatureInstallation: (nat: 'MATERIEL' | 'LOGICIEL') => void;
  equipementsDescription: string;
  onEquipementsDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  equipementsDescriptionError?: string;
  onToggleInstallationPreset: (preset: string) => void;
  onRattachementEquipementChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function PanneInstallationFields({
  typeDemande,
  clientId,
  equipements,
  loadingEquipements,
  equipementId,
  onEquipementChange,
  equipementError,
  categoriePanne,
  setCategoriePanne,
  sousTypePanneMat,
  onSousTypePanneMatChange,
  sousTypePanneLog,
  onSousTypePanneLogChange,
  natureInstallation,
  setNatureInstallation,
  equipementsDescription,
  onEquipementsDescriptionChange,
  equipementsDescriptionError,
  onToggleInstallationPreset,
  onRattachementEquipementChange,
}: PanneInstallationFieldsProps) {
  if (typeDemande === 'PANNE') {
    return (
      <div className="space-y-3 pt-2 border-t border-slate-100">
        {/* Équipement concerné */}
        <div>
          <label htmlFor="equipementId" className="block text-xs font-bold text-slate-600 mb-1.5">
            Actif concerné (équipement ou logiciel) *
          </label>
          {!clientId ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200">
              Sélectionnez d'abord un client pour voir ses actifs.
            </p>
          ) : loadingEquipements ? (
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          ) : equipements.length === 0 ? (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-4 py-2.5 border border-amber-200">
              Ce client n'a aucun actif enregistré dans la CMDB.
            </p>
          ) : (
            <div className="relative">
              <select
                id="equipementId"
                value={equipementId}
                onChange={onEquipementChange}
                className={`w-full appearance-none bg-slate-50 border ${
                  equipementError ? 'border-red-400' : 'border-slate-200'
                } rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition cursor-pointer`}
              >
                <option value="">— Sélectionner l'actif en panne —</option>
                {equipements.map((eq) => {
                  const isReforme = eq.statut === 'EN_REFORME';
                  return (
                    <option key={eq.id} value={eq.id} disabled={isReforme}>
                      [{eq.typeActif === 'MATERIEL' ? 'Matériel' : 'Logiciel'}] {eq.modele} (
                      {eq.numeroSerie}){eq.editeur ? ` — ${eq.editeur}` : ''}
                      {isReforme
                        ? ' ❌ [Mis au rebut / Réformé]'
                        : eq.statut === 'EN_PANNE'
                          ? ' ⚠ [Déjà en panne]'
                          : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}
          {equipementError && (
            <p className="text-xs text-red-600 mt-1 font-medium">{equipementError}</p>
          )}
        </div>

        {/* Catégorie de panne (MATERIEL ou LOGICIEL) */}
        <div>
          <p className="block text-xs font-bold text-slate-600 mb-1.5">
            Nature du diagnostic requis
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCategoriePanne('MATERIEL')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                categoriePanne === 'MATERIEL'
                  ? 'bg-[#31525B] text-white border-[#31525B]'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Panne Matérielle (Hardware)
            </button>
            <button
              type="button"
              onClick={() => setCategoriePanne('LOGICIEL')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                categoriePanne === 'LOGICIEL'
                  ? 'bg-[#31525B] text-white border-[#31525B]'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Panne Logicielle (Software)
            </button>
          </div>
        </div>

        {/* Sous-type matériel */}
        {categoriePanne === 'MATERIEL' && (
          <div>
            <label
              htmlFor="sousTypePanneMat"
              className="block text-xs font-bold text-slate-600 mb-1.5"
            >
              Sous-type de panne matérielle
            </label>
            <div className="relative">
              <select
                id="sousTypePanneMat"
                value={sousTypePanneMat}
                onChange={onSousTypePanneMatChange}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition cursor-pointer"
              >
                <option value="">— Préciser le type matériel (optionnel) —</option>
                {SOUS_TYPE_MAT.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Sous-type logiciel */}
        {categoriePanne === 'LOGICIEL' && (
          <div>
            <label
              htmlFor="sousTypePanneLog"
              className="block text-xs font-bold text-slate-600 mb-1.5"
            >
              Sous-type de panne logicielle
            </label>
            <div className="relative">
              <select
                id="sousTypePanneLog"
                value={sousTypePanneLog}
                onChange={onSousTypePanneLogChange}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition cursor-pointer"
              >
                <option value="">— Préciser le type logiciel (optionnel) —</option>
                {SOUS_TYPE_LOG.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Installation
  return (
    <div className="pt-2 border-t border-slate-100 space-y-4">
      {/* Sélecteur de nature d'installation : Matérielle vs Logicielle */}
      <div>
        <p className="block text-xs font-bold text-slate-600 mb-1.5">
          Nature de l'installation requise *
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              {
                key: 'MATERIEL',
                label: 'Installation Matérielle',
                sub: 'Hardware, équipements physiques & réseau',
                icon: HardDrive,
              },
              {
                key: 'LOGICIEL',
                label: 'Installation Logicielle',
                sub: 'OS, progiciels, licences & applications',
                icon: Laptop,
              },
            ] as const
          ).map((nat) => {
            const Icon = nat.icon;
            const isSelected = natureInstallation === nat.key;
            return (
              <button
                key={nat.key}
                type="button"
                onClick={() => setNatureInstallation(nat.key)}
                className={`flex flex-col items-center text-center p-3 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#31525B] border-[#31525B] text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-[#FFA101]' : 'text-slate-500'}`}
                />
                <span className="text-xs font-bold leading-tight">{nat.label}</span>
                <span className="text-[10px] opacity-75 mt-0.5 leading-tight">{nat.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Presets rapides d'éléments types à déployer */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FFA101]" />
            Éléments recommandés ({natureInstallation === 'MATERIEL' ? 'Hardware' : 'Software'})
          </span>
          <span className="text-[11px] text-slate-400">Cliquez pour insérer / retirer</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(natureInstallation === 'MATERIEL'
            ? PRESETS_INSTALL_MATERIEL
            : PRESETS_INSTALL_LOGICIEL
          ).map((preset) => {
            const isIncluded = equipementsDescription.includes(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onToggleInstallationPreset(preset)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  isIncluded
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {isIncluded && <Check className="w-3 h-3 text-emerald-600" />}
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description détaillée */}
      <div>
        <label
          htmlFor="equipementsDescription"
          className="block text-xs font-bold text-slate-600 mb-1.5"
        >
          Description précise des équipements &amp; logiciels à déployer *
        </label>
        <textarea
          id="equipementsDescription"
          placeholder={
            natureInstallation === 'MATERIEL'
              ? 'Ex: 5 postes PC HP ProBook 450, Switch Cisco Gigabit 24 ports, imprimante réseau Epson, câblage RJ45...'
              : 'Ex: Déploiement Windows 11 Pro, installation Microsoft 365, paramétrage ERP Odoo, Antivirus Bitdefender...'
          }
          value={equipementsDescription}
          onChange={onEquipementsDescriptionChange}
          rows={4}
          className={`w-full bg-slate-50 border ${
            equipementsDescriptionError ? 'border-red-400' : 'border-slate-200'
          } rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition resize-none`}
        />
        {equipementsDescriptionError && (
          <p className="text-xs text-red-600 mt-1 font-medium">{equipementsDescriptionError}</p>
        )}
      </div>

      {equipements.length > 0 && (
        <div>
          <label
            htmlFor="equipementIdInstall"
            className="block text-xs font-bold text-slate-600 mb-1.5"
          >
            Ou rattacher à un actif déjà existant dans la CMDB (optionnel)
          </label>
          <div className="relative">
            <select
              id="equipementIdInstall"
              value={equipementId}
              onChange={onRattachementEquipementChange}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition cursor-pointer"
            >
              <option value="">
                — Nouvel actif neuf (création automatique CMDB avec QR code à la clôture) —
              </option>
              {equipements.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.modele} ({eq.numeroSerie}) — {eq.statut}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Si aucun actif existant n'est sélectionné, la fiche équipement sera automatiquement
            créée dans la CMDB avec QR code lors de la signature client sur le terrain.
          </p>
        </div>
      )}
    </div>
  );
}

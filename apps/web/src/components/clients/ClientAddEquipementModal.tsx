'use client';

import { AlertCircle, Cpu, HardDrive, Loader2, Package, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { EquipementDB } from './types';

interface ClientAddEquipementModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientAdresse?: string | null;
  onSuccess: (newEq: EquipementDB) => void;
}

export function ClientAddEquipementModal({
  isOpen,
  onClose,
  clientId,
  clientAdresse,
  onSuccess,
}: ClientAddEquipementModalProps) {
  const [modele, setModele] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [typeActif, setTypeActif] = useState<'MATERIEL' | 'LOGICIEL'>('MATERIEL');
  const [siteAdresse, setSiteAdresse] = useState('');
  const [statut, setStatut] = useState<'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME'>('EN_SERVICE');
  const [dateInstallation, setDateInstallation] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setModele('');
      setNumeroSerie('');
      setTypeActif('MATERIEL');
      setSiteAdresse(clientAdresse || '');
      setStatut('EN_SERVICE');
      setDateInstallation(new Date().toISOString().split('T')[0]);
      setError(null);
    }
  }, [isOpen, clientAdresse]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!modele.trim()) {
      setError(
        typeActif === 'LOGICIEL'
          ? 'Le nom du logiciel ou progiciel est requis.'
          : 'Le modèle ou la marque du matériel est requis.',
      );
      return;
    }

    if (!numeroSerie.trim()) {
      setError(
        typeActif === 'LOGICIEL'
          ? 'La clé de licence ou identifiant est requise.'
          : 'Le numéro de série est requis.',
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/equipements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          typeActif,
          modele: modele.trim(),
          numeroSerie: numeroSerie.trim().toUpperCase(),
          siteAdresse: siteAdresse.trim() || clientAdresse || null,
          statut,
          dateInstallation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de l’équipement.');
      }

      onSuccess(data.equipement);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue.');
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
            <Package className="w-5 h-5 text-[#FFA101]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Ajouter un actif CMDB</h2>
            <p className="text-xs text-slate-500">
              Enregistrez un équipement pour ce client avec génération de QR Code.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type d'actif */}
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-1.5">Type d'actif</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTypeActif('MATERIEL')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  typeActif === 'MATERIEL'
                    ? 'border-[#31525B] bg-[#31525B]/5 text-[#31525B]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                Matériel (Hardware)
              </button>
              <button
                type="button"
                onClick={() => setTypeActif('LOGICIEL')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  typeActif === 'LOGICIEL'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Cpu className="w-4 h-4" />
                Logiciel (Licence)
              </button>
            </div>
          </div>

          {/* Modèle / Nom */}
          <div>
            <label htmlFor="add-eq-modele" className="block text-xs font-bold text-slate-700 mb-1">
              {typeActif === 'LOGICIEL' ? 'Nom du logiciel / application' : 'Marque et Modèle'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="add-eq-modele"
              type="text"
              required
              value={modele}
              onChange={(e) => setModele(e.target.value)}
              placeholder={
                typeActif === 'LOGICIEL'
                  ? 'Ex: Suite Microsoft 365, Sage X3...'
                  : 'Ex: Switch Cisco Catalyst 2960, Dell OptiPlex...'
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#31525B]/20"
            />
          </div>

          {/* Numéro de série / Licence */}
          <div>
            <label
              htmlFor="add-eq-numeroSerie"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              {typeActif === 'LOGICIEL' ? 'Clé de licence / Réf' : 'Numéro de série (S/N)'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="add-eq-numeroSerie"
              type="text"
              required
              value={numeroSerie}
              onChange={(e) => setNumeroSerie(e.target.value)}
              placeholder={typeActif === 'LOGICIEL' ? 'Ex: LIC-MS365-XXXX' : 'Ex: SN-CISCO-84920'}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#31525B]/20 uppercase"
            />
          </div>

          {/* Statut & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="add-eq-statut"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Statut initial
              </label>
              <select
                id="add-eq-statut"
                value={statut}
                onChange={(e) =>
                  setStatut(e.target.value as 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME')
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#31525B]/20"
              >
                <option value="EN_SERVICE">En service</option>
                <option value="EN_PANNE">En panne</option>
                <option value="EN_REFORME">Mis au rebut</option>
              </select>
            </div>

            <div>
              <label htmlFor="add-eq-date" className="block text-xs font-bold text-slate-700 mb-1">
                Date d'installation
              </label>
              <input
                id="add-eq-date"
                type="date"
                value={dateInstallation}
                onChange={(e) => setDateInstallation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#31525B]/20"
              />
            </div>
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
                  <Plus className="w-4 h-4 text-[#FFA101]" />
                  <span>Ajouter à la CMDB</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

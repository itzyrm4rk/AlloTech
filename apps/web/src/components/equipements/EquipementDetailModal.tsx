'use client';

import { exportCarnetEntretienPdf, parseRapportDetails } from '@/lib/export-utils';
import { calculateEquipmentHealth } from '@/lib/health-utils';
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  ExternalLink,
  FileCode,
  FileDown,
  History,
  Layers,
  Loader2,
  Pencil,
  Phone,
  Plus,
  Printer,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type EquipementDB, STATUT_CONFIG, URGENCE_BADGES } from './types';

interface EquipementDetailModalProps {
  equipement: EquipementDB | null;
  onClose: () => void;
  onEdit: (eq: EquipementDB) => void;
  onDownloadCarnetPdf: (eq: EquipementDB) => void;
  onOpenPrintSticker: (eq: EquipementDB) => void;
  onUpdateStatus: (id: string, statut: 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME') => Promise<void>;
  updatingStatutId: string | null;
  downloadingCarnetId: string | null;
}

export function EquipementDetailModal({
  equipement,
  onClose,
  onEdit,
  onDownloadCarnetPdf,
  onOpenPrintSticker,
  onUpdateStatus,
  updatingStatutId,
  downloadingCarnetId,
}: EquipementDetailModalProps) {
  const [detailTab, setDetailTab] = useState<'HISTORIQUE' | 'TECHNICIENS' | 'SPECIFICATIONS'>(
    'HISTORIQUE',
  );

  const distinctTechs = useMemo(() => {
    if (!equipement?.tickets) return [];
    const map = new Map<
      string,
      {
        id: string;
        matricule: string;
        prenom: string;
        nom: string;
        telephone?: string | null;
        photoUrl?: string | null;
        count: number;
        lastDate: string;
      }
    >();

    for (const t of equipement.tickets) {
      for (const tt of t.techniciens || []) {
        if (tt.technicien) {
          const tech = tt.technicien;
          const existing = map.get(tech.id);
          if (existing) {
            existing.count += 1;
            if (new Date(t.createdAt) > new Date(existing.lastDate)) {
              existing.lastDate = t.createdAt;
            }
          } else {
            map.set(tech.id, {
              id: tech.id,
              matricule: tech.matricule,
              prenom: tech.prenom,
              nom: tech.nom,
              telephone: tech.telephone,
              photoUrl: tech.photoUrl,
              count: 1,
              lastDate: t.createdAt,
            });
          }
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [equipement]);

  const detailHealth = useMemo(() => {
    if (!equipement) return null;
    return calculateEquipmentHealth(equipement);
  }, [equipement]);

  if (!equipement) return null;

  const isLogiciel = equipement.typeActif === 'LOGICIEL';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Bouton fermer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* En-tête de la fiche de vie de l'actif */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#31525B] flex items-center justify-center text-white shrink-0 shadow-xs">
              {isLogiciel ? (
                <Layers className="w-6 h-6 text-[#FFA101]" />
              ) : (
                <Cpu className="w-6 h-6 text-[#FFA101]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFA101]">
                  Fiche de vie de l'actif CMDB
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                    isLogiciel
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isLogiciel ? 'Logiciel' : 'Matériel'}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                {equipement.modele}
              </h2>
              <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">
                {isLogiciel ? 'Licence :' : 'S/N :'}{' '}
                <span className="text-[#31525B]">{equipement.numeroSerie}</span>
              </p>
            </div>
          </div>

          {/* Actions d'en-tête */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onDownloadCarnetPdf(equipement)}
              disabled={downloadingCarnetId === equipement.id}
              className="px-3 py-1.5 bg-[#31525B] hover:bg-[#243d44] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              title="Télécharger le carnet d'entretien officiel (PDF)"
            >
              {downloadingCarnetId === equipement.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFA101]" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-[#FFA101]" />
              )}
              <span>
                {downloadingCarnetId === equipement.id
                  ? 'Téléchargement...'
                  : 'Télécharger le carnet (PDF)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(equipement)}
              className="px-2.5 py-1.5 bg-[#31525B]/10 hover:bg-[#31525B]/20 text-[#31525B] text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-[#31525B]/20"
              title="Modifier les informations de l'équipement"
            >
              <Pencil className="w-3.5 h-3.5 text-[#FFA101]" />
              <span>Modifier</span>
            </button>

            <button
              type="button"
              onClick={() => exportCarnetEntretienPdf(equipement)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
              title="Imprimer directement le carnet d'entretien (Aperçu navigateur)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 px-1.5">Statut :</span>
              {(['EN_SERVICE', 'EN_PANNE', 'EN_REFORME'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={updatingStatutId === equipement.id}
                  onClick={() => void onUpdateStatus(equipement.id, st)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    equipement.statut === st
                      ? `${STATUT_CONFIG[st].bg} ${STATUT_CONFIG[st].text} font-black shadow-xs`
                      : 'text-slate-500 hover:bg-slate-200/60'
                  }`}
                >
                  {STATUT_CONFIG[st].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Onglets de navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 py-3 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setDetailTab('HISTORIQUE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              detailTab === 'HISTORIQUE'
                ? 'bg-[#31525B] text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#FFA101]" />
            <span>Historique des pannes ({equipement.tickets?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setDetailTab('TECHNICIENS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              detailTab === 'TECHNICIENS'
                ? 'bg-[#31525B] text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#FFA101]" />
            <span>Techniciens intervenus ({distinctTechs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setDetailTab('SPECIFICATIONS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              detailTab === 'SPECIFICATIONS'
                ? 'bg-[#31525B] text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-[#FFA101]" />
            <span>Spécifications & Site</span>
          </button>
        </div>

        {/* Contenu déroulant */}
        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4">
          {/* ONGLET 1 : HISTORIQUE */}
          {detailTab === 'HISTORIQUE' && (
            <div className="space-y-4">
              {/* Alerte visuelle de santé / instabilité */}
              {detailHealth?.isInstable && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 shadow-xs animate-in fade-in duration-150">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                      <AlertOctagon className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-200/80 text-rose-800">
                          Alerte Fiabilité Critique
                        </span>
                        <span className="text-xs font-black text-rose-800">
                          Score : {detailHealth.score}%
                        </span>
                      </div>
                      <p className="text-xs font-bold text-rose-900 mt-1">
                        {detailHealth.alerteMessage}
                      </p>
                      {detailHealth.recommandation && (
                        <p className="text-[11px] text-rose-700 mt-0.5 font-medium">
                          💡 Recommandation : {detailHealth.recommandation}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/tickets?equipementId=${equipement.id}&new=1`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Créer ticket / révision</span>
                  </Link>
                </div>
              )}

              {detailHealth &&
                detailHealth.level === 'SURVEILLANCE' &&
                !detailHealth.isInstable && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-800">
                          Surveillance recommandée
                        </span>
                        <span className="font-bold text-amber-800">
                          Score : {detailHealth.score}%
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-1 font-medium">
                        {detailHealth.recommandation}
                      </p>
                    </div>
                  </div>
                )}

              {/* Cartes résumé fiabilité */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Total tickets
                  </span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {equipement.tickets?.length || 0}
                  </p>
                </div>

                <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">
                    Pannes signalées
                  </span>
                  <p className="text-xl font-black text-rose-700 mt-0.5">
                    {(equipement.tickets || []).filter((t) => t.typeDemande === 'PANNE').length}
                  </p>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">
                    Résolus / Clôturés
                  </span>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">
                    {
                      (equipement.tickets || []).filter(
                        (t) => t.statutActuel === 'RESOLUE' || t.statutActuel === 'CLOTUREE',
                      ).length
                    }
                  </p>
                </div>

                <div className="bg-[#31525B]/5 border border-[#31525B]/20 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-[#31525B] uppercase">
                    Indice MTBF moyen
                  </span>
                  <p className="text-xl font-black text-[#31525B] mt-0.5">
                    {detailHealth?.totalPannes === 0 ? '∞' : `${detailHealth?.mtbfDays} j`}
                  </p>
                  <span className="text-[9px] font-semibold text-slate-400">
                    {detailHealth?.totalPannes || 0} panne
                    {(detailHealth?.totalPannes || 0) > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Liste des tickets associés */}
              {!equipement.tickets || equipement.tickets.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">
                    Aucun incident ni panne répertorié
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Cet actif est en parfait état de marche. Aucune intervention curative ou
                    préventive n'a encore été enregistrée dans la CMDB.
                  </p>
                  <Link
                    href={`/dashboard/tickets?equipementId=${equipement.id}&new=1`}
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#31525B] hover:bg-[#FFA101] text-white hover:text-slate-900 rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer un ticket sur cet équipement</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipement.tickets.map((ticket) => {
                    const urg = URGENCE_BADGES[ticket.urgence] || URGENCE_BADGES.NORMALE;
                    const isPanne = ticket.typeDemande === 'PANNE';
                    const isInstall = ticket.typeDemande === 'INSTALLATION';
                    const parsedRapport = parseRapportDetails(ticket);

                    const dureeStr =
                      parsedRapport?.dureeMinutes && parsedRapport.dureeMinutes > 0
                        ? parsedRapport.dureeMinutes >= 60
                          ? `${Math.floor(parsedRapport.dureeMinutes / 60)}h ${
                              parsedRapport.dureeMinutes % 60
                            }min`
                          : `${parsedRapport.dureeMinutes} min`
                        : null;

                    return (
                      <div
                        key={ticket.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 hover:border-slate-300 transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/tickets/${ticket.id}`}
                              className="inline-flex items-center gap-1 font-mono font-black text-xs text-[#31525B] hover:text-[#FFA101] transition"
                            >
                              <span>{ticket.reference}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>

                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                isPanne
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isInstall
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {ticket.typeDemande}
                            </span>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${urg.bg} ${urg.text} ${urg.border}`}
                            >
                              {urg.label}
                            </span>

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {ticket.statutActuel}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 font-medium">
                            Déclaré le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>

                        {/* Description du problème */}
                        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            {ticket.description}
                          </p>
                          {(ticket.categoriePanne ||
                            ticket.sousTypePanneMat ||
                            ticket.sousTypePanneLog) && (
                            <div className="text-[11px] text-slate-500 mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                              {ticket.categoriePanne && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700">
                                  Catégorie :{' '}
                                  <strong className="text-slate-900">
                                    {ticket.categoriePanne}
                                  </strong>
                                </span>
                              )}
                              {ticket.sousTypePanneMat && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 font-medium text-amber-900 flex items-center gap-1">
                                  <Cpu className="w-3 h-3 text-amber-600" />
                                  Panne Matériel : <strong>{ticket.sousTypePanneMat}</strong>
                                </span>
                              )}
                              {ticket.sousTypePanneLog && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 font-medium text-blue-900 flex items-center gap-1">
                                  <FileCode className="w-3 h-3 text-blue-600" />
                                  Panne Logiciel : <strong>{ticket.sousTypePanneLog}</strong>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Techniciens intervenus */}
                        {ticket.techniciens && ticket.techniciens.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Technicien(s) :
                            </span>
                            {ticket.techniciens.map(({ technicien }) => (
                              <span
                                key={technicien.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                              >
                                <div className="w-4 h-4 rounded-full bg-[#31525B] text-[#FFA101] text-[9px] flex items-center justify-center font-black">
                                  {technicien.prenom.charAt(0)}
                                </div>
                                <span>
                                  {technicien.prenom} {technicien.nom}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  ({technicien.matricule})
                                </span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Rapport de clôture */}
                        {parsedRapport ? (
                          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-black text-emerald-900 text-xs uppercase tracking-wide">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Rapport de résolution validé</span>
                              </div>
                              {dureeStr && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                  <Clock className="w-3 h-3 text-emerald-700" />
                                  <span>Durée : {dureeStr}</span>
                                </span>
                              )}
                            </div>

                            <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200/80">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Démarche de résolution appliquée :
                              </span>
                              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                {parsedRapport.resolution}
                              </p>
                            </div>

                            {parsedRapport.piecesChangees && (
                              <div className="bg-amber-50/90 border border-amber-200/90 p-2.5 rounded-lg text-xs">
                                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <Cpu className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Pièces physiques remplacées :</span>
                                </span>
                                <p className="text-xs font-bold text-amber-950">
                                  {parsedRapport.piecesChangees}
                                </p>
                              </div>
                            )}

                            {parsedRapport.correctifLogiciel && (
                              <div className="bg-blue-50/90 border border-blue-200/90 p-2.5 rounded-lg text-xs">
                                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <FileCode className="w-3.5 h-3.5 text-blue-700" />
                                  <span>Correctifs logiciels / Patchs appliqués :</span>
                                </span>
                                <p className="text-xs font-bold text-blue-950">
                                  {parsedRapport.correctifLogiciel}
                                </p>
                              </div>
                            )}

                            {parsedRapport.observations && (
                              <div className="text-xs text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200/60">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                                  Observations du technicien :
                                </span>
                                <p className="italic text-slate-700">
                                  {parsedRapport.observations}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-200/60 text-[10px] text-emerald-800">
                              {parsedRapport.auteurNom && (
                                <span>
                                  Intervention validée par :{' '}
                                  <strong>{parsedRapport.auteurNom}</strong>
                                </span>
                              )}
                              {parsedRapport.dateCloture && (
                                <span className="ml-auto text-emerald-700">
                                  Clôturé le{' '}
                                  {new Date(parsedRapport.dateCloture).toLocaleString('fr-FR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : ticket.statutActuel === 'EN_COURS' ? (
                          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-center gap-2 font-medium">
                            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>
                              Intervention actuellement en cours sur le terrain. Le rapport de
                              résolution sera disponible dès validation par le technicien.
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ONGLET 2 : TECHNICIENS */}
          {detailTab === 'TECHNICIENS' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Liste des techniciens AlloTech ayant déjà effectué une intervention sur cet
                équipement :
              </p>

              {distinctTechs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">
                    Aucun technicien assigné pour le moment
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Dès qu'une intervention sera réalisée sur cet équipement, l'historique des
                    techniciens s'affichera ici.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {distinctTechs.map((tech) => (
                    <div
                      key={tech.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {tech.photoUrl ? (
                          <img
                            src={tech.photoUrl}
                            alt={`${tech.prenom} ${tech.nom}`}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#31525B] to-[#1e343a] text-white flex items-center justify-center font-black text-xs shrink-0">
                            <span className="text-[#FFA101]">{tech.prenom.charAt(0)}</span>
                            <span>{tech.nom.charAt(0)}</span>
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">
                            {tech.prenom} {tech.nom}
                          </p>
                          <p className="text-xs font-mono font-bold text-[#31525B]">
                            {tech.matricule}
                          </p>
                          {tech.telephone && (
                            <a
                              href={`tel:${tech.telephone}`}
                              className="text-[11px] text-slate-500 hover:text-[#FFA101] flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{tech.telephone}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-black">
                          {tech.count} intervention{tech.count > 1 ? 's' : ''}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Dernier passage : {new Date(tech.lastDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ONGLET 3 : SPÉCIFICATIONS TECHNIQUES */}
          {detailTab === 'SPECIFICATIONS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Client propriétaire
                  </span>
                  {equipement.client ? (
                    <div>
                      <Link
                        href={`/dashboard/clients/${equipement.client.id}`}
                        className="text-sm font-black text-[#31525B] hover:text-[#FFA101] transition inline-flex items-center gap-1.5"
                      >
                        {equipement.client.typeClient === 'PARTICULIER' ? (
                          <User className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Building2 className="w-4 h-4 text-[#FFA101] shrink-0" />
                        )}
                        <span>{equipement.client.nom}</span>
                        {equipement.client.typeClient === 'PARTICULIER' && (
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-md border border-blue-200/80">
                            Particulier
                          </span>
                        )}
                        <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                      </Link>
                      {equipement.client.telephone && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tél : {equipement.client.telephone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Non renseigné</p>
                  )}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Localisation / Site
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {equipement.siteAdresse || 'Non renseignée'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {isLogiciel ? 'Date d’activation' : 'Date d’installation'}
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {equipement.dateInstallation
                      ? new Date(equipement.dateInstallation).toLocaleDateString('fr-FR')
                      : 'Non renseignée'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Enregistré dans la CMDB le
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {new Date(equipement.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {isLogiciel && (
                  <>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Éditeur logiciel
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        {equipement.editeur || 'Non renseigné'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Version installée
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        {equipement.version || 'Non renseignée'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* QR Code de l'équipement */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-900">Identification QR Code terrain</p>
                  <p className="text-[11px] text-slate-500 font-mono">{equipement.qrCodeData}</p>
                </div>

                {!isLogiciel && (
                  <button
                    type="button"
                    onClick={() => {
                      const eq = equipement;
                      onClose();
                      onOpenPrintSticker(eq);
                    }}
                    className="px-4 py-2 bg-[#31525B] hover:bg-[#233b41] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#FFA101]" />
                    <span>Imprimer l'étiquette QR</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pied de modale */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            Identifiant : <span className="font-mono">{equipement.id}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

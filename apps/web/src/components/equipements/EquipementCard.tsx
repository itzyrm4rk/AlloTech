'use client';

import { calculateEquipmentHealth } from '@/lib/health-utils';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Building2,
  Calendar,
  Cpu,
  Eye,
  FileDown,
  Layers,
  Loader2,
  MapPin,
  Pencil,
  QrCode,
  ShieldCheck,
  Ticket,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { type EquipementDB, STATUT_CONFIG } from './types';

interface EquipementCardProps {
  equipement: EquipementDB;
  onSelectDetail: (eq: EquipementDB) => void;
  onEdit: (eq: EquipementDB) => void;
  onDownloadCarnet: (eq: EquipementDB) => void;
  onPrintSticker: (eq: EquipementDB) => void;
  onDelete: (id: string, modele: string) => void;
  downloadingCarnetId: string | null;
  deletingId: string | null;
}

export function EquipementCard({
  equipement,
  onSelectDetail,
  onEdit,
  onDownloadCarnet,
  onPrintSticker,
  onDelete,
  downloadingCarnetId,
  deletingId,
}: EquipementCardProps) {
  const cfg = STATUT_CONFIG[equipement.statut] || STATUT_CONFIG.EN_SERVICE;
  const ticketsCount = equipement.tickets?.length || 0;
  const isLogiciel = equipement.typeActif === 'LOGICIEL';
  const health = calculateEquipmentHealth(equipement);

  return (
    <div
      onClick={() => onSelectDetail(equipement)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectDetail(equipement);
        }
      }}
      className={`group bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative ${
        health.isInstable
          ? 'border-2 border-rose-400 ring-2 ring-rose-100/70 hover:border-rose-500'
          : 'border border-slate-200/90 hover:border-[#FFA101]'
      }`}
    >
      <div>
        {/* En-tête : Icône, type & badges statut/santé */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#31525B]/10 group-hover:bg-[#31525B] rounded-xl flex items-center justify-center text-[#31525B] group-hover:text-white transition">
              {isLogiciel ? (
                <Layers className="w-5 h-5 text-[#FFA101]" />
              ) : (
                <Cpu className="w-5 h-5 text-[#FFA101]" />
              )}
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                isLogiciel
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isLogiciel ? 'Logiciel' : 'Matériel'}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              {cfg.label}
            </span>

            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                health.level === 'EXCELLENT'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : health.level === 'SURVEILLANCE'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200 font-black'
              }`}
              title={`Score de fiabilité : ${health.score}% - MTBF : ${
                health.totalPannes === 0 ? 'Aucune panne' : `${health.mtbfDays} j`
              }`}
            >
              {health.level === 'EXCELLENT' && (
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              )}
              {health.level === 'SURVEILLANCE' && (
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              )}
              {health.level === 'CRITIQUE' && (
                <AlertOctagon className="w-3 h-3 text-rose-600 shrink-0" />
              )}
              <span>
                {health.label} ({health.score}%)
              </span>
            </span>
          </div>
        </div>

        {/* Modèle & Numéro de série */}
        <h3 className="text-sm font-black text-slate-900 group-hover:text-[#31525B] leading-tight mb-1 transition">
          {equipement.modele}
        </h3>

        <p className="text-xs font-mono font-bold text-slate-500 mb-2.5">
          {isLogiciel ? 'Licence :' : 'S/N :'} {equipement.numeroSerie}
        </p>

        {/* Alerte visuelle contextualisée si instable */}
        {health.isInstable && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-900">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug">
              <p className="font-bold">{health.alerteMessage}</p>
              {health.recommandation && (
                <p className="text-[10px] text-rose-700 mt-0.5">{health.recommandation}</p>
              )}
            </div>
          </div>
        )}

        {/* Données d'exploitation */}
        <div className="space-y-1.5 mb-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
          {equipement.client && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {equipement.client.typeClient === 'PARTICULIER' ? (
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              ) : (
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <Link
                href={`/dashboard/clients/${equipement.client.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-bold text-[#31525B] hover:text-[#FFA101] transition truncate max-w-[170px]"
              >
                {equipement.client.nom}
              </Link>
              {equipement.client.typeClient === 'PARTICULIER' && (
                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/80">
                  Particulier
                </span>
              )}
            </div>
          )}

          {isLogiciel && (equipement.editeur || equipement.version) && (
            <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium">
              {equipement.editeur && (
                <span>
                  Éditeur: <strong>{equipement.editeur}</strong>
                </span>
              )}
              {equipement.version && (
                <span>
                  Version: <strong>{equipement.version}</strong>
                </span>
              )}
            </div>
          )}

          {equipement.siteAdresse && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{equipement.siteAdresse}</span>
            </div>
          )}

          {equipement.dateInstallation && (
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                {isLogiciel ? 'Activé le ' : 'Installé le '}
                {new Date(equipement.dateInstallation).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Ticket className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              {ticketsCount} ticket{ticketsCount > 1 ? 's' : ''} associé
              {ticketsCount > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center justify-between gap-1.5 text-[11px] pt-1.5 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Activity className="w-3 h-3 text-[#31525B] shrink-0" />
              <span>MTBF (fiabilité) :</span>
            </div>
            <span className="font-mono font-bold text-slate-700">
              {health.totalPannes === 0 ? '∞ (0 panne)' : `${health.mtbfDays} j / panne`}
            </span>
          </div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectDetail(equipement);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#31525B] hover:bg-[#FFA101] text-white hover:text-slate-900 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Historique & détails</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(equipement);
            }}
            className="p-2 text-slate-500 hover:text-[#31525B] hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Modifier l'équipement"
          >
            <Pencil className="w-4 h-4 text-[#31525B]" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownloadCarnet(equipement);
            }}
            disabled={downloadingCarnetId === equipement.id}
            className="p-2 text-slate-500 hover:text-[#31525B] hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Télécharger le carnet d'entretien officiel (PDF)"
          >
            {downloadingCarnetId === equipement.id ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#FFA101]" />
            ) : (
              <FileDown className="w-4 h-4 text-[#31525B]" />
            )}
          </button>

          {!isLogiciel && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrintSticker(equipement);
              }}
              className="p-2 text-slate-500 hover:text-[#31525B] hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Imprimer QR Code"
            >
              <QrCode className="w-4 h-4 text-[#FFA101]" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(equipement.id, equipement.modele);
            }}
            disabled={deletingId === equipement.id}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Supprimer l'actif"
          >
            {deletingId === equipement.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

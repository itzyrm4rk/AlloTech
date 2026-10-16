import { Cpu, Package, Printer } from 'lucide-react';
import Link from 'next/link';
import type { TicketDetail } from './types';

export function TicketCmdbCard({
  equipement,
  onOpenPrintSticker,
}: {
  equipement: NonNullable<TicketDetail['equipement']>;
  onOpenPrintSticker?: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          {equipement.typeActif === 'LOGICIEL' ? (
            <Cpu className="w-4 h-4 text-[#FFA101]" />
          ) : (
            <Package className="w-4 h-4 text-[#FFA101]" />
          )}
          Actif CMDB concerné
        </h2>
        {onOpenPrintSticker && (
          <button
            type="button"
            onClick={onOpenPrintSticker}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#31525B]/10 hover:bg-[#31525B]/20 text-[#31525B] text-xs font-bold rounded-xl transition cursor-pointer"
            title="Imprimer l'étiquette QR Code"
          >
            <Printer className="w-3.5 h-3.5 text-[#FFA101]" />
            Étiquette QR
          </button>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Nom / Modèle</span>
          <span className="text-sm font-bold text-slate-900">{equipement.modele}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Type</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
              equipement.typeActif === 'LOGICIEL'
                ? 'bg-purple-50 text-purple-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {equipement.typeActif}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {equipement.typeActif === 'LOGICIEL' ? 'Clé / Licence' : 'N° de série'}
          </span>
          <span className="text-xs font-mono text-slate-700">{equipement.numeroSerie}</span>
        </div>
        {equipement.editeur && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Éditeur</span>
            <span className="text-sm text-slate-700">{equipement.editeur}</span>
          </div>
        )}
        {equipement.version && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Version</span>
            <span className="text-sm text-slate-700">{equipement.version}</span>
          </div>
        )}
      </div>
      <Link
        href="/dashboard/equipements"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#31525B] hover:text-[#FFA101] transition"
      >
        Voir dans la CMDB →
      </Link>
    </div>
  );
}

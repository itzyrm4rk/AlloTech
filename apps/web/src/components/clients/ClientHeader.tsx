'use client';

import { Calendar, Edit2, Mail, MapPin, Phone, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { type ClientDB, TYPE_CONFIG } from './types';

interface ClientHeaderProps {
  client: ClientDB;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

export function ClientHeader({ client, onEdit, onDelete, deleting = false }: ClientHeaderProps) {
  const typeCfg = TYPE_CONFIG[client.typeClient] || TYPE_CONFIG.ENTREPRISE;
  const TypeIcon = typeCfg.icon;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Identité */}
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl ${typeCfg.bg} border ${typeCfg.border} flex items-center justify-center shrink-0 shadow-xs`}
          >
            <TypeIcon className={`w-7 h-7 ${typeCfg.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
              >
                {typeCfg.label}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Depuis le{' '}
                {new Date(client.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{client.nom}</h1>
          </div>
        </div>

        {/* Actions principales */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/dashboard/tickets/nouveau?clientId=${client.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FFA101]" />
            <span>Nouveau ticket</span>
          </Link>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Edit2 className="w-4 h-4 text-slate-600" />
            <span>Modifier</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Supprimer ce client"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleting ? 'Suppression...' : 'Supprimer'}</span>
          </button>
        </div>
      </div>

      {/* Cartouches de contact & localisation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
        {/* Téléphone */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Phone className="w-4 h-4 text-[#31525B]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">Téléphone</p>
            <a
              href={`tel:${client.telephone}`}
              className="text-xs font-bold text-slate-800 hover:text-[#FFA101] transition truncate block"
            >
              {client.telephone}
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Mail className="w-4 h-4 text-[#31525B]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">Email de contact</p>
            {client.email ? (
              <a
                href={`mailto:${client.email}`}
                className="text-xs font-bold text-slate-800 hover:text-[#FFA101] transition truncate block"
              >
                {client.email}
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic">Non renseigné</span>
            )}
          </div>
        </div>

        {/* Adresse */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <MapPin className="w-4 h-4 text-[#FFA101]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Site / Localisation</p>
            {client.adresse ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  client.adresse,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-slate-800 hover:text-[#FFA101] transition truncate block"
                title="Localiser sur Google Maps"
              >
                {client.adresse}
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic">Non renseignée</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

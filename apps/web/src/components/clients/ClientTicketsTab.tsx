'use client';

import { Pagination } from '@/components/Pagination';
import { ArrowRight, Plus, Search, Ticket as TicketIcon, User } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { TicketDB } from './types';

interface ClientTicketsTabProps {
  clientId: string;
  tickets: TicketDB[];
}

const STATUT_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  CREEE: { label: 'Créée', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  ASSIGNEE: {
    label: 'Assignée',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  EN_ROUTE: {
    label: 'En route',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
  },
  EN_COURS: {
    label: 'En cours',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  EN_PAUSE: {
    label: 'En pause',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
  },
  TERMINEE: {
    label: 'Terminée',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  CLOTUREE: {
    label: 'Clôturée',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
  },
  ANNULEE: { label: 'Annulée', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const URGENCE_BADGES: Record<string, { label: string; bg: string }> = {
  CRITIQUE: { label: 'Critique', bg: 'bg-red-50 text-red-700 border-red-200' },
  HAUTE: { label: 'Haute', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  NORMALE: { label: 'Normale', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  BASSE: { label: 'Basse', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export function ClientTicketsTab({ clientId, tickets }: ClientTicketsTabProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PANNE' | 'INSTALLATION'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.reference.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());

      const matchType =
        filterType === 'ALL' ||
        (filterType === 'PANNE' && t.typeDemande === 'PANNE') ||
        (filterType === 'INSTALLATION' && t.typeDemande === 'INSTALLATION');

      return matchSearch && matchType;
    });
  }, [tickets, search, filterType]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-4">
      {/* Barre d'outils tickets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          {/* Recherche */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Réf. ticket, objet..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#31525B]/20"
            />
          </div>

          {/* Filtres types */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setFilterType('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType('PANNE');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterType === 'PANNE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pannes
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType('INSTALLATION');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterType === 'INSTALLATION'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Installations
            </button>
          </div>
        </div>

        {/* Bouton ouvrir nouveau ticket */}
        <Link
          href={`/dashboard/tickets/nouveau?clientId=${clientId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#FFA101]" />
          <span>Créer un ticket</span>
        </Link>
      </div>

      {/* Tableau / Cartes */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center shadow-xs">
          <TicketIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">Aucun ticket d'intervention</p>
          <p className="text-xs text-slate-400 mt-1">
            {search
              ? 'Aucune intervention ne correspond à cette recherche.'
              : 'Ce client n’a pas encore fait l’objet de demande d’intervention.'}
          </p>
          <Link
            href={`/dashboard/tickets/nouveau?clientId=${clientId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 bg-[#31525B] text-white rounded-xl text-xs font-bold transition hover:bg-[#233b41]"
          >
            <Plus className="w-3.5 h-3.5 text-[#FFA101]" />
            <span>Ouvrir une intervention</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                  <th className="px-5 py-3.5">Réf. & Description</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5">Urgence</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Technicien(s)</th>
                  <th className="px-4 py-3.5 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3.5 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((t) => {
                  const statutCfg = STATUT_BADGES[t.statutActuel] || STATUT_BADGES.CREEE;
                  const urgenceCfg = URGENCE_BADGES[t.urgence] || URGENCE_BADGES.NORMALE;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-3.5">
                        <Link href={`/dashboard/tickets/${t.id}`} className="block">
                          <p className="font-bold text-slate-900 group-hover:text-[#FFA101] transition-colors">
                            {t.reference}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[280px]">
                            {t.description}
                          </p>
                        </Link>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            t.typeDemande === 'INSTALLATION'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.typeDemande}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statutCfg.bg} ${statutCfg.text} ${statutCfg.border}`}
                        >
                          {statutCfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${urgenceCfg.bg}`}
                        >
                          {urgenceCfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {t.techniciens && t.techniciens.length > 0 ? (
                          <div className="flex items-center gap-1 text-slate-700">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>
                              {t.techniciens
                                .map((ta) => `${ta.technicien.prenom} ${ta.technicien.nom}`)
                                .join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Non assigné</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 hidden lg:table-cell text-slate-500 text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/dashboard/tickets/${t.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-[#31525B] hover:text-white text-slate-700 rounded-lg text-xs font-bold transition"
                        >
                          <span>Voir</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > pageSize && (
            <div className="p-3 border-t border-slate-100 flex justify-end">
              <Pagination
                currentPage={currentPage}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

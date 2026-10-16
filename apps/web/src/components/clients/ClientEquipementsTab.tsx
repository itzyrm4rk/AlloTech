'use client';

import { Pagination } from '@/components/Pagination';
import { Cpu, HardDrive, Package, Plus, Printer, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type EquipementDB, STATUT_EQUIPEMENT_CONFIG } from './types';

interface ClientEquipementsTabProps {
  equipements: EquipementDB[];
  onOpenAddModal: () => void;
  onOpenPrintSticker: (equipement: EquipementDB) => void;
}

export function ClientEquipementsTab({
  equipements,
  onOpenAddModal,
  onOpenPrintSticker,
}: ClientEquipementsTabProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'MATERIEL' | 'LOGICIEL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const matCount = equipements.filter((e) => (e.typeActif ?? 'MATERIEL') === 'MATERIEL').length;
  const logCount = equipements.filter((e) => e.typeActif === 'LOGICIEL').length;

  const filtered = useMemo(() => {
    return equipements.filter((eq) => {
      const matchSearch =
        eq.modele.toLowerCase().includes(search.toLowerCase()) ||
        eq.numeroSerie.toLowerCase().includes(search.toLowerCase()) ||
        Boolean(eq.siteAdresse?.toLowerCase().includes(search.toLowerCase()));

      const eqType = eq.typeActif ?? 'MATERIEL';
      const matchType =
        filterType === 'ALL' ||
        (filterType === 'MATERIEL' && eqType === 'MATERIEL') ||
        (filterType === 'LOGICIEL' && eqType === 'LOGICIEL');

      return matchSearch && matchType;
    });
  }, [equipements, search, filterType]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-4">
      {/* Barre d'outils CMDB */}
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
              placeholder="Modèle, série, licence..."
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
              Tous ({equipements.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType('MATERIEL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                filterType === 'MATERIEL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardDrive className="w-3 h-3 text-[#31525B]" />
              Matériels ({matCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType('LOGICIEL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                filterType === 'LOGICIEL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3 h-3 text-purple-600" />
              Logiciels ({logCount})
            </button>
          </div>
        </div>

        {/* Bouton ajout */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#FFA101]" />
          <span>Ajouter un équipement</span>
        </button>
      </div>

      {/* Liste / Tableau des équipements */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center shadow-xs">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">Aucun équipement trouvé</p>
          <p className="text-xs text-slate-400 mt-1">
            {search
              ? 'Aucun actif ne correspond à cette recherche.'
              : 'Ce client ne possède pas encore d’équipement enregistré dans la CMDB.'}
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 bg-[#31525B] text-white rounded-xl text-xs font-bold transition hover:bg-[#233b41] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#FFA101]" />
            <span>Enregistrer un équipement</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                  <th className="px-5 py-3.5">Modèle & Nom</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">N° Série / Clé</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Site</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((eq) => {
                  const isLog = eq.typeActif === 'LOGICIEL';
                  const statutCfg =
                    STATUT_EQUIPEMENT_CONFIG[eq.statut] || STATUT_EQUIPEMENT_CONFIG.EN_SERVICE;

                  return (
                    <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isLog ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-[#31525B]'
                            }`}
                          >
                            {isLog ? (
                              <Cpu className="w-3.5 h-3.5" />
                            ) : (
                              <HardDrive className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="font-bold text-slate-900">{eq.modele}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isLog ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isLog ? 'LOGICIEL' : 'MATÉRIEL'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-slate-700 font-semibold">
                          {eq.numeroSerie}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${statutCfg.bg} ${statutCfg.text} ${statutCfg.border}`}
                        >
                          {statutCfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 hidden md:table-cell text-slate-500 truncate max-w-[200px]">
                        {eq.siteAdresse || '—'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenPrintSticker(eq)}
                            className="p-1.5 bg-slate-100 hover:bg-[#31525B] hover:text-white text-slate-700 rounded-lg transition cursor-pointer"
                            title="Imprimer l'étiquette QR Code"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href="/dashboard/equipements"
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition"
                          >
                            Détail
                          </Link>
                        </div>
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

'use client';

import { Building2, Cpu, HardDrive, User, Users } from 'lucide-react';
import type { ClientDB } from './types';

interface ClientStatsCardsProps {
  clients: ClientDB[];
}

export function ClientStatsCards({ clients }: ClientStatsCardsProps) {
  const totalClients = clients.length;
  const totalEntreprises = clients.filter((c) => c.typeClient === 'ENTREPRISE').length;
  const totalParticuliers = clients.filter((c) => c.typeClient === 'PARTICULIER').length;

  const totalMateriels = clients.reduce(
    (acc, c) =>
      acc + (c.equipements?.filter((e) => (e.typeActif ?? 'MATERIEL') === 'MATERIEL').length || 0),
    0,
  );

  const totalLogiciels = clients.reduce(
    (acc, c) => acc + (c.equipements?.filter((e) => e.typeActif === 'LOGICIEL').length || 0),
    0,
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Total clients */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">Total Clients</span>
          <div className="w-7 h-7 rounded-lg bg-[#31525B]/10 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-[#31525B]" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-900">{totalClients}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Comptes enregistrés</p>
      </div>

      {/* Entreprises */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">Entreprises</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-900">{totalEntreprises}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Parcs B2B sous contrat</p>
      </div>

      {/* Particuliers */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">Particuliers</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-amber-600" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-900">{totalParticuliers}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Résidentiel</p>
      </div>

      {/* Matériels */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">Matériels</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-900">{totalMateriels}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Actifs physiques CMDB</p>
      </div>

      {/* Logiciels */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">Logiciels</span>
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-900">{totalLogiciels}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Licences & Systèmes</p>
      </div>
    </div>
  );
}

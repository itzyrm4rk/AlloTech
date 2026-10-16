'use client';

import { CheckCircle, Clock, Ticket, Zap } from 'lucide-react';
import type React from 'react';
import type { GlobalStats } from './types';

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  iconBg: string;
}

function KpiCard({ icon: Icon, label, value, sub, color, iconBg }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${iconBg} shrink-0`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <p className={`text-3xl font-black ${color}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface StatsKpisProps {
  stats: GlobalStats;
}

export function StatsKpis({ stats }: StatsKpisProps) {
  const percentResolved =
    stats.total > 0 ? `${Math.round((stats.resolus / stats.total) * 100)}% du total` : undefined;

  const subCritique =
    stats.parUrgence.HAUTE > 0 ? `+ ${stats.parUrgence.HAUTE} haute priorité` : undefined;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard
        icon={Ticket}
        label="Interventions totales"
        value={stats.total}
        sub={`${stats.pannes} pannes · ${stats.installations} install.`}
        color="text-[#31525B]"
        iconBg="bg-[#31525B]/10"
      />
      <KpiCard
        icon={CheckCircle}
        label="Résolues & Clôturées"
        value={stats.resolus}
        sub={percentResolved}
        color="text-[#2E8B57]"
        iconBg="bg-emerald-50"
      />
      <KpiCard
        icon={Clock}
        label="MTTR & MTTA moyen"
        value={stats.mttrFormate}
        sub={`MTTA prise en charge : ${stats.mttaFormate || 'N/A'}`}
        color="text-[#31525B]"
        iconBg="bg-slate-100"
      />
      <KpiCard
        icon={Zap}
        label="Tickets critiques"
        value={stats.parUrgence.CRITIQUE}
        sub={subCritique}
        color="text-[#C0392B]"
        iconBg="bg-red-50"
      />
    </div>
  );
}

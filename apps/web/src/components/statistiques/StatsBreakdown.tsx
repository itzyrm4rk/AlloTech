'use client';

import { Wrench, Zap } from 'lucide-react';
import type { GlobalStats } from './types';

interface SlaGaugeProps {
  pct: number;
}

function SlaGauge({ pct }: SlaGaugeProps) {
  const color = pct >= 80 ? '#2E8B57' : pct >= 60 ? '#FFA101' : '#C0392B';
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28" role="img" aria-label={`Taux SLA : ${pct}%`}>
      <title>{`Taux SLA : ${pct}%`}</title>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#E2E8F0" strokeWidth="10" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${circ.toFixed(1)}`}
        strokeDashoffset={`${offset.toFixed(1)}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="50" y="52" textAnchor="middle" fontSize="18" fontWeight="800" fill={color}>
        {pct}%
      </text>
      <text x="50" y="66" textAnchor="middle" fontSize="9" fill="#94A3B8">
        SLA OK
      </text>
    </svg>
  );
}

interface UrgenceBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function UrgenceBar({ label, value, total, color }: UrgenceBarProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold w-16 text-slate-600">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-extrabold w-8 text-right" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

interface StatsBreakdownProps {
  stats: GlobalStats;
}

export function StatsBreakdown({ stats }: StatsBreakdownProps) {
  const categories = [
    {
      label: 'Matériel',
      value: stats.parCategorie.MATERIEL,
      color: '#31525B',
      icon: Wrench,
    },
    {
      label: 'Logiciel',
      value: stats.parCategorie.LOGICIEL,
      color: '#FFA101',
      icon: Zap,
    },
  ];

  const totalCategories = stats.parCategorie.MATERIEL + stats.parCategorie.LOGICIEL;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Jauge SLA */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col items-center justify-center">
        <h3 className="text-sm font-bold text-slate-600 mb-4">Taux de Respect SLA</h3>
        <SlaGauge pct={stats.tauxSla} />
        <p className="text-xs text-slate-500 mt-3">
          {stats.slaRespected} / {stats.resolus} tickets dans les délais
        </p>
      </div>

      {/* Répartition urgence */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-600 mb-4">Répartition par Urgence</h3>
        <div className="space-y-3">
          <UrgenceBar
            label="CRITIQUE"
            value={stats.parUrgence.CRITIQUE}
            total={stats.total}
            color="#C0392B"
          />
          <UrgenceBar
            label="HAUTE"
            value={stats.parUrgence.HAUTE}
            total={stats.total}
            color="#FFA101"
          />
          <UrgenceBar
            label="NORMALE"
            value={stats.parUrgence.NORMALE}
            total={stats.total}
            color="#31525B"
          />
          <UrgenceBar
            label="BASSE"
            value={stats.parUrgence.BASSE}
            total={stats.total}
            color="#64748B"
          />
        </div>
      </div>

      {/* Pannes catégorie */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-600 mb-4">Catégorisation des Pannes</h3>
        <div className="space-y-4">
          {categories.map(({ label, value, color, icon: Icon }) => {
            const pct = totalCategories > 0 ? Math.round((value / totalCategories) * 100) : 0;
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-bold text-slate-700">{label}</span>
                    <span className="text-xs font-extrabold" style={{ color }}>
                      {value} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                        transition: 'width 0.7s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
            {stats.pannes} pannes au total
          </p>
        </div>
      </div>
    </div>
  );
}

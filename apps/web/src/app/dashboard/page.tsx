'use client';

import { authClient } from '@allotech/auth/client';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Hand,
  Plus,
  RefreshCw,
  Ticket,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type StatutTicket =
  | 'CREEE'
  | 'ASSIGNEE'
  | 'EN_ROUTE'
  | 'EN_COURS'
  | 'EN_PAUSE'
  | 'TERMINEE'
  | 'CLOTUREE'
  | 'ANNULEE';

type UrgenceTicket = 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE';

interface RealTicket {
  id: string;
  reference: string;
  typeDemande: string;
  statutActuel: StatutTicket;
  urgence: UrgenceTicket;
  adresseSite: string;
  createdAt: string;
  client?: {
    id: string;
    nom: string;
    raisonSociale?: string | null;
  } | null;
}

interface KPIState {
  total: number;
  creees: number;
  enCours: number;
  critiques: number;
  terminees: number;
}

const URGENCE_CONFIG: Record<
  UrgenceTicket,
  { label: string; bg: string; text: string; border: string }
> = {
  CRITIQUE: {
    label: 'CRITIQUE',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  HAUTE: {
    label: 'HAUTE',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  NORMALE: {
    label: 'NORMALE',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  BASSE: {
    label: 'BASSE',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
};

const STATUT_CONFIG: Record<StatutTicket, { label: string; color: string; dot: string }> = {
  CREEE: { label: 'Créée', color: 'text-slate-500', dot: 'bg-slate-400' },
  ASSIGNEE: { label: 'Assignée', color: 'text-blue-600', dot: 'bg-blue-500' },
  EN_ROUTE: { label: 'En route', color: 'text-cyan-600', dot: 'bg-cyan-500' },
  EN_COURS: { label: 'En cours', color: 'text-amber-600', dot: 'bg-amber-500 animate-pulse' },
  EN_PAUSE: { label: 'En pause', color: 'text-orange-600', dot: 'bg-orange-500' },
  TERMINEE: { label: 'Terminée', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  CLOTUREE: { label: 'Clôturée', color: 'text-teal-600', dot: 'bg-teal-500' },
  ANNULEE: { label: 'Annulée', color: 'text-rose-600', dot: 'bg-rose-500' },
};

function KPICard({
  title,
  value,
  icon: Icon,
  color,
  link,
  loading = false,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  link?: string;
  loading?: boolean;
}) {
  const content = (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 transition-all duration-200 shadow-xs hover:shadow-md group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shadow-xs`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#FFA101] transition-colors" />
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse mb-1" />
      ) : (
        <p className="text-3xl font-black text-[#1A2C31] mb-1 tracking-tight">{value}</p>
      )}
      <p className="text-sm font-medium text-slate-500">{title}</p>
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const [tickets, setTickets] = useState<RealTicket[]>([]);
  const [kpi, setKpi] = useState<KPIState>({
    total: 0,
    creees: 0,
    enCours: 0,
    critiques: 0,
    terminees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState<'Bonjour' | 'Bonsoir'>('Bonjour');

  // Salutation dynamique basée sur l'heure locale
  useEffect(() => {
    const hour = new Date().getHours();
    // De 18h00 à 04h59 -> Bonsoir, sinon Bonjour
    setGreeting(hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour');
  }, []);

  // Récupération des données réelles depuis l'API de production
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch('/api/tickets');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setTickets(data.tickets ?? []);
            if (data.kpi) {
              setKpi({
                total: data.kpi.total ?? 0,
                creees: data.kpi.creees ?? 0,
                enCours: data.kpi.enCours ?? 0,
                critiques: data.kpi.critiques ?? 0,
                terminees: data.kpi.terminees ?? 0,
              });
            }
          }
        }
      } catch (err) {
        console.error('Erreur de chargement du dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const adminName = session?.user?.name ?? 'Administrateur';
  const firstName = adminName.split(' ')[0];
  const recentTickets = tickets.slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* En-tête */}
      <div>
        {/* Badge d'état système dynamique */}
        {loading ? (
          <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
            <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />
            <span className="text-xs font-semibold text-slate-600">
              Synchronisation des données...
            </span>
          </div>
        ) : kpi.critiques > 0 ? (
          <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="text-xs font-semibold text-red-700">
              {kpi.critiques} intervention{kpi.critiques > 1 ? 's' : ''} critique
              {kpi.critiques > 1 ? 's' : ''} en cours
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-800">
              Système opérationnel • 0 incident critique
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1A2C31] tracking-tight">
            {greeting}, {firstName}
          </h1>
          <div className="w-9 h-9 rounded-xl bg-[#FFA101]/10 border border-[#FFA101]/30 flex items-center justify-center shrink-0">
            <Hand className="w-5 h-5 text-[#FFA101] -rotate-12" />
          </div>
        </div>

        <p className="text-slate-500 mt-1 text-sm font-medium">
          Tableau de bord AlloTech —{' '}
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* KPIs avec vraies valeurs en temps réel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total tickets"
          value={kpi.total}
          icon={Ticket}
          color="bg-[#31525B]"
          link="/dashboard/tickets"
          loading={loading}
        />
        <KPICard
          title="En cours"
          value={kpi.enCours}
          icon={Activity}
          color="bg-[#FFA101]"
          link="/dashboard/tickets?statut=EN_COURS"
          loading={loading}
        />
        <KPICard
          title="Critiques actives"
          value={kpi.critiques}
          icon={AlertTriangle}
          color="bg-red-600"
          link="/dashboard/tickets?urgence=CRITIQUE"
          loading={loading}
        />
        <KPICard
          title="Terminés"
          value={kpi.terminees}
          icon={CheckCircle}
          color="bg-emerald-600"
          link="/dashboard/tickets?statut=TERMINEE"
          loading={loading}
        />
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/tickets/nouveau"
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#31525B] to-[#244047] rounded-2xl hover:from-[#244047] hover:to-[#1b3137] transition-all duration-200 group shadow-md shadow-[#31525B]/20 text-white"
        >
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition">
            <Plus className="w-5 h-5 text-[#FFA101] stroke-[2.5]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Nouveau ticket</p>
            <p className="text-xs text-slate-200">Créer une intervention</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/dashboard/clients/nouveau"
          className="flex items-center gap-3 p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all duration-200 group shadow-xs"
        >
          <div className="w-10 h-10 bg-[#B3DEE5]/30 rounded-xl flex items-center justify-center group-hover:bg-[#B3DEE5]/50 transition">
            <Users className="w-5 h-5 text-[#31525B]" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Nouveau client</p>
            <p className="text-xs text-slate-500">Ajouter un client</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-[#FFA101] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/dashboard/techniciens"
          className="flex items-center gap-3 p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all duration-200 group shadow-xs"
        >
          <div className="w-10 h-10 bg-[#FAE6B1]/40 rounded-xl flex items-center justify-center group-hover:bg-[#FAE6B1]/60 transition">
            <Wrench className="w-5 h-5 text-[#8C5800]" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Techniciens</p>
            <p className="text-xs text-slate-500">Gérer l'équipe & congés</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-[#FFA101] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Tableau des derniers tickets réels */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#31525B] rounded-xl flex items-center justify-center shadow-xs">
              <Clock className="w-4.5 h-4.5 text-[#FFA101]" />
            </div>
            <h2 className="text-base font-bold text-[#1A2C31]">Dernières interventions réelles</h2>
          </div>
          <Link
            href="/dashboard/tickets"
            className="flex items-center gap-1.5 text-sm font-bold text-[#FFA101] hover:text-[#d88700] transition-colors"
          >
            Voir tout ({kpi.total})
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Ticket className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Aucune intervention enregistrée</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Toutes les interventions créées par vous ou via l'application mobile apparaîtront ici
              en direct.
            </p>
            <Link
              href="/dashboard/tickets/nouveau"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-[#31525B] text-white text-xs font-bold hover:bg-[#254148] transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#FFA101]" />
              <span>Créer la première intervention</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTickets.map((ticket) => {
              const statutCfg = STATUT_CONFIG[ticket.statutActuel] ?? {
                label: ticket.statutActuel,
                color: 'text-slate-500',
                dot: 'bg-slate-400',
              };
              const urgenceCfg = URGENCE_CONFIG[ticket.urgence] ?? {
                label: ticket.urgence,
                bg: 'bg-slate-50',
                text: 'text-slate-600',
                border: 'border-slate-200',
              };
              const clientLabel =
                ticket.client?.raisonSociale || ticket.client?.nom || 'Client non spécifié';
              const createdDate = new Date(ticket.createdAt);

              return (
                <Link
                  key={ticket.id}
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Indicateur de statut */}
                  <div className="flex items-center gap-2 flex-shrink-0 w-28 sm:w-32">
                    <span className={`w-2.5 h-2.5 rounded-full ${statutCfg.dot}`} />
                    <span className={`text-xs font-bold ${statutCfg.color}`}>
                      {statutCfg.label}
                    </span>
                  </div>

                  {/* Info ticket */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-medium text-slate-500">
                        {ticket.reference}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urgenceCfg.bg} ${urgenceCfg.text} ${urgenceCfg.border}`}
                      >
                        {urgenceCfg.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-[#31525B] transition-colors">
                      {clientLabel}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{ticket.adresseSite}</p>
                  </div>

                  {/* Type + date */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <span className="text-xs font-bold text-slate-700 block">
                      {ticket.typeDemande}
                    </span>
                    <span className="text-xs text-slate-400">
                      {createdDate.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#FFA101] group-hover:translate-x-0.5 transition flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA création */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/40">
          <Link
            href="/dashboard/tickets/nouveau"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-sm font-bold text-[#FFA101] hover:text-[#e08e00] shadow-2xs transition-all duration-150"
          >
            <Zap className="w-4 h-4 text-[#FFA101]" />
            Créer un nouveau ticket d'intervention
          </Link>
        </div>
      </div>
    </div>
  );
}

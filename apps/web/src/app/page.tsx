import { TICKET_STATUS_MAP, type TicketStatus } from '@allotech/ui';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  PauseCircle,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
} from 'lucide-react';

export default function AdminHomePage() {
  const sampleTickets: Array<{
    id: string;
    client: string;
    type: 'Panne' | 'Installation';
    status: TicketStatus;
    site: string;
    technician: string;
    time: string;
  }> = [
    {
      id: 'TCK-2026-001',
      client: 'Société Camerounaise de Banque (Akwa)',
      type: 'Panne',
      status: 'EN_COURS',
      site: 'Boulevard de la Liberté, Akwa - Douala',
      technician: 'Kamga Emmanuel (TECH-042)',
      time: 'Il y a 25 min',
    },
    {
      id: 'TCK-2026-002',
      client: 'Clinique de Bonanjo',
      type: 'Installation',
      status: 'ASSIGNEE',
      site: 'Rue Prince Bell, Bonanjo - Douala',
      technician: 'Tchakounté Paul (TECH-018)',
      time: 'Il y a 1h 10',
    },
    {
      id: 'TCK-2026-003',
      client: 'Logistique Transit Portuaire',
      type: 'Panne',
      status: 'EN_PAUSE',
      site: 'Zone Portuaire, Douala',
      technician: 'Nkomo Jean-Pierre (TECH-009)',
      time: 'En pause (Attente switch 24p)',
    },
    {
      id: 'TCK-2026-004',
      client: 'Cabinet Notarial Douala Ouest',
      type: 'Installation',
      status: 'CLOTUREE',
      site: 'Avenue Castelnau, Bali - Douala',
      technician: 'Kamga Emmanuel (TECH-042)',
      time: 'Clôturé à 14h30 (PDF généré)',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#2C2C2E]">
      {/* Barre de navigation supérieure */}
      <header className="sticky top-0 z-50 border-b border-[#E4E4E7] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B3A5C] text-white shadow-sm">
              <Wrench className="h-5 w-5 text-[#E07A3C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[#1B3A5C]">AlloTech</span>
                <span className="rounded-full bg-[#E07A3C]/10 px-2.5 py-0.5 text-xs font-semibold text-[#E07A3C]">
                  Douala
                </span>
              </div>
              <p className="text-xs text-[#2C2C2E]/60">Supervision des Interventions Techniques</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-[#E4E4E7] bg-[#F4F4F5] px-3 py-1.5 text-xs text-[#2C2C2E]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2E8B57] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2E8B57]" />
              </span>
              <span>Supervision active (Polling 15s)</span>
            </div>

            <div className="flex items-center gap-3 border-l border-[#E4E4E7] pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B3A5C] text-xs font-semibold text-white">
                AD
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-[#1B3A5C]">Administrateur</p>
                <p className="text-[#2C2C2E]/60">admin@allotech.cm</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* En-tête de page */}
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B3A5C]">
              Tableau de bord — Supervision en temps réel
            </h1>
            <p className="text-sm text-[#2C2C2E]/70">
              Pilotage des interventions sur le terrain, suivi des techniciens et respect des
              engagements SLA.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[#E07A3C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#cf6b2f]"
            >
              <Wrench className="h-4 w-4" />
              Nouveau Ticket (Appel Client)
            </button>
          </div>
        </div>

        {/* Cartes Métriques Clés */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#2C2C2E]/60">Interventions du jour</span>
              <Clock className="h-4 w-4 text-[#1B3A5C]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#1B3A5C]">14</p>
            <p className="mt-1 text-xs text-[#2E8B57]">8 en cours • 4 assignées</p>
          </div>

          <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#2C2C2E]/60">Techniciens actifs</span>
              <Smartphone className="h-4 w-4 text-[#E07A3C]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#1B3A5C]">6 / 8</p>
            <p className="mt-1 text-xs text-[#2C2C2E]/60">2 en congé (non assignables)</p>
          </div>

          <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#2C2C2E]/60">Taux de respect SLA</span>
              <ShieldCheck className="h-4 w-4 text-[#2E8B57]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#2E8B57]">96.4 %</p>
            <p className="mt-1 text-xs text-[#2C2C2E]/60">Objectif entreprise : 95%</p>
          </div>

          <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#2C2C2E]/60">Alertes critiques</span>
              <AlertTriangle className="h-4 w-4 text-[#C0392B]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#C0392B]">1</p>
            <p className="mt-1 text-xs text-[#C0392B]">1 ticket en pause &gt; 24h</p>
          </div>
        </div>

        {/* Table des interventions récentes avec badges officiels */}
        <div className="mb-8 rounded-xl border border-[#E4E4E7] bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E4E4E7] px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-[#1B3A5C]">Dernières interventions</h2>
              <p className="text-xs text-[#2C2C2E]/60">
                Mises à jour automatiques reçues du terrain
              </p>
            </div>
            <span className="text-xs font-medium text-[#E07A3C]">Vue complète</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4F4F5] text-xs font-medium text-[#2C2C2E]/70 uppercase">
                <tr>
                  <th className="px-6 py-3">Réf Ticket</th>
                  <th className="px-6 py-3">Client & Site</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Technicien assigné</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Horodatage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]">
                {sampleTickets.map((ticket) => {
                  const meta = TICKET_STATUS_MAP[ticket.status];
                  return (
                    <tr key={ticket.id} className="hover:bg-[#FAFAF8] transition">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-[#1B3A5C]">
                        {ticket.id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#2C2C2E]">{ticket.client}</p>
                        <p className="flex items-center gap-1 text-xs text-[#2C2C2E]/60">
                          <MapPin className="h-3 w-3 text-[#E07A3C]" />
                          {ticket.site}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                            ticket.type === 'Panne'
                              ? 'bg-[#FFEBEE] text-[#C0392B]'
                              : 'bg-[#E3F2FD] text-[#1B3A5C]'
                          }`}
                        >
                          {ticket.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[#2C2C2E]">
                        {ticket.technician}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}
                        >
                          {ticket.status === 'EN_COURS' && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0369A1] animate-pulse" />
                          )}
                          {ticket.status === 'EN_PAUSE' && <PauseCircle className="h-3 w-3" />}
                          {ticket.status === 'CLOTUREE' && <CheckCircle2 className="h-3 w-3" />}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#2C2C2E]/60">{ticket.time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validation de l'Architecture Sprint 0 & Stack 100% Gratuite */}
        <div className="rounded-xl border border-[#1B3A5C]/15 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1B3A5C]">
            <Sparkles className="h-4 w-4 text-[#E07A3C]" />
            Architecture Technique Validée (Sprint 0 — Monorepo Turborepo)
          </div>
          <p className="mt-1 text-xs text-[#2C2C2E]/70">
            Conforme aux règles permanentes : palier 100% gratuit sans carte bancaire, zéro
            WebSocket, zéro Next 15, zéro Mapbox.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-[#F4F4F5] p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[#1B3A5C]">
                <Layers className="h-3.5 w-3.5 text-[#E07A3C]" />
                Next.js 16
              </div>
              <p className="mt-1 text-[#2C2C2E]/70">App Router, RSC, Tailwind</p>
            </div>

            <div className="rounded-lg bg-[#F4F4F5] p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[#1B3A5C]">
                <Smartphone className="h-3.5 w-3.5 text-[#2E8B57]" />
                Expo SDK 57
              </div>
              <p className="mt-1 text-[#2C2C2E]/70">Expo Go, NativeWind, SQLite</p>
            </div>

            <div className="rounded-lg bg-[#F4F4F5] p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[#1B3A5C]">
                <Server className="h-3.5 w-3.5 text-[#E0A83C]" />
                Neon PostgreSQL
              </div>
              <p className="mt-1 text-[#2C2C2E]/70">Serverless, Drizzle ORM</p>
            </div>

            <div className="rounded-lg bg-[#F4F4F5] p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[#1B3A5C]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#1B3A5C]" />
                Better Auth & tRPC
              </div>
              <p className="mt-1 text-[#2C2C2E]/70">Sessions sécurisées & Zod</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

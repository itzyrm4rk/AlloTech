'use client';

import { authClient } from '@allotech/auth/client';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  LogOut,
  Plus,
  ShieldCheck,
  Ticket,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/connexion');
    }
  }, [session, isPending, router]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/connexion');
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#E07A3C] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B1329] text-slate-100">
      {/* Barre de navigation supérieure */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B3A5C] to-[#E07A3C] flex items-center justify-center shadow-md shadow-[#1B3A5C]/40">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                Allo<span className="text-[#E07A3C]">Tech</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-[#1B3A5C] text-blue-200 border border-blue-400/30">
                Dashboard Administrateur
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{session.user.name}</p>
              <p className="text-xs text-slate-400">{session.user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* En-tête de bienvenue avec statut temps réel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#1B3A5C]/50 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Bonjour, {session.user.name} 👋
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Centre de supervision opérationnel — Douala, Cameroun
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tickets/nouveau"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#E07A3C] hover:bg-[#d66f33] active:scale-[0.99] transition shadow-lg shadow-[#E07A3C]/30"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Ticket</span>
            </Link>
          </div>
        </div>

        {/* Métriques KPI rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Interventions en cours
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">0</p>
            <p className="text-xs text-slate-400 mt-1">Aucune intervention active</p>
          </div>

          <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Techniciens inscrits
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">0</p>
            <p className="text-xs text-emerald-400 mt-1">Auto-inscriptions via mobile</p>
          </div>

          <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Alertes SLA
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">0</p>
            <p className="text-xs text-slate-400 mt-1">Tous les délais respectés</p>
          </div>

          <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tickets clôturés
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">0</p>
            <p className="text-xs text-slate-400 mt-1">Historique des interventions</p>
          </div>
        </div>

        {/* Modules du Dashboard (liens vers les fonctionnalités des sprints suivants) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-[#1B3A5C] flex items-center justify-center text-white mb-4">
              <Ticket className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Gestion des Tickets</h2>
            <p className="text-sm text-slate-400 mb-4">
              Création des demandes de panne ou installation suite aux appels clients de Douala.
            </p>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Sprint 4
            </span>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-[#E07A3C] flex items-center justify-center text-white mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Techniciens & Disponibilité</h2>
            <p className="text-sm text-slate-400 mb-4">
              Consultez les techniciens inscrits, activez leurs comptes et gérez leurs congés.
            </p>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Sprint 2
            </span>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-[#2E8B57] flex items-center justify-center text-white mb-4">
              <Wrench className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">CMDB & Équipements</h2>
            <p className="text-sm text-slate-400 mb-4">
              Catalogue du matériel client avec fiches techniques et QR codes imprimables.
            </p>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Sprint 3
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { AlloTechLogo } from '@/components/AlloTechLogo';
import { authClient } from '@allotech/auth/client';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck,
  FileSpreadsheet,
  HardDrive,
  Layers,
  Lock,
  Menu,
  Navigation,
  QrCode,
  Radio,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Si l'utilisateur est déjà connecté, redirection transparente vers le dashboard
  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace('/dashboard');
    }
  }, [session, isPending, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-slate-900 flex flex-col selection:bg-[#FFA101]/20 selection:text-[#31525B]">
      {/* 1. Header de Navigation Supérieur */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <AlloTechLogo size={42} showText={true} textColor="text-slate-900" />
          </Link>

          {/* Navigation Liens Métier Desktop */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#cockpit" className="hover:text-[#31525B] transition-colors">
              Cockpit Superviseur
            </a>
            <a href="#services" className="hover:text-[#31525B] transition-colors">
              Piliers Hardware & Software
            </a>
            <a href="#terrain" className="hover:text-[#31525B] transition-colors">
              Outils Terrain
            </a>
          </nav>

          {/* Boutons d'Accès Portails */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/connexion"
              className="px-4 py-2 text-xs sm:text-sm font-bold text-[#31525B] hover:text-[#FFA101] transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/dashboard"
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#31525B] hover:bg-[#254148] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-[#31525B]/20 flex items-center gap-2"
            >
              <span>Cockpit Admin</span>
              <ArrowRight className="w-4 h-4 text-[#FFA101]" />
            </Link>
          </div>

          {/* Bouton Hamburger Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Ouvrir ou fermer le menu de navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu Déroulant Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-5 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2">
              <Link
                href="#cockpit"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#31525B] bg-[#31525B]/5 transition flex items-center gap-2"
              >
                <span>Cockpit Superviseur</span>
              </Link>
              <Link
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Piliers Hardware & Software
              </Link>
              <Link
                href="#terrain"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Outils Terrain
              </Link>
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/connexion"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#31525B] hover:bg-slate-50 transition"
              >
                Connexion
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-[#31525B] text-white text-sm font-bold shadow-md shadow-[#31525B]/20 flex items-center justify-center gap-2"
              >
                <span>Cockpit Admin</span>
                <ArrowRight className="w-4 h-4 text-[#FFA101]" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section Ultra-Moderne */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/70">
        {/* Halos lumineux d'ambiance */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#B3DEE5]/30 blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-[#FFA101]/10 blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Titre Principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Maintenance Informatique <br />
              <span className="bg-gradient-to-r from-[#31525B] via-[#2A4951] to-[#FFA101] bg-clip-text text-transparent">
                Pilotage Central & Terrain
              </span>
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              La plateforme unifiée pour superviser vos parcs d'équipements CMDB, assigner
              efficacement les interventions selon les disponibilités et assister les techniciens
              avec l'IA.
            </p>

            {/* Actions CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#31525B] hover:bg-[#254148] text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-[#31525B]/25 flex items-center justify-center gap-2 group"
              >
                <span>Accéder au Cockpit Superviseur</span>
                <ArrowRight className="w-4 h-4 text-[#FFA101] group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="/api/download/apk"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-200/90 transition-all shadow-xs flex items-center justify-center gap-2.5 group"
                title="Télécharger l'application APK Technicien Mobile pour Android"
              >
                <Smartphone className="w-4 h-4 text-[#FFA101] group-hover:scale-110 transition-transform" />
                <span>APK Technicien Mobile</span>
                <span className="text-[10.5px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Android
                </span>
              </a>
            </div>

            {/* Métriques Clés d'Engagement */}
            <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-[#31525B] mb-1">
                  <Clock className="w-4 h-4 text-[#FFA101]" />
                  <span className="text-xl font-black">&lt; 2h</span>
                </div>
                <p className="text-xs font-bold text-slate-500">Prise en charge SLA</p>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-[#31525B] mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />
                  <span className="text-xl font-black">99.4%</span>
                </div>
                <p className="text-xs font-bold text-slate-500">Taux de résolution</p>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-[#31525B] mb-1">
                  <QrCode className="w-4 h-4 text-[#31525B]" />
                  <span className="text-xl font-black">100%</span>
                </div>
                <p className="text-xs font-bold text-slate-500">Traçabilité CMDB</p>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-[#31525B] mb-1">
                  <Sparkles className="w-4 h-4 text-[#FFA101]" />
                  <span className="text-xl font-black">Flash</span>
                </div>
                <p className="text-xs font-bold text-slate-500">Diagnostic IA Hybride</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section Cockpit Administrateur & Tour de Contrôle (NOUVELLE SECTION MAJEURE) */}
      <section
        id="cockpit"
        className="py-24 bg-gradient-to-b from-white via-slate-50/70 to-white border-b border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête de section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Le Cockpit Administrateur : <br />
              <span className="text-[#31525B]">Pilotez Vos Opérations en Temps Réel</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
              Fini les feuilles volantes et les dispatchs manuels approximatifs. AlloTech offre aux
              responsables d'exploitation une suite décisionnelle complète pour orchestrer les
              techniciens, surveiller les contrats SLA et pérenniser les parcs clients.
            </p>
          </div>

          {/* Grille des 6 piliers du Cockpit Administrateur */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Supervision Cartographique Live */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#31525B]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#31525B] text-[#FFA101] flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  <Radio className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-[#2E8B57] mb-2.5">
                  Flux SSE • Zéro Rechargement
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                  Supervision Cartographique & Télémétrie Live
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Visualisez en direct sur carte MapLibre interactive la position GPS des
                  techniciens, leurs états opérationnels (disponible, en route, sur site) et les
                  incidents actifs.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100">
                <Link
                  href="/dashboard/supervision"
                  className="text-xs font-bold text-[#31525B] group-hover:text-[#FFA101] transition-colors flex items-center gap-1.5"
                >
                  <span>Accéder à la carte de supervision</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* 2. Gestion des Techniciens & Matrice de Compétences */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#FFA101]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFA101] text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  <Sliders className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 mb-2.5">
                  Disponibilités & Compétences
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                  Gestion des Techniciens & Compétences
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Cartographiez les compétences techniques de vos équipes (Hardware, Systèmes,
                  Réseaux). Le superviseur assigne les tickets avec vérification automatique de
                  l'activité du technicien et de ses périodes de congés pour éliminer tout conflit
                  d'agenda.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100">
                <Link
                  href="/dashboard/techniciens"
                  className="text-xs font-bold text-[#31525B] group-hover:text-[#FFA101] transition-colors flex items-center gap-1.5"
                >
                  <span>Gérer l'équipe technique</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* 3. Gouvernance CMDB & Carnet de Santé */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#2E8B57]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#2E8B57] text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-[#2E8B57] mb-2.5">
                  Traçabilité Matérielle
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                  Gestion CMDB & Carnet de Santé des Actifs
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Fiches complètes par équipement (serveurs, switches, postes), génération
                  automatique de QR Codes pérennes, calcul algorithmique du score de fiabilité et
                  export PDF certifié.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100">
                <Link
                  href="/dashboard/equipements"
                  className="text-xs font-bold text-[#31525B] group-hover:text-[#FFA101] transition-colors flex items-center gap-1.5"
                >
                  <span>Consulter le parc d'équipements</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* 4. Monitoring SLA & Escalade des Alertes */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-red-400/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-red-50 border border-red-200 text-[11px] font-bold text-red-700 mb-2.5">
                  Respect des Délais & Contrats
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                  Surveillance des SLA & Centre d'Alertes
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Suivi en temps réel des chronomètres SLA contractuels (&lt; 2h / &lt; 4h).
                  Détection proactive des tickets à risque avec notifications visuelles et alertes
                  critiques avant tout dépassement.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100">
                <Link
                  href="/dashboard/alertes"
                  className="text-xs font-bold text-[#31525B] group-hover:text-[#FFA101] transition-colors flex items-center gap-1.5"
                >
                  <span>Voir le centre d'alertes SLA</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* 5. Moteur Analytique & KPI MTTR */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#31525B]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-[#FFA101] flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-800 mb-2.5">
                  KPIs & Métriques Décisionnelles
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                  Analytique Avancée & Calcul du MTTR
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Mesurez précisément le temps moyen de résolution (MTTR), le taux de récidive des
                  pannes et la charge de travail par technicien pour optimiser la rentabilité de
                  votre service support.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100">
                <Link
                  href="/dashboard/statistiques"
                  className="text-xs font-bold text-[#31525B] group-hover:text-[#FFA101] transition-colors flex items-center gap-1.5"
                >
                  <span>Explorer les statistiques & KPIs</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* 6. Exports & Bilans d'Activité Direction */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#31525B]/90 text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[11px] font-bold text-[#31525B] mb-2.5">
                  Exports Excel & PDF Structurés
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                  Reporting Direction & Fiches Signées
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Exportez en un clic vos tableaux de bord Excel multi-onglets formatés (tickets,
                  respect SLA, parcs) et archivez des fiches d'intervention binaires certifiées avec
                  signatures tactiles et photos horodatées.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100">
                <Link
                  href="/dashboard/tickets"
                  className="text-xs font-bold text-[#31525B] group-hover:text-[#FFA101] transition-colors flex items-center gap-1.5"
                >
                  <span>Gérer les tickets & exports</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bandeau d'aperçu immersif du cockpit */}
          <div className="mt-12 bg-[#31525B] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#FFA101]/20 blur-[90px] pointer-events-none" />
            <div className="relative z-10 max-w-2xl space-y-3">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                Une vue à 360° sur toute l'activité informatique de vos clients
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Connectez-vous dès maintenant pour créer des comptes techniciens, attribuer des
                compétences, déclarer de nouveaux parcs CMDB et suivre chaque intervention minute
                par minute.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#FFA101] hover:bg-amber-500 text-slate-950 font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Accéder au Cockpit</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>
              <Link
                href="/dashboard/supervision"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4 text-[#FFA101]" />
                <span>Voir la carte Live</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Les Deux Piliers : Hardware vs Software */}
      <section id="services" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-[#FFA101] uppercase tracking-wider">
              Une Prise en Charge Globale
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              L'Équilibre Parfait Matériel & Logiciel
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Chaque incident est traité avec rigueur qu'il s'agisse d'une défaillance physique de
              composant ou d'un dysfonctionnement applicatif et réseau.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pilier 1 : Maintenance Matérielle (Hardware) */}
            <div className="bg-gradient-to-br from-[#FAFAF8] to-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#31525B]/40 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-[#31525B] text-[#FFA101] flex items-center justify-center mb-6 shadow-md shadow-[#31525B]/20 group-hover:scale-105 transition-transform">
                <Cpu className="w-7 h-7" />
              </div>

              <div className="inline-block px-3 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] font-bold text-amber-900 mb-3">
                Pilier Physique • Équipements & Composants
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                Maintenance Matérielle (Hardware)
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Interventions directes sur les infrastructures physiques, postes de travail, parcs
                de serveurs, réseaux d'entreprise et périphériques.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200/80">
                <div className="flex items-start gap-3">
                  <Wrench className="w-4 h-4 text-[#FFA101] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 font-medium leading-5">
                    <strong>Dépannage & Remplacement :</strong> Alimentations, mémoires RAM, disques
                    durs, cartes mères, écrans et connectique.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Server className="w-4 h-4 text-[#FFA101] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 font-medium leading-5">
                    <strong>Infrastructures Réseaux :</strong> Câblage structuré, armoires de
                    brassage, switches configurables, routeurs et onduleurs.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <QrCode className="w-4 h-4 text-[#FFA101] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 font-medium leading-5">
                    <strong>Gestion de Parc CMDB :</strong> Identification par QR Code et
                    traçabilité du cycle de vie de chaque actif physique.
                  </p>
                </div>
              </div>
            </div>

            {/* Pilier 2 : Maintenance Logicielle (Software) */}
            <div className="bg-gradient-to-br from-[#FAFAF8] to-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#FFA101]/40 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-[#FFA101] text-white flex items-center justify-center mb-6 shadow-md shadow-[#FFA101]/20 group-hover:scale-105 transition-transform">
                <Terminal className="w-7 h-7" />
              </div>

              <div className="inline-block px-3 py-1 rounded-lg bg-teal-50 border border-teal-200/80 text-[11px] font-bold text-[#31525B] mb-3">
                Pilier Virtuel • Systèmes & Cloud
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                Maintenance Logicielle (Software)
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Maintien en condition opérationnelle des systèmes d'exploitation, logiciels métiers,
                sauvegardes cloud et protocoles de cybersécurité.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200/80">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#2E8B57] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 font-medium leading-5">
                    <strong>Sécurité & Antivirus :</strong> Détection, éradication de malwares,
                    pare-feu et application des correctifs de sécurité critiques.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <HardDrive className="w-4 h-4 text-[#31525B] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 font-medium leading-5">
                    <strong>Sauvegardes Cloud B2 :</strong> Plans de continuité d'activité (PCA/PRA)
                    et restauration rapide des données d'entreprise.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Bot className="w-4 h-4 text-[#FFA101] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 font-medium leading-5">
                    <strong>Diagnostic IA Prédictif :</strong> Corrélation des pannes avec
                    l'historique des incidents grâce à Google Gemini 3.5 Flash-Lite.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Outils Terrain & Écosystème Connecté */}
      <section id="terrain" className="py-20 bg-[#F4F4F5]/60 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-1 space-y-4">
              <span className="text-xs font-bold text-[#31525B] uppercase tracking-wider">
                Écosystème Temps Réel
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Une Passerelle Directe entre Cockpit et Terrain
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Les interventions créées par le superviseur sont immédiatement distribuées aux
                techniciens accrédités sur leur application mobile native.
              </p>

              <div className="pt-2">
                <Link
                  href="/dashboard/tickets"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#31525B] hover:text-[#FFA101] transition-colors"
                >
                  <span>Explorer le gestionnaire de tickets</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#31525B]/10 text-[#31525B] flex items-center justify-center mb-3">
                  <Navigation className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Guidage GPS Embarqué</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Cartographie Leaflet OpenStreetMap intégrée et calcul d'itinéraires précis sans
                  frais via le moteur OSRM.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#FFA101] flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Sécurité Biométrique</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Authentification rapide par empreinte digitale ou FaceID pour les techniciens sur
                  le terrain.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E8B57] flex items-center justify-center mb-3">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Rapports & Signatures</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Génération immédiate de fiches d'intervention avec signature tactile du client et
                  sauvegarde pérenne.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#31525B] flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-[#FFA101]" />
                </div>
                <h4 className="text-base font-bold text-slate-900">IA Hybride Embarquée</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Résolution guidée Google Gemini + moteur local pour diagnostic sans interruption
                  même hors-ligne.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer Professionnel Unifié */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <AlloTechLogo size={36} showText={true} textColor="text-slate-900" />
              <span className="hidden sm:inline text-slate-300">|</span>
              <p className="text-xs text-slate-500 font-medium">
                Plateforme de Maintenance Informatique & Gestion de Parc
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
              <a href="#cockpit" className="hover:text-[#31525B] transition">
                Tour de Contrôle Admin
              </a>
              <Link href="/dashboard/supervision" className="hover:text-[#31525B] transition">
                Supervision Live
              </Link>
              <Link href="/connexion" className="hover:text-[#31525B] transition">
                Connexion
              </Link>
              <Link href="/dashboard" className="hover:text-[#FFA101] transition">
                Tableau de bord
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>© {new Date().getFullYear()} AlloTech. Tous droits réservés.</p>
            <p className="flex items-center gap-1.5 font-medium">
              <span>Plateforme conçue & développée par</span>
              <strong className="text-[#31525B] font-bold">Marc Didier</strong>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

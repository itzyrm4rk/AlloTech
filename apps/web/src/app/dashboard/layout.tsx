'use client';

import { AlloTechLogo } from '@/components/AlloTechLogo';
import { authClient } from '@allotech/auth/client';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  Ticket,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navLinks = [
  {
    href: '/dashboard',
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/dashboard/supervision',
    label: 'Supervision Live',
    icon: Radio,
    exact: false,
    live: true,
  },
  {
    href: '/dashboard/tickets',
    label: 'Tickets',
    icon: Ticket,
    exact: false,
    badge: null,
  },
  {
    href: '/dashboard/clients',
    label: 'Clients',
    icon: Building2,
    exact: false,
  },
  {
    href: '/dashboard/equipements',
    label: 'Équipements',
    icon: Cpu,
    exact: false,
  },
  {
    href: '/dashboard/techniciens',
    label: 'Techniciens',
    icon: Wrench,
    exact: false,
  },
  {
    href: '/dashboard/competences',
    label: 'Compétences',
    icon: Award,
    exact: false,
  },
  {
    href: '/dashboard/statistiques',
    label: 'Statistiques',
    icon: BarChart3,
    exact: false,
  },
];

function Sidebar({
  open,
  onClose,
  pathname,
  onLogout,
  adminName,
  adminImage,
  unreadAlertsCount = 0,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  onLogout: () => void;
  adminName: string;
  adminImage?: string | null;
  unreadAlertsCount?: number;
}) {
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden cursor-pointer"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
          role="button"
          tabIndex={0}
          aria-label="Fermer le menu latéral"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-slate-200/80 shadow-sm flex flex-col transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center">
            <AlloTechLogo size={36} showText={true} />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </p>
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href, link.exact ?? false);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                      ${
                        active
                          ? 'bg-[#31525B] text-white shadow-md shadow-[#31525B]/20 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-[#FFA101]' : 'text-slate-400'}`}
                    />
                    <span className="flex-1 flex items-center gap-2">
                      {link.label}
                      {link.live && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-[#FFA101]" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Section alertes */}
          <div className="mt-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Système
            </p>
            <Link
              href="/dashboard/alertes"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${
                  pathname.startsWith('/dashboard/alertes')
                    ? 'bg-[#31525B] text-white shadow-md shadow-[#31525B]/20 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <AlertTriangle
                className={`w-4.5 h-4.5 flex-shrink-0 ${pathname.startsWith('/dashboard/alertes') ? 'text-[#FFA101]' : 'text-slate-400'}`}
              />
              <span className="flex-1">Alertes</span>
              {unreadAlertsCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-rose-500 text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        {/* Profil Admin + Déconnexion */}
        <div className="border-t border-slate-100 px-3 py-4 flex-shrink-0 bg-slate-50/50">
          <Link
            href="/dashboard/profil"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl hover:bg-white hover:shadow-xs transition-colors group"
            title="Gérer mon profil"
          >
            {adminImage ? (
              <img
                src={adminImage}
                alt={adminName}
                className="w-8 h-8 rounded-full object-cover border border-[#FFA101] flex-shrink-0 group-hover:ring-2 group-hover:ring-[#FFA101] transition-all"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#31525B] to-[#FFA101] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 group-hover:ring-2 group-hover:ring-[#FFA101] transition-all">
                {adminName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#FFA101] transition-colors">
                {adminName}
              </p>
              <p className="text-xs text-slate-400">Administrateur • Profil</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <LogOut className="w-4.5 h-4.5 text-slate-400" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveProfile, setLiveProfile] = useState<{
    name?: string;
    image?: string | null;
  }>({});
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);

  // Synchronisation du compteur d'alertes non lues (chargement initial, navigation, polling léger et custom events)
  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh alert count on route change
  useEffect(() => {
    let isMounted = true;
    const fetchUnreadAlerts = () => {
      fetch('/api/alertes?nonLuesSeulement=true')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (isMounted && typeof data?.unreadCount === 'number') {
            setUnreadAlertsCount(data.unreadCount);
          }
        })
        .catch(() => {});
    };

    fetchUnreadAlerts();
    const interval = setInterval(fetchUnreadAlerts, 25000);

    const handleAlertesUpdated = () => {
      fetchUnreadAlerts();
    };
    window.addEventListener('allotech:alertes-updated', handleAlertesUpdated);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('allotech:alertes-updated', handleAlertesUpdated);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/connexion');
    }
  }, [session, isPending, router]);

  // Écoute des mises à jour de profil instantanées émises depuis la page Profil
  useEffect(() => {
    const handleProfileUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ name?: string; image?: string | null }>;
      if (custom.detail) {
        setLiveProfile((prev) => ({
          ...prev,
          ...(custom.detail.name ? { name: custom.detail.name } : {}),
          ...(custom.detail.image !== undefined ? { image: custom.detail.image } : {}),
        }));
      }
    };

    window.addEventListener('allotech:profile-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('allotech:profile-updated', handleProfileUpdated);
    };
  }, []);

  // Récupération de la photo et du nom enregistrés en base au chargement initial (optimisé pour Neon Free Tier)
  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch profile once on mount
  useEffect(() => {
    if (!pathname) return;
    let isMounted = true;
    fetch('/api/auth/update-profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (isMounted && data?.success) {
          setLiveProfile({
            name: data.name || `${data.prenom || ''} ${data.nom || ''}`.trim() || undefined,
            image: data.image ?? null,
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/connexion');
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-[#FFA101] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const adminName = liveProfile.name || session.user?.name || 'Administrateur';
  const adminImage =
    liveProfile.image !== undefined ? liveProfile.image : (session.user?.image ?? null);

  return (
    <div className="flex h-screen bg-[#F8FAFB] overflow-hidden text-[#1A2C31]">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pathname={pathname}
        onLogout={handleLogout}
        adminName={adminName}
        adminImage={adminImage}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFB]">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-20 lg:hidden bg-white/95 backdrop-blur border-b border-slate-200/80 h-14 flex items-center px-4 gap-3 flex-shrink-0 shadow-xs">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center">
            <AlloTechLogo size={28} showText={true} />
          </Link>

          {/* Bell alertes & Avatar mobile */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/dashboard/alertes"
              className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex items-center justify-center"
              aria-label="Alertes système"
            >
              <Bell className="w-5 h-5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                  {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                </span>
              )}
            </Link>
            <Link href="/dashboard/profil" className="flex items-center" aria-label="Mon profil">
              {adminImage ? (
                <img
                  src={adminImage}
                  alt={adminName}
                  className="w-7 h-7 rounded-full object-cover border border-[#FFA101]"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#31525B] to-[#FFA101] flex items-center justify-center text-white text-xs font-bold">
                  {adminName.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Zone de scroll du contenu */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

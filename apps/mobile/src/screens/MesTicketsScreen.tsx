import { CalendarOff, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NetworkBanner } from '../components/NetworkBanner';
import { TicketFilterBar, TicketListItem } from '../components/ticket';
import type { StoredUser } from '../lib/auth-storage';
import { getCachedTickets, saveTicketsToCache } from '../lib/offlineDb';
import { trpcClient } from '../lib/trpc';
import type { Statut, Ticket, Urgence } from '../types/ticket.types';

// Re-exports pour la rétrocompatibilité
export type { Statut, Ticket, Urgence };
export { TicketListItem as TicketCard };

// Salutation dynamique selon l'heure
function getSalutation(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bonjour';
  if (h >= 12 && h < 18) return 'Bon après-midi';
  if (h >= 18 && h < 22) return 'Bonsoir';
  return 'Bonne nuit';
}

interface MesTicketsScreenProps {
  currentUser: StoredUser | null;
  onTicketPress: (ticket: Ticket) => void;
}

export function MesTicketsScreen({ currentUser, onTicketPress }: MesTicketsScreenProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasActiveAbsence, setHasActiveAbsence] = useState(false);

  // ---- Chargement données ----
  const loadTickets = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await trpcClient.tickets.mesTickets.query();
      const mapped: Ticket[] = ((data as Record<string, unknown>[]) || []).map((t) => ({
        id: String(t.id),
        reference: String(t.reference),
        client: (t.client as { nom?: string })?.nom || 'Client AlloTech',
        clientType: (t.client as { typeClient?: 'ENTREPRISE' | 'PARTICULIER' })?.typeClient || null,
        clientTelephone: (t.client as { telephone?: string })?.telephone || null,
        adresseSite:
          (t.site as { adresse?: string; nom?: string })?.adresse ||
          (t.site as { adresse?: string; nom?: string })?.nom ||
          'Douala, Cameroun',
        latitudeSite: (t.site as { latitude?: number })?.latitude
          ? String((t.site as { latitude?: number }).latitude)
          : null,
        longitudeSite: (t.site as { longitude?: number })?.longitude
          ? String((t.site as { longitude?: number }).longitude)
          : null,
        statut: ((t.statutActuel as string) || 'ASSIGNEE') as Statut,
        urgence: ((t.urgence as string) || 'NORMALE') as Urgence,
        typeDemande: (t.typeDemande as string) || 'MAINTENANCE',
        description: (t.description as string) || 'Intervention terrain.',
        createdAt: t.createdAt ? String(t.createdAt) : new Date().toISOString(),
        techniciensCount: Array.isArray(t.techniciens) ? t.techniciens.length : undefined,
      }));
      setTickets(mapped);
      saveTicketsToCache(mapped);
    } catch (err) {
      console.warn('[MesTicketsScreen] Erreur réseau, lecture du cache SQLite local:', err);
      const cached = getCachedTickets<Ticket>();
      if (cached.length > 0) {
        setTickets(cached);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const checkAbsence = useCallback(async () => {
    try {
      const profil = await trpcClient.techniciens.monProfil.query();
      setHasActiveAbsence(Boolean(profil?.hasActiveAbsence));
    } catch {
      setHasActiveAbsence(false);
    }
  }, []);

  useEffect(() => {
    const cached = getCachedTickets<Ticket>();
    if (cached.length > 0) {
      setTickets(cached);
      setIsLoading(false);
    }
    void loadTickets(cached.length > 0);
    void checkAbsence();
  }, [loadTickets, checkAbsence]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadTickets(true);
      void checkAbsence();
    }, 30_000);
    return () => clearInterval(interval);
  }, [loadTickets, checkAbsence]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadTickets(true);
    void checkAbsence();
  }, [loadTickets, checkAbsence]);

  // ---- Métriques ----
  const enCoursCount = tickets.filter(
    (t) => t.statut === 'EN_COURS' || t.statut === 'EN_ROUTE' || t.statut === 'EN_PAUSE',
  ).length;
  const aTraiterCount = tickets.filter((t) => t.statut === 'ASSIGNEE').length;
  const terminesCount = tickets.filter(
    (t) => t.statut === 'TERMINEE' || t.statut === 'CLOTUREE',
  ).length;
  const urgentsCount = tickets.filter(
    (t) =>
      (t.urgence === 'CRITIQUE' || t.urgence === 'HAUTE') &&
      t.statut !== 'CLOTUREE' &&
      t.statut !== 'TERMINEE',
  ).length;

  // ---- Filtres ----
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatut =
        filterStatut === 'TOUS'
          ? true
          : filterStatut === 'EN_COURS'
            ? t.statut === 'EN_COURS' || t.statut === 'EN_ROUTE' || t.statut === 'EN_PAUSE'
            : filterStatut === 'TERMINEE' || filterStatut === 'CLOTUREE'
              ? t.statut === 'TERMINEE' || t.statut === 'CLOTUREE'
              : t.statut === filterStatut;
      if (!matchesStatut) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        t.client.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.adresseSite.toLowerCase().includes(q)
      );
    });
  }, [tickets, filterStatut, searchQuery]);

  const salutation = getSalutation();
  const prenom = currentUser?.prenom || 'Technicien';

  // ---- Header section ----
  const ListHeader = (
    <View>
      {/* Bandeau statut réseau / sync */}
      <NetworkBanner onSyncComplete={() => void loadTickets(true)} />

      {/* Bannière d'alerte compte */}
      {currentUser?.isActif === false && (
        <View style={styles.bannerWarning}>
          <ShieldAlert size={15} color="#92400E" />
          <Text style={styles.bannerText}>
            Votre compte est en cours d'activation par l'administrateur.
          </Text>
        </View>
      )}
      {hasActiveAbsence && (
        <View style={styles.bannerAbsence}>
          <CalendarOff size={15} color="#065F46" />
          <Text style={[styles.bannerText, { color: '#065F46' }]}>
            Période d'absence déclarée — vous êtes dispensé d'interventions.
          </Text>
        </View>
      )}

      {/* Hero section : Salutation */}
      <View style={styles.hero}>
        <Text style={styles.heroGreeting}>{salutation},</Text>
        <Text style={styles.heroName}>{prenom} 👋</Text>
        <Text style={styles.heroSub}>
          {tickets.length === 0
            ? 'Aucune intervention assignée'
            : aTraiterCount + enCoursCount === 0
              ? `Toutes vos interventions sont traitées (${terminesCount} clôturée${terminesCount > 1 ? 's' : ''})`
              : `${aTraiterCount + enCoursCount} intervention${aTraiterCount + enCoursCount > 1 ? 's' : ''} à traiter • ${terminesCount} clôturée${terminesCount > 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Barre de stats, recherche et filtres */}
      <TicketFilterBar
        totalCount={tickets.length}
        filteredCount={filteredTickets.length}
        enCoursCount={enCoursCount}
        aTraiterCount={aTraiterCount}
        urgentsCount={urgentsCount}
        terminesCount={terminesCount}
        filterStatut={filterStatut}
        onFilterStatutChange={setFilterStatut}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />
    </View>
  );

  // ---- Empty state ----
  const EmptyState = isLoading ? (
    <View style={styles.emptyLoading}>
      <ActivityIndicator size="large" color="#FFA101" />
      <Text style={styles.emptyLoadingText}>Synchronisation…</Text>
    </View>
  ) : (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <CheckCircle2 size={32} color="#10B981" />
      </View>
      <Text style={styles.emptyTitle}>{searchQuery ? 'Aucun résultat' : 'Vous êtes à jour !'}</Text>
      <Text style={styles.emptySub}>
        {searchQuery
          ? 'Essayez un autre terme de recherche.'
          : 'Aucune intervention assignée pour le moment.'}
      </Text>
      {(searchQuery.length > 0 || filterStatut !== 'TOUS') && (
        <TouchableOpacity
          onPress={() => {
            setSearchQuery('');
            setFilterStatut('TOUS');
          }}
          style={styles.emptyReset}
        >
          <Text style={styles.emptyResetText}>Réinitialiser</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <FlatList
      data={filteredTickets}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TicketListItem ticket={item} onPress={onTicketPress} />}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#FFA101"
          colors={['#FFA101']}
        />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={EmptyState}
      style={{ backgroundColor: '#F1F5F9' }}
    />
  );
}

const styles = StyleSheet.create({
  // ---- Banners ----
  bannerWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
  },
  bannerAbsence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 18,
  },

  // ---- Hero ----
  hero: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  heroGreeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },

  // ---- FlatList ----
  listContent: {
    paddingBottom: 50,
  },

  // ---- Empty state ----
  emptyLoading: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 14,
  },
  emptyLoadingText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  emptyBox: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyReset: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyResetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#31525B',
  },
});

import { Bell, Camera, MapPin, QrCode, Ticket, User } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LogBox,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import './global.css';
import './src/lib/cssInterop';
import { AlloTechLogo } from './src/components/AlloTechLogo';
import {
  type StoredUser,
  clearSession,
  getSessionToken,
  getStoredUser,
  saveSession,
} from './src/lib/auth-storage';
import {
  listenNotificationTap,
  setupNotifications,
  showSystemNotification,
} from './src/lib/notifications';
import { trpcClient } from './src/lib/trpc';
import { NotificationsModal } from './src/modals/NotificationsModal';
import { PhotoCaptureModal } from './src/modals/PhotoCaptureModal';
import { QrScanModal } from './src/modals/QrScanModal';
import { CarteScreen } from './src/screens/CarteScreen';
import { ConnexionScreen } from './src/screens/ConnexionScreen';
import { DetailTicketScreen } from './src/screens/DetailTicketScreen';
import { InscriptionScreen } from './src/screens/InscriptionScreen';
import { MesTicketsScreen, type Ticket as TicketType } from './src/screens/MesTicketsScreen';
import { ProfilScreen } from './src/screens/ProfilScreen';

LogBox.ignoreLogs(['Cannot connect to Expo CLI.', 'Running "main" with', 'expo-constants']);

type Screen = 'CONNEXION' | 'INSCRIPTION' | 'TERRAIN';

// ─── Composant interne Terrain (tous les hooks en tête) ───────────────────────

function TerrainApp({
  currentUser,
  onLogout,
  onUserUpdated,
  onTicketPress,
  onBackFromTicket,
  selectedTicket,
  onSelectTicketById,
}: {
  currentUser: StoredUser | null;
  onLogout: () => void;
  onUserUpdated: (u: StoredUser) => void;
  onTicketPress: (t: TicketType) => void;
  selectedTicket: TicketType | null;
  onBackFromTicket: () => void;
  onSelectTicketById: (ticketId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'CARTE' | 'PROFIL'>('TICKETS');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showQrScan, setShowQrScan] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const lastUnreadCountRef = useRef<number | null>(null);

  // Polling compteur de notifications avec émission de notification système si nouvelle alerte
  useEffect(() => {
    let isMounted = true;
    const fetchUnreadCount = async () => {
      try {
        const res = await trpcClient.alertes.countNonLues.query();
        if (isMounted && typeof res.count === 'number') {
          if (lastUnreadCountRef.current !== null && res.count > lastUnreadCountRef.current) {
            // Une nouvelle alerte est arrivée pour le technicien : on émet une notification système dans le volet Android
            try {
              const latestList = await trpcClient.alertes.list.query({
                nonLuesSeulement: true,
                limit: 1,
              });
              if (latestList && latestList.length > 0) {
                const first = latestList[0];
                await showSystemNotification({
                  title: 'Nouvelle alerte d’intervention',
                  body: first.message,
                  ticketId: first.ticketId || undefined,
                });
              }
            } catch {
              await showSystemNotification({
                title: 'AlloTech Intervention',
                body: 'Vous avez une nouvelle notification d’intervention.',
              });
            }
          }
          lastUnreadCountRef.current = res.count;
          setUnreadNotificationsCount(res.count);
        }
      } catch {
        // Silencieux si hors ligne
      }
    };
    void fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 25000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const syncProfile = async () => {
      try {
        const profile = await trpcClient.auth.me.query();
        if (
          isMounted &&
          profile &&
          profile.role === 'TECHNICIEN' &&
          profile.email &&
          currentUser &&
          (!currentUser.email ||
            currentUser.email.includes('@tech.allotech.cm') ||
            currentUser.email !== profile.email)
        ) {
          const tech = profile.technicien;
          const updated: StoredUser = {
            ...currentUser,
            email: profile.email,
            nom: tech?.nom || currentUser.nom,
            prenom: tech?.prenom || currentUser.prenom,
            telephone: tech?.telephone || currentUser.telephone,
            photoUrl: tech?.photoUrl || currentUser.photoUrl,
          };
          const token = await getSessionToken();
          if (token) {
            await saveSession(token, updated);
          }
          onUserUpdated(updated);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('Vous devez être connecté')) {
          console.warn('[App] Session expirée côté serveur, redirection vers Connexion.');
          onLogout();
        }
      }
    };
    void syncProfile();
    return () => {
      isMounted = false;
    };
  }, [currentUser, onUserUpdated, onLogout]);

  const techPrenom = currentUser?.prenom || 'Technicien';
  const techNom = currentUser?.nom || '';
  const techInitials = `${techPrenom[0] || 'T'}${techNom[0] || 'C'}`.toUpperCase();
  const headerBg = activeTab === 'TICKETS' ? '#F1F5F9' : '#FFFFFF';
  const headerBorder = activeTab === 'TICKETS' ? 'transparent' : '#E4E4E7';

  // Si un ticket est sélectionné → écran Détail
  if (selectedTicket) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
        <DetailTicketScreen ticket={selectedTicket} onBack={onBackFromTicket} />
      </>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: headerBg }}>
      <StatusBar barStyle="dark-content" backgroundColor={headerBg} />

      {/* Modales globales */}
      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUnreadCountChanged={(count) => setUnreadNotificationsCount(count)}
        onSelectTicket={(ticketId) => {
          setShowNotifications(false);
          onSelectTicketById(ticketId);
        }}
      />
      <QrScanModal visible={showQrScan} onClose={() => setShowQrScan(false)} />
      <PhotoCaptureModal visible={showPhotoCapture} onClose={() => setShowPhotoCapture(false)} />

      {/* En-tête : Avatar à gauche, Cloche à droite */}
      <View
        style={{
          backgroundColor: headerBg,
          borderBottomWidth: activeTab === 'TICKETS' ? 0 : 1,
          borderBottomColor: headerBorder,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('PROFIL')}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}
          accessibilityLabel="Voir mon profil"
        >
          {currentUser?.photoUrl ? (
            <Image
              source={{ uri: currentUser.photoUrl }}
              style={{ width: 38, height: 38, borderRadius: 19 }}
            />
          ) : (
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#31525B',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                {techInitials}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E293B' }} numberOfLines={1}>
              {techPrenom} {techNom}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>
              {currentUser?.matricule ? `#${currentUser.matricule}` : 'AlloTech Terrain'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Actions rapides d'en-tête */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowQrScan(true)}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: activeTab === 'TICKETS' ? '#FFFFFF' : '#F1F5F9',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="Scanner un équipement"
          >
            <QrCode size={19} color="#31525B" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: activeTab === 'TICKETS' ? '#FFFFFF' : '#F1F5F9',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color="#31525B" />
            {unreadNotificationsCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  minWidth: 17,
                  height: 17,
                  paddingHorizontal: 3,
                  backgroundColor: '#FFA101',
                  borderRadius: 9,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: headerBg,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF' }}>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenu de l'onglet actif */}
      <View style={{ flex: 1 }}>
        {activeTab === 'TICKETS' ? (
          <MesTicketsScreen currentUser={currentUser} onTicketPress={onTicketPress} />
        ) : activeTab === 'CARTE' ? (
          <CarteScreen currentUser={currentUser} onTicketPress={onTicketPress} />
        ) : (
          <ProfilScreen
            currentUser={currentUser}
            onLogout={onLogout}
            onUserUpdated={onUserUpdated}
          />
        )}
      </View>

      {/* Barre de navigation basse */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          flexDirection: 'row',
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingHorizontal: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 8,
        }}
      >
        {/* 1. Tickets */}
        <TouchableOpacity
          onPress={() => setActiveTab('TICKETS')}
          activeOpacity={0.7}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            paddingVertical: 4,
          }}
          accessibilityLabel="Mes interventions"
        >
          <Ticket size={22} color={activeTab === 'TICKETS' ? '#FFA101' : '#CBD5E1'} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: activeTab === 'TICKETS' ? '#FFA101' : '#94A3B8',
            }}
          >
            Tickets
          </Text>
          {activeTab === 'TICKETS' && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                width: 20,
                height: 2.5,
                borderRadius: 2,
                backgroundColor: '#FFA101',
              }}
            />
          )}
        </TouchableOpacity>

        {/* 2. Carte */}
        <TouchableOpacity
          onPress={() => setActiveTab('CARTE')}
          activeOpacity={0.7}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            paddingVertical: 4,
          }}
          accessibilityLabel="Carte des interventions"
        >
          <MapPin size={22} color={activeTab === 'CARTE' ? '#FFA101' : '#CBD5E1'} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: activeTab === 'CARTE' ? '#FFA101' : '#94A3B8',
            }}
          >
            Carte
          </Text>
          {activeTab === 'CARTE' && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                width: 20,
                height: 2.5,
                borderRadius: 2,
                backgroundColor: '#FFA101',
              }}
            />
          )}
        </TouchableOpacity>

        {/* 3. Scanner — bouton central surélevé */}
        <TouchableOpacity
          onPress={() => setShowQrScan(true)}
          activeOpacity={0.75}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            paddingVertical: 4,
          }}
          accessibilityLabel="Scanner QR Équipement"
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: '#31525B',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -16,
              shadowColor: '#31525B',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <QrCode size={20} color="#FFFFFF" />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#31525B', marginTop: 2 }}>
            Scanner
          </Text>
        </TouchableOpacity>

        {/* 4. Caméra */}
        <TouchableOpacity
          onPress={() => setShowPhotoCapture(true)}
          activeOpacity={0.7}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            paddingVertical: 4,
          }}
          accessibilityLabel="Prendre une photo"
        >
          <Camera size={22} color="#CBD5E1" />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#94A3B8' }}>Caméra</Text>
        </TouchableOpacity>

        {/* 5. Profil */}
        <TouchableOpacity
          onPress={() => setActiveTab('PROFIL')}
          activeOpacity={0.7}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            paddingVertical: 4,
          }}
          accessibilityLabel="Mon profil"
        >
          <User size={22} color={activeTab === 'PROFIL' ? '#FFA101' : '#CBD5E1'} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: activeTab === 'PROFIL' ? '#FFA101' : '#94A3B8',
            }}
          >
            Profil
          </Text>
          {activeTab === 'PROFIL' && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                width: 20,
                height: 2.5,
                borderRadius: 2,
                backgroundColor: '#FFA101',
              }}
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Composant racine App ─────────────────────────────────────────────────────

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('CONNEXION');
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  // Initialisation session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const sessionPromise = (async () => {
          const token = await getSessionToken();
          const user = await getStoredUser();
          return { token, user };
        })();

        const timeoutPromise = new Promise<{ token: null; user: null }>((resolve) =>
          setTimeout(() => resolve({ token: null, user: null }), 1000),
        );

        const { token, user } = await Promise.race([sessionPromise, timeoutPromise]);

        if (isMounted && token && user) {
          setCurrentUser(user);
          setCurrentScreen('TERRAIN');
          return;
        }
      } catch {
        // Timeout ou erreur → écran connexion
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    }

    void initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = useCallback(async () => {
    const user = await getStoredUser();
    setCurrentUser(user);
    setCurrentScreen('TERRAIN');
  }, []);

  const handleLogout = useCallback(async () => {
    await clearSession();
    setCurrentUser(null);
    setSelectedTicket(null);
    setCurrentScreen('CONNEXION');
  }, []);

  const handleUserUpdated = useCallback((updated: StoredUser) => {
    setCurrentUser((prev) => {
      if (
        prev &&
        prev.id === updated.id &&
        prev.email === updated.email &&
        prev.nom === updated.nom &&
        prev.prenom === updated.prenom &&
        prev.telephone === updated.telephone &&
        prev.photoUrl === updated.photoUrl
      ) {
        return prev;
      }
      return updated;
    });
  }, []);

  const handleTicketPress = useCallback((ticket: TicketType) => {
    setSelectedTicket(ticket);
  }, []);

  const handleBackFromTicket = useCallback(() => {
    setSelectedTicket(null);
  }, []);

  const handleSelectTicketById = useCallback(async (ticketId: string) => {
    try {
      const raw = await trpcClient.tickets.byId.query({ id: ticketId });
      if (raw) {
        const rawClient = raw.client as
          | { nom?: string; typeClient?: 'ENTREPRISE' | 'PARTICULIER'; telephone?: string }
          | null
          | undefined;

        const mappedTicket: TicketType = {
          id: String(raw.id),
          reference: String(raw.reference),
          client: rawClient?.nom || 'Client AlloTech',
          clientType: rawClient?.typeClient || null,
          clientTelephone: rawClient?.telephone || null,
          adresseSite: raw.adresseSite || 'Douala, Cameroun',
          latitudeSite: raw.latitudeSite ? String(raw.latitudeSite) : null,
          longitudeSite: raw.longitudeSite ? String(raw.longitudeSite) : null,
          statut: ((raw.statutActuel as string) || 'ASSIGNEE') as TicketType['statut'],
          urgence: ((raw.urgence as string) || 'NORMALE') as TicketType['urgence'],
          typeDemande: (raw.typeDemande as string) || 'MAINTENANCE',
          description: (raw.description as string) || 'Intervention terrain.',
          createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
          techniciensCount: Array.isArray(raw.techniciens) ? raw.techniciens.length : undefined,
        };
        setSelectedTicket(mappedTicket);
      }
    } catch (err) {
      console.warn('[handleSelectTicketById] Erreur chargement ticket:', err);
    }
  }, []);

  // Configuration des notifications Android / iOS et écoute du clic sur notification
  useEffect(() => {
    void setupNotifications();
    const unsubscribe = listenNotificationTap((ticketId) => {
      void handleSelectTicketById(ticketId);
    });
    return () => {
      unsubscribe();
    };
  }, [handleSelectTicketById]);

  // ---- Rendu conditionnel (APRÈS tous les hooks) ----

  if (isInitializing) {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: '#F8FAFB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
          <View style={{ alignItems: 'center', gap: 20 }}>
            <AlloTechLogo size={56} showText subtitle="Initialisation sécurisée…" />
            <ActivityIndicator size="small" color="#FFA101" />
            <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700', marginTop: 12 }}>
              AlloTech Mobile • v1.0.0 by Marc Didier
            </Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (currentScreen === 'INSCRIPTION') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
        <InscriptionScreen
          onSuccess={() => setCurrentScreen('CONNEXION')}
          onNavigateToConnexion={() => setCurrentScreen('CONNEXION')}
        />
      </SafeAreaProvider>
    );
  }

  if (currentScreen === 'CONNEXION') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
        <ConnexionScreen
          onSuccess={handleLoginSuccess}
          onNavigateToInscription={() => setCurrentScreen('INSCRIPTION')}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <TerrainApp
        currentUser={currentUser}
        onLogout={handleLogout}
        onUserUpdated={handleUserUpdated}
        onTicketPress={handleTicketPress}
        onBackFromTicket={handleBackFromTicket}
        selectedTicket={selectedTicket}
        onSelectTicketById={handleSelectTicketById}
      />
    </SafeAreaProvider>
  );
}

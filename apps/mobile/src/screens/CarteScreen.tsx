import * as Location from 'expo-location';
import { MapPin, Navigation, RefreshCw, Ticket as TicketIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { StoredUser } from '../lib/auth-storage';
import { getCachedTickets } from '../lib/offlineDb';
import { trpcClient } from '../lib/trpc';
import { MapRouteModal } from '../modals/MapRouteModal';
import type { Ticket } from './MesTicketsScreen';

interface CarteScreenProps {
  currentUser: StoredUser | null;
  onTicketPress: (ticket: Ticket) => void;
}

export function CarteScreen({ onTicketPress }: CarteScreenProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [techCoords, setTechCoords] = useState<{ lat: number; lon: number }>({
    lat: 4.0511,
    lon: 9.7679,
  });

  // Récupération de la position du technicien
  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setTechCoords({
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
        });
      }
    } catch {}
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const data = await trpcClient.tickets.mesTickets.query();
      const mapped: Ticket[] = ((data as Record<string, unknown>[]) || []).map((t) => ({
        id: String(t.id),
        reference: String(t.reference),
        client: (t.client as { nom?: string })?.nom || 'Client AlloTech',
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
        statut: ((t.statutActuel as string) || 'ASSIGNEE') as Ticket['statut'],
        urgence: ((t.urgence as string) || 'NORMALE') as Ticket['urgence'],
        typeDemande: (t.typeDemande as string) || 'MAINTENANCE',
        description: (t.description as string) || 'Intervention terrain',
        createdAt: t.createdAt ? String(t.createdAt) : new Date().toISOString(),
      }));

      setTickets(mapped);
      setSelectedTicket((prev) => prev ?? (mapped.length > 0 ? mapped[0] : null));
    } catch (err) {
      console.warn('[CarteScreen] Erreur réseau, lecture du cache SQLite local:', err);
      const cached = getCachedTickets<Ticket>();
      if (cached.length > 0) {
        setTickets(cached);
        setSelectedTicket((prev) => prev ?? cached[0]);
      }
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    // Affichage immédiat du cache local pour un rendu instantané
    const cached = getCachedTickets<Ticket>();
    if (cached.length > 0) {
      setTickets(cached);
      setSelectedTicket((prev) => prev ?? cached[0]);
      setLoadingTickets(false);
    }
    void getUserLocation();
    void fetchTickets();
  }, [getUserLocation, fetchTickets]);

  // Points GPS pour la carte
  const validPoints = useMemo(() => {
    return tickets.map((t, index) => {
      const fallbackLats = [4.0483, 4.0532, 4.0612, 4.0398, 4.0721];
      const fallbackLons = [9.7027, 9.7145, 9.7289, 9.6912, 9.741];

      const lat = t.latitudeSite
        ? Number.parseFloat(t.latitudeSite)
        : fallbackLats[index % fallbackLats.length];
      const lon = t.longitudeSite
        ? Number.parseFloat(t.longitudeSite)
        : fallbackLons[index % fallbackLons.length];

      return {
        ...t,
        lat,
        lon,
      };
    });
  }, [tickets]);

  // Génération du HTML Leaflet
  const leafletHtml = useMemo(() => {
    const markersJs = validPoints
      .map((p) => {
        const color =
          p.urgence === 'CRITIQUE' ? '#EF4444' : p.urgence === 'HAUTE' ? '#F97316' : '#3B82F6';
        return `
          (function() {
            var icon = L.divIcon({
              className: 'ticket-pin',
              html: '<div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">#</div>',
              iconSize: [26, 26]
            });
            var m = L.marker([${p.lat}, ${p.lon}], { icon: icon }).addTo(map);
            m.bindPopup('<b>#${p.reference}</b><br/>${p.client.replace(/'/g, "\\'")}<br/><span style="color: ${color}; font-weight: bold;">${p.urgence}</span>');
            m.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_TICKET', id: '${p.id}' }));
            });
          })();
        `;
      })
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
    .pulse-tech {
      width: 22px;
      height: 22px;
      background: #FFA101;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(255,161,1, 0.8);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${techCoords.lat}, ${techCoords.lon}], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Position technicien
    var techIcon = L.divIcon({ className: 'pulse-tech', iconSize: [22, 22] });
    L.marker([${techCoords.lat}, ${techCoords.lon}], { icon: techIcon })
      .addTo(map)
      .bindPopup('<b>Votre position (Terrain)</b>');

    ${markersJs}

    var allCoords = [[${techCoords.lat}, ${techCoords.lon}]].concat(${JSON.stringify(
      validPoints.map((p) => [p.lat, p.lon]),
    )});
    if (allCoords.length > 1) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] });
    }
  </script>
</body>
</html>
    `;
  }, [validPoints, techCoords]);

  const handleOpenGps = (t: Ticket) => {
    setSelectedTicket(t);
    setShowRouteModal(true);
  };

  return (
    <View className="flex-1 bg-[#F8FAFB] relative">
      {/* Carte Leaflet OpenStreetMap */}
      <WebView
        key={`map-${validPoints.length}-${techCoords.lat}`}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={{ flex: 1 }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'SELECT_TICKET') {
              const found = tickets.find((t) => t.id === data.id);
              if (found) setSelectedTicket(found);
            }
          } catch {
            // Ignorer
          }
        }}
      />

      <View className="absolute top-4 left-4 right-4 bg-white/95 rounded-2xl p-3.5 border border-slate-200 shadow-sm flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <View className="w-9 h-9 rounded-xl bg-[#31525B] items-center justify-center">
            <MapPin size={19} color="#FFA101" />
          </View>
          <View>
            <Text className="text-sm font-black text-[#1A2C31]">Carte des interventions</Text>
            <Text className="text-xs text-slate-500 font-semibold">
              {validPoints.length} site(s)
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            void getUserLocation();
            void fetchTickets();
          }}
          className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center active:bg-slate-200"
          accessibilityLabel="Rafraîchir la position"
        >
          {loadingTickets ? (
            <ActivityIndicator size="small" color="#FFA101" />
          ) : (
            <RefreshCw size={17} color="#31525B" />
          )}
        </TouchableOpacity>
      </View>

      {selectedTicket && (
        <View className="absolute bottom-4 left-4 right-4 bg-white rounded-3xl p-4 border border-slate-200 shadow-lg">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-mono font-bold text-slate-500">
                #{selectedTicket.reference}
              </Text>
              <View
                className={`px-2.5 py-0.5 rounded-md ${
                  selectedTicket.urgence === 'CRITIQUE'
                    ? 'bg-rose-50 border border-rose-200'
                    : selectedTicket.urgence === 'HAUTE'
                      ? 'bg-amber-50 border border-amber-200'
                      : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <Text
                  className={`text-xs font-black ${
                    selectedTicket.urgence === 'CRITIQUE'
                      ? 'text-rose-700'
                      : selectedTicket.urgence === 'HAUTE'
                        ? 'text-amber-700'
                        : 'text-blue-700'
                  }`}
                >
                  {selectedTicket.urgence}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-full">
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text className="text-xs font-bold text-slate-700">
                {selectedTicket.statut.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          <Text className="text-lg font-bold text-slate-900 mb-1" numberOfLines={1}>
            {selectedTicket.client}
          </Text>

          <View className="flex-row items-center gap-1.5 mb-3.5">
            <MapPin size={15} color="#64748B" />
            <Text className="text-sm text-slate-500 flex-1" numberOfLines={1}>
              {selectedTicket.adresseSite}
            </Text>
          </View>

          <View className="flex-row gap-2.5">
            <TouchableOpacity
              onPress={() => handleOpenGps(selectedTicket)}
              className="flex-1 min-h-[48px] bg-[#31525B] rounded-2xl flex-row items-center justify-center gap-2 active:bg-slate-800"
            >
              <Navigation size={17} color="#FFA101" />
              <Text className="text-sm font-bold text-white">Itinéraire GPS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onTicketPress(selectedTicket)}
              className="flex-1 min-h-[48px] bg-[#FFA101] rounded-2xl flex-row items-center justify-center gap-2 active:bg-amber-600 shadow-xs"
            >
              <TicketIcon size={17} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">Ouvrir le ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {selectedTicket && (
        <MapRouteModal
          visible={showRouteModal}
          onClose={() => setShowRouteModal(false)}
          adresseSite={selectedTicket.adresseSite}
          latitudeSite={selectedTicket.latitudeSite}
          longitudeSite={selectedTicket.longitudeSite}
          ticketReference={selectedTicket.reference}
        />
      )}
    </View>
  );
}

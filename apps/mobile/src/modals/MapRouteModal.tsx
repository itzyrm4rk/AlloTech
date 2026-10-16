import * as Location from 'expo-location';
import { ExternalLink, MapPin, Navigation, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface MapRouteModalProps {
  visible: boolean;
  onClose: () => void;
  adresseSite: string;
  latitudeSite?: string | null;
  longitudeSite?: string | null;
  ticketReference: string;
}

// Calcul de distance à vol d'oiseau (formule de Haversine) avec facteur de virages urbain
function calculateDirectDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): { distance: string; duration: string } {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = (R * c * 1.3).toFixed(1);
  const minutes = Math.max(5, Math.round((Number.parseFloat(km) / 28) * 60));
  return { distance: km, duration: String(minutes) };
}

export function MapRouteModal({
  visible,
  onClose,
  adresseSite,
  latitudeSite,
  longitudeSite,
  ticketReference,
}: MapRouteModalProps) {
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [techCoords, setTechCoords] = useState<{ lat: number; lon: number }>({
    lat: 4.0511,
    lon: 9.7679, // Douala centre par défaut
  });
  const [distanceKm, setDistanceKm] = useState<string | null>(null);
  const [durationMin, setDurationMin] = useState<string | null>(null);

  const destLat = latitudeSite ? Number.parseFloat(latitudeSite) : 4.0483;
  const destLon = longitudeSite ? Number.parseFloat(longitudeSite) : 9.7027;

  useEffect(() => {
    if (!visible) return;

    async function getUserLocation() {
      setLoadingLocation(true);
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
      } catch {
        // En cas de refus ou indisponibilité, on garde la position par défaut
      } finally {
        setLoadingLocation(false);
      }
    }

    void getUserLocation();
  }, [visible]);

  // Calcul du tracé OSRM gratuit avec repli automatique hors-ligne
  useEffect(() => {
    if (!visible) return;

    // Estimation initiale ou hors-ligne immédiate
    const direct = calculateDirectDistance(techCoords.lat, techCoords.lon, destLat, destLon);
    setDistanceKm(direct.distance);
    setDurationMin(direct.duration);

    async function fetchRouteSummary() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${techCoords.lon},${techCoords.lat};${destLon},${destLat}?overview=false`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.routes?.[0]) {
            const dist = (data.routes[0].distance / 1000).toFixed(1);
            const dur = Math.round(data.routes[0].duration / 60);
            setDistanceKm(dist);
            setDurationMin(String(dur));
          }
        }
      } catch {
        // Mode hors-ligne : l'estimation directe via Haversine est déjà active
      }
    }

    void fetchRouteSummary();
  }, [visible, techCoords.lat, techCoords.lon, destLat, destLon]);

  const handleOpenExternalGps = async () => {
    const dest =
      latitudeSite && longitudeSite ? `${destLat},${destLon}` : encodeURIComponent(adresseSite);

    const nativeUrl = Platform.select({
      ios: `maps:0,0?q=${dest}`,
      android: `geo:${destLat},${destLon}?q=${dest}`,
    });

    const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${techCoords.lat},${techCoords.lon}&destination=${dest}`;

    try {
      if (nativeUrl && (await Linking.canOpenURL(nativeUrl))) {
        await Linking.openURL(nativeUrl);
        return;
      }
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert(
        'Navigation GPS',
        `Destination : ${adresseSite}\nCoordonnées : ${destLat}, ${destLon}`,
      );
    }
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
    .dest-pin { background-color: #FFA101; border: 2px solid #FFFFFF; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .tech-pin { background-color: #31525B; border: 2px solid #FFFFFF; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${(techCoords.lat + destLat) / 2}, ${(techCoords.lon + destLon) / 2}], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Marqueur technicien
    var techIcon = L.divIcon({ className: 'tech-pin', iconSize: [20, 20] });
    L.marker([${techCoords.lat}, ${techCoords.lon}], { icon: techIcon }).addTo(map).bindPopup('<b>Votre position actuelle</b>').openPopup();

    // Marqueur site client
    var destIcon = L.divIcon({ className: 'dest-pin', iconSize: [20, 20] });
    L.marker([${destLat}, ${destLon}], { icon: destIcon }).addTo(map).bindPopup('<b>Site intervention</b><br/>${ticketReference}');

    // Tracé d'itinéraire OSRM
    var osrmUrl = 'https://router.project-osrm.org/route/v1/driving/${techCoords.lon},${techCoords.lat};${destLon},${destLat}?geometries=geojson&overview=full';
    fetch(osrmUrl)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.routes && data.routes[0]) {
          var route = L.geoJSON(data.routes[0].geometry, {
            style: { color: '#FFA101', weight: 5, opacity: 0.85 }
          }).addTo(map);
          map.fitBounds(route.getBounds(), { padding: [40, 40] });
        } else {
          var bounds = L.latLngBounds([[${techCoords.lat}, ${techCoords.lon}], [${destLat}, ${destLon}]]);
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      })
      .catch(function() {
        var bounds = L.latLngBounds([[${techCoords.lat}, ${techCoords.lon}], [${destLat}, ${destLon}]]);
        map.fitBounds(bounds, { padding: [40, 40] });
      });
  </script>
</body>
</html>
  `;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-3xl h-[88%] flex-col overflow-hidden">
          {/* En-tête */}
          <View className="bg-[#31525B] px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-xl bg-[#FFA101] items-center justify-center">
                <Navigation size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text className="text-lg font-bold text-white">Itinéraire d'intervention</Text>
                <Text className="text-xs text-slate-200">
                  {ticketReference} • Navigation terrain
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-1.5 rounded-full bg-white/10"
              accessibilityLabel="Fermer"
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Bandeau infos trajet */}
          <View className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-1.5">
                <MapPin size={16} color="#FFA101" />
                <Text className="text-sm font-bold text-slate-800 truncate">{adresseSite}</Text>
              </View>
              <Text className="text-xs text-slate-500 mt-0.5">
                Destination GPS : {destLat.toFixed(4)}, {destLon.toFixed(4)}
              </Text>
            </View>

            {distanceKm && durationMin && (
              <View className="flex-row items-center gap-3 shrink-0 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200">
                <View className="items-center">
                  <Text className="text-sm font-bold text-[#31525B]">{distanceKm} km</Text>
                  <Text className="text-xs text-slate-400">Distance</Text>
                </View>
                <View className="w-[1px] h-6 bg-slate-200" />
                <View className="items-center">
                  <Text className="text-sm font-bold text-[#FFA101]">~{durationMin} min</Text>
                  <Text className="text-xs text-slate-400">Trajet</Text>
                </View>
              </View>
            )}
          </View>

          {/* Carte interactive WebView */}
          <View className="flex-1 relative">
            {loadingLocation ? (
              <View className="flex-1 items-center justify-center bg-slate-100">
                <ActivityIndicator size="large" color="#FFA101" />
                <Text className="text-sm font-medium text-slate-500 mt-2">
                  Acquisition de votre position GPS...
                </Text>
              </View>
            ) : (
              <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={{ flex: 1 }}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                  <View className="absolute inset-0 items-center justify-center bg-slate-100">
                    <ActivityIndicator size="small" color="#FFA101" />
                  </View>
                )}
              />
            )}
          </View>

          {/* Bouton d'action Google Maps */}
          <View className="p-4 bg-white border-t border-slate-200">
            <TouchableOpacity
              onPress={handleOpenExternalGps}
              className="min-h-[52px] bg-[#31525B] rounded-2xl flex-row items-center justify-center gap-2.5 shadow-sm"
              accessibilityLabel="Ouvrir dans Google Maps"
            >
              <Navigation size={18} color="#FFFFFF" />
              <Text className="text-base font-bold text-white">
                Démarrer le guidage (Google Maps / Waze)
              </Text>
              <ExternalLink size={16} color="#FFA101" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

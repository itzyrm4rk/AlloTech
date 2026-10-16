import NetInfo from '@react-native-community/netinfo';
import { CheckCircle2, WifiOff } from 'lucide-react-native';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { processSyncQueue } from '../lib/syncQueue';

interface NetworkBannerProps {
  onSyncComplete?: () => void;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({ onSyncComplete }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);

      // Détection du retour de la connexion
      if (wasOfflineRef.current && !offline) {
        console.log('[NetworkBanner] Connexion rétablie ! Lancement de la synchronisation...');
        setSyncStatus('Synchronisation des actions en cours...');

        processSyncQueue().then((res) => {
          if (res.succeeded > 0) {
            setSyncStatus(`✓ ${res.succeeded} action(s) synchronisée(s) avec succès !`);
            if (onSyncComplete) onSyncComplete();
          } else {
            setSyncStatus(null);
          }

          setTimeout(() => {
            setSyncStatus(null);
          }, 4000);
        });
      }

      wasOfflineRef.current = offline;
    });

    return () => unsubscribe();
  }, [onSyncComplete]);

  if (syncStatus) {
    return (
      <View
        style={{
          backgroundColor: '#2E8B57',
          paddingVertical: 8,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <CheckCircle2 size={16} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{syncStatus}</Text>
      </View>
    );
  }

  if (isOffline) {
    return (
      <View
        style={{
          backgroundColor: '#FFA101',
          paddingVertical: 8,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <WifiOff size={16} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
          Mode hors-ligne actif • Sauvegarde locale SQLite
        </Text>
      </View>
    );
  }

  return null;
};

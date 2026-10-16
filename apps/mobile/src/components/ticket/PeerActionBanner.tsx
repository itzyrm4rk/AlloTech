import { Bell, CheckCircle2, PauseCircle, PlayCircle, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export interface PeerNotification {
  message: string;
  type: 'demarrage' | 'pause' | 'reprise' | 'termine' | 'cloture';
  timestamp: number;
}

interface PeerActionBannerProps {
  notification: PeerNotification | null;
  onDismiss: () => void;
}

export function PeerActionBanner({ notification, onDismiss }: PeerActionBannerProps) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000); // Disparaît automatiquement après 7 secondes
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isPause = notification.type === 'pause';
  const isCloture = notification.type === 'cloture' || notification.type === 'termine';
  const isDemarrage = notification.type === 'demarrage' || notification.type === 'reprise';

  const bgColor = isPause
    ? 'bg-amber-500'
    : isCloture
      ? 'bg-emerald-600'
      : isDemarrage
        ? 'bg-[#31525B]'
        : 'bg-indigo-600';

  return (
    <View className="mx-4 mt-2 mb-1 shadow-md">
      <View className={`flex-row items-center justify-between p-3.5 rounded-2xl ${bgColor}`}>
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
            {isPause ? (
              <PauseCircle size={18} color="#FFFFFF" />
            ) : isCloture ? (
              <CheckCircle2 size={18} color="#FFFFFF" />
            ) : isDemarrage ? (
              <PlayCircle size={18} color="#FFFFFF" />
            ) : (
              <Bell size={18} color="#FFFFFF" />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
              Synchronisation Équipe
            </Text>
            <Text className="text-xs font-semibold text-white leading-4 mt-0.5">
              {notification.message}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-7 h-7 rounded-full bg-white/10 items-center justify-center"
        >
          <X size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

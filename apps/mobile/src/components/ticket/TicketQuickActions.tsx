import { Camera, History, Navigation, QrCode, Sparkles } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

interface TicketQuickActionsProps {
  onOpenIaModal: () => void;
  onOpenPannesRecentes: () => void;
  onOpenMapModal: () => void;
  onOpenQrModal: () => void;
  onOpenPhotoModal: () => void;
}

export function TicketQuickActions({
  onOpenIaModal,
  onOpenPannesRecentes,
  onOpenMapModal,
  onOpenQrModal,
  onOpenPhotoModal,
}: TicketQuickActionsProps) {
  return (
    <>
      {/* Bannière Diagnostic IA & Pannes récentes */}
      <View className="mx-4 mt-3 bg-[#31525B] rounded-2xl p-4 shadow-sm border border-[#FFA101]/40">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 rounded-xl bg-[#FFA101] items-center justify-center shadow-xs">
              <Sparkles size={22} color="#FFFFFF" />
            </View>
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-extrabold text-white">Diagnostic IA Rapide</Text>
                <View className="bg-[#FFA101]/20 px-2 py-0.5 rounded-full border border-[#FFA101]/40">
                  <Text className="text-[10px] font-bold text-[#FFA101]">ASSISTANT</Text>
                </View>
              </View>
              <Text className="text-xs text-slate-200 mt-0.5">
                Analyse des symptômes & recommandations Gemini
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onOpenIaModal}
            activeOpacity={0.8}
            className="flex-1 min-h-[46px] bg-[#FFA101] rounded-xl flex-row items-center justify-center gap-2 shadow-xs"
          >
            <Sparkles size={16} color="#020617" />
            <Text className="text-xs font-black text-slate-950 uppercase tracking-wide">
              Lancer le Diag IA
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenPannesRecentes}
            activeOpacity={0.8}
            className="min-h-[46px] px-3.5 bg-white/15 border border-white/25 rounded-xl flex-row items-center justify-center gap-1.5"
          >
            <History size={16} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">Pannes récentes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Raccourcis terrain : Itinéraire, QR Code, Photo */}
      <View className="mx-4 mt-2.5 flex-row gap-2">
        <TouchableOpacity
          onPress={onOpenMapModal}
          activeOpacity={0.7}
          className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 items-center justify-center gap-1.5 shadow-xs"
        >
          <Navigation size={18} color="#0E7490" />
          <Text className="text-xs font-bold text-slate-700 text-center">Itinéraire</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenQrModal}
          activeOpacity={0.7}
          className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 items-center justify-center gap-1.5 shadow-xs"
        >
          <QrCode size={18} color="#31525B" />
          <Text className="text-xs font-bold text-slate-700 text-center">Scan QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenPhotoModal}
          activeOpacity={0.7}
          className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 items-center justify-center gap-1.5 shadow-xs"
        >
          <Camera size={18} color="#D97706" />
          <Text className="text-xs font-bold text-slate-700 text-center">Prendre Photo</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

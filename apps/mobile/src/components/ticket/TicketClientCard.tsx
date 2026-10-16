import { CheckCircle, MapPin, Phone, User } from 'lucide-react-native';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

export interface TicketClientCardProps {
  client: string;
  adresseSite: string;
  clientPhone?: string | null;
  latitudeSite?: string | null;
  longitudeSite?: string | null;
}

export function TicketClientCard({
  client,
  adresseSite,
  clientPhone,
  latitudeSite,
  longitudeSite,
}: TicketClientCardProps) {
  return (
    <View className="mx-4 mt-3 bg-white rounded-2xl border border-[#E4E4E7] p-5 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <User size={18} color="#31525B" />
          <Text className="text-base font-bold text-[#31525B]">Client & Contact</Text>
        </View>

        {clientPhone && (
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${clientPhone}`)}
            className="flex-row items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl"
          >
            <Phone size={14} color="#288358" />
            <Text className="text-sm font-bold text-[#288358]">Appeler</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-lg font-extrabold text-slate-900">{client}</Text>

      <View className="flex-row items-start gap-2 mt-2">
        <MapPin size={16} color="#FFA101" className="shrink-0 mt-0.5" />
        <Text className="text-sm text-slate-600 flex-1 leading-relaxed">{adresseSite}</Text>
      </View>

      {latitudeSite && longitudeSite && (
        <View className="mt-2.5 flex-row items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg self-start">
          <CheckCircle size={14} color="#288358" />
          <Text className="text-xs font-mono text-slate-500">
            GPS : {Number.parseFloat(latitudeSite).toFixed(4)},{' '}
            {Number.parseFloat(longitudeSite).toFixed(4)}
          </Text>
        </View>
      )}
    </View>
  );
}

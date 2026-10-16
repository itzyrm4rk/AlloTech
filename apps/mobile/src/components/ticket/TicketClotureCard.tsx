import { Award, CheckCircle2 } from 'lucide-react-native';
import { Text, View } from 'react-native';
import type { FullTicketData, Statut } from '../../types/ticket.types';

export interface TicketClotureCardProps {
  statut: Statut;
  fullTicket: FullTicketData | null;
}

export function TicketClotureCard({ statut, fullTicket }: TicketClotureCardProps) {
  if (statut !== 'CLOTUREE') return null;

  return (
    <View className="mx-4 mt-3 bg-[#F0FDF4] rounded-3xl border border-[#86EFAC] p-5 shadow-xs">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2.5">
          <View className="w-9 h-9 rounded-xl bg-emerald-500 items-center justify-center">
            <Award size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text className="text-base font-black text-[#1A2C31]">Intervention Clôturée</Text>
            <Text className="text-xs text-emerald-700 font-semibold">
              Signée et archivée avec succès
            </Text>
          </View>
        </View>

        <View className="bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
          <Text className="text-xs font-bold text-emerald-800">Officiel</Text>
        </View>
      </View>

      {fullTicket?.signature?.nomSignataire && (
        <View className="bg-white/80 rounded-2xl p-3.5 mb-3 border border-emerald-100">
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Signataire client
          </Text>
          <Text className="text-sm font-black text-slate-900">
            {fullTicket.signature.nomSignataire}
          </Text>
        </View>
      )}

      {fullTicket?.rapport?.contenu && (
        <View className="bg-white/80 rounded-2xl p-3.5 mb-3 border border-emerald-100">
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Rapport technique enregistré
          </Text>
          <Text className="text-sm text-slate-800 leading-relaxed">
            {fullTicket.rapport.contenu}
          </Text>
        </View>
      )}

      <View className="bg-emerald-50 rounded-2xl p-3 flex-row items-center gap-2 border border-emerald-200/60">
        <CheckCircle2 size={16} color="#16A34A" />
        <Text className="text-xs text-emerald-800 font-medium flex-1">
          Le rapport officiel avec photos et signature est prêt à être imprimé ou téléchargé côté
          bureau.
        </Text>
      </View>
    </View>
  );
}

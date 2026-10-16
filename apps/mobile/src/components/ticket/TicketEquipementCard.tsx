import { ChevronRight, History, MapPin, Wrench } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

export interface EquipementInfo {
  id?: string;
  modele: string;
  numeroSerie: string;
  statut?: string;
  typeActif?: string | null;
  siteAdresse?: string | null;
}

export interface TicketEquipementCardProps {
  equipement: EquipementInfo | null | undefined;
  onOpenPannesRecentes: () => void;
}

function getEquipementStatutBadge(statut?: string) {
  switch (statut) {
    case 'EN_SERVICE':
      return {
        label: 'En service',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        dot: '#10B981',
      };
    case 'EN_PANNE':
      return {
        label: 'En panne',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        dot: '#EF4444',
      };
    case 'EN_REFORME':
      return {
        label: 'Réformé',
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        text: 'text-slate-600',
        dot: '#64748B',
      };
    default:
      return {
        label: statut ? statut.replace(/_/g, ' ') : 'Non défini',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        text: 'text-slate-600',
        dot: '#94A3B8',
      };
  }
}

export function TicketEquipementCard({
  equipement,
  onOpenPannesRecentes,
}: TicketEquipementCardProps) {
  if (!equipement) return null;

  const eqBadge = getEquipementStatutBadge(equipement.statut);

  return (
    <View className="mx-4 mt-3 bg-white rounded-2xl border border-[#E4E4E7] p-5 shadow-sm">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-amber-500/10 items-center justify-center">
            <Wrench size={16} color="#FFA101" />
          </View>
          <Text className="text-base font-bold text-[#31525B]">Équipement CMDB</Text>
        </View>
        <View
          className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full border ${eqBadge.bg} ${eqBadge.border}`}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: eqBadge.dot,
            }}
          />
          <Text className={`text-xs font-bold ${eqBadge.text}`}>{eqBadge.label}</Text>
        </View>
      </View>

      <Text className="text-lg font-extrabold text-slate-800">{equipement.modele}</Text>

      <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
        <View className="bg-slate-100 px-2.5 py-1 rounded-md">
          <Text className="text-xs font-mono text-slate-700 font-semibold">
            N° Série : {equipement.numeroSerie}
          </Text>
        </View>
        {equipement.typeActif && (
          <View className="bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-md">
            <Text className="text-[11px] font-bold text-sky-800">
              {equipement.typeActif === 'MATERIEL' ? 'Matériel physique' : 'Actif Logiciel'}
            </Text>
          </View>
        )}
      </View>

      {equipement.siteAdresse && (
        <View className="flex-row items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
          <MapPin size={13} color="#64748B" />
          <Text className="text-xs text-slate-600 font-medium" numberOfLines={1}>
            Emplacement : {equipement.siteAdresse}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={onOpenPannesRecentes}
        className="mt-3 pt-2.5 border-t border-slate-100 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2">
          <History size={15} color="#FFA101" />
          <Text className="text-xs font-bold text-[#31525B]">
            Consulter l'historique des pannes
          </Text>
        </View>
        <ChevronRight size={16} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );
}

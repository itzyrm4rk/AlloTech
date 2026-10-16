import { Award, CheckCircle, Navigation, Pause, Play } from 'lucide-react-native';
import type { ElementType } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import type { Statut } from '../../types/ticket.types';

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: ElementType; bg: string; text: string }
> = {
  EN_ROUTE: {
    label: 'Partir sur site (En route)',
    icon: Navigation,
    bg: '#0E7490',
    text: '#FFFFFF',
  },
  EN_COURS: { label: "Démarrer l'intervention (GPS)", icon: Play, bg: '#31525B', text: '#FFFFFF' },
  EN_PAUSE: { label: 'Mettre en pause', icon: Pause, bg: '#FFA101', text: '#1C1C1E' },
  TERMINEE: { label: 'Marquer fin des travaux', icon: CheckCircle, bg: '#2E8B57', text: '#FFFFFF' },
  CLOTUREE: {
    label: "Signer & Clôturer l'intervention",
    icon: Award,
    bg: '#FFA101',
    text: '#020617',
  },
};

export interface TicketActionButtonsProps {
  statut: Statut;
  allowedNext: Statut[];
  isActioning: boolean;
  onStatutChange: (nextStatut: Statut) => void;
  onOpenCloture: () => void;
}

export function TicketActionButtons({
  statut,
  allowedNext,
  isActioning,
  onStatutChange,
  onOpenCloture,
}: TicketActionButtonsProps) {
  if (statut === 'CLOTUREE') return null;

  return (
    <View className="mx-4 mt-3 bg-white rounded-2xl border border-[#E4E4E7] p-5 shadow-sm">
      <Text className="text-sm font-bold text-[#31525B] mb-3">Actions d'avancement</Text>

      <View className="gap-3">
        {allowedNext.map((nextStatut) => {
          const actionCfg = ACTION_CONFIG[nextStatut];
          if (!actionCfg) return null;
          const Icon = actionCfg.icon;
          const isResuming = statut === 'EN_PAUSE' && nextStatut === 'EN_COURS';
          const labelText = isResuming ? "Reprendre l'intervention" : actionCfg.label;

          return (
            <TouchableOpacity
              key={nextStatut}
              onPress={() => onStatutChange(nextStatut)}
              disabled={isActioning}
              className="min-h-[56px] rounded-2xl flex-row items-center justify-center gap-3 shadow-sm"
              style={{ backgroundColor: isActioning ? '#E4E4E7' : actionCfg.bg }}
              accessibilityLabel={labelText}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color="#9CA3AF" />
              ) : (
                <>
                  <Icon size={20} color={actionCfg.text} />
                  <Text
                    style={{ color: isActioning ? '#9CA3AF' : actionCfg.text }}
                    className="text-base font-bold"
                  >
                    {labelText}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Raccourci direct de clôture si l'intervention est en cours ou terminée */}
        {(statut === 'EN_COURS' || statut === 'TERMINEE') && !allowedNext.includes('CLOTUREE') && (
          <TouchableOpacity
            onPress={onOpenCloture}
            className="min-h-[54px] rounded-2xl flex-row items-center justify-center gap-2.5 bg-[#FFA101] shadow-xs active:bg-amber-600"
            accessibilityLabel="Clôturer avec signature"
          >
            <Award size={20} color="#020617" />
            <Text className="text-base font-black text-slate-950">
              Faire signer le client & Clôturer
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

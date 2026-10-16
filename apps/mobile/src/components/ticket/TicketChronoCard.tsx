import { CheckCircle2, Clock, Pause } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';
import { STATUT_CONFIG } from '../../types/ticket.types';
import type { Statut } from '../../types/ticket.types';
import { PulseDot } from '../PulseDot';

export interface TicketChronoCardProps {
  statut: Statut;
  formattedTime: string;
  loadingDetails?: boolean;
  heureDepart?: Date | null;
  heureDemarrage?: Date | null;
  dernierMotifPause?: string | null;
}

export function TicketChronoCard({
  statut,
  formattedTime,
  loadingDetails = false,
  heureDepart,
  heureDemarrage,
  dernierMotifPause,
}: TicketChronoCardProps) {
  const statCfg = STATUT_CONFIG[statut] || STATUT_CONFIG.ASSIGNEE;

  return (
    <View className="mx-4 mt-4 bg-white rounded-2xl border border-[#E4E4E7] p-5 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 mb-1">
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: statCfg.dot,
            }}
          />
          <Text style={{ color: statCfg.text, fontSize: 16, fontWeight: '800' }}>
            {statCfg.label}
          </Text>
        </View>

        {loadingDetails && <ActivityIndicator size="small" color="#FFA101" />}
      </View>

      {heureDepart && (
        <View className="flex-row items-center gap-1.5 mt-1">
          <Clock size={14} color="#9CA3AF" />
          <Text className="text-sm text-[#2C2C2E]/60">
            Départ :{' '}
            {heureDepart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}

      {heureDemarrage && (
        <View className="flex-row items-center gap-1.5 mt-0.5">
          <Clock size={14} color="#FFA101" />
          <Text className="text-sm text-[#2C2C2E]/60">
            Démarré :{' '}
            {heureDemarrage.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}

      {/* VRAI CHRONOMÈTRE ACTIF TEMPS RÉEL (s'arrête en pause, reprend en EN_COURS) */}
      {heureDemarrage && (
        <View className="mt-3 pt-3 border-t border-slate-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View
                className={`w-7 h-7 rounded-lg items-center justify-center ${
                  statut === 'EN_COURS'
                    ? 'bg-amber-500/15'
                    : statut === 'EN_PAUSE'
                      ? 'bg-orange-500/15'
                      : 'bg-emerald-500/15'
                }`}
              >
                {statut === 'EN_COURS' ? (
                  <Clock size={15} color="#D97706" />
                ) : statut === 'EN_PAUSE' ? (
                  <Pause size={15} color="#EA580C" />
                ) : (
                  <CheckCircle2 size={15} color="#16A34A" />
                )}
              </View>
              <View>
                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {statut === 'EN_COURS'
                    ? 'Chronomètre actif'
                    : statut === 'EN_PAUSE'
                      ? 'Chrono suspendu (En pause)'
                      : 'Temps total d’intervention'}
                </Text>
                <Text className="text-[10px] text-slate-400">
                  {statut === 'EN_COURS'
                    ? 'Temps de travail effectif décompté'
                    : statut === 'EN_PAUSE'
                      ? 'Le compteur est figé pendant la pause'
                      : 'Durée nette hors pauses'}
                </Text>
              </View>
            </View>

            {/* Badge digital HH:MM:SS */}
            <View
              className={`px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5 ${
                statut === 'EN_COURS'
                  ? 'bg-amber-50 border-amber-300'
                  : statut === 'EN_PAUSE'
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-emerald-50 border-emerald-300'
              }`}
            >
              {statut === 'EN_COURS' && <PulseDot color="#F59E0B" size={8} />}
              {statut === 'EN_PAUSE' && <View className="w-2 h-2 rounded-full bg-orange-500" />}
              <Text
                className={`text-base font-black font-mono tracking-wider ${
                  statut === 'EN_COURS'
                    ? 'text-amber-800'
                    : statut === 'EN_PAUSE'
                      ? 'text-orange-700'
                      : 'text-emerald-800'
                }`}
              >
                {formattedTime}
              </Text>
            </View>
          </View>

          {/* Affichage du motif de pause si actuellement EN_PAUSE */}
          {statut === 'EN_PAUSE' && dernierMotifPause && (
            <View className="mt-2.5 bg-orange-50/80 border border-orange-200/90 rounded-xl p-2.5 flex-row items-start gap-2">
              <Pause size={14} color="#EA580C" className="shrink-0 mt-0.5" />
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-orange-900 uppercase">
                  Raison de la pause :
                </Text>
                <Text className="text-xs text-orange-950 font-medium mt-0.5 leading-relaxed">
                  {dernierMotifPause}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

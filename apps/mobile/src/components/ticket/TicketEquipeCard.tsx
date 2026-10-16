import { Phone, Users } from 'lucide-react-native';
import { Alert, Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { resolveMediaUrl } from '../../lib/media-utils';
import { PulseDot } from '../PulseDot';

export interface TechnicienMember {
  technicien: {
    id?: string;
    matricule: string;
    nom: string;
    prenom: string;
    telephone?: string | null;
    photoUrl?: string | null;
  };
}

export interface TicketEquipeCardProps {
  techniciens?: TechnicienMember[];
  currentUser?: { technicienId?: string; matricule?: string } | null;
}

export function TicketEquipeCard({ techniciens, currentUser }: TicketEquipeCardProps) {
  if (!techniciens || techniciens.length === 0) return null;

  return (
    <View className="mx-4 mt-3 bg-white rounded-2xl border border-[#E4E4E7] p-5 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-[#31525B]/10 items-center justify-center">
            <Users size={17} color="#31525B" />
          </View>
          <Text className="text-base font-bold text-[#31525B]">Équipe d'intervention</Text>
        </View>

        {techniciens.length > 1 ? (
          <View className="flex-row items-center gap-1.5 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-full">
            <PulseDot color="#4F46E5" size={8} />
            <Text className="text-xs font-bold text-indigo-700">
              Binôme • {techniciens.length} techniciens
            </Text>
          </View>
        ) : (
          <View className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
            <Text className="text-xs font-semibold text-slate-600">Intervention solo</Text>
          </View>
        )}
      </View>

      <View className="gap-2">
        {techniciens.map((t, idx) => {
          const tech = t.technicien;
          const isMe =
            currentUser &&
            (tech.id === currentUser.technicienId || tech.matricule === currentUser.matricule);
          const initials = `${tech.prenom?.[0] || ''}${tech.nom?.[0] || ''}`.toUpperCase() || 'T';

          return (
            <View
              key={tech.id || tech.matricule || idx}
              className={`flex-row items-center justify-between p-3 rounded-xl border ${
                isMe ? 'bg-amber-50/50 border-amber-200/90' : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-2">
                {tech.photoUrl ? (
                  <Image
                    source={{ uri: resolveMediaUrl(tech.photoUrl) }}
                    className="w-10 h-10 rounded-full border border-slate-200"
                  />
                ) : (
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center border ${
                      isMe ? 'bg-[#31525B] border-[#31525B]' : 'bg-slate-700 border-slate-800'
                    }`}
                  >
                    <Text className="text-xs font-black text-white">{initials}</Text>
                  </View>
                )}

                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center gap-1.5 flex-wrap">
                    <Text className="text-sm font-extrabold text-slate-900" numberOfLines={1}>
                      {tech.prenom} {tech.nom}
                    </Text>
                    {isMe && (
                      <View className="bg-[#FFA101] px-1.5 py-0.5 rounded-md">
                        <Text className="text-[10px] font-black text-slate-950">VOUS</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs font-mono text-slate-500 mt-0.5">
                    Matricule : {tech.matricule}
                  </Text>
                </View>
              </View>

              {/* Action d'appel natif rapide (pour les coéquipiers) */}
              {!isMe && tech.telephone ? (
                <TouchableOpacity
                  onPress={() => {
                    const cleanTel = tech.telephone?.replace(/[^\d+]/g, '');
                    if (cleanTel) {
                      void Linking.openURL(`tel:${cleanTel}`).catch(() => {
                        Alert.alert('Erreur', 'Impossible d’ouvrir l’application téléphone.');
                      });
                    }
                  }}
                  className="w-9 h-9 rounded-xl bg-emerald-500 items-center justify-center shadow-xs active:bg-emerald-600"
                  accessibilityLabel={`Appeler ${tech.prenom}`}
                >
                  <Phone size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : isMe ? (
                <View className="px-2 py-0.5 rounded-md bg-amber-100/70 border border-amber-300/60">
                  <Text className="text-[10px] font-bold text-amber-900">Sur site</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

import { CheckCircle2 } from 'lucide-react-native';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { Competence } from '../../hooks/useInscription';

interface CompetencesSelectModalProps {
  visible: boolean;
  onClose: () => void;
  competences: Competence[];
  selectedCompetences: string[];
  onToggleCompetence: (id: string) => void;
}

export function CompetencesSelectModal({
  visible,
  onClose,
  competences,
  selectedCompetences,
  onToggleCompetence,
}: CompetencesSelectModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl border border-slate-200 p-6 pb-10 max-h-[70%] shadow-2xl">
          <View className="flex-row items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <Text className="text-xl font-bold text-[#1A2C31]">Vos compétences</Text>
            <TouchableOpacity
              onPress={onClose}
              className="bg-[#FFA101] px-5 py-2.5 rounded-xl min-h-[44px] items-center justify-center shadow-xs"
            >
              <Text className="text-slate-950 font-black text-base">Valider</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {competences.map((comp) => {
              const selected = selectedCompetences.includes(comp.id);
              return (
                <TouchableOpacity
                  key={comp.id}
                  activeOpacity={0.7}
                  onPress={() => onToggleCompetence(comp.id)}
                  className={`flex-row items-center gap-3 p-4 mb-2 rounded-xl border min-h-[52px] ${
                    selected ? 'bg-[#F0F8FA] border-[#31525B]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-md border-2 items-center justify-center ${
                      selected ? 'bg-[#FFA101] border-[#FFA101]' : 'border-slate-300'
                    }`}
                  >
                    {selected && <CheckCircle2 size={13} color="#020617" />}
                  </View>
                  <Text
                    className={`text-base flex-1 ${
                      selected ? 'text-[#1A2C31] font-bold' : 'text-slate-700'
                    }`}
                  >
                    {comp.libelle}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {competences.length === 0 && (
              <Text className="text-slate-400 text-sm text-center py-8">
                Chargement des compétences…
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

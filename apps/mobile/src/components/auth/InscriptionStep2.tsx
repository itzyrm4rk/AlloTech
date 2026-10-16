import { ArrowRight, ChevronDown, Eye, EyeOff, Lock } from 'lucide-react-native';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Competence } from '../../hooks/useInscription';

interface InscriptionStep2Props {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  selectedCompetences: string[];
  competences: Competence[];
  onOpenCompetencesModal: () => void;
  onUpdateField: (field: 'password' | 'confirmPassword', value: string) => void;
  onSubmit: () => void;
  onPreviousStep: () => void;
  loading: boolean;
}

export function InscriptionStep2({
  password,
  confirmPassword,
  showPassword,
  onToggleShowPassword,
  selectedCompetences,
  competences,
  onOpenCompetencesModal,
  onUpdateField,
  onSubmit,
  onPreviousStep,
  loading,
}: InscriptionStep2Props) {
  return (
    <>
      {/* Mot de passe */}
      <View className="mb-4">
        <Text className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
          Mot de passe (6+ caractères)
        </Text>
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-[52px]">
          <Lock size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-3 text-slate-900 text-base font-medium"
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={(v) => onUpdateField('password', v)}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={onToggleShowPassword} className="p-1">
            {showPassword ? (
              <EyeOff size={18} color="#64748B" />
            ) : (
              <Eye size={18} color="#64748B" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirmer mot de passe */}
      <View className="mb-5">
        <Text className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
          Confirmer le mot de passe
        </Text>
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-[52px]">
          <Lock size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-3 text-slate-900 text-base font-medium"
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            value={confirmPassword}
            onChangeText={(v) => onUpdateField('confirmPassword', v)}
            secureTextEntry={!showPassword}
          />
        </View>
      </View>

      {/* Multi-sélection compétences */}
      <View className="mb-6">
        <Text className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
          Compétences déclarées{' '}
          <Text className="text-slate-400 font-normal">
            ({selectedCompetences.length} sélectionnées)
          </Text>
        </Text>
        <TouchableOpacity
          onPress={onOpenCompetencesModal}
          className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-[52px] justify-between"
          accessibilityLabel="Sélectionner vos compétences"
        >
          <Text className="text-slate-700 text-base font-medium flex-1" numberOfLines={1}>
            {selectedCompetences.length === 0
              ? 'Appuyer pour sélectionner…'
              : competences
                  .filter((c) => selectedCompetences.includes(c.id))
                  .map((c) => c.libelle.split('&')[0]?.trim() ?? c.libelle)
                  .join(', ')}
          </Text>
          <ChevronDown size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Boutons d'action */}
      <View className="gap-3">
        <TouchableOpacity
          onPress={onSubmit}
          disabled={loading}
          className={`h-[52px] rounded-xl items-center justify-center flex-row gap-2 shadow-sm ${
            loading ? 'bg-slate-300' : 'bg-[#FFA101]'
          }`}
          accessibilityLabel="Finaliser l'inscription"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#020617" />
          ) : (
            <>
              <Text className="text-slate-950 font-black text-lg">Créer mon compte</Text>
              <ArrowRight size={19} color="#020617" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPreviousStep}
          className="h-[52px] rounded-xl items-center justify-center border border-slate-200 bg-white shadow-2xs"
          accessibilityLabel="Retour à l'étape précédente"
        >
          <Text className="text-slate-700 font-bold text-base">← Retour</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

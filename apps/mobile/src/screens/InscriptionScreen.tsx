import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlloTechLogo } from '../components/AlloTechLogo';
import { CompetencesSelectModal, InscriptionStep1, InscriptionStep2 } from '../components/auth';
import { useInscription } from '../hooks/useInscription';

type InscriptionScreenProps = {
  onSuccess: () => void;
  onNavigateToConnexion: () => void;
};

export function InscriptionScreen({ onSuccess, onNavigateToConnexion }: InscriptionScreenProps) {
  const {
    step,
    setStep,
    showPassword,
    setShowPassword,
    loading,
    error,
    setError,
    success,
    competences,
    competenceModalVisible,
    setCompetenceModalVisible,
    formData,
    updateFormField,
    toggleCompetence,
    handleNextStep,
    handleSubmit,
  } = useInscription({ onSuccess });

  if (success) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#F8FAFB' }}
        className="flex-1 bg-[#F8FAFB] items-center justify-center px-6"
      >
        <View className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm items-center gap-4 max-w-sm w-full">
          <View className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 items-center justify-center shadow-xs">
            <CheckCircle2 size={40} color="#288358" />
          </View>
          <Text className="text-2xl font-black text-[#1A2C31] text-center">
            Inscription réussie !
          </Text>
          <Text className="text-slate-600 text-center text-sm leading-6">
            Votre compte est en attente d'activation par l'administrateur. Vous serez notifié dès
            que votre accès sera confirmé.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFB' }} className="flex-1 bg-[#F8FAFB]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        className="flex-1"
      >
        <ScrollView
          style={{ flex: 1 }}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-6 mt-2">
            <AlloTechLogo
              size={52}
              showText={true}
              subtitle={
                step === 1
                  ? 'Inscription — Étape 1/2 : Informations'
                  : 'Inscription — Étape 2/2 : Sécurité & compétences'
              }
            />
          </View>

          {/* Indicateur d'étape */}
          <View className="flex-row gap-2 mb-6">
            <View className="flex-1 h-1.5 rounded-full bg-[#FFA101]" />
            <View
              className={`flex-1 h-1.5 rounded-full ${step === 2 ? 'bg-[#FFA101]' : 'bg-slate-200'}`}
            />
          </View>

          {/* Formulaire */}
          <View className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex-row items-start gap-3">
                <AlertCircle size={16} color="#C0392B" />
                <Text className="text-red-700 text-sm font-medium flex-1 leading-5">{error}</Text>
              </View>
            )}

            {step === 1 ? (
              <InscriptionStep1
                matricule={formData.matricule}
                prenom={formData.prenom}
                nom={formData.nom}
                telephone={formData.telephone}
                email={formData.email}
                onUpdateField={updateFormField}
                onNextStep={handleNextStep}
              />
            ) : (
              <>
                <InscriptionStep2
                  password={formData.password}
                  confirmPassword={formData.confirmPassword}
                  showPassword={showPassword}
                  onToggleShowPassword={() => setShowPassword(!showPassword)}
                  selectedCompetences={formData.selectedCompetences}
                  competences={competences}
                  onOpenCompetencesModal={() => setCompetenceModalVisible(true)}
                  onUpdateField={updateFormField}
                  onSubmit={() => void handleSubmit()}
                  onPreviousStep={() => {
                    setStep(1);
                    setError(null);
                  }}
                  loading={loading}
                />

                {/* Modal de sélection multi-compétences */}
                <CompetencesSelectModal
                  visible={competenceModalVisible}
                  onClose={() => setCompetenceModalVisible(false)}
                  competences={competences}
                  selectedCompetences={formData.selectedCompetences}
                  onToggleCompetence={toggleCompetence}
                />
              </>
            )}
          </View>

          {/* Lien connexion */}
          <View className="mt-6 items-center mb-6">
            <Text className="text-slate-600 text-base font-medium">
              Déjà inscrit ?{' '}
              <Text className="text-[#FFA101] font-bold" onPress={onNavigateToConnexion}>
                Se connecter
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

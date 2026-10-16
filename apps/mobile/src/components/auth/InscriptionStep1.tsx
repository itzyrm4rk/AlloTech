import { ArrowRight, Mail, Phone, User } from 'lucide-react-native';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface InscriptionStep1Props {
  matricule: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  onUpdateField: (
    field: 'matricule' | 'prenom' | 'nom' | 'telephone' | 'email',
    value: string,
  ) => void;
  onNextStep: () => void;
}

export function InscriptionStep1({
  matricule,
  prenom,
  nom,
  telephone,
  email,
  onUpdateField,
  onNextStep,
}: InscriptionStep1Props) {
  return (
    <>
      {/* Matricule */}
      <View className="mb-4">
        <Text className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
          Matricule
        </Text>
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-[52px]">
          <User size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-3 text-slate-900 text-base font-semibold"
            placeholder="Ex: TEC-001"
            placeholderTextColor="#94A3B8"
            value={matricule}
            onChangeText={(v) => onUpdateField('matricule', v)}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Prénom + Nom */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
            Prénom
          </Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-[52px]">
            <TextInput
              className="flex-1 text-slate-900 text-base font-medium"
              placeholder="Paul"
              placeholderTextColor="#94A3B8"
              value={prenom}
              onChangeText={(v) => onUpdateField('prenom', v)}
            />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
            Nom
          </Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-[52px]">
            <TextInput
              className="flex-1 text-slate-900 text-base font-medium"
              placeholder="Kamga"
              placeholderTextColor="#94A3B8"
              value={nom}
              onChangeText={(v) => onUpdateField('nom', v)}
            />
          </View>
        </View>
      </View>

      {/* Téléphone */}
      <View className="mb-4">
        <Text className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
          Téléphone
        </Text>
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-[52px]">
          <Phone size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-3 text-slate-900 text-base font-medium"
            placeholder="+237 6XX XX XX XX"
            placeholderTextColor="#94A3B8"
            value={telephone}
            onChangeText={(v) => onUpdateField('telephone', v)}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Email */}
      <View className="mb-6">
        <Text className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
          Email
        </Text>
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-[52px]">
          <Mail size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-3 text-slate-900 text-base font-medium"
            placeholder="paul.kamga@email.cm"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={(v) => onUpdateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={onNextStep}
        className="h-[52px] bg-[#31525B] rounded-xl items-center justify-center flex-row gap-2 shadow-sm"
        accessibilityLabel="Passer à l'étape suivante"
      >
        <Text className="text-white font-bold text-lg">Suivant</Text>
        <ArrowRight size={19} color="#FFFFFF" />
      </TouchableOpacity>
    </>
  );
}

import { AlertCircle, ArrowRight, Eye, EyeOff, Fingerprint, Lock, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlloTechLogo } from '../components/AlloTechLogo';
import {
  authenticateWithBiometrics,
  checkBiometricStatus,
  getBiometricAuth,
  getSessionToken,
  getStoredUser,
  isBiometricsConfigured,
  saveBiometricAuth,
  saveSession,
} from '../lib/auth-storage';
import { getBaseUrl, trpcClient } from '../lib/trpc';
import { ForgotPasswordModal } from '../modals/ForgotPasswordModal';

type ConnexionScreenProps = {
  onSuccess: () => void;
  onNavigateToInscription: () => void;
};

export function ConnexionScreen({ onSuccess, onNavigateToInscription }: ConnexionScreenProps) {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [savedUser, setSavedUser] = useState<string | null>(null);

  const [showForgotPw, setShowForgotPw] = useState(false);

  useEffect(() => {
    async function checkBio() {
      try {
        const bioStatus = await checkBiometricStatus();
        const bioAuth = await getBiometricAuth();
        const isConfigured = await isBiometricsConfigured();

        if (bioAuth && bioStatus.hasHardware && isConfigured) {
          setSavedUser(`${bioAuth.user.prenom} ${bioAuth.user.nom}`);
          setMatricule(bioAuth.user.matricule);
          setHasBiometric(true);
        } else {
          const user = await getStoredUser();
          if (user) {
            setSavedUser(`${user.prenom} ${user.nom}`);
            setMatricule((prev) => prev || user.matricule);
          }
          setHasBiometric(false);
        }
      } catch {
        setHasBiometric(false);
      }
    }
    void checkBio();
  }, []);

  const handleBiometricLogin = async () => {
    setError(null);
    try {
      const authenticated = await authenticateWithBiometrics('Déverrouiller avec la biométrie');
      if (authenticated) {
        const bioAuth = await getBiometricAuth();
        const candidateToken = bioAuth?.token || (await getSessionToken());
        const candidateUser = bioAuth?.user || (await getStoredUser());

        if (candidateToken && candidateUser) {
          await saveSession(candidateToken, candidateUser);
          try {
            await trpcClient.auth.me.query();
            onSuccess();
            return;
          } catch (valErr: unknown) {
            const msg = valErr instanceof Error ? valErr.message : '';
            if (msg.includes('Vous devez être connecté')) {
              setError(
                'Votre session a expiré sur le serveur. Veuillez vous reconnecter avec votre mot de passe.',
              );
              return;
            }
            // Hors-ligne éventuel : on permet l'accès au cache SQLite
            onSuccess();
            return;
          }
        }
      }
      setError('Authentification biométrique non reconnue ou annulée.');
    } catch {
      setError("Impossible d'utiliser l'authentification biométrique.");
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!matricule.trim()) {
      setError('Veuillez renseigner votre matricule.');
      return;
    }
    if (!password) {
      setError('Veuillez renseigner votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = getBaseUrl();

      let targetEmail = matricule.trim().toLowerCase();
      if (!targetEmail.includes('@')) {
        try {
          const resEmail = await fetch(
            `${baseUrl}/api/auth/resolve-technicien-email?matricule=${encodeURIComponent(
              matricule.trim().toUpperCase(),
            )}`,
            {
              headers: {
                Accept: 'application/json',
                Origin: baseUrl,
              },
            },
          );
          if (resEmail.ok) {
            const dataEmail = await resEmail.json();
            if (dataEmail?.email) {
              targetEmail = dataEmail.email;
            }
          }
        } catch {
          targetEmail = `${matricule.trim().toLowerCase()}@tech.allotech.cm`;
        }
      }

      const res = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: baseUrl,
        },
        body: JSON.stringify({
          email: targetEmail,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.message || 'Matricule ou mot de passe incorrect. Vérifiez vos identifiants.',
        );
      }

      const data = await res.json();
      const token: string = data.token ?? data.session?.token ?? '';

      await saveSession(token, {
        id: '',
        matricule: matricule.trim().toUpperCase(),
        nom: '',
        prenom: '',
        technicienId: '',
        isActif: false,
      });

      // Récupère le profil technicien via tRPC avec le token injecté
      const profile = await trpcClient.auth.me.query();

      if (profile.role !== 'TECHNICIEN' || !profile.technicien) {
        throw new Error('Ce compte ne correspond pas à un technicien AlloTech.');
      }

      if (!profile.technicien.isActif) {
        throw new Error(
          "Votre compte est en attente d'activation par l'administrateur. Contactez votre responsable.",
        );
      }

      const fullUser = {
        id: profile.id,
        matricule: matricule.trim().toUpperCase(),
        nom: profile.technicien.nom,
        prenom: profile.technicien.prenom,
        technicienId: profile.technicien.id,
        isActif: profile.technicien.isActif,
        telephone: profile.technicien.telephone,
        photoUrl: profile.technicien.photoUrl ?? undefined,
        email:
          (profile as { email?: string }).email ||
          data.user?.email ||
          (targetEmail.includes('@') ? targetEmail : undefined),
      };

      // Mise à jour de la session active
      await saveSession(token, fullUser);

      // Met à jour les identifiants biométriques seulement si le technicien a activé l'option
      const bioConfigured = await isBiometricsConfigured();
      if (bioConfigured) {
        await saveBiometricAuth(token, fullUser);
      }

      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-7">
            <AlloTechLogo size={58} showText={true} subtitle="Application Technicien Terrain" />
          </View>

          <View className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex-row items-start gap-3">
                <AlertCircle size={18} color="#C0392B" />
                <Text className="text-red-700 text-sm font-medium flex-1 leading-5">{error}</Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
                Matricule ou Email
              </Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-[52px]">
                <User size={19} color="#64748B" />
                <TextInput
                  className="flex-1 ml-3 text-slate-900 text-base font-semibold"
                  placeholder="Ex: TEC-001 ou email"
                  placeholderTextColor="#94A3B8"
                  value={matricule}
                  onChangeText={(v) => {
                    setMatricule(v);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
                Mot de passe
              </Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-[52px]">
                <Lock size={19} color="#64748B" />
                <TextInput
                  className="flex-1 ml-3 text-slate-900 text-base font-medium"
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="ml-2 p-1"
                  accessibilityLabel="Afficher ou masquer le mot de passe"
                >
                  {showPassword ? (
                    <EyeOff size={19} color="#64748B" />
                  ) : (
                    <Eye size={19} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="items-end mb-5">
              <TouchableOpacity
                onPress={() => setShowForgotPw(true)}
                className="py-1"
                accessibilityLabel="Mot de passe oublié"
              >
                <Text className="text-sm font-bold text-[#FFA101]">Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`h-[52px] rounded-xl items-center justify-center flex-row gap-2 shadow-md mb-3 ${
                loading ? 'bg-slate-300' : 'bg-[#FFA101]'
              }`}
              accessibilityLabel="Se connecter"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#020617" />
              ) : (
                <>
                  <Text className="text-slate-950 font-black text-lg">Se connecter</Text>
                  <ArrowRight size={19} color="#020617" />
                </>
              )}
            </TouchableOpacity>

            {/* Bouton Biométrie (Empreinte / FaceID) si session précédente existante */}
            {hasBiometric && savedUser && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                className="h-[52px] bg-[#F0F8FA] border border-[#B3DEE5] rounded-xl items-center justify-center flex-row gap-3 shadow-xs"
                accessibilityLabel="Connexion par empreinte digitale ou FaceID"
              >
                <Fingerprint size={24} color="#31525B" />
                <Text className="text-[#31525B] font-bold text-base">
                  Connexion rapide : {savedUser}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="mt-8 items-center">
            <Text className="text-slate-600 text-base font-medium">
              Nouveau technicien ?{' '}
              <Text className="text-[#FFA101] font-bold" onPress={onNavigateToInscription}>
                Créer mon compte
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal visible={showForgotPw} onClose={() => setShowForgotPw(false)} />
    </SafeAreaView>
  );
}

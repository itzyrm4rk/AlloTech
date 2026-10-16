import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getBaseUrl } from '../lib/trpc';

export interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPw, setForgotNewPw] = useState('');
  const [forgotConfirmPw, setForgotConfirmPw] = useState('');
  const [showForgotPwText, setShowForgotPwText] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotInfo, setForgotInfo] = useState<string | null>(null);

  const resetForm = () => {
    setForgotStep(1);
    setForgotError(null);
    setForgotInfo(null);
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPw('');
    setForgotConfirmPw('');
    setShowForgotPwText(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRequestOtp = async () => {
    setForgotError(null);
    setForgotInfo(null);
    const inputVal = forgotEmail.trim();
    if (!inputVal) {
      setForgotError('Veuillez renseigner votre matricule ou adresse email.');
      return;
    }

    setForgotLoading(true);
    try {
      const baseUrl = getBaseUrl();
      let targetEmail = inputVal.toLowerCase();

      // Si l'utilisateur saisit un matricule (pas de @)
      if (!targetEmail.includes('@')) {
        try {
          const resEmail = await fetch(
            `${baseUrl}/api/auth/resolve-technicien-email?matricule=${encodeURIComponent(
              inputVal.toUpperCase(),
            )}`,
          );
          if (resEmail.ok) {
            const dataEmail = await resEmail.json();
            if (dataEmail?.email) {
              targetEmail = dataEmail.email;
              setForgotEmail(targetEmail);
            }
          }
        } catch {
          // Utiliser l'email par défaut si échec
        }
      }

      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: baseUrl,
        },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'envoyer le code.");
      }
      setForgotStep(2);
      setForgotInfo('Un code de vérification à 6 chiffres a été envoyé par email.');
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Erreur lors de la demande du code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotError(null);
    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setForgotError('Veuillez renseigner le code OTP à 6 chiffres.');
      return;
    }
    if (!forgotNewPw || forgotNewPw.length < 8) {
      setForgotError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (forgotNewPw !== forgotConfirmPw) {
      setForgotError('Les mots de passe ne correspondent pas.');
      return;
    }

    setForgotLoading(true);
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: baseUrl,
        },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          otp: cleanOtp,
          newPassword: forgotNewPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Échec de la réinitialisation.');
      }
      handleClose();
      Alert.alert('Succès', 'Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.');
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 border-t border-slate-200 max-h-[85%] shadow-2xl">
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-100">
            <View className="flex-row items-center gap-2">
              <KeyRound size={20} color="#FFA101" />
              <Text className="text-lg font-bold text-[#1A2C31]">
                {forgotStep === 1 ? 'Mot de passe oublié' : 'Vérification & Nouveau mot de passe'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} className="p-2" accessibilityLabel="Fermer">
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {forgotError && (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 my-3 flex-row items-center gap-2">
              <AlertCircle size={16} color="#C0392B" />
              <Text className="text-xs text-red-700 font-medium flex-1">{forgotError}</Text>
            </View>
          )}

          {forgotInfo && (
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 my-3 flex-row items-center gap-2">
              <CheckCircle2 size={16} color="#0284C7" />
              <Text className="text-xs text-blue-700 font-medium flex-1">{forgotInfo}</Text>
            </View>
          )}

          <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
            {forgotStep === 1 ? (
              <>
                <Text className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Saisissez votre matricule (ex: TEC-001) ou votre adresse email. Vous recevrez un
                  code OTP à 6 chiffres.
                </Text>

                <Text className="text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Matricule ou Email *
                </Text>
                <TextInput
                  value={forgotEmail}
                  onChangeText={(t) => {
                    setForgotEmail(t);
                    setForgotError(null);
                  }}
                  placeholder="ex: TEC-001 ou email"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-[50px] text-base text-slate-900 mb-6 font-medium"
                />

                <TouchableOpacity
                  onPress={handleRequestOtp}
                  disabled={forgotLoading}
                  className="min-h-[52px] bg-[#FFA101] rounded-xl flex-row items-center justify-center gap-2 mb-4 shadow-sm"
                  accessibilityLabel="Envoyer le code"
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#020617" />
                  ) : (
                    <>
                      <Mail size={18} color="#020617" />
                      <Text className="text-base font-bold text-slate-950">
                        Envoyer le code de vérification
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* ÉTAPE 2 : Saisie OTP + Nouveau mot de passe */
              <>
                <View className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex-row items-center justify-between">
                  <Text className="text-xs text-slate-600 flex-1" numberOfLines={1}>
                    Code envoyé à : <Text className="text-slate-900 font-bold">{forgotEmail}</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setForgotStep(1);
                      setForgotError(null);
                    }}
                    className="ml-2"
                  >
                    <Text className="text-xs text-[#FFA101] font-bold">Modifier</Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Code de sécurité (6 chiffres) *
                </Text>
                <TextInput
                  value={forgotOtp}
                  onChangeText={(t) => {
                    setForgotOtp(t.replace(/\D/g, ''));
                    setForgotError(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="123456"
                  placeholderTextColor="#94A3B8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-[50px] text-lg font-mono text-center text-slate-900 mb-4 tracking-widest font-bold"
                />

                <Text className="text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Nouveau mot de passe (min. 8 car.) *
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-[50px] mb-4">
                  <TextInput
                    value={forgotNewPw}
                    onChangeText={setForgotNewPw}
                    secureTextEntry={!showForgotPwText}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 text-base text-slate-900 font-medium"
                  />
                  <TouchableOpacity
                    onPress={() => setShowForgotPwText(!showForgotPwText)}
                    className="p-1"
                    accessibilityLabel="Afficher ou masquer le mot de passe"
                  >
                    {showForgotPwText ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>

                <Text className="text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Confirmer le nouveau mot de passe *
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-[50px] mb-6">
                  <TextInput
                    value={forgotConfirmPw}
                    onChangeText={setForgotConfirmPw}
                    secureTextEntry={!showForgotPwText}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 text-base text-slate-900 font-medium"
                  />
                  <TouchableOpacity
                    onPress={() => setShowForgotPwText(!showForgotPwText)}
                    className="p-1"
                    accessibilityLabel="Afficher ou masquer le mot de passe"
                  >
                    {showForgotPwText ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={forgotLoading}
                  className="min-h-[52px] bg-[#31525B] rounded-xl flex-row items-center justify-center gap-2 mb-3 shadow-sm"
                  accessibilityLabel="Réinitialiser le mot de passe"
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <KeyRound size={18} color="#FFA101" />
                      <Text className="text-base font-bold text-white">
                        Valider le nouveau mot de passe
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRequestOtp}
                  disabled={forgotLoading}
                  className="py-2 items-center justify-center flex-row gap-1 mb-4"
                >
                  <RefreshCw size={12} color="#64748B" />
                  <Text className="text-xs font-bold text-[#FFA101]">Renvoyer un nouveau code</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

import { AlertCircle, Eye, EyeOff, Lock, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getSessionToken } from '../../lib/auth-storage';
import { getBaseUrl } from '../../lib/trpc';

interface PasswordModalProps {
  visible: boolean;
  onClose: () => void;
  email?: string | null;
}

export function PasswordModal({ visible, onClose, email }: PasswordModalProps) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const handleClose = () => {
    setPwError(null);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    onClose();
  };

  const handleChangePassword = async () => {
    setPwError(null);
    if (!currentPw) {
      setPwError('Le mot de passe actuel est requis.');
      return;
    }
    if (!newPw || newPw.length < 8) {
      setPwError('Minimum 8 caractères requis.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Les mots de passe ne correspondent pas.');
      return;
    }

    setPwLoading(true);
    try {
      const token = await getSessionToken();
      const res = await fetch(`${getBaseUrl()}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: email || undefined,
          currentPassword: currentPw,
          newPassword: newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec de la modification.');
      handleClose();
      Alert.alert('Succès', 'Mot de passe modifié avec succès.');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Erreur lors de la modification.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modifier le mot de passe</Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {pwError && (
              <View style={styles.pwErrorBox}>
                <AlertCircle size={14} color="#DC2626" />
                <Text style={styles.pwErrorText}>{pwError}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>MOT DE PASSE ACTUEL</Text>
            <View style={styles.pwInputWrap}>
              <TextInput
                value={currentPw}
                onChangeText={setCurrentPw}
                secureTextEntry={!showCurrentPw}
                style={styles.pwInput}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity onPress={() => setShowCurrentPw((v) => !v)} style={styles.pwEyeBtn}>
                {showCurrentPw ? (
                  <EyeOff size={16} color="#94A3B8" />
                ) : (
                  <Eye size={16} color="#94A3B8" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>NOUVEAU MOT DE PASSE</Text>
            <View style={styles.pwInputWrap}>
              <TextInput
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry={!showNewPw}
                style={styles.pwInput}
                placeholder="Minimum 8 caractères"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity onPress={() => setShowNewPw((v) => !v)} style={styles.pwEyeBtn}>
                {showNewPw ? (
                  <EyeOff size={16} color="#94A3B8" />
                ) : (
                  <Eye size={16} color="#94A3B8" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>CONFIRMER LE MOT DE PASSE</Text>
            <View style={[styles.pwInputWrap, { marginBottom: 24 }]}>
              <TextInput
                value={confirmPw}
                onChangeText={setConfirmPw}
                secureTextEntry={!showConfirmPw}
                style={styles.pwInput}
                placeholder="Répétez le nouveau mot de passe"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity onPress={() => setShowConfirmPw((v) => !v)} style={styles.pwEyeBtn}>
                {showConfirmPw ? (
                  <EyeOff size={16} color="#94A3B8" />
                ) : (
                  <Eye size={16} color="#94A3B8" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={pwLoading}
              style={[styles.savePrimaryBtn, pwLoading && { opacity: 0.6 }]}
            >
              {pwLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Lock size={16} color="#FFFFFF" />
                  <Text style={styles.savePrimaryBtnText}>Modifier le mot de passe</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { paddingHorizontal: 20, paddingTop: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  pwInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
  },
  pwInput: { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '500' },
  pwEyeBtn: { padding: 4 },
  pwErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  pwErrorText: { flex: 1, fontSize: 12, color: '#DC2626', fontWeight: '500' },
  savePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#31525B',
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 24,
  },
  savePrimaryBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});

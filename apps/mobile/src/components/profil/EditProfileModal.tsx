import { Image as ImageIcon, Save, Trash2, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { resolveMediaUrl } from '../../lib/media-utils';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  prenom: string;
  onPrenomChange: (text: string) => void;
  nom: string;
  onNomChange: (text: string) => void;
  telephone: string;
  onTelephoneChange: (text: string) => void;
  avatar: string | null;
  onAvatarChange: (avatar: string | null) => void;
  initials: string;
  isSaving: boolean;
  onSave: () => void;
  onAvatarOptions: () => void;
}

export function EditProfileModal({
  visible,
  onClose,
  prenom,
  onPrenomChange,
  nom,
  onNomChange,
  telephone,
  onTelephoneChange,
  avatar,
  onAvatarChange,
  initials,
  isSaving,
  onSave,
  onAvatarOptions,
}: EditProfileModalProps) {
  const resolvedAvatar = resolveMediaUrl(avatar);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header modale */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modifier mon profil</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Photo */}
            <Text style={styles.fieldLabel}>PHOTO DE PROFIL</Text>
            <View style={styles.avatarEditRow}>
              {resolvedAvatar ? (
                <Image source={{ uri: resolvedAvatar }} style={styles.avatarEditImg} />
              ) : (
                <View style={styles.avatarEditFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.avatarEditBtns}>
                <TouchableOpacity onPress={onAvatarOptions} style={styles.avatarPickBtn}>
                  <ImageIcon size={14} color="#31525B" />
                  <Text style={styles.avatarPickBtnText}>Choisir une photo</Text>
                </TouchableOpacity>
                {avatar && (
                  <TouchableOpacity
                    onPress={() => onAvatarChange(null)}
                    style={styles.avatarRemoveBtn}
                  >
                    <Trash2 size={13} color="#DC2626" />
                    <Text style={styles.avatarRemoveBtnText}>Retirer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Prénom */}
            <Text style={styles.fieldLabel}>PRÉNOM *</Text>
            <TextInput
              value={prenom}
              onChangeText={onPrenomChange}
              style={styles.fieldInput}
              placeholder="Votre prénom"
              placeholderTextColor="#94A3B8"
            />

            {/* Nom */}
            <Text style={styles.fieldLabel}>NOM *</Text>
            <TextInput
              value={nom}
              onChangeText={onNomChange}
              style={styles.fieldInput}
              placeholder="Votre nom"
              placeholderTextColor="#94A3B8"
            />

            {/* Téléphone */}
            <Text style={styles.fieldLabel}>TÉLÉPHONE</Text>
            <TextInput
              value={telephone}
              onChangeText={onTelephoneChange}
              keyboardType="phone-pad"
              style={[styles.fieldInput, { marginBottom: 24 }]}
              placeholder="+237 6XX XX XX XX"
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity
              onPress={onSave}
              disabled={isSaving}
              style={[styles.savePrimaryBtn, isSaving && { opacity: 0.6 }]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={16} color="#FFFFFF" />
                  <Text style={styles.savePrimaryBtnText}>Enregistrer</Text>
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
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    marginBottom: 14,
  },
  avatarEditRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatarEditImg: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarEditFallback: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#31525B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  avatarEditBtns: { flex: 1, gap: 8 },
  avatarPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  avatarPickBtnText: { fontSize: 12, fontWeight: '700', color: '#31525B' },
  avatarRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  avatarRemoveBtnText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
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

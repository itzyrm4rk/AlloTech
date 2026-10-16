import { AlertCircle, ChevronRight, Fingerprint, KeyRound, Lock } from 'lucide-react-native';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import type { BiometricStatus } from '../../lib/auth-storage';

interface SecurityCardProps {
  bioStatus: BiometricStatus | null;
  biometricEnabled: boolean;
  selectedBiometricMode: 'FACE_ID' | 'FINGERPRINT';
  onToggleBiometrics: (val: boolean) => void;
  onSelectMode: (mode: 'FACE_ID' | 'FINGERPRINT') => void;
  onChangePasswordPress: () => void;
}

export function SecurityCard({
  bioStatus,
  biometricEnabled,
  selectedBiometricMode,
  onToggleBiometrics,
  onSelectMode,
  onChangePasswordPress,
}: SecurityCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionTitleRow}>
        <KeyRound size={18} color="#FFA101" />
        <Text style={styles.sectionTitle}>Sécurité du compte</Text>
      </View>

      {/* Biométrie */}
      <View style={styles.bioBox}>
        <View style={styles.bioHeader}>
          <View style={styles.bioHeaderLeft}>
            <Fingerprint size={20} color="#31525B" />
            <View>
              <Text style={styles.bioTitle}>Connexion biométrique</Text>
              <Text style={styles.bioSub}>
                {bioStatus?.hasHardware && bioStatus.isEnrolled
                  ? 'Activez selon votre préférence'
                  : 'Désactivée par défaut'}
              </Text>
            </View>
          </View>
          {bioStatus?.hasHardware && bioStatus.isEnrolled && (
            <Switch
              value={biometricEnabled}
              onValueChange={onToggleBiometrics}
              trackColor={{ false: '#E2E8F0', true: '#FFA101' }}
              thumbColor="#FFFFFF"
            />
          )}
        </View>

        {/* Choix du mode */}
        {bioStatus?.hasHardware && (
          <View style={styles.bioModes}>
            <Text style={styles.bioModesLabel}>Méthode</Text>
            <View style={styles.bioModesRow}>
              {(['FINGERPRINT', 'FACE_ID'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => onSelectMode(mode)}
                  style={[styles.bioPill, selectedBiometricMode === mode && styles.bioPillActive]}
                >
                  <Text
                    style={[
                      styles.bioPillText,
                      selectedBiometricMode === mode && { color: '#FFFFFF' },
                    ]}
                  >
                    {mode === 'FINGERPRINT' ? 'Empreinte' : 'Face ID'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {bioStatus?.hasHardware && !bioStatus.isEnrolled && (
          <View style={styles.bioWarning}>
            <AlertCircle size={13} color="#D97706" />
            <Text style={styles.bioWarningText}>
              Capteur détecté — aucune empreinte ou visage enregistré dans les Paramètres système.
            </Text>
          </View>
        )}

        {bioStatus !== null && !bioStatus?.hasHardware && (
          <View style={styles.bioWarning}>
            <AlertCircle size={13} color="#94A3B8" />
            <Text style={[styles.bioWarningText, { color: '#94A3B8' }]}>
              Capteur biométrique non disponible sur cet appareil.
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={onChangePasswordPress}
        style={styles.changePwBtn}
        accessibilityLabel="Changer mon mot de passe"
      >
        <View style={styles.changePwLeft}>
          <Lock size={16} color="#31525B" />
          <Text style={styles.changePwText}>Changer mon mot de passe</Text>
        </View>
        <ChevronRight size={16} color="#CBD5E1" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  bioBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 2,
    marginBottom: 12,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bioHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bioTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  bioSub: { fontSize: 13, color: '#64748B', marginTop: 1 },
  bioModes: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  bioModesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  bioModesRow: { flexDirection: 'row', gap: 8 },
  bioPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bioPillActive: { backgroundColor: '#31525B', borderColor: '#31525B' },
  bioPillText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  bioWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bioWarningText: { fontSize: 13, color: '#D97706', flex: 1, lineHeight: 18 },
  changePwBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  changePwLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  changePwText: { fontSize: 16, fontWeight: '700', color: '#31525B' },
});

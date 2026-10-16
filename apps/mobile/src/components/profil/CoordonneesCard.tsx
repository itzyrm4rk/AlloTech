import { Mail, Phone, Shield } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CoordonneesCardProps {
  matricule?: string | null;
  email: string;
  telephone?: string | null;
}

function InfoRow({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, accent && { backgroundColor: '#FFF7ED' }]}>{icon}</View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, accent && { color: '#31525B', fontWeight: '800' }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function CoordonneesCard({ matricule, email, telephone }: CoordonneesCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Coordonnées professionnelles</Text>

      <InfoRow
        icon={<Shield size={17} color="#31525B" />}
        label="Matricule"
        value={matricule || '—'}
        accent
      />
      <View style={styles.divider} />
      <InfoRow
        icon={<Mail size={17} color="#31525B" />}
        label="Email professionnel"
        value={email}
      />
      <View style={styles.divider} />
      <InfoRow
        icon={<Phone size={17} color="#31525B" />}
        label="Téléphone"
        value={telephone || 'Non renseigné'}
      />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
});

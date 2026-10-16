import { Award, Edit2 } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CompetencesCardProps {
  techCompetences: Array<{ id: string; libelle: string }>;
  isLoadingCompetences: boolean;
  onEditPress: () => void;
}

export function CompetencesCard({
  techCompetences,
  isLoadingCompetences,
  onEditPress,
}: CompetencesCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Award size={18} color="#FFA101" />
          <Text style={styles.sectionTitle}>Compétences techniques</Text>
        </View>
        <TouchableOpacity
          onPress={onEditPress}
          style={styles.editPill}
          accessibilityLabel="Modifier mes compétences"
        >
          <Edit2 size={12} color="#D97706" />
          <Text style={styles.editPillText}>Modifier</Text>
        </TouchableOpacity>
      </View>

      {isLoadingCompetences ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#FFA101" />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      ) : techCompetences.length > 0 ? (
        <View style={styles.compTagsWrap}>
          {techCompetences.map((comp) => (
            <View key={comp.id} style={styles.compTag}>
              <View style={styles.compTagDot} />
              <Text style={styles.compTagText}>{comp.libelle}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCompBox}>
          <Text style={styles.emptyCompText}>Aucune compétence sélectionnée.</Text>
          <TouchableOpacity onPress={onEditPress} style={styles.addCompBtn}>
            <Text style={styles.addCompBtnText}>+ Ajouter des compétences</Text>
          </TouchableOpacity>
        </View>
      )}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  editPillText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  loadingText: { fontSize: 14, color: '#94A3B8' },
  compTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  compTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  compTagDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFA101' },
  compTagText: { fontSize: 15, fontWeight: '600', color: '#334155' },
  emptyCompBox: {
    padding: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 10,
  },
  emptyCompText: { fontSize: 15, color: '#94A3B8', textAlign: 'center' },
  addCompBtn: {
    backgroundColor: '#31525B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addCompBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

import { Check, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CompetenceItem {
  id: string;
  libelle: string;
  code?: string | null;
}

interface CompetencesModalProps {
  visible: boolean;
  onClose: () => void;
  catalog: CompetenceItem[];
  selectedCompIds: string[];
  onToggleComp: (id: string) => void;
  isSaving: boolean;
  onSave: () => void;
}

export function CompetencesModal({
  visible,
  onClose,
  catalog,
  selectedCompIds,
  onToggleComp,
  isSaving,
  onSave,
}: CompetencesModalProps) {
  const [competenceSearch, setCompetenceSearch] = useState('');

  const filteredCatalog = catalog.filter((c) =>
    c.libelle.toLowerCase().includes(competenceSearch.toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Mes compétences</Text>
              <Text style={styles.modalSub}>{selectedCompIds.length} sélectionnée(s)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Barre de recherche */}
          <View style={styles.compSearchBar}>
            <Search size={14} color="#94A3B8" />
            <TextInput
              value={competenceSearch}
              onChangeText={setCompetenceSearch}
              placeholder="Rechercher une compétence…"
              placeholderTextColor="#94A3B8"
              style={styles.compSearchInput}
            />
          </View>

          <ScrollView style={styles.compList} keyboardShouldPersistTaps="handled">
            {filteredCatalog.length === 0 ? (
              <Text style={styles.compEmptyText}>Aucune compétence trouvée.</Text>
            ) : (
              filteredCatalog.map((comp) => {
                const isSelected = selectedCompIds.includes(comp.id);
                return (
                  <TouchableOpacity
                    key={comp.id}
                    onPress={() => onToggleComp(comp.id)}
                    style={[styles.compItem, isSelected && styles.compItemActive]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.compItemText,
                        isSelected && { color: '#31525B', fontWeight: '700' },
                      ]}
                    >
                      {comp.libelle}
                    </Text>
                    {isSelected && (
                      <View style={styles.compItemCheck}>
                        <Check size={13} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.compFooter}>
            <TouchableOpacity
              onPress={onSave}
              disabled={isSaving}
              style={[styles.savePrimaryBtn, { flex: 1 }, isSaving && { opacity: 0.6 }]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.savePrimaryBtnText}>
                  Enregistrer ({selectedCompIds.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
  modalSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  compSearchInput: { flex: 1, fontSize: 14, color: '#1E293B' },
  compList: { flex: 1, paddingHorizontal: 16 },
  compEmptyText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingVertical: 20 },
  compItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compItemActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  compItemText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  compItemCheck: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: '#31525B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  savePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#31525B',
    borderRadius: 14,
    paddingVertical: 15,
  },
  savePrimaryBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});

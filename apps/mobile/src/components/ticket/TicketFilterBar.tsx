import { CheckCircle2, Clock, Flame, Inbox, Search, X } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  accent: string;
  active: boolean;
  onPress: () => void;
}

function StatCard({ label, value, icon, accent, active, onPress }: StatCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={[styles.statCard, active && { backgroundColor: accent, borderColor: accent }]}
    >
      <View
        style={[
          styles.statIcon,
          { backgroundColor: active ? 'rgba(255,255,255,0.2)' : `${accent}18` },
        ]}
      >
        {icon}
      </View>
      <Text style={[styles.statValue, active && { color: '#FFFFFF' }]}>{value}</Text>
      <Text style={[styles.statLabel, active && { color: 'rgba(255,255,255,0.85)' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export interface TicketFilterBarProps {
  totalCount: number;
  filteredCount: number;
  enCoursCount: number;
  aTraiterCount: number;
  urgentsCount: number;
  terminesCount: number;
  filterStatut: string;
  onFilterStatutChange: (filter: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function TicketFilterBar({
  totalCount,
  filteredCount,
  enCoursCount,
  aTraiterCount,
  urgentsCount,
  terminesCount,
  filterStatut,
  onFilterStatutChange,
  searchQuery,
  onSearchQueryChange,
}: TicketFilterBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <View>
      {/* Stats cards (Scroll horizontal avec 4 colonnes : En cours, À traiter, Traités, Urgents) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        <StatCard
          label="En cours"
          value={enCoursCount}
          accent="#F59E0B"
          icon={<Clock size={16} color={filterStatut === 'EN_COURS' ? '#FFFFFF' : '#F59E0B'} />}
          active={filterStatut === 'EN_COURS'}
          onPress={() => onFilterStatutChange(filterStatut === 'EN_COURS' ? 'TOUS' : 'EN_COURS')}
        />
        <StatCard
          label="À traiter"
          value={aTraiterCount}
          accent="#31525B"
          icon={<Inbox size={16} color={filterStatut === 'ASSIGNEE' ? '#FFFFFF' : '#31525B'} />}
          active={filterStatut === 'ASSIGNEE'}
          onPress={() => onFilterStatutChange(filterStatut === 'ASSIGNEE' ? 'TOUS' : 'ASSIGNEE')}
        />
        <StatCard
          label="Urgents"
          value={urgentsCount}
          accent="#DC2626"
          icon={<Flame size={16} color={filterStatut === 'CRITIQUE' ? '#FFFFFF' : '#DC2626'} />}
          active={filterStatut === 'CRITIQUE'}
          onPress={() => onFilterStatutChange(filterStatut === 'CRITIQUE' ? 'TOUS' : 'CRITIQUE')}
        />
        <StatCard
          label="Traités"
          value={terminesCount}
          accent="#10B981"
          icon={
            <CheckCircle2 size={16} color={filterStatut === 'TERMINEE' ? '#FFFFFF' : '#10B981'} />
          }
          active={filterStatut === 'TERMINEE'}
          onPress={() => onFilterStatutChange(filterStatut === 'TERMINEE' ? 'TOUS' : 'TERMINEE')}
        />
      </ScrollView>

      {/* Séparateur + titre section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes interventions</Text>
        {totalCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredCount}</Text>
          </View>
        )}
      </View>

      {/* Barre de recherche */}
      <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
        <Search size={15} color={searchFocused ? '#31525B' : '#94A3B8'} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Rechercher client, référence…"
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchQueryChange('')} style={styles.searchClear}>
            <X size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Pills de filtre */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {[
          { key: 'TOUS', label: `Tous (${totalCount})` },
          { key: 'EN_COURS', label: `En cours (${enCoursCount})` },
          { key: 'ASSIGNEE', label: `À traiter (${aTraiterCount})` },
          { key: 'TERMINEE', label: `Terminés (${terminesCount})` },
        ].map((f) => {
          const active = filterStatut === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => onFilterStatutChange(f.key)}
              activeOpacity={0.7}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    minWidth: 104,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E293B',
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  searchBarFocused: {
    borderColor: '#31525B',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  searchClear: { padding: 2 },
  filtersRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
});

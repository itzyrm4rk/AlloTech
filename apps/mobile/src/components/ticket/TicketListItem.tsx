import { ChevronRight, MapPin, Phone, Users } from 'lucide-react-native';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { STATUT_CONFIG, URGENCE_CONFIG } from '../../types/ticket.types';
import type { Ticket } from '../../types/ticket.types';

export interface TicketListItemProps {
  ticket: Ticket;
  onPress: (t: Ticket) => void;
}

export function TicketListItem({ ticket, onPress }: TicketListItemProps) {
  const urg = URGENCE_CONFIG[ticket.urgence] ?? URGENCE_CONFIG.NORMALE;
  const stat = STATUT_CONFIG[ticket.statut] ?? STATUT_CONFIG.ASSIGNEE;
  const isCritique = ticket.urgence === 'CRITIQUE';

  return (
    <TouchableOpacity
      onPress={() => onPress(ticket)}
      activeOpacity={0.72}
      style={[styles.card, isCritique && styles.cardCritique]}
      accessibilityLabel={`Intervention ${ticket.reference} – ${ticket.client}`}
    >
      {/* Bande colorée urgence à gauche */}
      <View style={[styles.cardAccent, { backgroundColor: urg.color }]} />

      <View style={styles.cardBody}>
        {/* Ligne 1 : Référence + Statut */}
        <View style={styles.cardRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardRef}>#{ticket.reference}</Text>
            {ticket.techniciensCount && ticket.techniciensCount > 1 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: '#EEF2FF',
                  paddingHorizontal: 6,
                  paddingVertical: 1.5,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#C7D2FE',
                }}
              >
                <Users size={10} color="#4338CA" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#4338CA' }}>
                  Binôme ({ticket.techniciensCount})
                </Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.statBadge, { backgroundColor: stat.bg }]}>
            <View style={[styles.statDot, { backgroundColor: stat.dot }]} />
            <Text style={[styles.statText, { color: stat.color }]}>{stat.label}</Text>
          </View>
        </View>

        {/* Ligne 2 : Nom du client + Bouton d'appel téléphonique natif */}
        <View style={styles.cardClientRow}>
          <Text style={[styles.cardClient, { flex: 1 }]} numberOfLines={1}>
            {ticket.client}
          </Text>
          {ticket.clientTelephone ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${ticket.clientTelephone}`)}
              style={styles.phoneButton}
              activeOpacity={0.7}
              accessibilityLabel={`Appeler ${ticket.clientTelephone}`}
            >
              <Phone size={12} color="#166534" />
              <Text style={styles.phoneButtonText}>{ticket.clientTelephone}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Ligne 3 : Type de demande */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 }}>
          {ticket.typeDemande === 'INSTALLATION' ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#FEF3C7',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#FDE68A',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#92400E' }}>
                NOUVELLE INSTALLATION
              </Text>
            </View>
          ) : (
            <Text style={[styles.cardType, { color: urg.color }]} numberOfLines={1}>
              {ticket.typeDemande.replace(/_/g, ' ')}
            </Text>
          )}
        </View>

        {/* Ligne 4 : Description courte */}
        <Text style={styles.cardDesc} numberOfLines={2}>
          {ticket.description}
        </Text>

        {/* Pied : adresse + urgence + chevron */}
        <View style={styles.cardFooter}>
          <View style={styles.cardAddressRow}>
            <MapPin size={11} color="#94A3B8" />
            <Text style={styles.cardAddress} numberOfLines={1}>
              {ticket.adresseSite}
            </Text>
          </View>

          <View style={styles.cardFooterRight}>
            <View style={[styles.urgBadge, { backgroundColor: urg.bg }]}>
              <Text style={[styles.urgText, { color: urg.color }]}>{urg.label}</Text>
            </View>
            <ChevronRight size={15} color="#CBD5E1" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardCritique: {
    borderColor: '#FCA5A5',
    shadowColor: '#DC2626',
    shadowOpacity: 0.1,
  },
  cardAccent: {
    width: 4,
    borderRadius: 0,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardRef: {
    fontSize: 13,
    fontWeight: '800',
    color: '#31525B',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  phoneButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    fontFamily: 'monospace',
  },
  cardClient: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  cardType: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingRight: 8,
  },
  cardAddress: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  cardFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

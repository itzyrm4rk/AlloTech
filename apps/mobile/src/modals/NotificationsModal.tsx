import { Bell, Check, CheckCheck, Clock, Flame, Info, UserCheck, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { trpcClient } from '../lib/trpc';

interface AlerteItem {
  id: string;
  typeAlerte?: string;
  type?: string;
  message: string;
  isLue: boolean;
  ticketId?: string | null;
  createdAt: Date | string;
  ticket?: {
    reference: string;
  } | null;
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  onUnreadCountChanged?: (count: number) => void;
  onSelectTicket?: (ticketId: string) => void;
}

export function NotificationsModal({
  visible,
  onClose,
  onUnreadCountChanged,
  onSelectTicket,
}: NotificationsModalProps) {
  const [alertes, setAlertes] = useState<AlerteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAlertes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await trpcClient.alertes.list.query({
        nonLuesSeulement: false,
        limit: 30,
      });
      const mapped = (data || []) as unknown as AlerteItem[];
      setAlertes(mapped);
      const unreadCount = mapped.filter((a) => !a.isLue).length;
      onUnreadCountChanged?.(unreadCount);
    } catch {
      // Échec silencieux
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChanged]);

  useEffect(() => {
    if (visible) {
      void fetchAlertes();
    }
  }, [visible, fetchAlertes]);

  const handleMarquerLue = async (alerteId: string) => {
    try {
      await trpcClient.alertes.marquerLue.mutate({ alerteId });
      setAlertes((prev) => prev.map((a) => (a.id === alerteId ? { ...a, isLue: true } : a)));
      const remainingUnread = alertes.filter((a) => a.id !== alerteId && !a.isLue).length;
      onUnreadCountChanged?.(remainingUnread);
    } catch {
      // Ignorer
    }
  };

  const handleMarquerToutesLues = async () => {
    setMarkingAll(true);
    try {
      await trpcClient.alertes.marquerToutesLues.mutate();
      setAlertes((prev) => prev.map((a) => ({ ...a, isLue: true })));
      onUnreadCountChanged?.(0);
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues.');
    } catch {
      Alert.alert('Erreur', 'Impossible de marquer toutes les notifications comme lues.');
    } finally {
      setMarkingAll(false);
    }
  };

  const getAlerteIcon = (type?: string | null) => {
    switch (type) {
      case 'SLA_DEPASSE':
      case 'SLA_PREDICTIF':
        return <Flame size={16} color="#B91C1C" />;
      case 'PAUSE_PROLONGEE':
        return <Clock size={16} color="#D97706" />;
      case 'NOUVELLE_INSCRIPTION':
        return <UserCheck size={16} color="#2563EB" />;
      default:
        return <Info size={16} color="#31525B" />;
    }
  };

  const unreadList = alertes.filter((a) => !a.isLue);
  const displayedList = filterUnreadOnly ? unreadList : alertes;

  const s = nStyles;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.bellIcon}>
                <Bell size={18} color="#D97706" />
              </View>
              <View>
                <Text style={s.headerTitle}>Notifications</Text>
                <Text style={s.headerSub}>
                  {unreadList.length} non lue{unreadList.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <View style={s.headerRight}>
              {unreadList.length > 0 && (
                <TouchableOpacity
                  onPress={handleMarquerToutesLues}
                  disabled={markingAll}
                  activeOpacity={0.7}
                  style={s.readAllBtn}
                  accessibilityLabel="Tout marquer comme lu"
                >
                  <CheckCheck size={14} color="#31525B" />
                  <Text style={s.readAllText}>Tout lire</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={s.closeBtn} accessibilityLabel="Fermer">
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filtres */}
          <View style={s.filters}>
            {[
              { key: false, label: `Toutes (${alertes.length})` },
              { key: true, label: `Non lues (${unreadList.length})` },
            ].map((f) => (
              <TouchableOpacity
                key={String(f.key)}
                onPress={() => setFilterUnreadOnly(f.key)}
                style={[s.filterPill, filterUnreadOnly === f.key && s.filterPillActive]}
              >
                <Text
                  style={[s.filterPillText, filterUnreadOnly === f.key && s.filterPillTextActive]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Liste */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={s.center}>
                <ActivityIndicator size="small" color="#FFA101" />
                <Text style={s.loadingText}>Chargement…</Text>
              </View>
            ) : displayedList.length === 0 ? (
              <View style={s.emptyBox}>
                <View style={s.emptyIcon}>
                  <Check size={28} color="#2E8B57" />
                </View>
                <Text style={s.emptyTitle}>Vous êtes à jour !</Text>
                <Text style={s.emptySub}>
                  {filterUnreadOnly ? 'Aucune notification non lue.' : 'Aucune notification reçue.'}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {displayedList.map((item) => {
                  const dateStr = new Date(item.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const alerteType = (item.typeAlerte || item.type || 'NOTIFICATION').toString();
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        if (!item.isLue) void handleMarquerLue(item.id);
                        const targetTicketId = item.ticketId;
                        if (targetTicketId && onSelectTicket) {
                          onClose();
                          onSelectTicket(targetTicketId);
                        }
                      }}
                      activeOpacity={0.7}
                      style={[s.notifItem, !item.isLue && s.notifItemUnread]}
                    >
                      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                        <View style={s.notifIconBox}>{getAlerteIcon(alerteType)}</View>
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 3,
                            }}
                          >
                            <Text style={s.notifType}>{alerteType.replace(/_/g, ' ')}</Text>
                            {!item.isLue && <View style={s.unreadDot} />}
                          </View>
                          <Text style={s.notifMsg}>{item.message}</Text>
                          {item.ticket?.reference && (
                            <Text style={s.notifRef}>Ticket : #{item.ticket.reference}</Text>
                          )}
                          <Text style={s.notifDate}>{dateStr}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const nStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    height: '85%',
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  headerSub: { fontSize: 14, color: '#94A3B8', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  readAllText: { fontSize: 13, fontWeight: '700', color: '#31525B' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterPillActive: { backgroundColor: '#31525B', borderColor: '#31525B' },
  filterPillText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  filterPillTextActive: { color: '#FFFFFF' },
  center: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: '#94A3B8' },
  emptyBox: { paddingVertical: 48, alignItems: 'center', paddingHorizontal: 20 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  emptySub: { fontSize: 15, color: '#94A3B8', textAlign: 'center', marginTop: 6, lineHeight: 22 },
  notifItem: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifItemUnread: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  notifIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifType: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFA101' },
  notifMsg: { fontSize: 15, color: '#334155', lineHeight: 22, fontWeight: '500' },
  notifRef: {
    fontSize: 13,
    color: '#31525B',
    fontFamily: 'monospace',
    marginTop: 6,
    fontWeight: '800',
  },
  notifDate: { fontSize: 13, color: '#94A3B8', marginTop: 6 },
});

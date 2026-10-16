import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  AlertCircle,
  History,
  Keyboard,
  QrCode,
  RefreshCw,
  Search,
  Server,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
import { trpcClient } from '../lib/trpc';

interface QrScanModalProps {
  visible: boolean;
  onClose: () => void;
  onEquipementScanned?: (equipement: EquipementData) => void;
}

export interface EquipementData {
  id: string;
  modele: string;
  numeroSerie: string;
  statut: string;
  qrCodeData?: string | null;
  siteAdresse?: string | null;
  dateInstallation?: Date | string | null;
  client?: {
    nom: string;
    telephone?: string;
  } | null;
  tickets?: Array<{
    id: string;
    reference: string;
    statutActuel: string;
    urgence: string;
    description: string;
    createdAt: Date | string;
  }>;
}

export function QrScanModal({ visible, onClose, onEquipementScanned }: QrScanModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [equipement, setEquipement] = useState<EquipementData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [recentEquipements, setRecentEquipements] = useState<EquipementData[]>([]);

  useEffect(() => {
    if (visible) {
      if (!permission?.granted) {
        void requestPermission();
      }
      setScanned(false);
      setEquipement(null);
      setError(null);
      setManualCode('');
      setShowManualInput(false);

      void trpcClient.equipements.list
        .query({ limit: 8 })
        .then((res) => {
          if (res?.data) {
            setRecentEquipements(res.data as unknown as EquipementData[]);
          }
        })
        .catch(() => {});
    }
  }, [visible, permission?.granted, requestPermission]);

  const handleLookup = async (code: string) => {
    if (!code || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await trpcClient.equipements.byQrCode.query({ qrCodeData: code });
      setEquipement(data as EquipementData);
      onEquipementScanned?.(data as EquipementData);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Équipement introuvable pour ce QR Code ou numéro de série.',
      );
      setTimeout(() => setScanned(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || loading || equipement) return;
    setScanned(true);
    void handleLookup(data);
  };

  const s = qStyles;

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
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.headerIcon}>
                <QrCode size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={s.headerTitle}>Scanner QR Équipement</Text>
                <Text style={s.headerSub}>Identification CMDB & Historique technique</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn} accessibilityLabel="Fermer">
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {!equipement && (
              <View style={s.cameraSection}>
                {!permission?.granted ? (
                  <View style={s.permBox}>
                    <QrCode size={48} color="#31525B" />
                    <Text style={s.permTitle}>Autorisation Caméra requise</Text>
                    <Text style={s.permSub}>
                      Pour scanner les codes QR fixés sur les équipements du parc, l'accès à la
                      caméra est nécessaire.
                    </Text>
                    <TouchableOpacity onPress={requestPermission} style={s.permBtn}>
                      <Text style={s.permBtnText}>Autoriser la caméra</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={s.cameraBox}>
                    <CameraView
                      style={{ flex: 1 }}
                      facing="back"
                      barcodeScannerSettings={{
                        barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a'],
                      }}
                      onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                    />

                    {/* Viseur */}
                    <View style={s.viewfinder}>
                      <View style={s.viewfinderBox} />
                      <Text style={s.viewfinderLabel}>
                        {scanned
                          ? 'Code détecté, analyse…'
                          : 'Pointez vers le QR Code ou Code-barres'}
                      </Text>
                    </View>

                    {scanned && (
                      <View style={s.rescanWrap}>
                        <TouchableOpacity
                          onPress={() => {
                            setScanned(false);
                            setError(null);
                          }}
                          style={s.rescanBtn}
                        >
                          <RefreshCw size={14} color="#FFFFFF" />
                          <Text style={s.rescanBtnText}>Re-scanner</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Saisie manuelle */}
                <View style={{ width: '100%', marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => setShowManualInput(!showManualInput)}
                    style={s.manualToggle}
                  >
                    <Keyboard size={15} color="#31525B" />
                    <Text style={s.manualToggleText}>
                      {showManualInput
                        ? 'Masquer la saisie manuelle'
                        : 'Saisir le numéro de série manuellement'}
                    </Text>
                  </TouchableOpacity>

                  {showManualInput && (
                    <View style={s.manualRow}>
                      <TextInput
                        value={manualCode}
                        onChangeText={setManualCode}
                        placeholder="Ex: SN-2026-X99 ou UUID..."
                        placeholderTextColor="#94A3B8"
                        style={s.manualInput}
                      />
                      <TouchableOpacity
                        onPress={() => handleLookup(manualCode.trim())}
                        disabled={!manualCode.trim() || loading}
                        style={s.manualSearchBtn}
                      >
                        <Search size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {recentEquipements.length > 0 && !equipement && (
                  <View style={s.recentWrap}>
                    <View style={s.recentHeader}>
                      <Server size={14} color="#64748B" />
                      <Text style={s.recentTitle}>Équipements récents du parc CMDB :</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {recentEquipements.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() =>
                            handleLookup(item.qrCodeData || item.numeroSerie || item.id)
                          }
                          style={s.recentItem}
                        >
                          <Text style={s.recentItemModel}>{item.modele}</Text>
                          <Text style={s.recentItemSn}>SN: {item.numeroSerie}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* Chargement */}
            {loading && (
              <View style={s.center}>
                <ActivityIndicator size="large" color="#FFA101" />
                <Text style={s.loadingText}>Recherche dans l'annuaire CMDB...</Text>
              </View>
            )}

            {/* Erreur */}
            {error && !loading && (
              <View style={s.errorBox}>
                <AlertCircle size={18} color="#C0392B" />
                <View style={{ flex: 1 }}>
                  <Text style={s.errorTitle}>Équipement non trouvé</Text>
                  <Text style={s.errorMsg}>{error}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setScanned(false);
                      setError(null);
                    }}
                    style={s.errorBtn}
                  >
                    <Text style={s.errorBtnText}>Scanner à nouveau</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Fiche équipement trouvée */}
            {equipement && !loading && (
              <View style={s.equipCard}>
                {/* Header équipement */}
                <View style={s.equipHeader}>
                  <View style={s.equipHeaderRow}>
                    <View style={s.equipStatusBadge}>
                      <Text style={s.equipStatusText}>{equipement.statut}</Text>
                    </View>
                    <Text style={s.equipSn}>N° {equipement.numeroSerie}</Text>
                  </View>
                  <Text style={s.equipModel}>{equipement.modele}</Text>
                  {equipement.client && (
                    <Text style={s.equipClient}>
                      Client : <Text style={{ fontWeight: '700' }}>{equipement.client.nom}</Text>
                    </Text>
                  )}
                  {equipement.siteAdresse && (
                    <Text style={s.equipSite}>Site : {equipement.siteAdresse}</Text>
                  )}
                </View>

                {/* Historique */}
                <View style={s.historyCard}>
                  <View style={s.historyHeader}>
                    <History size={16} color="#31525B" />
                    <Text style={s.historyTitle}>
                      Historique des interventions ({equipement.tickets?.length ?? 0})
                    </Text>
                  </View>

                  {!equipement.tickets || equipement.tickets.length === 0 ? (
                    <Text style={s.historyEmpty}>
                      Aucune intervention passée enregistrée sur cet équipement.
                    </Text>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {equipement.tickets.map((t) => (
                        <View key={t.id} style={s.ticketItem}>
                          <View style={s.ticketItemHeader}>
                            <Text style={s.ticketRef}>{t.reference}</Text>
                            <Text style={s.ticketDate}>
                              {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                            </Text>
                          </View>
                          <Text style={s.ticketDesc} numberOfLines={2}>
                            {t.description}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                              marginTop: 6,
                            }}
                          >
                            <View style={s.ticketStatusBadge}>
                              <Text style={s.ticketStatusText}>{t.statutActuel}</Text>
                            </View>
                            <Text style={s.ticketUrgence}>Priorité : {t.urgence}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setEquipement(null);
                    setScanned(false);
                  }}
                  style={s.newScanBtn}
                >
                  <Text style={s.newScanBtnText}>Scanner un autre équipement</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const qStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    height: '92%',
    maxHeight: '94%',
    overflow: 'hidden',
  },

  header: {
    backgroundColor: '#31525B',
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFA101',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#CBD5E1', marginTop: 1 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Camera section
  cameraSection: { padding: 16, alignItems: 'center' },
  permBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginVertical: 16,
  },
  permTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 12,
    textAlign: 'center',
  },
  permSub: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 22,
  },
  permBtn: {
    backgroundColor: '#FFA101',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  cameraBox: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFA101',
    backgroundColor: '#000',
  },
  viewfinder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderBox: {
    width: 180,
    height: 180,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#FFA101',
    borderRadius: 16,
    backgroundColor: 'rgba(255,161,1,0.08)',
  },
  viewfinderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rescanWrap: { position: 'absolute', bottom: 12, left: 12, right: 12, alignItems: 'center' },
  rescanBtn: {
    backgroundColor: '#FFA101',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rescanBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  manualToggleText: { fontSize: 14, fontWeight: '700', color: '#31525B' },
  manualRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  manualInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  manualSearchBtn: {
    width: 50,
    height: 50,
    backgroundColor: '#31525B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentWrap: {
    width: '100%',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  recentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: '#475569' },
  recentItem: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  recentItemModel: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  recentItemSn: { fontSize: 12, color: '#64748B', fontFamily: 'monospace' },
  center: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: '#64748B' },
  errorBox: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  errorTitle: { fontSize: 15, fontWeight: '800', color: '#991B1B' },
  errorMsg: { fontSize: 14, color: '#DC2626', marginTop: 4 },
  errorBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
  },
  errorBtnText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  equipCard: { padding: 16, gap: 12 },
  equipHeader: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  equipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  equipStatusBadge: {
    backgroundColor: 'rgba(49,82,91,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  equipStatusText: { fontSize: 13, fontWeight: '800', color: '#31525B' },
  equipSn: { fontSize: 13, color: '#64748B', fontFamily: 'monospace', fontWeight: '700' },
  equipModel: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  equipClient: { fontSize: 14, color: '#475569', marginTop: 4, fontWeight: '600' },
  equipSite: { fontSize: 14, color: '#64748B', marginTop: 2 },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  historyTitle: { fontSize: 16, fontWeight: '800', color: '#31525B' },
  historyEmpty: { fontSize: 14, color: '#94A3B8', fontStyle: 'italic' },
  ticketItem: {
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  ticketItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ticketRef: { fontSize: 14, fontWeight: '800', color: '#31525B', fontFamily: 'monospace' },
  ticketDate: { fontSize: 12, color: '#94A3B8' },
  ticketDesc: { fontSize: 14, color: '#475569', fontWeight: '500', lineHeight: 20 },
  ticketStatusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ticketStatusText: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  ticketUrgence: { fontSize: 12, color: '#64748B' },
  newScanBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  newScanBtnText: { fontSize: 15, fontWeight: '800', color: '#31525B' },
});

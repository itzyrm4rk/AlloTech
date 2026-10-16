import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  Sparkles,
  Tag,
  User,
  Wrench,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { trpcClient } from '../lib/trpc';

interface PanneItem {
  id: string;
  reference: string;
  typeDemande: string;
  urgence: string;
  statutActuel: string;
  description: string;
  categoriePanne?: string | null;
  sousTypePanneMat?: string | null;
  sousTypePanneLog?: string | null;
  heureDemarrage?: string | Date | null;
  heureFinale?: string | Date | null;
  createdAt: string | Date;
  clotureAt?: string | Date | null;
  rapport?: {
    contenu: string;
    technicien?: {
      user?: {
        nom?: string | null;
        prenom?: string | null;
      } | null;
    } | null;
  } | null;
  techniciens?: Array<{
    technicien?: {
      user?: {
        nom?: string | null;
        prenom?: string | null;
      } | null;
    } | null;
  }>;
}

interface PannesRecentesModalProps {
  visible: boolean;
  onClose: () => void;
  equipementId?: string | null;
  equipementNom?: string | null;
  clientId?: string | null;
  clientNom?: string | null;
  currentTicketId: string;
  onSelectPanne?: (panne: PanneItem) => void;
}

export function PannesRecentesModal({
  visible,
  onClose,
  equipementId,
  equipementNom,
  clientId,
  clientNom,
  currentTicketId,
  onSelectPanne,
}: PannesRecentesModalProps) {
  const [loading, setLoading] = useState(false);
  const [pannes, setPannes] = useState<PanneItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const screenHeight = Dimensions.get('window').height;
  const sheetHeight = Math.round(screenHeight * 0.82);

  const fetchPannes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let list: PanneItem[] = [];

      if (equipementId) {
        // Récupérer les tickets rattachés à cet équipement via equipements.byId
        const eqData = await trpcClient.equipements.byId.query({ id: equipementId });
        if (eqData?.tickets) {
          list = eqData.tickets as unknown as PanneItem[];
        }
      } else if (clientId) {
        // Fallback : récupérer les tickets du client
        const res = await trpcClient.tickets.list.query({
          clientId,
          limit: 20,
        });
        if (res?.data) {
          list = res.data as unknown as PanneItem[];
        }
      }

      // Filtrer pour exclure le ticket en cours et trier les plus récents en premier
      const filtered = list.filter((p) => p.id !== currentTicketId);
      setPannes(filtered);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger l'historique des pannes.",
      );
    } finally {
      setLoading(false);
    }
  }, [equipementId, clientId, currentTicketId]);

  useEffect(() => {
    if (visible) {
      void fetchPannes();
    }
  }, [visible, fetchPannes]);

  const getUrgenceBadgeColor = (urg: string) => {
    switch (urg) {
      case 'CRITIQUE':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'HAUTE':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'NORMALE':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatutBadgeColor = (statut: string) => {
    if (statut === 'CLOTUREE' || statut === 'TERMINEE') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (statut === 'EN_COURS' || statut === 'EN_ROUTE') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const formatDuree = (debut?: string | Date | null, fin?: string | Date | null) => {
    if (!debut || !fin) return null;
    const d1 = new Date(debut).getTime();
    const d2 = new Date(fin).getTime();
    const diffMin = Math.round((d2 - d1) / (1000 * 60));
    if (diffMin <= 0) return null;
    if (diffMin < 60) return `${diffMin} min`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        {/* Zone cliquable pour fermer en touchant au-dessus */}
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Fermer la modale"
        />

        {/* Conteneur Bottom Sheet avec hauteur explicite pour éviter le repliement */}
        <View
          style={{ height: sheetHeight }}
          className="bg-white rounded-t-3xl flex-col overflow-hidden shadow-2xl"
        >
          {/* Petite barre de poignée */}
          <View className="items-center pt-2 pb-1 bg-[#31525B]">
            <View className="w-10 h-1 rounded-full bg-white/30" />
          </View>

          {/* En-tête */}
          <View className="bg-[#31525B] px-5 py-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              <View className="w-9 h-9 rounded-xl bg-[#FFA101] items-center justify-center">
                <History size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-white">Historique des Pannes</Text>
                <Text className="text-xs text-slate-200" numberOfLines={1}>
                  {equipementNom
                    ? `Équipement : ${equipementNom}`
                    : `Client : ${clientNom || 'Actuel'}`}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-1.5 rounded-full bg-white/10"
              accessibilityLabel="Fermer"
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Contenu Scrollable */}
          <ScrollView
            className="flex-1 px-5 py-4"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {loading && (
              <View className="py-16 items-center justify-center gap-3">
                <ActivityIndicator size="large" color="#FFA101" />
                <Text className="text-sm font-semibold text-slate-600">
                  Recherche des pannes antérieures...
                </Text>
              </View>
            )}

            {error && !loading && (
              <View className="py-8 items-center gap-2">
                <AlertTriangle size={24} color="#C0392B" />
                <Text className="text-sm text-red-600 text-center">{error}</Text>
                <TouchableOpacity
                  onPress={fetchPannes}
                  className="mt-2 px-4 py-2 bg-[#31525B] rounded-xl"
                >
                  <Text className="text-xs font-bold text-white">Réessayer</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !error && pannes.length === 0 && (
              <View className="py-16 items-center gap-3">
                <View className="w-14 h-14 rounded-full bg-emerald-50 items-center justify-center border border-emerald-200">
                  <CheckCircle2 size={28} color="#288358" />
                </View>
                <Text className="text-base font-bold text-slate-800">Aucun incident antérieur</Text>
                <Text className="text-xs text-slate-500 text-center max-w-[280px]">
                  Cet équipement ne présente aucun autre incident enregistré dans la base CMDB.
                </Text>
              </View>
            )}

            {!loading && !error && pannes.length > 0 && (
              <View className="gap-3">
                {/* Bandeau d'analyse récurrence si >= 2 pannes */}
                {pannes.length >= 2 && (
                  <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex-row items-center gap-2.5 mb-1">
                    <AlertTriangle size={18} color="#D97706" />
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-amber-900">
                        Équipement à pannes répétées
                      </Text>
                      <Text className="text-[11px] text-amber-700">
                        {pannes.length} incidents antérieurs ont déjà été signalés sur cet actif.
                      </Text>
                    </View>
                  </View>
                )}

                <View className="flex-row items-center justify-between mb-0.5">
                  <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {pannes.length} incident{pannes.length > 1 ? 's' : ''} passé
                    {pannes.length > 1 ? 's' : ''}
                  </Text>
                  <Text className="text-[11px] text-slate-400">
                    Classé du plus récent au plus ancien
                  </Text>
                </View>

                {pannes.map((item) => {
                  const dateStr = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Date inconnue';

                  const dureeStr = formatDuree(item.heureDemarrage, item.heureFinale);

                  // Récupérer le technicien intervenant depuis le rapport ou la relation
                  const tech =
                    item.rapport?.technicien?.user || item.techniciens?.[0]?.technicien?.user;
                  const techNom = tech ? `${tech.prenom || ''} ${tech.nom || ''}`.trim() : null;

                  return (
                    <View
                      key={item.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 gap-2.5 shadow-2xs"
                    >
                      {/* Barre supérieure : Référence & Date */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-black font-mono text-[#31525B]">
                            {item.reference}
                          </Text>
                          <View
                            className={`px-2 py-0.5 rounded-md border ${getUrgenceBadgeColor(
                              item.urgence,
                            )}`}
                          >
                            <Text className="text-[10px] font-bold uppercase">{item.urgence}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Calendar size={12} color="#64748B" />
                          <Text className="text-xs text-slate-500">{dateStr}</Text>
                        </View>
                      </View>

                      {/* Catégorie / Sous-type de panne */}
                      {(item.categoriePanne || item.sousTypePanneMat || item.sousTypePanneLog) && (
                        <View className="flex-row items-center gap-1.5 flex-wrap">
                          <Tag size={12} color="#FFA101" />
                          <Text className="text-xs font-semibold text-slate-600">
                            {[item.categoriePanne, item.sousTypePanneMat, item.sousTypePanneLog]
                              .filter(Boolean)
                              .join(' • ')}
                          </Text>
                        </View>
                      )}

                      {/* Symptôme initial signalé */}
                      <View className="bg-white rounded-xl p-2.5 border border-slate-200/80">
                        <Text className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          Symptôme / Description :
                        </Text>
                        <Text className="text-xs text-slate-700 leading-relaxed">
                          {item.description}
                        </Text>
                      </View>

                      {/* SOLUTION APPLIQUÉE (Compte-rendu du technicien) */}
                      {item.rapport?.contenu && (
                        <View className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3">
                          <View className="flex-row items-center justify-between mb-1">
                            <View className="flex-row items-center gap-1.5">
                              <Wrench size={13} color="#059669" />
                              <Text className="text-xs font-bold text-emerald-800">
                                Solution appliquée
                              </Text>
                            </View>
                            {onSelectPanne && (
                              <TouchableOpacity
                                onPress={() => onSelectPanne(item)}
                                className="flex-row items-center gap-1 bg-white px-2 py-0.5 rounded border border-emerald-300"
                              >
                                <Sparkles size={11} color="#059669" />
                                <Text className="text-[10px] font-bold text-emerald-700">
                                  Utiliser comme piste
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text className="text-xs text-slate-700 leading-relaxed font-medium">
                            {item.rapport.contenu}
                          </Text>
                        </View>
                      )}

                      {/* Détails complémentaires : Intervenant & Durée */}
                      {(techNom || dureeStr) && (
                        <View className="flex-row items-center gap-4 pt-1">
                          {techNom && (
                            <View className="flex-row items-center gap-1">
                              <User size={12} color="#64748B" />
                              <Text className="text-[11px] text-slate-600 font-medium">
                                Par {techNom}
                              </Text>
                            </View>
                          )}
                          {dureeStr && (
                            <View className="flex-row items-center gap-1">
                              <Clock size={12} color="#64748B" />
                              <Text className="text-[11px] text-slate-600 font-medium">
                                Durée : {dureeStr}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Statut actuel & Date clôture */}
                      <View className="flex-row items-center justify-between pt-2 border-t border-slate-200/60 mt-0.5">
                        <View
                          className={`px-2 py-0.5 rounded-md border ${getStatutBadgeColor(
                            item.statutActuel,
                          )}`}
                        >
                          <Text className="text-[10px] font-bold">{item.statutActuel}</Text>
                        </View>
                        {item.clotureAt && (
                          <View className="flex-row items-center gap-1">
                            <CheckCircle2 size={12} color="#288358" />
                            <Text className="text-[11px] text-emerald-700 font-semibold">
                              Clôturé le{' '}
                              {new Date(item.clotureAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
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

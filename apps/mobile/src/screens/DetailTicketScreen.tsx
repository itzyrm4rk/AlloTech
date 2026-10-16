import { ChevronLeft } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NetworkBanner } from '../components/NetworkBanner';
import {
  PeerActionBanner,
  TicketActionButtons,
  TicketChronoCard,
  TicketClientCard,
  TicketClotureCard,
  TicketDescriptionCard,
  TicketEquipeCard,
  TicketEquipementCard,
  TicketModales,
  TicketQuickActions,
} from '../components/ticket';
import { useDetailTicket } from '../hooks/useDetailTicket';
import { TRANSITIONS, URGENCE_CONFIG } from '../types/ticket.types';
import type { Ticket, Urgence } from '../types/ticket.types';

interface DetailTicketScreenProps {
  ticket: Ticket;
  onBack: () => void;
}

export function DetailTicketScreen({ ticket, onBack }: DetailTicketScreenProps) {
  const {
    statut,
    isActioning,
    heureDepart,
    heureDemarrage,
    dernierMotifPause,
    fullTicket,
    loadingDetails,
    currentUser,
    formattedTime,
    peerNotification,
    clearPeerNotification,

    // Modales
    showMapModal,
    setShowMapModal,
    showQrModal,
    setShowQrModal,
    showPhotoModal,
    setShowPhotoModal,
    showIaModal,
    setShowIaModal,
    showPauseModal,
    setShowPauseModal,
    showClotureModal,
    setShowClotureModal,
    showPannesRecentesModal,
    setShowPannesRecentesModal,
    motifPause,
    setMotifPause,

    // Photos
    capturedPhotos,

    // Actions
    handleStatutChange,
    handleConfirmPause,
    handleClotureSuccess,
    handleEquipementScanned,
    handleMediasSaved,
  } = useDetailTicket(ticket);

  const urgCfg = URGENCE_CONFIG[ticket.urgence as Urgence] || URGENCE_CONFIG.NORMALE;
  const allowedNext = TRANSITIONS[statut] ?? [];
  const clientPhone = fullTicket?.client?.telephone;
  const equipementInfo = fullTicket?.equipement;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFB' }} className="flex-1 bg-[#F8FAFB]">
      <NetworkBanner />

      {/* En-tête de navigation & informations clés */}
      <View className="bg-white border-b border-[#E4E4E7] px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={onBack}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-lg"
          accessibilityLabel="Retour à la liste"
        >
          <ChevronLeft size={24} color="#31525B" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-[#31525B]" numberOfLines={1}>
            {ticket.reference}
          </Text>
          <Text className="text-sm text-[#2C2C2E]/70 font-medium">{ticket.client}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          {(fullTicket?.typeDemande ?? ticket.typeDemande) === 'INSTALLATION' && (
            <View className="bg-amber-100 border border-amber-300 rounded-lg px-2.5 py-1">
              <Text className="text-[11px] font-black text-amber-900">INSTALLATION</Text>
            </View>
          )}

          <View
            style={{
              backgroundColor: urgCfg.bg,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: urgCfg.text, fontSize: 13, fontWeight: '700' }}>
              {urgCfg.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Bannière de synchronisation collaborative d'équipe */}
      <PeerActionBanner notification={peerNotification} onDismiss={clearPeerNotification} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Chronomètre & statut */}
        <TicketChronoCard
          statut={statut}
          formattedTime={formattedTime}
          loadingDetails={loadingDetails}
          heureDepart={heureDepart}
          heureDemarrage={heureDemarrage}
          dernierMotifPause={dernierMotifPause}
        />

        {/* Actions rapides : IA, historique, GPS, QR code, Photo */}
        <TicketQuickActions
          onOpenIaModal={() => setShowIaModal(true)}
          onOpenPannesRecentes={() => setShowPannesRecentesModal(true)}
          onOpenMapModal={() => setShowMapModal(true)}
          onOpenQrModal={() => setShowQrModal(true)}
          onOpenPhotoModal={() => setShowPhotoModal(true)}
        />

        {/* Carte informations Client */}
        <TicketClientCard
          client={ticket.client}
          adresseSite={ticket.adresseSite}
          clientPhone={clientPhone}
          latitudeSite={ticket.latitudeSite}
          longitudeSite={ticket.longitudeSite}
        />

        {/* Équipe et techniciens assignés */}
        <TicketEquipeCard techniciens={fullTicket?.techniciens} currentUser={currentUser} />

        {/* Équipement concerné */}
        <TicketEquipementCard
          equipement={equipementInfo}
          onOpenPannesRecentes={() => setShowPannesRecentesModal(true)}
        />

        {/* Description du problème, SLA, matériel et pièces jointes */}
        <TicketDescriptionCard
          ticket={ticket}
          fullTicket={fullTicket}
          capturedPhotos={capturedPhotos}
          onAddPhotoPress={() => setShowPhotoModal(true)}
        />

        {/* Actions terrain principales (En route, Démarrer, Pause, Terminer, Clôturer) */}
        <TicketActionButtons
          statut={statut}
          allowedNext={allowedNext}
          isActioning={isActioning}
          onStatutChange={(nextStatut) => void handleStatutChange(nextStatut)}
          onOpenCloture={() => setShowClotureModal(true)}
        />

        {/* Résumé d'achèvement et signature client */}
        <TicketClotureCard statut={statut} fullTicket={fullTicket} />
      </ScrollView>

      {/* Modales d'intervention (Clôture, Map, Diag IA, Pannes récentes, QR, Photo, Pause) */}
      <TicketModales
        ticket={ticket}
        fullTicket={fullTicket}
        showClotureModal={showClotureModal}
        setShowClotureModal={setShowClotureModal}
        showMapModal={showMapModal}
        setShowMapModal={setShowMapModal}
        showIaModal={showIaModal}
        setShowIaModal={setShowIaModal}
        showPannesRecentesModal={showPannesRecentesModal}
        setShowPannesRecentesModal={setShowPannesRecentesModal}
        showQrModal={showQrModal}
        setShowQrModal={setShowQrModal}
        showPhotoModal={showPhotoModal}
        setShowPhotoModal={setShowPhotoModal}
        showPauseModal={showPauseModal}
        setShowPauseModal={setShowPauseModal}
        motifPause={motifPause}
        setMotifPause={setMotifPause}
        isActioning={isActioning}
        onConfirmPause={handleConfirmPause}
        onClotureSuccess={handleClotureSuccess}
        onEquipementScanned={handleEquipementScanned}
        onMediasSaved={handleMediasSaved}
      />
    </SafeAreaView>
  );
}

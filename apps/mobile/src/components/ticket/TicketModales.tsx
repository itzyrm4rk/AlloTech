import { Pause, X } from 'lucide-react-native';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ClotureModal } from '../../modals/ClotureModal';
import { DiagnosticIaModal } from '../../modals/DiagnosticIaModal';
import { MapRouteModal } from '../../modals/MapRouteModal';
import { PannesRecentesModal } from '../../modals/PannesRecentesModal';
import { PhotoCaptureModal } from '../../modals/PhotoCaptureModal';
import { type EquipementData, QrScanModal } from '../../modals/QrScanModal';
import type { FullTicketData, Ticket } from '../../types/ticket.types';

interface TicketModalesProps {
  ticket: Ticket;
  fullTicket: FullTicketData | null;
  showClotureModal: boolean;
  setShowClotureModal: (val: boolean) => void;
  showMapModal: boolean;
  setShowMapModal: (val: boolean) => void;
  showIaModal: boolean;
  setShowIaModal: (val: boolean) => void;
  showPannesRecentesModal: boolean;
  setShowPannesRecentesModal: (val: boolean) => void;
  showQrModal: boolean;
  setShowQrModal: (val: boolean) => void;
  showPhotoModal: boolean;
  setShowPhotoModal: (val: boolean) => void;
  showPauseModal: boolean;
  setShowPauseModal: (val: boolean) => void;
  motifPause: string;
  setMotifPause: (val: string) => void;
  isActioning: boolean;
  onConfirmPause: () => void;
  onClotureSuccess: (data: { nomSignataire?: string; clotureAt: string }) => void;
  onEquipementScanned: (eq: EquipementData) => void;
  onMediasSaved: (
    medias: Array<{
      uri: string;
      fileName: string;
      mimeType: string;
      fileSizeBytes?: number;
      note: string;
      type: 'image' | 'video';
    }>,
  ) => Promise<void>;
}

export function TicketModales({
  ticket,
  fullTicket,
  showClotureModal,
  setShowClotureModal,
  showMapModal,
  setShowMapModal,
  showIaModal,
  setShowIaModal,
  showPannesRecentesModal,
  setShowPannesRecentesModal,
  showQrModal,
  setShowQrModal,
  showPhotoModal,
  setShowPhotoModal,
  showPauseModal,
  setShowPauseModal,
  motifPause,
  setMotifPause,
  isActioning,
  onConfirmPause,
  onClotureSuccess,
  onEquipementScanned,
  onMediasSaved,
}: TicketModalesProps) {
  const equipementInfo = fullTicket?.equipement;

  return (
    <>
      {/* MODALE 0 : Clôture & Signature client */}
      <ClotureModal
        visible={showClotureModal}
        onClose={() => setShowClotureModal(false)}
        ticketId={ticket.id}
        ticketReference={ticket.reference}
        clientNom={ticket.client}
        clientType={fullTicket?.client?.typeClient || ticket.clientType}
        typeDemande={
          (fullTicket?.typeDemande ?? ticket.typeDemande) === 'INSTALLATION'
            ? 'INSTALLATION'
            : 'PANNE'
        }
        equipementsDescription={
          fullTicket?.equipementsDescription ??
          (ticket as unknown as { equipementsDescription?: string }).equipementsDescription
        }
        onClotureSuccess={onClotureSuccess}
      />

      {/* MODALE 1 : Itinéraire Map & Navigation */}
      <MapRouteModal
        visible={showMapModal}
        onClose={() => setShowMapModal(false)}
        adresseSite={ticket.adresseSite}
        latitudeSite={ticket.latitudeSite ?? fullTicket?.latitudeSite}
        longitudeSite={ticket.longitudeSite ?? fullTicket?.longitudeSite}
        ticketReference={ticket.reference}
      />

      {/* MODALE 2 : Diagnostic IA */}
      <DiagnosticIaModal
        visible={showIaModal}
        onClose={() => setShowIaModal(false)}
        ticketId={ticket.id}
        ticketReference={ticket.reference}
        equipementId={equipementInfo?.id}
        descriptionPanne={ticket.description}
        categoriePanne={fullTicket?.categoriePanne as 'MATERIEL' | 'LOGICIEL' | null}
        onOpenPannesRecentes={() => setShowPannesRecentesModal(true)}
      />

      {/* MODALE HISTORIQUE DES PANNES RÉCENTES */}
      <PannesRecentesModal
        visible={showPannesRecentesModal}
        onClose={() => setShowPannesRecentesModal(false)}
        equipementId={equipementInfo?.id}
        equipementNom={equipementInfo?.modele}
        clientId={fullTicket?.client?.id}
        clientNom={ticket.client}
        currentTicketId={ticket.id}
      />

      {/* MODALE 3 : Scanner QR */}
      <QrScanModal
        visible={showQrModal}
        onClose={() => setShowQrModal(false)}
        onEquipementScanned={onEquipementScanned}
      />

      {/* MODALE 4 : Prise de photos & vidéos d'intervention (multi-sélection jusqu'à 5) */}
      <PhotoCaptureModal
        visible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onMediasSaved={onMediasSaved}
      />

      {/* MODALE 5 : Motif de mise en pause */}
      <Modal visible={showPauseModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <View className="flex-row items-center gap-2">
                <Pause size={18} color="#FFA101" />
                <Text className="text-base font-bold text-[#31525B]">Mettre en pause</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPauseModal(false)} className="p-1">
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-slate-500 mb-3">
              Indiquez la raison pour laquelle vous devez suspendre temporairement cette
              intervention :
            </Text>

            <TextInput
              value={motifPause}
              onChangeText={setMotifPause}
              placeholder="Ex: En attente du câble fibre de rechange..."
              className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 h-28 mb-4"
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowPauseModal(false)}
                className="flex-1 min-h-[48px] bg-slate-100 rounded-xl items-center justify-center"
              >
                <Text className="text-sm font-bold text-slate-600">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirmPause}
                disabled={isActioning}
                className="flex-1 min-h-[48px] bg-[#FFA101] rounded-xl items-center justify-center"
              >
                {isActioning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-bold text-white">Confirmer la pause</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

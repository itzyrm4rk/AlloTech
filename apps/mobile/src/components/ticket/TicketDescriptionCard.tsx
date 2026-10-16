import {
  Camera,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Film,
  Info,
  MessageSquare,
  Play,
  Tag,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Image, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveMediaUrl, safeOpenUrl } from '../../lib/media-utils';
import type { FullTicketData, Ticket } from '../../types/ticket.types';

interface TicketDescriptionCardProps {
  ticket: Ticket;
  fullTicket: FullTicketData | null;
  capturedPhotos: Array<{ uri: string; note: string; timestamp: string }>;
  onAddPhotoPress: () => void;
}

const formatSousType = (st?: string | null) => {
  if (!st) return null;
  return st
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export function TicketDescriptionCard({
  ticket,
  fullTicket,
  capturedPhotos,
  onAddPhotoPress,
}: TicketDescriptionCardProps) {
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const isInstallation = (fullTicket?.typeDemande ?? ticket.typeDemande) === 'INSTALLATION';
  const categoriePanne =
    fullTicket?.categoriePanne || (ticket as unknown as { categoriePanne?: string }).categoriePanne;
  const sousType = fullTicket?.sousTypePanneMat || fullTicket?.sousTypePanneLog;
  const echeance = fullTicket?.slaEcheanceAt || fullTicket?.dateSouhaitee;
  const equipementsDescription =
    fullTicket?.equipementsDescription ??
    (ticket as unknown as { equipementsDescription?: string }).equipementsDescription;

  return (
    <View className="mx-4 mt-3 bg-white rounded-2xl border border-[#E4E4E7] p-5 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Info size={18} color="#31525B" />
          <Text className="text-base font-bold text-[#31525B]">
            {isInstallation ? "Détails de l'installation" : 'Description du problème'}
          </Text>
        </View>
        <View className="bg-slate-100 px-2 py-0.5 rounded-md">
          <Text className="text-[11px] font-bold text-slate-600">
            {fullTicket?.typeDemande ?? ticket.typeDemande}
          </Text>
        </View>
      </View>

      {/* Badges de classification technique (Catégorie & Sous-type de panne) */}
      {(categoriePanne || sousType) && (
        <View className="flex-row items-center gap-1.5 flex-wrap mb-3">
          {categoriePanne && (
            <View className="flex-row items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
              <Tag size={12} color="#D97706" />
              <Text className="text-xs font-bold text-amber-900">{categoriePanne}</Text>
            </View>
          )}
          {sousType && (
            <View className="bg-[#31525B]/10 border border-[#31525B]/20 px-2.5 py-1 rounded-lg">
              <Text className="text-xs font-bold text-[#31525B]">{formatSousType(sousType)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Échéance SLA / Date souhaitée */}
      {echeance && (
        <View className="mb-3 bg-sky-50 border border-sky-200/80 rounded-xl p-3 flex-row items-center gap-2.5">
          <Clock size={16} color="#0284C7" />
          <View className="flex-1">
            <Text className="text-[11px] font-bold text-sky-900 uppercase">
              {fullTicket?.slaEcheanceAt ? 'Échéance SLA' : 'Date souhaitée'}
            </Text>
            <Text className="text-xs font-semibold text-sky-800">
              {new Date(echeance).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      )}

      {/* Matériel à déployer si INSTALLATION */}
      {equipementsDescription && (
        <View className="mb-3 bg-amber-50/80 border border-amber-200 rounded-xl p-3.5">
          <Text className="text-xs font-bold text-amber-800 uppercase mb-1">
            Matériel & Équipements à déployer
          </Text>
          <Text className="text-sm font-semibold text-slate-800">{equipementsDescription}</Text>
        </View>
      )}

      {/* Description textuelle */}
      <View className="bg-[#F4F4F5] rounded-xl p-4">
        <Text className="text-[11px] font-bold text-slate-400 uppercase mb-1">
          Symptômes & Constat :
        </Text>
        <Text className="text-base text-[#2C2C2E] leading-relaxed font-medium">
          {ticket.description}
        </Text>
      </View>

      {/* Consignes particulières / Commentaire de coordination */}
      {fullTicket?.commentaire && (
        <View className="mt-3 bg-amber-50/90 border border-amber-200 rounded-xl p-3.5">
          <View className="flex-row items-center gap-1.5 mb-1">
            <MessageSquare size={14} color="#D97706" />
            <Text className="text-xs font-bold text-amber-900 uppercase">
              Consignes du coordinateur :
            </Text>
          </View>
          <Text className="text-xs text-slate-800 leading-relaxed font-medium">
            {fullTicket.commentaire}
          </Text>
        </View>
      )}

      {/* Pièces jointes & Médias (Photos, Documents, Cahier des charges) */}
      <View className="mt-4 pt-3 border-t border-slate-100">
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-bold text-slate-500 uppercase">
            Pièces jointes & Médias ({fullTicket?.medias?.length || 0})
          </Text>
          <TouchableOpacity
            onPress={onAddPhotoPress}
            className="flex-row items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg"
          >
            <Camera size={13} color="#FFA101" />
            <Text className="text-xs font-bold text-[#FFA101]">Ajouter photo</Text>
          </TouchableOpacity>
        </View>

        {fullTicket?.medias && fullTicket.medias.length > 0 ? (
          <View className="gap-2.5">
            {fullTicket.medias.map((m) => {
              const rawUrl = m.fileUrl || m.url || '';
              const resolvedUrl = resolveMediaUrl(rawUrl);
              const mediaName = m.fileName || m.nomFichier || 'Fichier joint';
              const isVideo =
                m.typeMedia === 'VIDEO_INTERVENTION_TECH' ||
                m.mimeType?.startsWith('video/') ||
                /\.(mp4|webm|mov|m4v)$/i.test(mediaName);
              const isImage =
                !isVideo &&
                (m.mimeType?.startsWith('image/') ||
                  m.typeMedia === 'PHOTO_PANNE_CLIENT' ||
                  m.typeMedia === 'PHOTO_INTERVENTION_TECH' ||
                  /\.(jpe?g|png|webp|gif)$/i.test(mediaName));

              if (isVideo) {
                return (
                  <View
                    key={m.id}
                    className="flex-row items-center justify-between p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl"
                  >
                    <TouchableOpacity
                      onPress={() => safeOpenUrl(resolvedUrl)}
                      className="flex-row items-center gap-3 flex-1"
                    >
                      <View className="w-14 h-14 rounded-xl bg-indigo-600 items-center justify-center shadow-xs">
                        <Play size={22} color="#FFFFFF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                          {mediaName}
                        </Text>
                        <Text className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                          Vidéo • Appuyer pour visionner
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => safeOpenUrl(resolvedUrl)}
                      className="p-2.5 bg-white border border-indigo-200 rounded-xl"
                      accessibilityLabel="Visionner ou télécharger la vidéo"
                    >
                      <Film size={16} color="#4F46E5" />
                    </TouchableOpacity>
                  </View>
                );
              }

              if (isImage) {
                return (
                  <View
                    key={m.id}
                    className="flex-row items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                  >
                    <TouchableOpacity
                      onPress={() => {
                        if (resolvedUrl) {
                          setPreviewImage({ url: resolvedUrl, name: mediaName });
                        }
                      }}
                      className="flex-row items-center gap-3 flex-1"
                    >
                      <View className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                        {resolvedUrl ? (
                          <Image
                            source={{ uri: resolvedUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : null}
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                          {mediaName}
                        </Text>
                        <Text className="text-[11px] text-slate-500 mt-0.5">
                          Photo • Appuyer pour agrandir
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => safeOpenUrl(resolvedUrl)}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl"
                      accessibilityLabel="Télécharger ou ouvrir"
                    >
                      <Download size={16} color="#31525B" />
                    </TouchableOpacity>
                  </View>
                );
              }

              // Document / PDF / Cahier des charges
              return (
                <View
                  key={m.id}
                  className="flex-row items-center justify-between p-3 bg-amber-50/50 border border-amber-200/80 rounded-2xl"
                >
                  <TouchableOpacity
                    onPress={() => safeOpenUrl(resolvedUrl)}
                    className="flex-row items-center gap-3 flex-1"
                  >
                    <View className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-200 items-center justify-center">
                      <FileText size={20} color="#D97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                        {mediaName}
                      </Text>
                      <Text className="text-[11px] text-amber-800 mt-0.5">
                        {m.typeMedia === 'DOC_CAHIER_CHARGES'
                          ? 'Cahier des charges / Plan'
                          : 'Document joint'}{' '}
                        •{' '}
                        {m.fileSizeBytes ? `${(m.fileSizeBytes / 1024).toFixed(0)} Ko` : 'Fichier'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => safeOpenUrl(resolvedUrl)}
                    className="px-3 py-2 bg-[#31525B] rounded-xl flex-row items-center gap-1.5 shadow-xs"
                  >
                    <Download size={14} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">Télécharger</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl items-center gap-1.5">
            <Camera size={20} color="#94A3B8" />
            <Text className="text-xs text-slate-500 font-medium text-center">
              Aucune pièce jointe transmise par le client pour ce ticket.
            </Text>
            <Text className="text-[11px] text-slate-400 text-center">
              Vous pouvez documenter l'état du site en prenant une photo avec le bouton ci-dessus.
            </Text>
          </View>
        )}
      </View>

      {/* Photos d'intervention capturées par le technicien */}
      {capturedPhotos.length > 0 && (
        <View className="mt-4 pt-3 border-t border-slate-100">
          <Text className="text-xs font-bold text-[#FFA101] uppercase mb-2">
            Photos d'intervention ({capturedPhotos.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            {capturedPhotos.map((p, idx) => (
              <TouchableOpacity
                key={`${p.uri}-${p.timestamp || idx}`}
                onPress={() =>
                  setPreviewImage({ url: p.uri, name: p.note || "Photo d'intervention" })
                }
                className="w-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mr-2 active:opacity-80"
              >
                <Image source={{ uri: p.uri }} className="w-24 h-20" resizeMode="cover" />
                <Text className="text-[10px] text-slate-700 font-semibold p-1" numberOfLines={1}>
                  {p.note}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Modal de prévisualisation plein écran d'une photo */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <SafeAreaView className="flex-1 bg-black/95 justify-between">
          <StatusBar barStyle="light-content" backgroundColor="#000000" />

          {/* Header modal */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10">
            <View className="flex-1 mr-3">
              <Text className="text-white font-bold text-sm" numberOfLines={1}>
                {previewImage?.name || 'Photo'}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => previewImage?.url && safeOpenUrl(previewImage.url)}
                className="p-2 rounded-full bg-white/20 active:bg-white/30"
                accessibilityLabel="Ouvrir dans le navigateur"
              >
                <ExternalLink size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPreviewImage(null)}
                className="p-2 rounded-full bg-white/20 active:bg-white/30"
                accessibilityLabel="Fermer"
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Corps de l'image */}
          <View className="flex-1 items-center justify-center p-2">
            {previewImage?.url ? (
              <Image
                source={{ uri: previewImage.url }}
                className="w-full h-full"
                resizeMode="contain"
              />
            ) : null}
          </View>

          {/* Footer d'action */}
          <View className="p-4 border-t border-white/10 flex-row items-center justify-center gap-3">
            <TouchableOpacity
              onPress={() => previewImage?.url && safeOpenUrl(previewImage.url)}
              className="flex-row items-center gap-2 px-5 py-2.5 bg-[#FFA101] rounded-xl active:opacity-90"
            >
              <Download size={16} color="#000000" />
              <Text className="text-xs font-bold text-slate-950">Ouvrir dans le navigateur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPreviewImage(null)}
              className="px-5 py-2.5 bg-white/20 rounded-xl active:bg-white/30"
            >
              <Text className="text-xs font-bold text-white">Fermer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

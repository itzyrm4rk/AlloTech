import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, FileImage, Film, Trash2, Video, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface CapturedMediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  fileName: string;
  mimeType: string;
  fileSizeBytes?: number;
  duration?: number;
}

interface PhotoCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onMediasSaved?: (
    medias: Array<{
      uri: string;
      type: 'image' | 'video';
      fileName: string;
      mimeType: string;
      note: string;
      fileSizeBytes?: number;
    }>,
  ) => void;
}

const MAX_MEDIA_QUOTA = 5; // Quota strict de 5 médias max par intervention pour protéger la mémoire et le réseau

export function PhotoCaptureModal({ visible, onClose, onMediasSaved }: PhotoCaptureModalProps) {
  const [mediaList, setMediaList] = useState<CapturedMediaItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [note, setNote] = useState('');
  const [tag, setTag] = useState<'PANNE' | 'EQUIPEMENT' | 'PREUVE' | 'AUTRE'>('PREUVE');

  const screenHeight = Dimensions.get('window').height;
  const sheetHeight = Math.round(screenHeight * 0.9);

  /**
   * Compresse et optimise une photo de manière sécurisée (max 1280px, qualité 0.65)
   * sans provoquer de plantage mémoire sur les smartphones
   */
  const processImage = async (rawUri: string, fileName?: string): Promise<CapturedMediaItem> => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        rawUri,
        [{ resize: { width: 1280 } }],
        { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG },
      );

      return {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        uri: manipResult.uri,
        type: 'image',
        fileName: fileName || `photo_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      };
    } catch (err) {
      console.warn('[PhotoCaptureModal] Fallback image originale (erreur manip):', err);
      return {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        uri: rawUri,
        type: 'image',
        fileName: fileName || `photo_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      };
    }
  };

  /**
   * Prendre une photo avec la caméra sans recadrage natif (évite le crash Android)
   */
  const handleTakePhoto = async () => {
    if (mediaList.length >= MAX_MEDIA_QUOTA) {
      Alert.alert(
        'Quota atteint',
        `Vous avez atteint le quota maximal de ${MAX_MEDIA_QUOTA} médias pour cette prise.`,
      );
      return;
    }

    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission requise',
          "Veuillez autoriser l'accès à l'appareil photo dans les paramètres de votre appareil.",
        );
        return;
      }

      setIsProcessing(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // CRUCIAL : évite le crash OOM de l'activité native de recadrage Android
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const item = await processImage(
          result.assets[0].uri,
          result.assets[0].fileName || undefined,
        );
        setMediaList((prev) => [...prev, item]);
      }
    } catch (_err) {
      Alert.alert('Erreur', "Impossible d'accéder à l'appareil photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Enregistrer une vidéo courte de terrain (max 30s)
   */
  const handleRecordVideo = async () => {
    if (mediaList.length >= MAX_MEDIA_QUOTA) {
      Alert.alert(
        'Quota atteint',
        `Vous avez atteint le quota maximal de ${MAX_MEDIA_QUOTA} médias pour cette prise.`,
      );
      return;
    }

    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission requise',
          "Veuillez autoriser l'accès à la caméra pour enregistrer une vidéo.",
        );
        return;
      }

      setIsProcessing(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 30, // 30 secondes max pour préserver la mémoire et la bande passante
        allowsEditing: false,
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const videoItem: CapturedMediaItem = {
          id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          uri: asset.uri,
          type: 'video',
          fileName: asset.fileName || `video_${Date.now()}.mp4`,
          mimeType: 'video/mp4',
          fileSizeBytes: asset.fileSize,
          duration: asset.duration ? Math.round(asset.duration / 1000) : undefined,
        };
        setMediaList((prev) => [...prev, videoItem]);
      }
    } catch {
      Alert.alert('Erreur', "Impossible de lancer l'enregistrement vidéo.");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Choisir depuis la galerie avec multi-sélection (Photos et Vidéos)
   */
  const handlePickGallery = async () => {
    const remainingQuota = MAX_MEDIA_QUOTA - mediaList.length;
    if (remainingQuota <= 0) {
      Alert.alert(
        'Quota atteint',
        `Vous avez déjà sélectionné le maximum de ${MAX_MEDIA_QUOTA} médias.`,
      );
      return;
    }

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission requise',
          "Veuillez autoriser l'accès à la galerie dans les paramètres de votre appareil.",
        );
        return;
      }

      setIsProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: remainingQuota,
        allowsEditing: false, // Évite les crashs
        quality: 0.7,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processedItems: CapturedMediaItem[] = [];

        for (const asset of result.assets) {
          if (processedItems.length + mediaList.length >= MAX_MEDIA_QUOTA) break;

          const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');

          if (isVideo) {
            processedItems.push({
              id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              uri: asset.uri,
              type: 'video',
              fileName: asset.fileName || `video_${Date.now()}.mp4`,
              mimeType: asset.mimeType || 'video/mp4',
              fileSizeBytes: asset.fileSize,
              duration: asset.duration ? Math.round(asset.duration / 1000) : undefined,
            });
          } else {
            const img = await processImage(asset.uri, asset.fileName || undefined);
            processedItems.push(img);
          }
        }

        setMediaList((prev) => [...prev, ...processedItems]);
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'accéder à la galerie.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setMediaList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReset = () => {
    setMediaList([]);
    setNote('');
    setTag('PREUVE');
  };

  const handleSave = () => {
    if (mediaList.length === 0) {
      Alert.alert(
        'Aucun média',
        'Veuillez sélectionner au moins une photo ou une vidéo avant d’enregistrer.',
      );
      return;
    }

    const noteText = note.trim() ? `[${tag}] ${note.trim()}` : `[${tag}] Preuve terrain`;

    const payload = mediaList.map((m) => ({
      uri: m.uri,
      type: m.type,
      fileName: m.fileName,
      mimeType: m.mimeType,
      note: noteText,
      fileSizeBytes: m.fileSizeBytes,
    }));

    onMediasSaved?.(payload);
    handleReset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        {/* Toucher au-dessus pour fermer */}
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => {
            handleReset();
            onClose();
          }}
          accessibilityLabel="Fermer"
        />

        <View
          style={{ height: sheetHeight }}
          className="bg-white rounded-t-3xl flex-col overflow-hidden shadow-2xl"
        >
          {/* Poignée discrète */}
          <View className="items-center pt-2.5 pb-1 bg-[#31525B]">
            <View className="w-10 h-1.5 rounded-full bg-white/30" />
          </View>

          {/* En-tête */}
          <View className="bg-[#31525B] px-5 py-3.5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-9 h-9 rounded-xl bg-[#FFA101] items-center justify-center">
                <Camera size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-white">Médias & Prises de vue terrain</Text>
                <Text className="text-xs text-slate-200" numberOfLines={1}>
                  Photos & Vidéos d'intervention pour l'administrateur
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                handleReset();
                onClose();
              }}
              className="p-1.5 rounded-full bg-white/10"
              accessibilityLabel="Fermer"
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Indicateur de Quota (Protection mémoire & réseau) */}
          <View className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View
                className={`w-2 h-2 rounded-full ${
                  mediaList.length >= MAX_MEDIA_QUOTA ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <Text className="text-xs font-bold text-slate-700">
                Quota : {mediaList.length} / {MAX_MEDIA_QUOTA} médias sélectionnés
              </Text>
            </View>
            <Text className="text-[11px] text-slate-500">Photos HD ou Vidéos ≤ 30s</Text>
          </View>

          <ScrollView
            className="flex-1 p-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isProcessing ? (
              <View className="items-center py-16 gap-3">
                <View className="w-16 h-16 rounded-2xl bg-amber-50 items-center justify-center border border-amber-200">
                  <ActivityIndicator size="large" color="#FFA101" />
                </View>
                <Text className="text-base font-bold text-slate-800">
                  Traitement et optimisation...
                </Text>
                <Text className="text-xs text-slate-500 text-center max-w-[280px]">
                  Préparation des médias pour un téléversement rapide et sans saturation du
                  smartphone.
                </Text>
              </View>
            ) : (
              <View className="gap-5 pb-6">
                {/* Boutons d'ajout (Photo, Vidéo, Galerie multi) */}
                <View>
                  <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Ajouter des preuves ({MAX_MEDIA_QUOTA - mediaList.length} emplacement(s)
                    restant(s))
                  </Text>
                  <View className="flex-row gap-2">
                    {/* Photo caméra */}
                    <TouchableOpacity
                      onPress={handleTakePhoto}
                      disabled={mediaList.length >= MAX_MEDIA_QUOTA}
                      className={`flex-1 p-3 rounded-2xl items-center justify-center gap-1.5 border ${
                        mediaList.length >= MAX_MEDIA_QUOTA
                          ? 'bg-slate-100 border-slate-200 opacity-50'
                          : 'bg-amber-50 border-amber-300'
                      }`}
                    >
                      <Camera size={20} color="#D97706" />
                      <Text className="text-xs font-bold text-amber-900">Photo</Text>
                    </TouchableOpacity>

                    {/* Vidéo caméra */}
                    <TouchableOpacity
                      onPress={handleRecordVideo}
                      disabled={mediaList.length >= MAX_MEDIA_QUOTA}
                      className={`flex-1 p-3 rounded-2xl items-center justify-center gap-1.5 border ${
                        mediaList.length >= MAX_MEDIA_QUOTA
                          ? 'bg-slate-100 border-slate-200 opacity-50'
                          : 'bg-indigo-50 border-indigo-300'
                      }`}
                    >
                      <Video size={20} color="#4F46E5" />
                      <Text className="text-xs font-bold text-indigo-900">Vidéo</Text>
                    </TouchableOpacity>

                    {/* Galerie multi */}
                    <TouchableOpacity
                      onPress={handlePickGallery}
                      disabled={mediaList.length >= MAX_MEDIA_QUOTA}
                      className={`flex-1 p-3 rounded-2xl items-center justify-center gap-1.5 border ${
                        mediaList.length >= MAX_MEDIA_QUOTA
                          ? 'bg-slate-100 border-slate-200 opacity-50'
                          : 'bg-sky-50 border-sky-300'
                      }`}
                    >
                      <FileImage size={20} color="#0284C7" />
                      <Text className="text-xs font-bold text-sky-900">Galerie</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Galerie des médias sélectionnés */}
                {mediaList.length > 0 && (
                  <View>
                    <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Médias prêts à l'envoi ({mediaList.length})
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="gap-2.5"
                    >
                      {mediaList.map((item) => (
                        <View
                          key={item.id}
                          className="w-32 h-36 bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 relative mr-2"
                        >
                          {item.type === 'image' ? (
                            <Image
                              source={{ uri: item.uri }}
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="w-full h-full items-center justify-center bg-slate-900 p-2">
                              <Film size={28} color="#FFA101" />
                              <Text className="text-[11px] font-bold text-white mt-1">
                                Vidéo MP4
                              </Text>
                              {item.duration && (
                                <Text className="text-[10px] text-slate-400">{item.duration}s</Text>
                              )}
                            </View>
                          )}

                          {/* Badge Type */}
                          <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-md">
                            <Text className="text-[10px] font-bold text-white uppercase">
                              {item.type}
                            </Text>
                          </View>

                          {/* Bouton de suppression */}
                          <TouchableOpacity
                            onPress={() => handleRemoveItem(item.id)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600/90 items-center justify-center shadow-xs"
                            accessibilityLabel="Supprimer ce média"
                          >
                            <Trash2 size={13} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Type de preuve / Tag */}
                <View>
                  <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Type d'élément photographié / filmé
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(
                      [
                        { id: 'PREUVE', label: 'Preuve fin de travail' },
                        { id: 'PANNE', label: 'Composant endommagé' },
                        { id: 'EQUIPEMENT', label: 'Plaque / Équipement' },
                        { id: 'AUTRE', label: 'Autre constat' },
                      ] as const
                    ).map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => setTag(t.id)}
                        className={`px-3 py-2 rounded-xl border ${
                          tag === t.id
                            ? 'bg-[#31525B] border-[#31525B]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            tag === t.id ? 'text-white' : 'text-slate-600'
                          }`}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Note / Description */}
                <View>
                  <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Commentaire technique (optionnel)
                  </Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-sm min-h-[75px]"
                    placeholder="Ex: Câble RJ45 remplacé, voyant vert stabilisé sur la baie..."
                    placeholderTextColor="#94A3B8"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {/* Bouton de validation finale */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={mediaList.length === 0}
                  className={`h-13 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm ${
                    mediaList.length > 0 ? 'bg-[#FFA101] active:bg-amber-600' : 'bg-slate-200'
                  }`}
                >
                  <Check size={18} color={mediaList.length > 0 ? '#020617' : '#94A3B8'} />
                  <Text
                    className={`text-base font-black ${
                      mediaList.length > 0 ? 'text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    {mediaList.length > 0
                      ? `Enregistrer (${mediaList.length} média${mediaList.length > 1 ? 's' : ''})`
                      : 'Sélectionnez au moins 1 média'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

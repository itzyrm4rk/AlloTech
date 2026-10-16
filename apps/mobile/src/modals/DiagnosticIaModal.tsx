import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  AlertTriangle,
  Bot,
  Camera,
  History,
  Image as ImageIcon,
  RefreshCw,
  Send,
  Sparkles,
  User,
  Wrench,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { trpcClient } from '../lib/trpc';

interface DiagnosticIaModalProps {
  visible: boolean;
  onClose: () => void;
  ticketId: string;
  ticketReference: string;
  equipementId?: string | null;
  descriptionPanne: string;
  categoriePanne?: 'MATERIEL' | 'LOGICIEL' | null;
  onOpenPannesRecentes?: () => void;
}

interface AttachedPhoto {
  id: string;
  uri: string;
  base64: string;
  mimeType: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  photos?: string[];
}

function renderInlineBold(text: string, baseColor = '#334155') {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  let boldCount = 0;
  let textCount = 0;
  return parts.map((part) => {
    const isBold = part.startsWith('**') && part.endsWith('**');
    const displayPart = isBold ? part.slice(2, -2) : part;
    const uniqueKey = isBold
      ? `b-${boldCount++}-${displayPart.slice(0, 10)}`
      : `t-${textCount++}-${displayPart.slice(0, 10)}`;
    return (
      <Text
        key={uniqueKey}
        style={isBold ? { fontWeight: '800', color: '#0F172A' } : { color: baseColor }}
      >
        {displayPart}
      </Text>
    );
  });
}

function FormattedAiMessage({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <View className="flex-col gap-1">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        const lineKey = `line-${idx}-${line.slice(0, 16)}`;
        if (!line) {
          return <View key={lineKey} style={{ height: 4 }} />;
        }

        // 1. Titre H3 / H2 / H1 (### 🤖 Titre)
        if (line.startsWith('#')) {
          const cleanTitle = line.replace(/^#+\s*/, '');
          return (
            <View key={lineKey} className="mt-1 mb-1">
              <Text className="text-base font-black text-[#1A2C31]">{cleanTitle}</Text>
            </View>
          );
        }

        // 2. Note / Badge (*(Note : ...)* ou *(...)*)
        if (line.startsWith('*(') && line.endsWith(')*')) {
          const cleanNote = line.slice(2, -2).trim();
          return (
            <View
              key={lineKey}
              className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 my-1 self-start"
            >
              <Text className="text-[11px] font-semibold text-amber-900 italic">{cleanNote}</Text>
            </View>
          );
        }

        // 3. Section subhead : **1. Causes probables :** ou **Titre :**
        if (line.startsWith('**') && line.endsWith('**')) {
          const cleanHeader = line.slice(2, -2).trim();
          return (
            <View key={lineKey} className="mt-2.5 mb-1 flex-row items-center gap-1.5">
              <View className="w-1.5 h-3.5 rounded-full bg-[#FFA101]" />
              <Text className="text-sm font-extrabold text-[#31525B]">{cleanHeader}</Text>
            </View>
          );
        }

        // 4. Liste à puces (- ou *)
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const textAfterBullet = line.slice(2);
          return (
            <View key={lineKey} className="flex-row items-start pl-1 my-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-[#FFA101] mt-2 mr-2" />
              <Text className="flex-1 text-xs text-slate-700 leading-5">
                {renderInlineBold(textAfterBullet)}
              </Text>
            </View>
          );
        }

        // 5. Liste numérotée (ex: "1. Débrancher...", "2. Tester...")
        const numMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const textAfterNum = numMatch[2];
          return (
            <View key={lineKey} className="flex-row items-start pl-0.5 my-1">
              <View className="w-5 h-5 rounded-full bg-[#31525B] items-center justify-center mr-2 mt-0.5">
                <Text className="text-[10px] font-black text-white">{num}</Text>
              </View>
              <Text className="flex-1 text-xs text-slate-700 leading-5">
                {renderInlineBold(textAfterNum)}
              </Text>
            </View>
          );
        }

        // 6. Paragraphe standard
        return (
          <Text key={lineKey} className="text-xs text-slate-700 leading-5">
            {renderInlineBold(line)}
          </Text>
        );
      })}
    </View>
  );
}

export function DiagnosticIaModal({
  visible,
  onClose,
  ticketId,
  ticketReference,
  equipementId,
  descriptionPanne,
  categoriePanne,
  onOpenPannesRecentes,
}: DiagnosticIaModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<AttachedPhoto[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const screenHeight = Dimensions.get('window').height;
  const sheetHeight = Math.round(screenHeight * 0.88);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, []);

  // Diagnostic initial automatique au montage
  const runInitialDiagnostic = useCallback(async () => {
    setIsInitialLoading(true);
    setError(null);
    try {
      const res = await trpcClient.tickets.diagnosticIA.mutate({
        ticketId,
        equipementId: equipementId || undefined,
        descriptionPanne,
        categoriePanne: categoriePanne || undefined,
      });

      setIsSimulated(Boolean(res.isSimulated));

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setMessages([
        {
          id: 'initial-ai',
          role: 'assistant',
          content: res.diagnostic,
          timestamp: timeStr,
        },
      ]);
      scrollToBottom();
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : '';
      if (rawMsg.includes('Vous devez être connecté')) {
        setError('Votre session a expiré. Rendez-vous dans l’onglet Profil pour vous reconnecter.');
      } else {
        setError(rawMsg || 'Impossible de joindre le service de diagnostic IA.');
      }
    } finally {
      setIsInitialLoading(false);
    }
  }, [ticketId, equipementId, descriptionPanne, categoriePanne, scrollToBottom]);

  useEffect(() => {
    if (visible) {
      if (messages.length === 0) {
        void runInitialDiagnostic();
      }
    } else {
      // Nettoyage à la fermeture
      setInputText('');
      setSelectedPhotos([]);
      setError(null);
    }
  }, [visible, messages.length, runInitialDiagnostic]);

  // Traitement et compression des photos sélectionnées
  const processAndAddPhotos = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setIsProcessingPhotos(true);
    try {
      const processed: AttachedPhoto[] = [];
      for (const asset of assets) {
        if (!asset.uri) continue;
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1024 } }],
          {
            compress: 0.75,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          },
        );

        if (manipResult.base64) {
          processed.push({
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            uri: manipResult.uri,
            base64: manipResult.base64,
            mimeType: 'image/jpeg',
          });
        }
      }

      setSelectedPhotos((prev) => {
        const combined = [...prev, ...processed];
        return combined.slice(0, 4); // Max 4 photos
      });
    } catch {
      Alert.alert('Erreur photo', 'Impossible de traiter la photo sélectionnée.');
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handlePickFromCamera = async () => {
    if (selectedPhotos.length >= 4) {
      Alert.alert('Limite atteinte', 'Vous pouvez joindre un maximum de 4 photos par message.');
      return;
    }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          "L'autorisation d'accéder à l'appareil photo est requise pour photographier l'équipement.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndAddPhotos(result.assets);
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir l'appareil photo.");
    }
  };

  const handlePickFromGallery = async () => {
    if (selectedPhotos.length >= 4) {
      Alert.alert('Limite atteinte', 'Vous pouvez joindre un maximum de 4 photos par message.');
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          "L'accès à la galerie photos est requis pour joindre des photos de la panne.",
        );
        return;
      }

      const remainingSlots = 4 - selectedPhotos.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndAddPhotos(result.assets);
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'accéder à la galerie photos.");
    }
  };

  const handleRemovePhoto = (id: string) => {
    setSelectedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Envoi d'une question ou analyse de photos
  const handleSendMessage = async (textToSend?: string) => {
    const rawText = (textToSend ?? inputText).trim();
    const hasPhotos = selectedPhotos.length > 0;
    if ((!rawText && !hasPhotos) || isSending || isInitialLoading || isProcessingPhotos) return;

    const text =
      rawText ||
      (selectedPhotos.length === 1
        ? "Analyse cette photo de l'équipement et diagnostique le problème visuel (composants, câblage, voyants, erreurs)."
        : `Analyse ces ${selectedPhotos.length} photos de l'équipement et diagnostique le problème visuel.`);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: timeStr,
      photos: selectedPhotos.map((p) => p.uri),
    };

    const photosToSend = [...selectedPhotos];
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setSelectedPhotos([]);
    setIsSending(true);
    setError(null);
    scrollToBottom();

    try {
      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await trpcClient.tickets.diagnosticIA.mutate({
        ticketId,
        equipementId: equipementId || undefined,
        descriptionPanne,
        categoriePanne: categoriePanne || undefined,
        images:
          photosToSend.length > 0
            ? photosToSend.map((p) => ({
                base64: p.base64,
                mimeType: p.mimeType,
              }))
            : undefined,
        messages: historyPayload,
      });

      setIsSimulated(Boolean(res.isSimulated));

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.diagnostic,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      scrollToBottom();
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : '';
      if (rawMsg.includes('Vous devez être connecté')) {
        setError('Votre session a expiré. Rendez-vous dans l’onglet Profil pour vous reconnecter.');
      } else {
        setError(rawMsg || "Erreur lors de l'envoi de votre question à l'assistant.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setInputText('');
    setSelectedPhotos([]);
    setError(null);
    void runInitialDiagnostic();
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

        {/* Conteneur Bottom Sheet avec hauteur fixe calculée et protection clavier */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={{ height: sheetHeight }}
          className="bg-white rounded-t-3xl flex-col overflow-hidden shadow-2xl"
        >
          {/* Petite barre de poignée */}
          <View className="items-center pt-2.5 pb-1 bg-[#31525B]">
            <View className="w-10 h-1.5 rounded-full bg-white/30" />
          </View>

          {/* En-tête modal élégant AlloTech */}
          <View className="bg-[#31525B] px-5 py-3 flex-row items-center justify-between border-b border-[#254148]">
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-10 h-10 rounded-xl bg-[#FFA101] items-center justify-center shadow-xs">
                <Sparkles size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-bold text-white">Assistant IA AlloTech</Text>
                  <View
                    className={`w-2 h-2 rounded-full ${
                      isSimulated ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                </View>
                <Text className="text-xs text-slate-200" numberOfLines={1}>
                  {ticketReference} • {isSimulated ? 'Mode Local Démo' : 'Gemini Multimodal Live'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5">
              <TouchableOpacity
                onPress={handleResetChat}
                className="p-2 rounded-xl bg-white/10 active:bg-white/20"
                accessibilityLabel="Recommencer"
              >
                <RefreshCw size={17} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                className="p-2 rounded-xl bg-white/10 active:bg-white/20"
                accessibilityLabel="Fermer"
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bandeau d'actions secondaires : Historique pannes CMDB */}
          {onOpenPannesRecentes && (
            <View className="bg-slate-100/90 px-4 py-2 flex-row items-center justify-between border-b border-slate-200">
              <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                <Wrench size={13} color="#31525B" />
                <Text className="text-xs text-slate-700 font-medium" numberOfLines={1}>
                  Panne : {descriptionPanne}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onOpenPannesRecentes();
                }}
                className="bg-amber-100 px-2.5 py-1 rounded-lg flex-row items-center gap-1 border border-amber-200"
              >
                <History size={12} color="#92400E" />
                <Text className="text-[11px] font-bold text-amber-900">Pannes CMDB</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Corps de la conversation */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 py-3 bg-[#F8FAFB]"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* État de chargement initial du diagnostic */}
            {isInitialLoading && (
              <View className="py-12 items-center justify-center gap-3">
                <View className="w-16 h-16 rounded-2xl bg-[#FFA101]/15 items-center justify-center">
                  <ActivityIndicator size="large" color="#FFA101" />
                </View>
                <Text className="text-base font-bold text-[#31525B] text-center">
                  Établissement du diagnostic IA...
                </Text>
                <Text className="text-xs text-slate-500 text-center max-w-[280px] leading-relaxed">
                  Analyse des symptômes, historique de l'équipement et calcul des recommandations
                  terrain.
                </Text>
              </View>
            )}

            {/* Affichage d'erreur avec bouton de réessai */}
            {error && !isInitialLoading && (
              <View className="my-3 p-3.5 rounded-2xl bg-red-50 border border-red-200 items-center gap-2">
                <View className="flex-row items-center gap-2">
                  <AlertTriangle size={18} color="#C0392B" />
                  <Text className="text-xs font-bold text-red-700 flex-1">{error}</Text>
                </View>
                <TouchableOpacity
                  onPress={messages.length === 0 ? runInitialDiagnostic : () => handleSendMessage()}
                  className="px-3 py-1.5 rounded-lg bg-[#31525B] flex-row items-center gap-1.5 self-end"
                >
                  <RefreshCw size={13} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">Réessayer</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Fil des messages de l'IA et du technicien */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <View
                  key={msg.id}
                  className={`mb-3.5 flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {/* Badge expéditeur */}
                  <View
                    className={`flex-row items-center gap-1.5 mb-1 px-1 ${
                      isUser ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full items-center justify-center ${
                        isUser ? 'bg-[#31525B]' : 'bg-[#FFA101]'
                      }`}
                    >
                      {isUser ? (
                        <User size={11} color="#FFFFFF" />
                      ) : (
                        <Bot size={11} color="#FFFFFF" />
                      )}
                    </View>
                    <Text className="text-[11px] font-semibold text-slate-500">
                      {isUser ? 'Vous (Technicien)' : 'Assistant AlloTech (Diagnostic)'}
                    </Text>
                    <Text className="text-[10px] text-slate-400">• {msg.timestamp}</Text>
                  </View>

                  {/* Bulle de message */}
                  <View
                    className={`p-3.5 rounded-2xl shadow-xs max-w-[92%] ${
                      isUser
                        ? 'bg-[#31525B] rounded-tr-xs'
                        : 'bg-white border border-slate-200/90 rounded-tl-xs'
                    }`}
                  >
                    {/* Photos attachées au message */}
                    {msg.photos && msg.photos.length > 0 && (
                      <View className="flex-row flex-wrap gap-2 mb-2.5">
                        {msg.photos.map((photoUri) => (
                          <Image
                            key={photoUri}
                            source={{ uri: photoUri }}
                            className="w-20 h-20 rounded-xl bg-slate-800 border border-white/20"
                            resizeMode="cover"
                          />
                        ))}
                      </View>
                    )}

                    {isUser ? (
                      <Text className="text-sm leading-relaxed text-white font-medium" selectable>
                        {msg.content}
                      </Text>
                    ) : (
                      <FormattedAiMessage content={msg.content} />
                    )}
                  </View>
                </View>
              );
            })}

            {/* Indicateur de réflexion en cours */}
            {isSending && (
              <View className="mb-3.5 flex-col items-start">
                <View className="flex-row items-center gap-1.5 mb-1 px-1">
                  <View className="w-5 h-5 rounded-full bg-[#FFA101] items-center justify-center">
                    <Bot size={11} color="#FFFFFF" />
                  </View>
                  <Text className="text-[11px] font-semibold text-slate-500">
                    Assistant AlloTech
                  </Text>
                </View>
                <View className="p-3 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs flex-row items-center gap-2.5">
                  <ActivityIndicator size="small" color="#FFA101" />
                  <Text className="text-xs text-slate-600 font-medium">
                    Analyse visuelle et technique en cours...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bandeau de prévisualisation des photos sélectionnées */}
          {selectedPhotos.length > 0 && (
            <View className="bg-slate-50 px-3.5 pt-2 pb-1.5 border-t border-slate-200">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-[11px] font-bold text-slate-700">
                  📸 {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} prête
                  {selectedPhotos.length > 1 ? 's' : ''} pour l'IA
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedPhotos([])}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-[11px] font-bold text-red-600">Tout retirer</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-2"
              >
                {selectedPhotos.map((photo) => (
                  <View key={photo.id} className="relative mr-2 my-1">
                    <Image
                      source={{ uri: photo.uri }}
                      className="w-14 h-14 rounded-xl border border-slate-300 bg-slate-200"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemovePhoto(photo.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 items-center justify-center border border-white"
                      accessibilityLabel="Retirer la photo"
                    >
                      <X size={10} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Barre d'outils et de saisie interactive du chat */}
          <View className="bg-white px-3 py-2.5 border-t border-slate-200 flex-row items-center gap-1.5">
            {/* Bouton Appareil Photo direct */}
            <TouchableOpacity
              onPress={handlePickFromCamera}
              disabled={isSending || isInitialLoading || isProcessingPhotos}
              className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center border border-slate-200 active:bg-slate-200"
              accessibilityLabel="Prendre une photo"
            >
              <Camera size={18} color="#31525B" />
            </TouchableOpacity>

            {/* Bouton Galerie photos */}
            <TouchableOpacity
              onPress={handlePickFromGallery}
              disabled={isSending || isInitialLoading || isProcessingPhotos}
              className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center border border-slate-200 active:bg-slate-200"
              accessibilityLabel="Choisir depuis la galerie"
            >
              <ImageIcon size={18} color="#31525B" />
            </TouchableOpacity>

            {/* Champ texte */}
            <View className="flex-1 bg-slate-100 rounded-2xl flex-row items-center px-3 py-1 border border-slate-200/80">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  selectedPhotos.length > 0
                    ? 'Ajouter une note ou envoyer direct...'
                    : 'Posez une question technique...'
                }
                placeholderTextColor="#94A3B8"
                multiline
                style={{ maxHeight: 85 }}
                className="flex-1 text-sm text-slate-900 py-1 font-medium"
                editable={!isSending && !isInitialLoading && !isProcessingPhotos}
                onFocus={scrollToBottom}
                onSubmitEditing={() => void handleSendMessage()}
              />
              {inputText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setInputText('')}
                  className="p-1 rounded-full bg-slate-200"
                >
                  <X size={12} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>

            {/* Bouton d'envoi */}
            <TouchableOpacity
              onPress={() => void handleSendMessage()}
              disabled={
                (!inputText.trim() && selectedPhotos.length === 0) ||
                isSending ||
                isInitialLoading ||
                isProcessingPhotos
              }
              className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs ${
                (inputText.trim() || selectedPhotos.length > 0) &&
                !isSending &&
                !isInitialLoading &&
                !isProcessingPhotos
                  ? 'bg-[#FFA101] active:bg-amber-600'
                  : 'bg-slate-200'
              }`}
              accessibilityLabel="Envoyer"
            >
              {isSending || isProcessingPhotos ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send
                  size={18}
                  color={
                    (inputText.trim() || selectedPhotos.length > 0) && !isInitialLoading
                      ? '#020617'
                      : '#94A3B8'
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

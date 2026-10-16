import {
  AlertCircle,
  Award,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Cpu,
  FileEdit,
  HardDrive,
  PenTool,
  RotateCcw,
  Trash2,
  User,
  UserCheck,
  X,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { enqueueSyncAction, updateCachedTicketStatus } from '../lib/offlineDb';
import { trpcClient } from '../lib/trpc';

interface ClotureModalProps {
  visible: boolean;
  onClose: () => void;
  ticketId: string;
  ticketReference: string;
  clientNom: string;
  clientType?: 'ENTREPRISE' | 'PARTICULIER' | string | null;
  typeDemande: 'PANNE' | 'INSTALLATION';
  equipementsDescription?: string | null;
  onClotureSuccess: (data: {
    reference: string;
    clotureAt: string;
    nomSignataire?: string;
  }) => void;
}

/**
 * Page HTML5 légère injectée dans la WebView pour capturer la signature tactile avec fluidité
 */
const SIGNATURE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { box-sizing: border-box; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
    html, body {
      margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;
      background-color: #FFFFFF; font-family: -apple-system, sans-serif;
    }
    #signature-pad {
      width: 100%; height: 100%; display: block;
      touch-action: none;
    }
    .watermark {
      position: absolute; bottom: 8px; right: 12px;
      font-size: 11px; color: #CBD5E1; font-weight: 700; letter-spacing: 0.5px;
      pointer-events: none;
    }
    .baseline {
      position: absolute; bottom: 25px; left: 16px; right: 16px;
      height: 1px; border-bottom: 1px dashed #E2E8F0;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="baseline"></div>
  <div class="watermark">Signer ici avec le doigt</div>
  <canvas id="signature-pad"></canvas>

  <script>
    const canvas = document.getElementById('signature-pad');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let hasDrawn = false;
    let lastX = 0;
    let lastY = 0;

    function resizeCanvas() {
      const ratio = Math.max(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1A2C31';
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('DOMContentLoaded', resizeCanvas);
    setTimeout(resizeCanvas, 50);

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    function startDraw(e) {
      e.preventDefault();
      isDrawing = true;
      hasDrawn = true;
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DRAWING_STATE', isDrawing: true }));
      } catch (err) {}
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
    }

    function moveDraw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    }

    function endDraw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      isDrawing = false;
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DRAWING_STATE', isDrawing: false }));
      } catch (err) {}
      sendSignature();
    }

    function sendSignature() {
      if (!hasDrawn) return;
      try {
        const dataUrl = canvas.toDataURL('image/png');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SIGNATURE_UPDATE',
          dataUrl: dataUrl,
          hasDrawn: true
        }));
      } catch (err) {}
    }

    function clearSignature() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawn = false;
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SIGNATURE_UPDATE',
          dataUrl: '',
          hasDrawn: false
        }));
      } catch (err) {}
    }

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('touchend', endDraw, { passive: false });
    canvas.addEventListener('touchcancel', endDraw, { passive: false });
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    canvas.addEventListener('mouseup', endDraw);

    window.addEventListener('message', function(event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'CLEAR') {
          clearSignature();
        } else if (msg.type === 'REQUEST_DATA') {
          sendSignature();
        }
      } catch (err) {}
    });
  </script>
</body>
</html>
`;

export function ClotureModal({
  visible,
  onClose,
  ticketId,
  ticketReference,
  clientNom,
  clientType,
  typeDemande,
  equipementsDescription,
  onClotureSuccess,
}: ClotureModalProps) {
  const isEntreprise = clientType === 'ENTREPRISE';

  const [rapport, setRapport] = useState('');
  // Pour un particulier, on pré-remplit directement avec clientNom.
  // Pour une entreprise, on commence vide pour inciter à noter la personne physique présente sur site.
  const [nomSignataire, setNomSignataire] = useState(
    clientType === 'ENTREPRISE' ? '' : clientNom || '',
  );
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);

  const [modeleInstalle, setModeleInstalle] = useState(equipementsDescription || '');
  const [numeroSerieInstalle, setNumeroSerieInstalle] = useState('');
  const [typeActif, setTypeActif] = useState<'MATERIEL' | 'LOGICIEL'>('MATERIEL');
  const [editeurInstalle, setEditeurInstalle] = useState('');
  const [versionInstalle, setVersionInstalle] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const webViewRef = useRef<WebView>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const screenHeight = Dimensions.get('window').height;
  const defaultSheetHeight = Math.round(screenHeight * 0.92);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const sheetHeight =
    keyboardHeight > 0
      ? Math.max(340, screenHeight - keyboardHeight - (Platform.OS === 'android' ? 24 : 44))
      : defaultSheetHeight;

  useEffect(() => {
    if (visible) {
      if (equipementsDescription) {
        if (!modeleInstalle) setModeleInstalle(equipementsDescription);
        const descUpper = equipementsDescription.toUpperCase();
        if (
          descUpper.includes('LOGICIEL') ||
          descUpper.includes('LICENCE') ||
          descUpper.includes('OFFICE') ||
          descUpper.includes('ANTIVIRUS') ||
          descUpper.includes('MICROSOFT')
        ) {
          setTypeActif('LOGICIEL');
        }
      }
      // Réinitialisation intelligente du signataire à l'ouverture du modal
      if (clientType === 'ENTREPRISE') {
        setNomSignataire('');
      } else {
        setNomSignataire(clientNom || '');
      }
      setError(null);
    }
  }, [visible, equipementsDescription, modeleInstalle, clientType, clientNom]);

  const handleClearSignature = () => {
    setSignatureDataUrl(null);
    setHasDrawnSignature(false);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'CLEAR' }));
  };

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'DRAWING_STATE') {
        setIsDrawingSignature(Boolean(data.isDrawing));
      } else if (data.type === 'SIGNATURE_UPDATE') {
        setHasDrawnSignature(Boolean(data.hasDrawn));
        setSignatureDataUrl(data.dataUrl || null);
      }
    } catch {
      // Ignorer
    }
  };

  const handleSubmitCloture = async () => {
    setError(null);

    if (!rapport.trim() || rapport.trim().length < 5) {
      setError("Veuillez rédiger un compte-rendu d'intervention d'au moins 5 caractères.");
      return;
    }

    if (!signatureDataUrl || !hasDrawnSignature) {
      setError('La signature manuscrite du client sur l’écran est obligatoire pour clôturer.');
      return;
    }

    if (!nomSignataire.trim()) {
      setError('Veuillez indiquer le nom et prénom du signataire client.');
      return;
    }

    setLoading(true);
    try {
      const res = await trpcClient.tickets.cloturer.mutate({
        ticketId,
        rapport: rapport.trim(),
        signatureDataUrl,
        nomSignataire: nomSignataire.trim(),
        equipementInstallation:
          typeDemande === 'INSTALLATION'
            ? {
                typeActif,
                modele: modeleInstalle.trim() || undefined,
                numeroSerie: numeroSerieInstalle.trim() || undefined,
                editeur: typeActif === 'LOGICIEL' ? editeurInstalle.trim() || undefined : undefined,
                version: typeActif === 'LOGICIEL' ? versionInstalle.trim() || undefined : undefined,
              }
            : undefined,
      });

      const resObj = res as {
        reference?: string;
        alreadyCloture?: boolean;
        message?: string;
        equipementCree?: { modele: string; numeroSerie: string };
      };

      if (resObj.alreadyCloture) {
        Alert.alert(
          'Intervention déjà clôturée',
          resObj.message || 'Cette intervention a déjà été clôturée par votre coéquipier.',
          [
            {
              text: 'OK',
              onPress: () => {
                onClotureSuccess({
                  reference: resObj.reference || ticketId,
                  clotureAt: new Date().toISOString(),
                  nomSignataire: nomSignataire.trim(),
                });
                onClose();
              },
            },
          ],
        );
        return;
      }

      Alert.alert(
        'Intervention clôturée avec succès',
        `Le ticket ${resObj.reference || ''} a été clôturé. Le rapport et la signature client ont été validés.${
          resObj.equipementCree
            ? `\n\n${typeActif === 'LOGICIEL' ? 'Actif logiciel CMDB' : 'Équipement CMDB'} créé : ${resObj.equipementCree.modele} (${typeActif === 'LOGICIEL' ? 'Licence' : 'S/N'}: ${resObj.equipementCree.numeroSerie})`
            : ''
        }`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClotureSuccess({
                reference: resObj.reference || '',
                clotureAt: new Date().toISOString(),
                nomSignataire: nomSignataire.trim(),
              });
              onClose();
            },
          },
        ],
      );
    } catch (err: unknown) {
      console.warn('[ClotureModal] Échec réseau clôture, sauvegarde dans sync_queue:', err);
      // Sauvegarde offline dans sync_queue
      enqueueSyncAction('CLOTURER', ticketId, {
        rapport: rapport.trim(),
        signatureDataUrl,
        nomSignataire: nomSignataire.trim(),
        equipementInstallation:
          typeDemande === 'INSTALLATION'
            ? {
                typeActif,
                modele: modeleInstalle.trim() || undefined,
                numeroSerie: numeroSerieInstalle.trim() || undefined,
                editeur: typeActif === 'LOGICIEL' ? editeurInstalle.trim() || undefined : undefined,
                version: typeActif === 'LOGICIEL' ? versionInstalle.trim() || undefined : undefined,
              }
            : undefined,
      });

      updateCachedTicketStatus(ticketId, 'CLOTUREE', {
        clotureAt: new Date().toISOString(),
        rapport: { contenu: rapport.trim() },
        signature: { signatureUrl: signatureDataUrl, nomSignataire: nomSignataire.trim() },
      });

      Alert.alert(
        'Clôture enregistrée en local (Mode hors-ligne)',
        `Le rapport d’intervention et la signature tactile de ${nomSignataire.trim()} ont été sauvegardés sur votre smartphone.\n\nIls seront automatiquement transmis dès que la connexion internet sera rétablie.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClotureSuccess({
                reference: ticketReference,
                clotureAt: new Date().toISOString(),
                nomSignataire: nomSignataire.trim(),
              });
              onClose();
            },
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Fermer la modale"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ height: sheetHeight }}
          className="bg-white rounded-t-3xl flex-col overflow-hidden shadow-2xl"
        >
          <View className="items-center pt-2.5 pb-1 bg-[#31525B]">
            <View className="w-11 h-1 rounded-full bg-white/30" />
          </View>

          <View className="bg-[#31525B] px-5 py-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-10 h-10 rounded-xl bg-[#FFA101] items-center justify-center shadow-xs">
                <Award size={22} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-white">Clôture de l'intervention</Text>
                <Text className="text-xs text-slate-200" numberOfLines={1}>
                  {ticketReference} • Rapport technique & Signature
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 rounded-full bg-white/10 active:bg-white/20"
              accessibilityLabel="Fermer"
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-5 py-4"
            contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? 120 : 80 }}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!isDrawingSignature}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={true}
          >
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex-row items-start gap-3">
                <AlertCircle size={20} color="#C0392B" className="shrink-0 mt-0.5" />
                <Text className="text-red-700 text-sm font-medium flex-1 leading-5">{error}</Text>
              </View>
            )}

            {/* SECTION 1 : Rapport d'intervention */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <FileEdit size={18} color="#31525B" />
                  <Text className="text-sm font-bold text-[#1A2C31] uppercase tracking-wider">
                    1. Rapport technique d'intervention *
                  </Text>
                </View>
                <Text className="text-xs font-mono text-slate-400">
                  {rapport.trim().length} car.
                </Text>
              </View>

              <Text className="text-xs text-slate-500 mb-2 leading-relaxed">
                Décrivez les opérations réalisées, les tests effectués et l'état final du matériel.
              </Text>

              <TextInput
                style={{
                  color: '#0F172A',
                  backgroundColor: '#F8FAFC',
                  fontSize: 15,
                  minHeight: 125,
                  maxHeight: 220,
                  textAlignVertical: 'top',
                }}
                className="border border-slate-200 rounded-2xl p-3.5"
                placeholder="Ex: Remplacement du connecteur défectueux, mise à niveau du microprogramme, test de validation réseau avec le client..."
                placeholderTextColor="#94A3B8"
                value={rapport}
                onChangeText={(t) => {
                  setRapport(t);
                  setError(null);
                }}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                  }, 120);
                }}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* SECTION 2 : Fiche équipement ou logiciel si INSTALLATION */}
            {typeDemande === 'INSTALLATION' && (
              <View className="mb-6 bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Cpu size={18} color="#D97706" />
                  <Text className="text-sm font-bold text-amber-900 uppercase tracking-wider">
                    Nouvel actif déployé (Création CMDB)
                  </Text>
                </View>
                <Text className="text-xs text-amber-800 mb-3 leading-relaxed">
                  Cette installation va automatiquement provisionner une nouvelle fiche dans la CMDB
                  du client avec un matricule officiel et un QR code unique.
                </Text>

                {/* Sélecteur Actif Matériel vs Actif Logiciel */}
                <View className="flex-row items-center bg-white border border-amber-300/80 p-1 rounded-xl mb-3.5">
                  <TouchableOpacity
                    onPress={() => setTypeActif('MATERIEL')}
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
                      typeActif === 'MATERIEL' ? 'bg-[#31525B]' : 'bg-transparent'
                    }`}
                  >
                    <HardDrive size={14} color={typeActif === 'MATERIEL' ? '#FFFFFF' : '#64748B'} />
                    <Text
                      className={`ml-1.5 text-xs font-bold ${
                        typeActif === 'MATERIEL' ? 'text-white' : 'text-slate-600'
                      }`}
                    >
                      Actif Matériel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setTypeActif('LOGICIEL')}
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
                      typeActif === 'LOGICIEL' ? 'bg-[#31525B]' : 'bg-transparent'
                    }`}
                  >
                    <Code2 size={14} color={typeActif === 'LOGICIEL' ? '#FFFFFF' : '#64748B'} />
                    <Text
                      className={`ml-1.5 text-xs font-bold ${
                        typeActif === 'LOGICIEL' ? 'text-white' : 'text-slate-600'
                      }`}
                    >
                      Actif Logiciel
                    </Text>
                  </TouchableOpacity>
                </View>

                {typeActif === 'MATERIEL' ? (
                  <View className="gap-3">
                    <View>
                      <Text className="text-xs font-bold text-slate-700 mb-1">
                        Marque & Modèle du matériel *
                      </Text>
                      <TextInput
                        className="bg-white border border-slate-200 rounded-xl px-3.5 h-[48px] text-base text-slate-900 font-medium"
                        placeholder="Ex: Switch Cisco Catalyst 2960 24P"
                        placeholderTextColor="#94A3B8"
                        value={modeleInstalle}
                        onChangeText={setModeleInstalle}
                      />
                    </View>

                    <View>
                      <Text className="text-xs font-bold text-slate-700 mb-1">
                        Numéro de série matériel (SN) (optionnel)
                      </Text>
                      <TextInput
                        className="bg-white border border-slate-200 rounded-xl px-3.5 h-[48px] text-base text-slate-900 font-mono font-medium"
                        placeholder="Ex: FOC1837Z01K (généré auto si omis)"
                        placeholderTextColor="#94A3B8"
                        value={numeroSerieInstalle}
                        onChangeText={setNumeroSerieInstalle}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                ) : (
                  <View className="gap-3">
                    <View>
                      <Text className="text-xs font-bold text-slate-700 mb-1">
                        Nom du logiciel / Suite applicative *
                      </Text>
                      <TextInput
                        className="bg-white border border-slate-200 rounded-xl px-3.5 h-[48px] text-base text-slate-900 font-medium"
                        placeholder="Ex: Suite Microsoft 365 Business Standard"
                        placeholderTextColor="#94A3B8"
                        value={modeleInstalle}
                        onChangeText={setModeleInstalle}
                      />
                    </View>

                    <View className="flex-row gap-2.5">
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-700 mb-1">
                          Éditeur (optionnel)
                        </Text>
                        <TextInput
                          className="bg-white border border-slate-200 rounded-xl px-3.5 h-[46px] text-sm text-slate-900 font-medium"
                          placeholder="Ex: Microsoft"
                          placeholderTextColor="#94A3B8"
                          value={editeurInstalle}
                          onChangeText={setEditeurInstalle}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-700 mb-1">
                          Version (optionnel)
                        </Text>
                        <TextInput
                          className="bg-white border border-slate-200 rounded-xl px-3.5 h-[46px] text-sm text-slate-900 font-medium"
                          placeholder="Ex: v2024.1"
                          placeholderTextColor="#94A3B8"
                          value={versionInstalle}
                          onChangeText={setVersionInstalle}
                        />
                      </View>
                    </View>

                    <View>
                      <Text className="text-xs font-bold text-slate-700 mb-1">
                        Clé de licence / N° d'activation (optionnel)
                      </Text>
                      <TextInput
                        className="bg-white border border-slate-200 rounded-xl px-3.5 h-[48px] text-base text-slate-900 font-mono font-medium"
                        placeholder="Ex: LIC-MS365-XXXX (généré auto si omis)"
                        placeholderTextColor="#94A3B8"
                        value={numeroSerieInstalle}
                        onChangeText={setNumeroSerieInstalle}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* SECTION 3 : Signature numérique client */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <PenTool size={18} color="#31525B" />
                  <Text className="text-sm font-bold text-[#1A2C31] uppercase tracking-wider">
                    2. Signature numérique du client *
                  </Text>
                </View>
                {hasDrawnSignature && (
                  <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check size={12} color="#16A34A" />
                    <Text className="text-xs font-bold text-emerald-700">Signé</Text>
                  </View>
                )}
              </View>

              {/* Nom du signataire */}
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs font-bold text-slate-700">
                    Nom et prénom du signataire client *
                  </Text>
                  {isEntreprise ? (
                    <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Building2 size={11} color="#B45309" />
                      <Text className="text-[10px] font-bold text-amber-800">
                        Client Entreprise
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                      <UserCheck size={11} color="#0369A1" />
                      <Text className="text-[10px] font-bold text-sky-800">Particulier</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-[48px]">
                  <User size={18} color="#64748B" />
                  <TextInput
                    style={{ color: '#0F172A', fontSize: 15, fontWeight: '600' }}
                    className="flex-1 ml-2.5"
                    placeholder={
                      isEntreprise
                        ? 'Ex: M. Alain Nguemo (Responsable site)'
                        : 'Ex: M. Jean-Marc Mbida'
                    }
                    placeholderTextColor="#94A3B8"
                    value={nomSignataire}
                    onChangeText={(t) => {
                      setNomSignataire(t);
                      setError(null);
                    }}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 120);
                    }}
                  />
                  {nomSignataire.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setNomSignataire('');
                        setError(null);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="p-1 rounded-full bg-slate-200"
                      accessibilityLabel="Effacer le nom du signataire"
                    >
                      <X size={13} color="#475569" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Suggestions & Aides contextuelles */}
                {isEntreprise ? (
                  <View className="mt-1.5 flex-col gap-1">
                    <Text className="text-[11px] text-slate-500 leading-tight">
                      Indiquez la personne physique présente validant l’intervention.
                    </Text>
                    {clientNom && nomSignataire !== clientNom && (
                      <TouchableOpacity
                        onPress={() => {
                          setNomSignataire(clientNom);
                          setError(null);
                        }}
                        activeOpacity={0.7}
                        className="self-start flex-row items-center gap-1.5 mt-0.5 bg-amber-50/80 border border-amber-200 px-2.5 py-1 rounded-lg"
                      >
                        <Building2 size={12} color="#B45309" />
                        <Text className="text-xs font-medium text-amber-900">
                          Utiliser « {clientNom} »
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View className="mt-1.5 flex-row items-center justify-between">
                    {nomSignataire === clientNom && clientNom ? (
                      <View className="flex-row items-center gap-1">
                        <Check size={12} color="#16A34A" />
                        <Text className="text-[11px] text-emerald-700 font-medium">
                          Autocomplété avec le nom du client (modifiable)
                        </Text>
                      </View>
                    ) : clientNom ? (
                      <TouchableOpacity
                        onPress={() => {
                          setNomSignataire(clientNom);
                          setError(null);
                        }}
                        activeOpacity={0.7}
                        className="flex-row items-center gap-1 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg"
                      >
                        <RotateCcw size={11} color="#0369A1" />
                        <Text className="text-xs font-medium text-sky-800">
                          Rétablir « {clientNom} »
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </View>

              {/* Pavé tactile de signature */}
              <View className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-xs">
                <View className="h-[180px] w-full bg-white relative">
                  <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={{ html: SIGNATURE_HTML }}
                    style={{ flex: 1, backgroundColor: '#FFFFFF' }}
                    javaScriptEnabled
                    domStorageEnabled
                    onMessage={handleWebViewMessage}
                    scrollEnabled={false}
                  />
                </View>

                {/* Barre d'outils signature */}
                <View className="bg-slate-50 border-t border-slate-200 px-3.5 py-2.5 flex-row items-center justify-between">
                  <Text className="text-xs text-slate-500 font-medium">
                    {hasDrawnSignature
                      ? 'Signature enregistrée avec succès'
                      : 'Faites signer le client dans la zone ci-dessus'}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClearSignature}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 active:bg-slate-100"
                    accessibilityLabel="Effacer la signature"
                  >
                    <Trash2 size={13} color="#C0392B" />
                    <Text className="text-xs font-bold text-[#C0392B]">Effacer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Bouton de validation finale */}
            <TouchableOpacity
              onPress={handleSubmitCloture}
              disabled={loading}
              className={`h-[56px] rounded-2xl flex-row items-center justify-center gap-3 shadow-md mb-2 ${
                loading ? 'bg-slate-300' : 'bg-[#FFA101] active:bg-amber-600'
              }`}
              accessibilityLabel="Valider et clôturer définitivement"
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#020617" />
                  <Text className="text-slate-950 font-black text-base">
                    Validation et clôture en cours...
                  </Text>
                </>
              ) : (
                <>
                  <CheckCircle2 size={22} color="#020617" />
                  <Text className="text-slate-950 font-black text-lg">
                    Valider & Clôturer l'intervention
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text className="text-center text-xs text-slate-400 mt-2">
              Le rapport et la signature seront transmis au bureau.
            </Text>
          </ScrollView>

          {/* Barre d'outils contextuelle lorsque le clavier est actif */}
          {keyboardHeight > 0 && (
            <View className="bg-slate-100 border-t border-slate-200 px-4 py-2 flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-slate-600">
                Saisie en cours ({rapport.trim().length} car.)
              </Text>
              <TouchableOpacity
                onPress={() => Keyboard.dismiss()}
                className="flex-row items-center gap-1.5 px-3 py-1.5 bg-[#31525B] rounded-lg active:bg-[#254148]"
                accessibilityLabel="Masquer le clavier"
              >
                <ChevronDown size={14} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">Masquer le clavier</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

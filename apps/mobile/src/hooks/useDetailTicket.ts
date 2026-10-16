import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';
import type { PeerNotification } from '../components/ticket/PeerActionBanner';
import { type StoredUser, getStoredUser } from '../lib/auth-storage';
import { enqueueSyncAction, getCachedTicketById, updateCachedTicketStatus } from '../lib/offlineDb';
import { trpcClient } from '../lib/trpc';
import { uploadMediaToServer } from '../lib/uploadMedia';
import type { EquipementData } from '../modals/QrScanModal';
import type { FullTicketData, Statut, Ticket } from '../types/ticket.types';
import { useTicketChrono } from './useTicketChrono';

export function useDetailTicket(ticket: Ticket) {
  const [statut, setStatut] = useState<Statut>(ticket.statut as Statut);
  const [isActioning, setIsActioning] = useState(false);
  const [heureDepart, setHeureDepart] = useState<Date | null>(null);
  const [heureDemarrage, setHeureDemarrage] = useState<Date | null>(null);
  const [dernierMotifPause, setDernierMotifPause] = useState<string | null>(null);

  // Modales
  const [showMapModal, setShowMapModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showIaModal, setShowIaModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [showPannesRecentesModal, setShowPannesRecentesModal] = useState(false);
  const [motifPause, setMotifPause] = useState('');

  // Photos prises sur le terrain pour cette intervention
  const [capturedPhotos, setCapturedPhotos] = useState<
    Array<{ uri: string; note: string; timestamp: string }>
  >([]);

  const [fullTicket, setFullTicket] = useState<FullTicketData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    void getStoredUser().then((user) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    async function loadFullDetails() {
      setLoadingDetails(true);
      try {
        const data = await trpcClient.tickets.byId.query({ id: ticket.id });
        const full = data as unknown as FullTicketData;
        setFullTicket(full);
        if (full.statutActuel) {
          setStatut(full.statutActuel as Statut);
        }
        if (full.heureDepart) {
          setHeureDepart(new Date(full.heureDepart));
        }
        if (full.heureDemarrage) {
          setHeureDemarrage(new Date(full.heureDemarrage));
        }
        // Trouver le dernier motif de pause si disponible
        const pauseEntry = full.statutsHistorique?.find(
          (h) => h.statutNouvel === 'EN_PAUSE' && h.motif,
        );
        if (pauseEntry?.motif) {
          setDernierMotifPause(pauseEntry.motif);
        }
      } catch (err) {
        console.warn('[useDetailTicket] Erreur réseau, lecture du cache SQLite local:', err);
        const cached = getCachedTicketById<FullTicketData>(ticket.id);
        if (cached) {
          setFullTicket(cached);
          if (cached.statutActuel) {
            setStatut(cached.statutActuel as Statut);
          }
          if (cached.heureDepart) {
            setHeureDepart(new Date(cached.heureDepart));
          }
          if (cached.heureDemarrage) {
            setHeureDemarrage(new Date(cached.heureDemarrage));
          }
        }
      } finally {
        setLoadingDetails(false);
      }
    }

    void loadFullDetails();
  }, [ticket.id]);

  // État de notification collaborative d'équipe
  const [peerNotification, setPeerNotification] = useState<PeerNotification | null>(null);

  const clearPeerNotification = useCallback(() => {
    setPeerNotification(null);
  }, []);

  // Polling silencieux de synchronisation d'équipe (toutes les 10 secondes)
  useEffect(() => {
    let isMounted = true;

    const pollSync = async () => {
      if (AppState.currentState !== 'active' || isActioning) return;
      try {
        const data = await trpcClient.tickets.byId.query({ id: ticket.id });
        if (!isMounted) return;
        const remote = data as unknown as FullTicketData;
        if (!remote) return;

        // 1. Détection de changement de statut initié par un coéquipier
        if (remote.statutActuel && remote.statutActuel !== statut) {
          const nextStatut = remote.statutActuel as Statut;
          setStatut(nextStatut);
          if (remote.heureDemarrage) setHeureDemarrage(new Date(remote.heureDemarrage));
          if (remote.heureDepart) setHeureDepart(new Date(remote.heureDepart));

          const latestHist = remote.statutsHistorique?.[0];
          const isPeer =
            latestHist?.auteurTechId && latestHist.auteurTechId !== currentUser?.technicienId;

          if (isPeer) {
            let notifType: PeerNotification['type'] = 'reprise';
            let msg = latestHist?.motif || `Statut mis à jour : ${nextStatut}`;

            if (nextStatut === 'EN_COURS') {
              notifType = remote.heureDemarrage ? 'demarrage' : 'reprise';
              msg = latestHist?.motif || 'Intervention démarrée par votre coéquipier.';
            } else if (nextStatut === 'EN_PAUSE') {
              notifType = 'pause';
              msg = latestHist?.motif || 'Intervention mise en pause par votre coéquipier.';
              setDernierMotifPause(latestHist?.motif || 'Pause en cours');
            } else if (nextStatut === 'TERMINEE') {
              notifType = 'termine';
              msg = 'Travaux terminés par votre coéquipier. Prêt pour la clôture.';
            } else if (nextStatut === 'CLOTUREE') {
              notifType = 'cloture';
              msg = 'Intervention clôturée et signée par votre coéquipier.';
              setShowClotureModal(false);
            }

            setPeerNotification({
              message: msg,
              type: notifType,
              timestamp: Date.now(),
            });
          }
        }

        // 2. Synchronisation des médias et données complètes
        setFullTicket((prev) => {
          if (!prev) return remote;
          const prevMedias = prev.medias?.length || 0;
          const remoteMedias = remote.medias?.length || 0;
          if (remoteMedias > prevMedias && prevMedias > 0) {
            const diff = remoteMedias - prevMedias;
            setPeerNotification({
              message: `${diff} nouveau(x) document(s)/photo(s) ajouté(s) par l’équipe.`,
              type: 'demarrage',
              timestamp: Date.now(),
            });
          }
          return remote;
        });
      } catch {
        // Silencieux pour ne pas perturber l'expérience utilisateur
      }
    };

    const intervalId = setInterval(() => {
      void pollSync();
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [ticket.id, statut, isActioning, currentUser?.technicienId]);

  // Hook de chronomètre — temps actif réel (pauses soustraites)
  const { formattedTime } = useTicketChrono({
    statut,
    heureDemarrage,
    history: fullTicket?.statutsHistorique,
    heureFinale: fullTicket?.heureFinale ? new Date(fullTicket.heureFinale) : null,
  });

  const executeStatutChange = useCallback(
    async (nextStatut: Statut, motif?: string) => {
      setIsActioning(true);
      let lat: string | undefined;
      let lon: string | undefined;

      try {
        if (nextStatut === 'EN_COURS') {
          // Enregistre position GPS technicien avec expo-location
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              lat = loc.coords.latitude.toString();
              lon = loc.coords.longitude.toString();
            }
          } catch {
            // Si permission refusée, continue sans crash
          }

          await trpcClient.tickets.demarrerIntervention.mutate({
            ticketId: ticket.id,
            latitude: lat,
            longitude: lon,
          });

          const now = new Date();
          const wasInPause = statut === 'EN_PAUSE';
          if (!wasInPause && !heureDemarrage) {
            setHeureDemarrage(now);
          }
          setStatut('EN_COURS');
          setFullTicket((prev) => {
            if (!prev) return null;
            const newHist = [
              ...(prev.statutsHistorique || []),
              {
                id: `local-${Date.now()}`,
                statutPrecedent: statut,
                statutNouvel: 'EN_COURS',
                motif: wasInPause
                  ? 'Reprise de l’intervention après pause'
                  : 'Démarrage de l’intervention',
                changedAt: now,
              },
            ];
            return {
              ...prev,
              statutActuel: 'EN_COURS',
              heureDemarrage: prev.heureDemarrage ?? now,
              statutsHistorique: newHist,
            };
          });

          if (wasInPause) {
            Alert.alert(
              'Intervention Reprise',
              'L’intervention a été reprise avec succès. Le chronomètre continue.',
            );
          } else {
            Alert.alert(
              'Intervention Démarrée',
              'Votre heure de début et vos coordonnées GPS ont été enregistrées avec succès.',
            );
          }
        } else {
          // Changement de statut standard (EN_ROUTE, EN_PAUSE, TERMINEE)
          await trpcClient.tickets.changerStatut.mutate({
            ticketId: ticket.id,
            nouveauStatut: nextStatut,
            motif: motif,
          });

          const now = new Date();
          if (nextStatut === 'EN_ROUTE') setHeureDepart(now);
          if (nextStatut === 'EN_PAUSE' && motif) setDernierMotifPause(motif);
          setStatut(nextStatut);

          setFullTicket((prev) => {
            if (!prev) return null;
            const newHist = [
              ...(prev.statutsHistorique || []),
              {
                id: `local-${Date.now()}`,
                statutPrecedent: statut,
                statutNouvel: nextStatut,
                motif: motif || null,
                changedAt: now,
              },
            ];
            return {
              ...prev,
              statutActuel: nextStatut,
              heureDepart: nextStatut === 'EN_ROUTE' ? (prev.heureDepart ?? now) : prev.heureDepart,
              heureFinale: nextStatut === 'TERMINEE' ? now : prev.heureFinale,
              statutsHistorique: newHist,
            };
          });

          if (nextStatut === 'TERMINEE') {
            Alert.alert(
              'Fin des travaux enregistrée',
              'Les travaux ont été validées comme terminées. Vous pouvez désormais faire signer le client pour clôturer l’intervention.',
            );
          } else if (nextStatut === 'EN_PAUSE') {
            Alert.alert(
              'Intervention mise en pause',
              'Le statut a été mis à jour. Vous pourrez reprendre l’intervention dès votre retour sur le ticket.',
            );
          }
        }
      } catch (err: unknown) {
        console.warn("[useDetailTicket] Échec réseau, mise en file d'attente offline:", err);
        // Mode hors-ligne : sauvegarde dans sync_queue et mise à jour locale immédiate
        enqueueSyncAction('CHANGER_STATUT', ticket.id, {
          nouveauStatut: nextStatut,
          motif,
          latitude: lat,
          longitude: lon,
        });
        updateCachedTicketStatus(ticket.id, nextStatut, {
          ...(nextStatut === 'EN_COURS' ? { heureDemarrage: new Date().toISOString() } : {}),
          ...(nextStatut === 'EN_ROUTE' ? { heureDepart: new Date().toISOString() } : {}),
        });
        if (nextStatut === 'EN_COURS') setHeureDemarrage(new Date());
        if (nextStatut === 'EN_ROUTE') setHeureDepart(new Date());
        setStatut(nextStatut);

        Alert.alert(
          'Mode Hors-ligne (Action enregistrée)',
          `Le statut "${nextStatut}" a été sauvegardé en mémoire locale sur votre smartphone. Il sera transmis au serveur dès le rétablissement de la connexion.`,
        );
      } finally {
        setIsActioning(false);
        setShowPauseModal(false);
        setMotifPause('');
      }
    },
    [ticket.id, statut, heureDemarrage],
  );

  const handleStatutChange = useCallback(
    async (nextStatut: Statut) => {
      if (nextStatut === 'EN_PAUSE') {
        setShowPauseModal(true);
        return;
      }

      if (nextStatut === 'CLOTUREE') {
        setShowClotureModal(true);
        return;
      }

      if (nextStatut === 'TERMINEE') {
        Alert.alert(
          'Fin des travaux sur site',
          'Confirmez-vous que les réparations ou installations sont terminées ? Vous pourrez ensuite faire signer le client pour clôturer.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Confirmer la fin',
              onPress: () => void executeStatutChange(nextStatut),
            },
          ],
        );
        return;
      }

      void executeStatutChange(nextStatut);
    },
    [executeStatutChange],
  );

  const handleConfirmPause = useCallback(() => {
    if (!motifPause.trim()) {
      Alert.alert('Motif requis', 'Veuillez préciser la raison de la mise en pause.');
      return;
    }
    void executeStatutChange('EN_PAUSE', motifPause.trim());
  }, [motifPause, executeStatutChange]);

  const handleClotureSuccess = useCallback(
    (data: { nomSignataire?: string; clotureAt: string }) => {
      setStatut('CLOTUREE');
      setFullTicket((prev) =>
        prev
          ? {
              ...prev,
              statutActuel: 'CLOTUREE',
              signature: {
                signatureUrl: 'signed',
                nomSignataire: data.nomSignataire || ticket.client,
                signedAt: data.clotureAt,
              },
            }
          : null,
      );
    },
    [ticket.client],
  );

  const handleEquipementScanned = useCallback((eq: EquipementData) => {
    setFullTicket((prev) => (prev ? { ...prev, equipement: eq } : null));
    Alert.alert(
      'Équipement associé',
      `L'équipement ${eq.modele} (S/N: ${eq.numeroSerie}) a été associé à cette intervention.`,
    );
  }, []);

  const handleMediasSaved = useCallback(
    async (
      mediasList: Array<{
        uri: string;
        fileName: string;
        mimeType: string;
        fileSizeBytes?: number;
        note: string;
        type: 'image' | 'video';
      }>,
    ) => {
      let savedCount = 0;
      for (const item of mediasList) {
        const typeMedia =
          item.type === 'video' ? 'VIDEO_INTERVENTION_TECH' : 'PHOTO_INTERVENTION_TECH';

        setCapturedPhotos((prev) => [
          { uri: item.uri, note: item.note, timestamp: new Date().toISOString() },
          ...prev,
        ]);

        try {
          const uploadRes = await uploadMediaToServer(item.uri, item.fileName, item.mimeType);
          const serverUrl = uploadRes.fileUrl;

          const res = await trpcClient.tickets.ajouterPhoto.mutate({
            ticketId: ticket.id,
            fileUrl: serverUrl,
            fileName: item.fileName,
            note: item.note,
            typeMedia,
            mimeType: item.mimeType,
            fileSizeBytes: uploadRes.fileSizeBytes || item.fileSizeBytes,
          });

          if (res?.media) {
            setFullTicket((prev) =>
              prev
                ? {
                    ...prev,
                    medias: [
                      res.media as NonNullable<typeof prev.medias>[number],
                      ...(prev.medias || []),
                    ],
                  }
                : null,
            );
          }
          savedCount++;
        } catch (err) {
          console.warn(
            '[useDetailTicket] Enregistrement serveur différé, mise en file offline:',
            err,
          );
          enqueueSyncAction('AJOUTER_PHOTO', ticket.id, {
            fileUrl: item.uri,
            fileName: item.fileName,
            note: item.note,
            typeMedia,
            mimeType: item.mimeType,
            fileSizeBytes: item.fileSizeBytes,
          });
          savedCount++;
        }
      }

      Alert.alert(
        'Médias enregistrés',
        `${savedCount} média(s) d'intervention ont été rattachés au ticket avec succès et transmis à la coordination.`,
      );
    },
    [ticket.id],
  );

  return {
    statut,
    setStatut,
    isActioning,
    heureDepart,
    heureDemarrage,
    dernierMotifPause,
    fullTicket,
    setFullTicket,
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
  };
}

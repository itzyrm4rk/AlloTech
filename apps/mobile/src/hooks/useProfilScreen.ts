import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  type BiometricStatus,
  type StoredUser,
  authenticateWithBiometrics,
  checkBiometricStatus,
  clearBiometricAuth,
  getBiometricPreference,
  getCompetencesCache,
  getSessionToken,
  isBiometricsConfigured,
  saveBiometricAuth,
  saveCompetencesCache,
  saveSession,
  setBiometricPreference,
  setBiometricsConfigured,
} from '../lib/auth-storage';
import { trpcClient } from '../lib/trpc';

interface UseProfilScreenProps {
  currentUser: StoredUser | null;
  onUserUpdated?: (user: StoredUser) => void;
}

export function useProfilScreen({ currentUser, onUserUpdated }: UseProfilScreenProps) {
  // --- États édition profil ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [prenom, setPrenom] = useState(currentUser?.prenom ?? '');
  const [nom, setNom] = useState(currentUser?.nom ?? '');
  const [telephone, setTelephone] = useState(currentUser?.telephone ?? '');
  const [avatar, setAvatar] = useState<string | null>(currentUser?.photoUrl || null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setPrenom(currentUser.prenom ?? '');
      setNom(currentUser.nom ?? '');
      setTelephone(currentUser.telephone ?? '');
      setAvatar(currentUser.photoUrl || null);
    }
  }, [currentUser]);

  // --- Mot de passe modal state ---
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // --- Compétences ---
  const [competencesCatalog, setCompetencesCatalog] = useState<
    Array<{ id: string; libelle: string; code?: string | null }>
  >([]);
  const [techCompetences, setTechCompetences] = useState<Array<{ id: string; libelle: string }>>(
    [],
  );
  const [isEditingCompetences, setIsEditingCompetences] = useState(false);
  const [selectedCompIds, setSelectedCompIds] = useState<string[]>([]);
  const [isSavingCompetences, setIsSavingCompetences] = useState(false);
  const [isLoadingCompetences, setIsLoadingCompetences] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCompetencesData = async () => {
      // 1. Chargement instantané depuis le cache local pour affichage immédiat
      try {
        const cached = await getCompetencesCache();
        if (isMounted) {
          if (cached && cached.length > 0) {
            setTechCompetences(cached);
            setSelectedCompIds(cached.map((c) => c.id));
          } else if (currentUser?.matricule === 'TEC-001' || currentUser?.nom === 'ATG') {
            const defaultComps = [
              {
                id: '45d36814-c4d1-46b4-bd4b-c7ab45b03b57',
                libelle: 'Réseau & Switchs (Cisco, Mikrotik)',
              },
              {
                id: '6499c7c9-5944-4cae-ab2d-2bc17680419c',
                libelle: 'Câblage structuré RJ45 / Baie',
              },
              { id: '94909276-68d9-43a6-8469-230c9d9e239e', libelle: 'Mikrotik' },
            ];
            setTechCompetences(defaultComps);
            setSelectedCompIds(defaultComps.map((c) => c.id));
            void saveCompetencesCache(defaultComps);
          }
        }
      } catch {
        // Silencieux
      }

      setIsLoadingCompetences(true);
      try {
        let [catalog, profile, meProfile] = await Promise.all([
          trpcClient.auth.getCompetences.query().catch(() => []),
          trpcClient.techniciens.monProfil.query().catch((e: unknown) => {
            console.warn('[ProfilScreen] monProfil error:', e);
            return null;
          }),
          trpcClient.auth.me.query().catch((e: unknown) => {
            console.warn('[ProfilScreen] auth.me error:', e);
            return null;
          }),
        ]);

        if (!catalog || catalog.length === 0) {
          try {
            await trpcClient.auth.seedCompetences.mutate();
            catalog = await trpcClient.auth.getCompetences.query().catch(() => []);
          } catch {
            // Silencieux
          }
        }

        if (isMounted) {
          if (catalog && catalog.length > 0) setCompetencesCatalog(catalog);

          const rawComps =
            (
              profile as {
                competences?: Array<{
                  competenceId: string;
                  competence?: { libelle?: string } | null;
                }>;
              }
            )?.competences ||
            (
              meProfile as {
                technicien?: {
                  competences?: Array<{
                    competenceId: string;
                    competence?: { libelle?: string } | null;
                  }>;
                };
              }
            )?.technicien?.competences ||
            [];
          if (rawComps && rawComps.length > 0) {
            const list = rawComps.map((tc) => ({
              id: tc.competenceId,
              libelle: tc.competence?.libelle || 'Compétence',
            }));
            setTechCompetences(list);
            setSelectedCompIds(list.map((c) => c.id));
            void saveCompetencesCache(list);
          }

          const realEmail =
            (profile as { email?: string; user?: { email?: string } })?.user?.email ||
            (profile as { email?: string })?.email ||
            (meProfile as { email?: string })?.email;
          if (
            realEmail &&
            currentUser &&
            (!currentUser.email ||
              currentUser.email.includes('@tech.allotech.cm') ||
              currentUser.email !== realEmail)
          ) {
            const updated = { ...currentUser, email: realEmail };
            const token = await getSessionToken();
            if (token) {
              await saveSession(token, updated);
            }
            onUserUpdated?.(updated);
          }
        }
      } catch (err: unknown) {
        console.warn('[ProfilScreen] fetchCompetencesData error:', err);
      } finally {
        if (isMounted) setIsLoadingCompetences(false);
      }
    };
    void fetchCompetencesData();
    return () => {
      isMounted = false;
    };
  }, [currentUser, onUserUpdated]);

  const handleSaveCompetences = async () => {
    if (selectedCompIds.length === 0) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner au moins une compétence.');
      return;
    }
    setIsSavingCompetences(true);
    try {
      const res = await trpcClient.techniciens.updateCompetences.mutate({
        competenceIds: selectedCompIds,
      });
      if (res.success && res.competences) {
        const updated = res.competences.map((tc) => ({
          id: tc.competenceId,
          libelle: tc.competence?.libelle || 'Compétence',
        }));
        setTechCompetences(updated);
        void saveCompetencesCache(updated);
      }
      setIsEditingCompetences(false);
      Alert.alert('Succès', 'Compétences mises à jour.');
    } catch (err: unknown) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Impossible de mettre à jour.');
    } finally {
      setIsSavingCompetences(false);
    }
  };

  const toggleSelectedCompId = useCallback((id: string) => {
    setSelectedCompIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const openCompetencesEdit = useCallback(() => {
    setSelectedCompIds(techCompetences.map((c) => c.id));
    setIsEditingCompetences(true);
  }, [techCompetences]);

  // --- Biométrie ---
  const [bioStatus, setBioStatus] = useState<BiometricStatus | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [selectedBiometricMode, setSelectedBiometricMode] = useState<'FACE_ID' | 'FINGERPRINT'>(
    'FINGERPRINT',
  );

  useEffect(() => {
    async function checkBio() {
      try {
        const status = await checkBiometricStatus();
        setBioStatus(status);
        const pref = await getBiometricPreference();
        if (pref === 'FACE_ID' || pref === 'FINGERPRINT') setSelectedBiometricMode(pref);
        else if (status.hasFaceId && !status.hasFingerprint) setSelectedBiometricMode('FACE_ID');
        if (status.hasHardware && status.isEnrolled) {
          const conf = await isBiometricsConfigured();
          setBiometricEnabled(conf);
        } else {
          setBiometricEnabled(false);
        }
      } catch {
        /* silencieux */
      }
    }
    void checkBio();
  }, []);

  const handleSelectMode = async (mode: 'FACE_ID' | 'FINGERPRINT') => {
    setSelectedBiometricMode(mode);
    await setBiometricPreference(mode);
  };

  const handleToggleBiometrics = async (val: boolean) => {
    if (val) {
      const prompt =
        selectedBiometricMode === 'FACE_ID'
          ? 'Validez avec Face ID pour activer'
          : 'Validez avec votre empreinte pour activer';
      const success = await authenticateWithBiometrics(prompt);
      if (success) {
        const token = await getSessionToken();
        if (token && currentUser) await saveBiometricAuth(token, currentUser);
        else await setBiometricsConfigured(true);
        await setBiometricPreference(selectedBiometricMode);
        setBiometricEnabled(true);
        Alert.alert(
          'Activé',
          `Connexion ${selectedBiometricMode === 'FACE_ID' ? 'Face ID' : 'par empreinte'} activée.`,
        );
      } else {
        setBiometricEnabled(false);
        Alert.alert('Échec', 'Vérification non confirmée.');
      }
    } else {
      await clearBiometricAuth();
      setBiometricEnabled(false);
      Alert.alert('Désactivé', 'Connexion biométrique désactivée.');
    }
  };

  // --- Initiales & Display ---
  const initials = useMemo(() => {
    const p = (currentUser?.prenom || prenom || '').trim();
    const n = (currentUser?.nom || nom || '').trim();
    return `${p ? p[0] : 'T'}${n ? n[0] : 'C'}`.toUpperCase();
  }, [currentUser, prenom, nom]);

  const displayName =
    `${currentUser?.prenom ?? ''} ${currentUser?.nom ?? ''}`.trim() || 'Technicien';
  const email =
    currentUser?.email && !currentUser.email.includes('@tech.allotech.cm')
      ? currentUser.email
      : currentUser?.matricule === 'TEC-001' || currentUser?.nom === 'ATG'
        ? 'didieratgmarc@gmail.com'
        : '—';

  // --- Avatar options ---
  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission requise', "Autorisez l'accès à la galerie.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAvatar(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'accéder à la galerie.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        Alert.alert('Permission requise', "Autorisez l'accès à la caméra.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAvatar(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'accéder à la caméra.");
    }
  };

  const handleAvatarOptions = () => {
    Alert.alert('Photo de profil', 'Comment souhaitez-vous ajouter votre photo ?', [
      { text: 'Galerie / Fichiers', onPress: handlePickFromGallery },
      { text: 'Prendre une photo', onPress: handleTakePhoto },
      ...(avatar
        ? [{ text: 'Supprimer', style: 'destructive' as const, onPress: () => setAvatar(null) }]
        : []),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  // --- Sauvegarde profil ---
  const handleSaveProfile = async () => {
    if (!prenom.trim() || !nom.trim()) {
      Alert.alert('Champs requis', 'Prénom et nom sont obligatoires.');
      return;
    }
    setIsSavingProfile(true);
    try {
      if (currentUser) {
        await trpcClient.techniciens.updateProfile.mutate({
          prenom: prenom.trim(),
          nom: nom.trim(),
          telephone: telephone.trim(),
          photoUrl: avatar ?? undefined,
        });
        const token = (await getSessionToken()) || '';
        const updatedUser: StoredUser = {
          ...currentUser,
          prenom: prenom.trim(),
          nom: nom.trim(),
          telephone: telephone.trim(),
          photoUrl: avatar || undefined,
        };
        await saveSession(token, updatedUser);
        onUserUpdated?.(updatedUser);
      }
      setIsEditingProfile(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès.');
    } catch (err: unknown) {
      Alert.alert('Erreur', err instanceof Error ? err.message : "Impossible d'enregistrer.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return {
    // Profil states & handlers
    isEditingProfile,
    setIsEditingProfile,
    prenom,
    setPrenom,
    nom,
    setNom,
    telephone,
    setTelephone,
    avatar,
    setAvatar,
    isSavingProfile,
    handleSaveProfile,
    handleAvatarOptions,

    // Mot de passe
    isEditingPassword,
    setIsEditingPassword,

    // Compétences
    competencesCatalog,
    techCompetences,
    isEditingCompetences,
    setIsEditingCompetences,
    selectedCompIds,
    toggleSelectedCompId,
    openCompetencesEdit,
    isSavingCompetences,
    isLoadingCompetences,
    handleSaveCompetences,

    // Biométrie
    bioStatus,
    biometricEnabled,
    selectedBiometricMode,
    handleToggleBiometrics,
    handleSelectMode,

    // Affichage
    initials,
    displayName,
    email,
  };
}

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const SESSION_TOKEN_KEY = 'allotech_session_token';
const SESSION_USER_KEY = 'allotech_session_user';
const BIOMETRICS_CONFIG_KEY = 'allotech_biometrics_configured';
const BIOMETRIC_CREDENTIALS_KEY = 'allotech_biometric_credentials';

export type StoredUser = {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  technicienId: string;
  isActif: boolean;
  telephone?: string;
  photoUrl?: string;
  email?: string;
};

export interface StoredBiometricAuth {
  token: string;
  user: StoredUser;
  lastLoginAt: string;
}

/**
 * Sauvegarde le token de session et les infos utilisateur
 * dans le keychain sécurisé du téléphone
 */
export const saveSession = async (token: string, user: StoredUser): Promise<void> => {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
  await SecureStore.setItemAsync(SESSION_USER_KEY, JSON.stringify(user));
};

/**
 * Récupère le token de session stocké
 */
export const getSessionToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
};

/**
 * Récupère les informations de l'utilisateur connecté
 */
export const getStoredUser = async (): Promise<StoredUser | null> => {
  const raw = await SecureStore.getItemAsync(SESSION_USER_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as StoredUser;
    if (!user.email && (user.matricule === 'TEC-001' || user.nom === 'ATG')) {
      user.email = 'didieratgmarc@gmail.com';
      await SecureStore.setItemAsync(SESSION_USER_KEY, JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
};

const COMPETENCES_CACHE_KEY = 'allotech_competences_cache';

/**
 * Met en cache les compétences pour un accès instantané hors-ligne
 */
export const saveCompetencesCache = async (
  competences: Array<{ id: string; libelle: string }>,
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(COMPETENCES_CACHE_KEY, JSON.stringify(competences));
  } catch {
    // Silencieux
  }
};

/**
 * Récupère le cache local des compétences
 */
export const getCompetencesCache = async (): Promise<Array<{
  id: string;
  libelle: string;
}> | null> => {
  try {
    const raw = await SecureStore.getItemAsync(COMPETENCES_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Supprime la session active (déconnexion normale)
 * Ne supprime pas l'enrôlement biométrique si configuré
 */
export const clearSession = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  await SecureStore.deleteItemAsync(SESSION_USER_KEY);
};

/**
 * Enregistre les identifiants biométriques pour une reconnexion ultra-rapide 1-clic
 */
export const saveBiometricAuth = async (token: string, user: StoredUser): Promise<void> => {
  const payload: StoredBiometricAuth = {
    token,
    user,
    lastLoginAt: new Date().toISOString(),
  };
  await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(payload));
  await SecureStore.setItemAsync(BIOMETRICS_CONFIG_KEY, 'true');
};

/**
 * Récupère les identifiants biométriques autorisés
 */
export const getBiometricAuth = async (): Promise<StoredBiometricAuth | null> => {
  const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredBiometricAuth;
  } catch {
    return null;
  }
};

/**
 * Supprime définitivement l'authentification biométrique
 */
export const clearBiometricAuth = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
  await SecureStore.setItemAsync(BIOMETRICS_CONFIG_KEY, 'false');
};

/**
 * Diagnostic matériel & enrôlement biométrique détaillé
 */
const BIOMETRICS_PREF_TYPE_KEY = 'allotech_biometrics_pref_type';

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  hasFingerprint: boolean;
  hasFaceId: boolean;
  biometricType: 'FINGERPRINT' | 'FACIAL_RECOGNITION' | 'IRIS' | 'NONE';
  label: string;
}

export const checkBiometricStatus = async (): Promise<BiometricStatus> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return {
        hasHardware: false,
        isEnrolled: false,
        hasFingerprint: false,
        hasFaceId: false,
        biometricType: 'NONE',
        label: 'Matériel non supporté',
      };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    const hasFaceId = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    const hasIris = types.includes(LocalAuthentication.AuthenticationType.IRIS);

    let biometricType: 'FINGERPRINT' | 'FACIAL_RECOGNITION' | 'IRIS' | 'NONE' = 'FINGERPRINT';
    let label = 'Empreinte digitale';

    if (hasFaceId && hasFingerprint) {
      label = 'Face ID ou Empreinte digitale';
      biometricType = 'FACIAL_RECOGNITION';
    } else if (hasFaceId) {
      biometricType = 'FACIAL_RECOGNITION';
      label = 'Face ID / Reconnaissance faciale';
    } else if (hasFingerprint) {
      biometricType = 'FINGERPRINT';
      label = 'Empreinte digitale';
    } else if (hasIris) {
      biometricType = 'IRIS';
      label = 'Scanner iris';
    }

    return { hasHardware, isEnrolled, hasFingerprint, hasFaceId, biometricType, label };
  } catch {
    return {
      hasHardware: false,
      isEnrolled: false,
      hasFingerprint: false,
      hasFaceId: false,
      biometricType: 'NONE',
      label: 'Indisponible',
    };
  }
};

export const getBiometricPreference = async (): Promise<'FACE_ID' | 'FINGERPRINT' | 'ANY'> => {
  const val = await SecureStore.getItemAsync(BIOMETRICS_PREF_TYPE_KEY);
  if (val === 'FACE_ID' || val === 'FINGERPRINT') return val;
  return 'ANY';
};

export const setBiometricPreference = async (
  pref: 'FACE_ID' | 'FINGERPRINT' | 'ANY',
): Promise<void> => {
  await SecureStore.setItemAsync(BIOMETRICS_PREF_TYPE_KEY, pref);
};

/**
 * Vérifie si la biométrie est disponible et utilisable (matériel + empreinte enregistrée)
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  const status = await checkBiometricStatus();
  return status.hasHardware && status.isEnrolled;
};

/**
 * Déclenche la vérification biométrique (empreinte / FaceID)
 * Retourne true si authentifié avec succès
 */
export const authenticateWithBiometrics = async (
  promptMessage = 'Connectez-vous à AlloTech',
): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Utiliser le mot de passe',
      cancelLabel: 'Annuler',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
};

/**
 * Vérifie si le technicien a activé l'option biométrique sur ce téléphone
 */
export const isBiometricsConfigured = async (): Promise<boolean> => {
  const item = await SecureStore.getItemAsync(BIOMETRICS_CONFIG_KEY);
  return item === 'true';
};

/**
 * Active ou désactive l'authentification biométrique dans les préférences
 */
export const setBiometricsConfigured = async (enabled: boolean): Promise<void> => {
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRICS_CONFIG_KEY, 'true');
  } else {
    await clearBiometricAuth();
  }
};

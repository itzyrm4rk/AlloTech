import { Linking } from 'react-native';
import { getBaseUrl } from './trpc';

/**
 * Résout une URL de média pour l'environnement React Native mobile.
 * Si l'URL est relative (ex: /uploads/photo.jpg), lui préfixe l'adresse du serveur (getBaseUrl()).
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('content://')
  ) {
    return trimmed;
  }
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Ouvre une URL de manière sécurisée en s'assurant qu'elle est absolue.
 */
export async function safeOpenUrl(url?: string | null): Promise<boolean> {
  const fullUrl = resolveMediaUrl(url);
  if (!fullUrl) return false;

  try {
    await Linking.openURL(fullUrl);
    return true;
  } catch (error) {
    console.warn('[safeOpenUrl] Impossible d’ouvrir l’URL:', fullUrl, error);
    return false;
  }
}

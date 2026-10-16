import { getSessionToken } from './auth-storage';
import { getBaseUrl } from './trpc';

export interface UploadMediaResult {
  success: boolean;
  fileUrl: string;
  fileName: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export async function uploadMediaToServer(
  localUri: string,
  fileName: string,
  mimeType: string,
): Promise<UploadMediaResult> {
  const baseUrl = getBaseUrl();
  const token = await getSessionToken();

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Échec upload serveur (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  return json as UploadMediaResult;
}

import { getPendingSyncActions, incrementSyncAttempts, removeSyncAction } from './offlineDb';
import { trpcClient } from './trpc';

let isSyncing = false;

/**
 * Dépile et exécute séquentiellement toutes les mutations en attente dans sync_queue
 */
export async function processSyncQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  if (isSyncing) {
    console.log('[SyncQueue] Synchronisation déjà en cours...');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const pending = getPendingSyncActions();
  if (pending.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  isSyncing = true;
  console.log(`[SyncQueue] Démarrage du traitement de ${pending.length} action(s) en attente...`);

  let succeeded = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const payload = JSON.parse(item.payload_json);

      if (item.action_type === 'CHANGER_STATUT') {
        console.log(
          `[SyncQueue] Rejeu CHANGER_STATUT pour ${item.ticket_id} -> ${payload.nouveauStatut}`,
        );
        await trpcClient.tickets.changerStatut.mutate({
          ticketId: item.ticket_id,
          nouveauStatut: payload.nouveauStatut,
          motif: payload.motif,
          latitude: payload.latitude,
          longitude: payload.longitude,
        });
        removeSyncAction(item.id);
        succeeded++;
      } else if (item.action_type === 'CLOTURER') {
        console.log(`[SyncQueue] Rejeu CLOTURER pour ${item.ticket_id}`);
        await trpcClient.tickets.cloturer.mutate({
          ticketId: item.ticket_id,
          rapport: payload.rapport,
          signatureDataUrl: payload.signatureDataUrl,
          nomSignataire: payload.nomSignataire,
          equipementInstallation: payload.equipementInstallation,
        });
        removeSyncAction(item.id);
        succeeded++;
      } else if (item.action_type === 'AJOUTER_PHOTO') {
        console.log(`[SyncQueue] Rejeu AJOUTER_PHOTO pour ${item.ticket_id}`);
        await trpcClient.tickets.ajouterPhoto.mutate({
          ticketId: item.ticket_id,
          fileUrl: payload.fileUrl,
          fileName: payload.fileName,
          note: payload.note,
          typeMedia: payload.typeMedia || 'PHOTO_INTERVENTION_TECH',
          mimeType: payload.mimeType || 'image/jpeg',
          fileSizeBytes: payload.fileSizeBytes,
        });
        removeSyncAction(item.id);
        succeeded++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[SyncQueue] Échec de l'action #${item.id} (${item.action_type}):`, msg);
      incrementSyncAttempts(item.id);
      failed++;
    }
  }

  isSyncing = false;
  console.log(`[SyncQueue] Fin de synchronisation : ${succeeded} réussie(s), ${failed} en échec.`);
  return { processed: pending.length, succeeded, failed };
}

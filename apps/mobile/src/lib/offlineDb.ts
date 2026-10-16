import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getOfflineDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('allotech_offline.db');
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db: SQLite.SQLiteDatabase) {
  try {
    // 1. Table cache des tickets assignés
    db.execSync(`
      CREATE TABLE IF NOT EXISTS tickets_cache (
        id TEXT PRIMARY KEY,
        reference TEXT NOT NULL,
        type_demande TEXT,
        statut_actuel TEXT NOT NULL,
        urgence TEXT NOT NULL,
        description TEXT,
        adresse_site TEXT,
        client_nom TEXT,
        client_telephone TEXT,
        equipement_modele TEXT,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // 2. Table file d'attente des mutations hors-ligne (sync_queue)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT NOT NULL,
        ticket_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0
      );
    `);
  } catch (error) {
    console.error('Erreur initialisation SQLite offlineDb:', error);
  }
}

export interface CachedTicketData {
  id: string;
  reference: string;
  typeDemande?: string | null;
  statutActuel?: string;
  statut?: string;
  urgence?: string;
  description?: string | null;
  adresseSite?: string | null;
  client?: string | { nom?: string; telephone?: string } | null;
  equipement?: { modele?: string } | null;
  [key: string]: unknown;
}

/**
 * Sauvegarde les tickets distants reçus du serveur dans le cache local SQLite
 */
export function saveTicketsToCache<T extends { id: string; reference: string }>(tickets: T[]) {
  try {
    const db = getOfflineDb();
    const now = Date.now();

    for (const t of tickets) {
      const anyT = t as Record<string, unknown>;
      const clientNom =
        typeof anyT.client === 'string'
          ? anyT.client
          : (anyT.client as { nom?: string })?.nom || '';
      const clientTel = (anyT.client as { telephone?: string })?.telephone || '';
      const eqModele = (anyT.equipement as { modele?: string })?.modele || '';
      const statut = (anyT.statutActuel as string) || (anyT.statut as string) || 'ASSIGNEE';
      const urgence = (anyT.urgence as string) || 'NORMALE';
      const typeDemande = (anyT.typeDemande as string) || null;
      const desc = (anyT.description as string) || '';
      const adr = (anyT.adresseSite as string) || '';
      const dataJson = JSON.stringify(t);

      db.runSync(
        `INSERT OR REPLACE INTO tickets_cache (
          id, reference, type_demande, statut_actuel, urgence,
          description, adresse_site, client_nom, client_telephone,
          equipement_modele, data_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.reference,
          typeDemande,
          statut,
          urgence,
          desc,
          adr,
          clientNom,
          clientTel,
          eqModele,
          dataJson,
          now,
        ],
      );
    }
  } catch (err) {
    console.error('Erreur saveTicketsToCache:', err);
  }
}

/**
 * Récupère tous les tickets du cache local SQLite
 */
export function getCachedTickets<T = CachedTicketData>(): T[] {
  try {
    const db = getOfflineDb();
    const rows = db.getAllSync<{ data_json: string }>(
      'SELECT data_json FROM tickets_cache ORDER BY updated_at DESC',
    );
    return rows.map((r) => JSON.parse(r.data_json));
  } catch (err) {
    console.error('Erreur getCachedTickets:', err);
    return [];
  }
}

/**
 * Récupère un ticket spécifique par son identifiant depuis le cache SQLite
 */
export function getCachedTicketById<T = CachedTicketData>(ticketId: string): T | null {
  try {
    const db = getOfflineDb();
    const row = db.getFirstSync<{ data_json: string }>(
      'SELECT data_json FROM tickets_cache WHERE id = ?',
      [ticketId],
    );
    if (row?.data_json) {
      return JSON.parse(row.data_json);
    }
  } catch (err) {
    console.error('Erreur getCachedTicketById:', err);
  }
  return null;
}

/**
 * Met à jour localement le statut d'un ticket dans le cache SQLite (intermédiaire offline)
 */
export function updateCachedTicketStatus(
  ticketId: string,
  newStatus: string,
  metadata?: Record<string, unknown>,
) {
  try {
    const db = getOfflineDb();
    const row = db.getFirstSync<{ data_json: string }>(
      'SELECT data_json FROM tickets_cache WHERE id = ?',
      [ticketId],
    );

    if (row) {
      const ticket = JSON.parse(row.data_json);
      ticket.statutActuel = newStatus;
      if (metadata) {
        if (metadata.heureDepart) ticket.heureDepart = metadata.heureDepart;
        if (metadata.heureDemarrage) ticket.heureDemarrage = metadata.heureDemarrage;
        if (metadata.latitudeDemarrage) ticket.latitudeDemarrage = metadata.latitudeDemarrage;
        if (metadata.longitudeDemarrage) ticket.longitudeDemarrage = metadata.longitudeDemarrage;
        if (metadata.heureFinale) ticket.heureFinale = metadata.heureFinale;
        if (metadata.clotureAt) ticket.clotureAt = metadata.clotureAt;
        if (metadata.rapport) ticket.rapport = metadata.rapport;
        if (metadata.signature) ticket.signature = metadata.signature;
      }

      db.runSync(
        'UPDATE tickets_cache SET statut_actuel = ?, data_json = ?, updated_at = ? WHERE id = ?',
        [newStatus, JSON.stringify(ticket), Date.now(), ticketId],
      );
    }
  } catch (err) {
    console.error('Erreur updateCachedTicketStatus:', err);
  }
}

export type SyncActionType = 'CHANGER_STATUT' | 'CLOTURER' | 'AJOUTER_PHOTO';

export interface SyncQueueItem {
  id: number;
  action_type: SyncActionType;
  ticket_id: string;
  payload_json: string;
  created_at: number;
  attempts: number;
}

/**
 * Ajoute une mutation dans la file d'attente offline
 */
export function enqueueSyncAction(actionType: SyncActionType, ticketId: string, payload: unknown) {
  try {
    const db = getOfflineDb();
    db.runSync(
      'INSERT INTO sync_queue (action_type, ticket_id, payload_json, created_at, attempts) VALUES (?, ?, ?, ?, ?)',
      [actionType, ticketId, JSON.stringify(payload), Date.now(), 0],
    );
    console.log(`[SyncQueue] Action '${actionType}' mise en file pour ticket ${ticketId}`);
  } catch (err) {
    console.error('Erreur enqueueSyncAction:', err);
  }
}

/**
 * Récupère les actions en attente dans la file
 */
export function getPendingSyncActions(): SyncQueueItem[] {
  try {
    const db = getOfflineDb();
    return db.getAllSync<SyncQueueItem>('SELECT * FROM sync_queue ORDER BY created_at ASC');
  } catch (err) {
    console.error('Erreur getPendingSyncActions:', err);
    return [];
  }
}

/**
 * Supprime une action exécutée avec succès de la file
 */
export function removeSyncAction(id: number) {
  try {
    const db = getOfflineDb();
    db.runSync('DELETE FROM sync_queue WHERE id = ?', [id]);
  } catch (err) {
    console.error('Erreur removeSyncAction:', err);
  }
}

/**
 * Incrémente le compteur de tentatives en cas d'erreur
 */
export function incrementSyncAttempts(id: number) {
  try {
    const db = getOfflineDb();
    db.runSync('UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?', [id]);
  } catch (err) {
    console.error('Erreur incrementSyncAttempts:', err);
  }
}

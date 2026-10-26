import Dexie, { Table } from 'dexie';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  Associado,
  Veiculo,
  Manutencao,
  Abastecimento,
  Mensalidade,
  Evento,
  Comunicado,
  Campanha,
  AmigoMotoClube,
  ParceiroServico,
  AuditoriaLog,
  ConfiguracaoClube,
} from '../types';

export interface OfflineQueueItem {
  id?: number;
  collectionName: string;
  action: 'create' | 'update' | 'delete';
  docId?: string;
  data?: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount?: number;
  errorMessage?: string;
}

export class IronSideOfflineDatabase extends Dexie {
  associados!: Table<Associado, string>;
  veiculos!: Table<Veiculo, string>;
  manutencoes!: Table<Manutencao, string>;
  abastecimentos!: Table<Abastecimento, string>;
  mensalidades!: Table<Mensalidade, string>;
  eventos!: Table<Evento, string>;
  comunicados!: Table<Comunicado, string>;
  campanhas!: Table<Campanha, string>;
  amigosMc!: Table<AmigoMotoClube, string>;
  prestadores!: Table<ParceiroServico, string>;
  auditoriaLogs!: Table<AuditoriaLog, string>;
  configuracoes!: Table<ConfiguracaoClube, string>;
  offlineQueue!: Table<OfflineQueueItem, number>;

  constructor() {
    super('IronSideOfflineDB');
    this.version(1).stores({
      associados: 'id, numeroAssociado, cpf, status, cargo',
      veiculos: 'id, associadoId, placa, marca, modelo',
      manutencoes: 'id, associadoId, veiculoId, data',
      abastecimentos: 'id, associadoId, veiculoId, data',
      mensalidades: 'id, associadoId, mesReferencia, status',
      eventos: 'id, data, tipo, status',
      comunicados: 'id, dataPublicacao, prioridade',
      campanhas: 'id, status, tipoCampanha',
      amigosMc: 'id, nome, cidade, estado',
      prestadores: 'id, tipo, cidade',
      auditoriaLogs: 'id, timestamp, autorUid',
      configuracoes: 'id',
      offlineQueue: '++id, collectionName, action, timestamp, status',
    });
  }
}

export const offlineDb = new IronSideOfflineDatabase();

/**
 * Cache snapshots from Firestore or memory into local IndexedDB
 */
export async function cacheCollectionLocally<T extends { id: string }>(
  table: Table<T, string>,
  items: T[]
): Promise<void> {
  try {
    if (!items || items.length === 0) return;
    await table.bulkPut(items);
  } catch (err) {
    console.warn('Erro ao salvar cache no IndexedDB:', err);
  }
}

/**
 * Enqueue a mutation to be synced when internet connectivity is active
 */
export async function enqueueOfflineMutation(
  collectionName: string,
  action: 'create' | 'update' | 'delete',
  docId: string | undefined,
  data?: any
): Promise<number> {
  const item: OfflineQueueItem = {
    collectionName,
    action,
    docId,
    data,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };
  const id = await offlineDb.offlineQueue.add(item);
  notifyQueueListeners();
  return id;
}

/**
 * Get count of pending offline mutations
 */
export async function getPendingOfflineQueueCount(): Promise<number> {
  try {
    return await offlineDb.offlineQueue.where('status').equals('pending').count();
  } catch {
    return 0;
  }
}

// Event listeners for offline queue count
type QueueListener = (count: number) => void;
const queueListeners: Set<QueueListener> = new Set();

export function subscribeToOfflineQueue(listener: QueueListener): () => void {
  queueListeners.add(listener);
  getPendingOfflineQueueCount().then(listener);
  return () => queueListeners.delete(listener);
}

function notifyQueueListeners() {
  getPendingOfflineQueueCount().then((count) => {
    queueListeners.forEach((fn) => fn(count));
  });
}

let isSyncing = false;

/**
 * Drain the offline queue and write to Cloud Firestore
 */
export async function syncOfflineQueueToFirestore(): Promise<{
  synced: number;
  failed: number;
}> {
  if (isSyncing) return { synced: 0, failed: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pendingItems = await offlineDb.offlineQueue
      .where('status')
      .equals('pending')
      .toArray();

    if (pendingItems.length === 0) {
      isSyncing = false;
      return { synced: 0, failed: 0 };
    }

    for (const item of pendingItems) {
      if (!item.id) continue;

      try {
        await offlineDb.offlineQueue.update(item.id, { status: 'syncing' });

        const { collectionName, action, docId, data } = item;

        if (action === 'create') {
          if (docId) {
            await setDoc(doc(db, collectionName, docId), { ...data, id: docId });
          } else {
            const docRef = await addDoc(collection(db, collectionName), data);
            await updateDoc(docRef, { id: docRef.id });
          }
        } else if (action === 'update' && docId) {
          await updateDoc(doc(db, collectionName, docId), data);
        } else if (action === 'delete' && docId) {
          await deleteDoc(doc(db, collectionName, docId));
        }

        // Mutation succeeded: remove from Dexie queue
        await offlineDb.offlineQueue.delete(item.id);
        synced++;
      } catch (err: any) {
        console.error(`Falha ao sincronizar item offline ${item.id}:`, err);
        failed++;
        await offlineDb.offlineQueue.update(item.id, {
          status: 'pending',
          retryCount: (item.retryCount || 0) + 1,
          errorMessage: err?.message || 'Erro desconhecido',
        });
      }
    }
  } catch (err) {
    console.warn('Erro durante execução da fila offline:', err);
  } finally {
    isSyncing = false;
    notifyQueueListeners();
  }

  return { synced, failed };
}

// Auto-trigger sync on window 'online' event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Dexie PWA] Conexão restabelecida. Sincronizando fila offline com Firestore...');
    syncOfflineQueueToFirestore();
  });
}

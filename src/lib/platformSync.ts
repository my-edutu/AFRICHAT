import type {
  MiniApp,
  OfflineOperation,
  PlatformBootstrapPayload,
  PlatformTransaction,
  PlatformWalletSnapshot,
  Transaction,
} from '../types';

const STORAGE_KEYS = {
  miniApps: 'africhat.platform.miniapps',
  wallet: 'africhat.platform.wallet',
  queue: 'africhat.platform.queue',
  lastSyncedAt: 'africhat.platform.lastSyncedAt',
} as const;

const ALLOWED_TRANSACTION_CATEGORIES: Transaction['category'][] = [
  'shopping',
  'transfer',
  'utility',
  'travel',
  'deposit',
];

const ALLOWED_TRANSACTION_STATUSES: Transaction['status'][] = [
  'Completed',
  'Pending',
  'Received',
  'Converted',
];

export interface SyncMutationResult<T> {
  status: 'synced' | 'queued';
  record: T;
  operationId: string;
}

export interface CachedPlatformSnapshot {
  miniApps: MiniApp[];
  wallet: PlatformWalletSnapshot;
  pendingOperations: OfflineOperation[];
  lastSyncedAt?: string;
}

function hasBrowserStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function readStoredJson<T>(key: string, fallback: T): T {
  if (!hasBrowserStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key: string, value: unknown): void {
  if (!hasBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota / privacy mode failures and keep the app running.
  }
}

function mergeById<T extends { id: string }>(base: T[], incoming: T[]): T[] {
  const index = new Map<string, T>();

  for (const item of base) {
    index.set(item.id, item);
  }

  for (const item of incoming) {
    index.set(item.id, item);
  }

  return Array.from(index.values());
}

function normalizeMiniApp(app: MiniApp): MiniApp {
  return {
    ...app,
    screens: Array.isArray(app.screens)
      ? app.screens.map((screen) => ({
          title: String(screen.title ?? ''),
          description: String(screen.description ?? ''),
          items: Array.isArray(screen.items) ? screen.items.map((item) => String(item)) : [],
          actions: Array.isArray(screen.actions)
            ? screen.actions.map((action) => ({
                label: String(action.label ?? ''),
                actionType: String(action.actionType ?? ''),
              }))
            : [],
        }))
      : [],
    syncState: app.syncState ?? 'synced',
  };
}

function normalizeTransaction(transaction: Transaction | PlatformTransaction): PlatformTransaction {
  const category = ALLOWED_TRANSACTION_CATEGORIES.includes(transaction.category)
    ? transaction.category
    : 'shopping';
  const status = ALLOWED_TRANSACTION_STATUSES.includes(transaction.status)
    ? transaction.status
    : 'Completed';

  return {
    ...transaction,
    id: String(transaction.id),
    title: String(transaction.title),
    category,
    amount: Number(transaction.amount),
    currency: String(transaction.currency),
    date: String(transaction.date),
    time: String(transaction.time),
    status,
  };
}

function normalizeWallet(wallet: PlatformWalletSnapshot): PlatformWalletSnapshot {
  const transactions = Array.isArray(wallet.transactions)
    ? wallet.transactions.map((transaction) => normalizeTransaction(transaction))
    : [];

  return {
    balance: Number.isFinite(wallet.balance) ? wallet.balance : 0,
    transactions,
    updatedAt: wallet.updatedAt || new Date().toISOString(),
  };
}

function buildOperationId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readQueue(): OfflineOperation[] {
  return readStoredJson<OfflineOperation[]>(STORAGE_KEYS.queue, []);
}

function writeQueue(queue: OfflineOperation[]): void {
  writeStoredJson(STORAGE_KEYS.queue, queue);
}

export function readQueuedOperations(): OfflineOperation[] {
  return readQueue();
}

export function queueOfflineOperation(operation: OfflineOperation): OfflineOperation[] {
  const queue = readQueue();
  const nextQueue = queue.some((item) => item.id === operation.id)
    ? queue.map((item) => (item.id === operation.id ? operation : item))
    : [...queue, operation];
  writeQueue(nextQueue);
  return nextQueue;
}

export function clearQueuedOperations(operationIds?: string[]): void {
  if (!operationIds || operationIds.length === 0) {
    writeQueue([]);
    return;
  }

  const ids = new Set(operationIds);
  writeQueue(readQueue().filter((operation) => !ids.has(operation.id)));
}

export function readCachedPlatformSnapshot(
  defaultMiniApps: MiniApp[],
  defaultWallet: PlatformWalletSnapshot,
): CachedPlatformSnapshot {
  const cachedMiniApps = readStoredJson<MiniApp[]>(STORAGE_KEYS.miniApps, []);
  const cachedWallet = readStoredJson<PlatformWalletSnapshot | null>(STORAGE_KEYS.wallet, null);
  const pendingOperations = readQueue();

  return {
    miniApps: mergeById(defaultMiniApps.map(normalizeMiniApp), cachedMiniApps.map(normalizeMiniApp)),
    wallet: normalizeWallet(cachedWallet ? cachedWallet : defaultWallet),
    pendingOperations,
    lastSyncedAt: readStoredJson<string | null>(STORAGE_KEYS.lastSyncedAt, null) || undefined,
  };
}

export function saveCachedPlatformSnapshot(snapshot: {
  miniApps: MiniApp[];
  wallet: PlatformWalletSnapshot;
  lastSyncedAt?: string;
}): void {
  writeStoredJson(STORAGE_KEYS.miniApps, snapshot.miniApps.map(normalizeMiniApp));
  writeStoredJson(STORAGE_KEYS.wallet, normalizeWallet(snapshot.wallet));
  if (snapshot.lastSyncedAt) {
    writeStoredJson(STORAGE_KEYS.lastSyncedAt, snapshot.lastSyncedAt);
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchPlatformBootstrap(): Promise<PlatformBootstrapPayload | null> {
  try {
    return await fetchJson<PlatformBootstrapPayload>('/api/bootstrap');
  } catch {
    return null;
  }
}

export async function flushQueuedOperations(): Promise<{
  applied: number;
  bootstrap: PlatformBootstrapPayload | null;
}> {
  const operations = readQueue();
  if (operations.length === 0) {
    return { applied: 0, bootstrap: null };
  }

  try {
    const response = await fetchJson<{
      acknowledgedIds: string[];
      bootstrap: PlatformBootstrapPayload;
    }>('/api/sync', {
      method: 'POST',
      body: JSON.stringify({ operations }),
    });

    clearQueuedOperations(response.acknowledgedIds);
    if (response.bootstrap) {
      saveCachedPlatformSnapshot({
        miniApps: response.bootstrap.deployedApps,
        wallet: response.bootstrap.wallet,
        lastSyncedAt: response.bootstrap.serverTime,
      });
    }

    return {
      applied: response.acknowledgedIds.length,
      bootstrap: response.bootstrap,
    };
  } catch {
    return { applied: 0, bootstrap: null };
  }
}

export async function publishMiniAppRecord(
  app: MiniApp,
  context: {
    prompt?: string;
    templateId?: string;
    clientOperationId?: string;
    creator?: string;
  } = {},
): Promise<SyncMutationResult<MiniApp>> {
  const operationId = context.clientOperationId || buildOperationId('publish-miniapp');
  const payload = {
    app: normalizeMiniApp({
      ...app,
      creator: context.creator ?? app.creator,
      sourcePrompt: context.prompt ?? app.sourcePrompt,
      templateId: context.templateId ?? app.templateId,
      syncState: 'synced' as const,
    }),
    context: {
      ...context,
      clientOperationId: operationId,
    },
  };

  try {
    const response = await fetchJson<{ app: MiniApp }>('/api/miniapps/publish', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      status: 'synced',
      record: normalizeMiniApp(response.app),
      operationId,
    };
  } catch {
    queueOfflineOperation({
      id: operationId,
      kind: 'publish-miniapp',
      createdAt: new Date().toISOString(),
      payload,
    });

    return {
      status: 'queued',
      record: normalizeMiniApp({
        ...payload.app,
        syncState: 'queued',
      }),
      operationId,
    };
  }
}

export async function recordWalletTransaction(
  transaction: PlatformTransaction,
  context: {
    sourceAppId?: string;
    clientOperationId?: string;
  } = {},
): Promise<SyncMutationResult<PlatformTransaction>> {
  const operationId = context.clientOperationId || buildOperationId('wallet-transaction');
  const normalizedTransaction = normalizeTransaction({
    ...transaction,
    clientOperationId: operationId,
    sourceAppId: context.sourceAppId ?? transaction.sourceAppId,
    syncedAt: transaction.syncedAt,
  });

  try {
    const response = await fetchJson<{ transaction: PlatformTransaction }>('/api/wallet/transactions', {
      method: 'POST',
      body: JSON.stringify({
        transaction: normalizedTransaction,
        context: {
          ...context,
          clientOperationId: operationId,
        },
      }),
    });

    return {
      status: 'synced',
      record: normalizeTransaction(response.transaction),
      operationId,
    };
  } catch {
    queueOfflineOperation({
      id: operationId,
      kind: 'wallet-transaction',
      createdAt: new Date().toISOString(),
      payload: {
        transaction: normalizedTransaction,
        context: {
          ...context,
          clientOperationId: operationId,
        },
      },
    });

    return {
      status: 'queued',
      record: normalizedTransaction,
      operationId,
    };
  }
}

export function queueMeshSyncRequest(
  app: MiniApp,
  reason: string,
  clientOperationId?: string,
): OfflineOperation[] {
  return queueOfflineOperation({
    id: clientOperationId || buildOperationId('mesh-sync'),
    kind: 'mesh-sync-request',
    createdAt: new Date().toISOString(),
    payload: {
      appId: app.id,
      appName: app.name,
      reason,
    },
  });
}

export function mergeMiniApps(base: MiniApp[], incoming: MiniApp[]): MiniApp[] {
  return mergeById(base.map(normalizeMiniApp), incoming.map(normalizeMiniApp));
}

export function mergeTransactions(
  base: PlatformTransaction[],
  incoming: PlatformTransaction[],
): PlatformTransaction[] {
  return mergeById(base.map(normalizeTransaction), incoming.map(normalizeTransaction));
}

export { normalizeMiniApp, normalizeTransaction, normalizeWallet };
export const loadCachedPlatformSnapshot = readCachedPlatformSnapshot;

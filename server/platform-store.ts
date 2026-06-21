import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { initialTransactions, staticMiniApps } from '../src/data';
import type {
  MiniApp,
  OfflineOperation,
  PlatformBootstrapPayload,
  PlatformTransaction,
  PlatformWalletSnapshot,
  Transaction,
} from '../src/types';

const ALLOWED_CATEGORIES = new Set([
  'Ride Hailing',
  'School Portal',
  'Marketplace',
  'Healthcare',
  'Cooperative',
  'Logistics',
  'Delivery',
  'Church',
  'Learning',
  'Streaming',
  'Hotel',
]);

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

interface StoredApp extends MiniApp {
  publishedAt: string;
  updatedAt: string;
  version: number;
  syncState: 'draft' | 'queued' | 'synced';
}

interface StoredState {
  version: 1;
  revision: number;
  deployedApps: StoredApp[];
  wallet: PlatformWalletSnapshot;
  templates: MiniApp[];
  processedOperationIds: string[];
  syncEvents: Array<{
    id: string;
    kind: OfflineOperation['kind'];
    createdAt: string;
    payload: Record<string, unknown>;
  }>;
  updatedAt: string;
}

interface PublishMiniAppInput {
  app: MiniApp;
  context?: {
    prompt?: string;
    templateId?: string;
    clientOperationId?: string;
    creator?: string;
  };
}

interface WalletTransactionInput {
  transaction: PlatformTransaction;
  context?: {
    clientOperationId?: string;
    sourceAppId?: string;
  };
}

interface SyncBatchInput {
  operations: OfflineOperation[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeMiniApp(app: MiniApp): MiniApp {
  return {
    ...app,
    id: asString(app.id),
    name: asString(app.name),
    description: asString(app.description),
    category: asString(app.category),
    icon: asString(app.icon, 'widgets'),
    bgColor: asString(app.bgColor, '#0A8F5A15'),
    textColor: asString(app.textColor, '#0A8F5A'),
    creator: app.creator ? asString(app.creator) : undefined,
    publishedAt: app.publishedAt ? asString(app.publishedAt) : undefined,
    updatedAt: app.updatedAt ? asString(app.updatedAt) : undefined,
    version: typeof app.version === 'number' ? app.version : undefined,
    templateId: app.templateId ? asString(app.templateId) : undefined,
    sourcePrompt: app.sourcePrompt ? asString(app.sourcePrompt) : undefined,
    syncState: app.syncState ?? 'synced',
    isCustom: Boolean(app.isCustom),
    isActive: app.isActive !== false,
    screens: Array.isArray(app.screens)
      ? app.screens.slice(0, 5).map((screen) => ({
          title: asString(screen.title, 'Untitled'),
          description: asString(screen.description),
          items: Array.isArray(screen.items)
            ? screen.items.slice(0, 25).map((item) => asString(item))
            : [],
          actions: Array.isArray(screen.actions)
            ? screen.actions.slice(0, 8).map((action) => ({
                label: asString(action.label, 'Action'),
                actionType: asString(action.actionType, 'open'),
              }))
            : [],
        }))
      : [],
  };
}

function normalizeTransaction(transaction: PlatformTransaction | Transaction): PlatformTransaction {
  const category = ALLOWED_TRANSACTION_CATEGORIES.includes(transaction.category)
    ? transaction.category
    : 'shopping';
  const status = ALLOWED_TRANSACTION_STATUSES.includes(transaction.status)
    ? transaction.status
    : 'Completed';

  return {
    ...transaction,
    id: asString(transaction.id),
    title: asString(transaction.title),
    category,
    amount: asNumber(transaction.amount),
    currency: asString(transaction.currency, '₦'),
    date: asString(transaction.date),
    time: asString(transaction.time),
    status,
    clientOperationId: 'clientOperationId' in transaction ? asString(transaction.clientOperationId ?? '') || undefined : undefined,
    sourceAppId: 'sourceAppId' in transaction ? asString(transaction.sourceAppId ?? '') || undefined : undefined,
    syncedAt: 'syncedAt' in transaction ? asString(transaction.syncedAt ?? '') || undefined : undefined,
  };
}

function defaultPublishedApp(): StoredApp {
  const timestamp = nowIso();
  return {
    id: 'abuja-rides',
    name: 'Abuja City Rides',
    description: 'Custom ride hailing for Garki.',
    category: 'Ride Hailing',
    icon: 'local_taxi',
    bgColor: 'rgba(109,219,159,0.1)',
    textColor: '#6ddb9f',
    isCustom: true,
    isActive: true,
    creator: 'Godfrey',
    publishedAt: timestamp,
    updatedAt: timestamp,
    version: 1,
    templateId: 'ridego',
    sourcePrompt: 'Build a ride hailing app for Abuja',
    syncState: 'synced',
    screens: [
      {
        title: 'Book a Premium Ride',
        description: 'Available drivers around Garki Area II:',
        items: [
          'Babajide Alabi - Toyota Corolla - 4.9',
          'Chidi Okafor - Honda Accord - 4.8',
          'Aisha Yusuf - Hyundai Elantra - 4.7',
        ],
        actions: [
          { label: 'Request Immediate Pickup', actionType: 'pay' },
          { label: 'Sync Offline Trip Cache', actionType: 'offline' },
        ],
      },
    ],
  };
}

function defaultState(): StoredState {
  const timestamp = nowIso();
  return {
    version: 1,
    revision: 1,
    deployedApps: [defaultPublishedApp()],
    wallet: {
      balance: 425500,
      transactions: initialTransactions.map((transaction) =>
        normalizeTransaction({
          ...transaction,
          syncedAt: timestamp,
        }),
      ),
      updatedAt: timestamp,
    },
    templates: staticMiniApps.map((template) =>
      normalizeMiniApp({
        ...template,
        syncState: 'synced',
        isActive: true,
      }),
    ),
    processedOperationIds: [],
    syncEvents: [],
    updatedAt: timestamp,
  };
}

function clampProcessedIds(ids: string[]): string[] {
  return ids.slice(-1000);
}

function clampSyncEvents(
  events: StoredState['syncEvents'],
): StoredState['syncEvents'] {
  return events.slice(0, 100);
}

export class PlatformStore {
  private state: StoredState | null = null;
  private pending: Promise<void> = Promise.resolve();

  constructor(private readonly filePath = PlatformStore.resolveDefaultPath()) {}

  static resolveDefaultPath(): string {
    return process.env.AFRICHAT_STORE_FILE || path.join(process.cwd(), '.africhat', 'platform-state.json');
  }

  async bootstrap(): Promise<PlatformBootstrapPayload> {
    return this.toBootstrapPayload(await this.getState());
  }

  async publishMiniApp(input: PublishMiniAppInput): Promise<StoredApp> {
    return this.runExclusive(async () => {
      const state = await this.getState();
      const normalized = this.validateMiniApp(input.app);
      const existingIndex = state.deployedApps.findIndex((item) => item.id === normalized.id);
      const existing = existingIndex >= 0 ? state.deployedApps[existingIndex] : null;
      const timestamp = nowIso();
      const stored: StoredApp = {
        ...normalized,
        creator: input.context?.creator ?? normalized.creator,
        sourcePrompt: input.context?.prompt ?? normalized.sourcePrompt,
        templateId: input.context?.templateId ?? normalized.templateId,
        publishedAt: existing?.publishedAt ?? timestamp,
        updatedAt: timestamp,
        version: (existing?.version ?? 0) + 1,
        syncState: 'synced',
      };

      if (existingIndex >= 0) {
        state.deployedApps[existingIndex] = stored;
      } else {
        state.deployedApps.unshift(stored);
      }

      state.revision += 1;
      state.updatedAt = timestamp;
      await this.persistState(state);
      return stored;
    });
  }

  async recordWalletTransaction(input: WalletTransactionInput): Promise<{ transaction: PlatformTransaction; wallet: PlatformWalletSnapshot }> {
    return this.runExclusive(async () => {
      const state = await this.getState();
      const normalized = this.validateTransaction(input.transaction);
      const existingIndex = state.wallet.transactions.findIndex((item) => item.id === normalized.id);
      const timestamp = nowIso();

      if (existingIndex >= 0) {
        state.wallet.transactions[existingIndex] = {
          ...state.wallet.transactions[existingIndex],
          ...normalized,
          syncedAt: timestamp,
        };
      } else {
        state.wallet.transactions.unshift({
          ...normalized,
          clientOperationId: input.context?.clientOperationId ?? normalized.clientOperationId,
          sourceAppId: input.context?.sourceAppId ?? normalized.sourceAppId,
          syncedAt: timestamp,
        });
        state.wallet.balance += normalized.amount;
      }

      state.wallet.updatedAt = timestamp;
      state.revision += 1;
      state.updatedAt = timestamp;
      await this.persistState(state);

      return {
        transaction: state.wallet.transactions[existingIndex >= 0 ? existingIndex : 0],
        wallet: state.wallet,
      };
    });
  }

  async syncOperations(input: SyncBatchInput): Promise<{
    acknowledgedIds: string[];
    bootstrap: PlatformBootstrapPayload;
  }> {
    return this.runExclusive(async () => {
      const state = await this.getState();
      const acknowledgedIds: string[] = [];

      for (const operation of input.operations) {
        if (state.processedOperationIds.includes(operation.id)) {
          acknowledgedIds.push(operation.id);
          continue;
        }

        if (operation.kind === 'publish-miniapp') {
          const payload = isRecord(operation.payload) ? operation.payload : null;
          const app = payload && isRecord(payload.app) ? (payload.app as MiniApp) : null;
          if (app) {
            await this.applyPublishMiniApp(state, {
              app,
              context: isRecord(payload?.context) ? (payload.context as PublishMiniAppInput['context']) : undefined,
            });
          }
        }

        if (operation.kind === 'wallet-transaction') {
          const payload = isRecord(operation.payload) ? operation.payload : null;
          const transaction = payload && isRecord(payload.transaction)
            ? (payload.transaction as PlatformTransaction)
            : null;
          if (transaction) {
            await this.applyWalletTransaction(state, {
              transaction,
              context: isRecord(payload?.context) ? (payload.context as WalletTransactionInput['context']) : undefined,
            });
          }
        }

        if (operation.kind === 'mesh-sync-request') {
          state.syncEvents.unshift({
            id: operation.id,
            kind: operation.kind,
            createdAt: operation.createdAt,
            payload: operation.payload,
          });
        }

        state.processedOperationIds.push(operation.id);
        acknowledgedIds.push(operation.id);
      }

      state.processedOperationIds = clampProcessedIds(state.processedOperationIds);
      state.syncEvents = clampSyncEvents(state.syncEvents);
      state.revision += 1;
      state.updatedAt = nowIso();
      await this.persistState(state);

      return {
        acknowledgedIds,
        bootstrap: this.toBootstrapPayload(state),
      };
    });
  }

  async listMiniApps(): Promise<MiniApp[]> {
    const state = await this.getState();
    return state.deployedApps.map((app) => ({ ...app }));
  }

  async getWallet(): Promise<PlatformWalletSnapshot> {
    const state = await this.getState();
    return {
      balance: state.wallet.balance,
      transactions: state.wallet.transactions.map((transaction) => ({ ...transaction })),
      updatedAt: state.wallet.updatedAt,
    };
  }

  async getSyncEvents(): Promise<StoredState['syncEvents']> {
    const state = await this.getState();
    return state.syncEvents.map((event) => ({ ...event, payload: { ...event.payload } }));
  }

  async getRevision(): Promise<number> {
    const state = await this.getState();
    return state.revision;
  }

  private async applyPublishMiniApp(state: StoredState, input: PublishMiniAppInput): Promise<void> {
    const normalized = this.validateMiniApp(input.app);
    const existingIndex = state.deployedApps.findIndex((item) => item.id === normalized.id);
    const existing = existingIndex >= 0 ? state.deployedApps[existingIndex] : null;
    const timestamp = nowIso();
    const stored: StoredApp = {
      ...normalized,
      creator: input.context?.creator ?? normalized.creator,
      sourcePrompt: input.context?.prompt ?? normalized.sourcePrompt,
      templateId: input.context?.templateId ?? normalized.templateId,
      publishedAt: existing?.publishedAt ?? timestamp,
      updatedAt: timestamp,
      version: (existing?.version ?? 0) + 1,
      syncState: 'synced',
    };

    if (existingIndex >= 0) {
      state.deployedApps[existingIndex] = stored;
    } else {
      state.deployedApps.unshift(stored);
    }
  }

  private async applyWalletTransaction(state: StoredState, input: WalletTransactionInput): Promise<void> {
    const normalized = this.validateTransaction(input.transaction);
    const existingIndex = state.wallet.transactions.findIndex((item) => item.id === normalized.id);
    const timestamp = nowIso();

    if (existingIndex >= 0) {
      state.wallet.transactions[existingIndex] = {
        ...state.wallet.transactions[existingIndex],
        ...normalized,
        syncedAt: timestamp,
      };
      return;
    }

    state.wallet.transactions.unshift({
      ...normalized,
      clientOperationId: input.context?.clientOperationId ?? normalized.clientOperationId,
      sourceAppId: input.context?.sourceAppId ?? normalized.sourceAppId,
      syncedAt: timestamp,
    });
    state.wallet.balance += normalized.amount;
    state.wallet.updatedAt = timestamp;
  }

  private async getState(): Promise<StoredState> {
    if (this.state) {
      return this.state;
    }

    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as StoredState;
      this.state = this.repairState(parsed);
      return this.state;
    } catch {
      this.state = defaultState();
      await this.persistState(this.state);
      return this.state;
    }
  }

  private repairState(input: StoredState): StoredState {
    const defaulted = defaultState();
    const deployedApps = Array.isArray(input.deployedApps)
      ? input.deployedApps.map((app) => this.validateMiniApp(app))
      : defaulted.deployedApps;
    const wallet = this.validateWallet(input.wallet);
    const templates = Array.isArray(input.templates)
      ? input.templates.map((template) => this.validateMiniApp(template))
      : defaulted.templates;

    return {
      version: 1,
      revision: typeof input.revision === 'number' ? input.revision : defaulted.revision,
      deployedApps: deployedApps.map((app) => ({
        ...app,
        publishedAt: app.publishedAt ?? nowIso(),
        updatedAt: app.updatedAt ?? nowIso(),
        version: typeof app.version === 'number' ? app.version : 1,
        syncState: app.syncState ?? 'synced',
      })),
      wallet,
      templates,
      processedOperationIds: Array.isArray(input.processedOperationIds) ? input.processedOperationIds : [],
      syncEvents: Array.isArray(input.syncEvents) ? clampSyncEvents(input.syncEvents) : [],
      updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : nowIso(),
    };
  }

  private validateMiniApp(app: MiniApp): MiniApp {
    if (!isRecord(app)) {
      throw new Error('Mini app payload must be an object');
    }

    const name = asString(app.name).trim();
    const description = asString(app.description).trim();
    const category = asString(app.category).trim();

    if (!name) {
      throw new Error('Mini app name is required');
    }

    if (name.length > 120) {
      throw new Error('Mini app name is too long');
    }

    if (!category || !ALLOWED_CATEGORIES.has(category)) {
      throw new Error(`Unsupported mini app category: ${category || 'unknown'}`);
    }

    return normalizeMiniApp({
      ...app,
      name,
      description: description || 'Generated mini app',
      category,
      icon: asString(app.icon, 'widgets'),
      bgColor: asString(app.bgColor, '#0A8F5A15'),
      textColor: asString(app.textColor, '#0A8F5A'),
      creator: app.creator ? asString(app.creator) : 'Unknown',
      syncState: app.syncState ?? 'synced',
      version: typeof app.version === 'number' ? app.version : 1,
      publishedAt: app.publishedAt ? asString(app.publishedAt) : nowIso(),
      updatedAt: app.updatedAt ? asString(app.updatedAt) : nowIso(),
      templateId: app.templateId ? asString(app.templateId) : undefined,
      sourcePrompt: app.sourcePrompt ? asString(app.sourcePrompt) : undefined,
    });
  }

  private validateWallet(wallet: PlatformWalletSnapshot): PlatformWalletSnapshot {
    if (!isRecord(wallet)) {
      return {
        balance: 0,
        transactions: [],
        updatedAt: nowIso(),
      };
    }

    const transactions = Array.isArray(wallet.transactions)
      ? wallet.transactions.map((transaction) => this.validateTransaction(transaction))
      : [];

    return {
      balance: asNumber(wallet.balance, 0),
      transactions,
      updatedAt: asString(wallet.updatedAt, nowIso()),
    };
  }

  private validateTransaction(transaction: PlatformTransaction): PlatformTransaction {
    if (!isRecord(transaction)) {
      throw new Error('Transaction payload must be an object');
    }

    const category = ALLOWED_TRANSACTION_CATEGORIES.includes(transaction.category)
      ? transaction.category
      : 'shopping';
    const status = ALLOWED_TRANSACTION_STATUSES.includes(transaction.status)
      ? transaction.status
      : 'Completed';

    const normalized = normalizeTransaction({
      ...transaction,
      id: asString(transaction.id || randomUUID()),
      title: asString(transaction.title).trim() || 'Untitled transaction',
      category,
      amount: asNumber(transaction.amount, 0),
      currency: asString(transaction.currency, '₦'),
      date: asString(transaction.date, 'Today'),
      time: asString(transaction.time, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
      status,
      clientOperationId: transaction.clientOperationId ? asString(transaction.clientOperationId) : undefined,
      sourceAppId: transaction.sourceAppId ? asString(transaction.sourceAppId) : undefined,
      syncedAt: transaction.syncedAt ? asString(transaction.syncedAt) : undefined,
    });

    if (!Number.isFinite(normalized.amount)) {
      throw new Error('Transaction amount must be numeric');
    }

    return normalized;
  }

  private toBootstrapPayload(state: StoredState): PlatformBootstrapPayload {
    return {
      deployedApps: state.deployedApps.map((app) => ({ ...app })),
      wallet: {
        balance: state.wallet.balance,
        transactions: state.wallet.transactions.map((transaction) => ({ ...transaction })),
        updatedAt: state.wallet.updatedAt,
      },
      revision: state.revision,
      serverTime: state.updatedAt,
      templates: state.templates.map((template) => ({ ...template })),
    };
  }

  private async persistState(state: StoredState): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const nextPath = `${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(nextPath, JSON.stringify(state, null, 2), 'utf8');
    await rename(nextPath, this.filePath);
    this.state = state;
  }

  private runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const next = this.pending.then(task, task);
    this.pending = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}

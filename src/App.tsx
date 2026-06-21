import { useEffect, useRef, useState } from 'react';

import { staticMiniApps } from './data';
import type {
  MiniApp,
  OfflineOperation,
  PlatformBootstrapPayload,
  PlatformTransaction,
  PlatformWalletSnapshot,
} from './types';
import {
  fetchPlatformBootstrap,
  flushQueuedOperations,
  loadCachedPlatformSnapshot,
  mergeMiniApps,
  mergeTransactions,
  publishMiniAppRecord,
  queueMeshSyncRequest,
  readQueuedOperations,
  recordWalletTransaction,
  saveCachedPlatformSnapshot,
} from './lib/platformSync';

const THEME_STORAGE_KEY = 'africhat-theme';
const DEFAULT_TEMPLATE_ID = 'ridego';
const DEFAULT_TIMESTAMP = new Date().toISOString();

const TEMPLATE_PROMPTS: Record<string, string> = {
  ridego: 'Build a ride hailing app for Abuja with driver dispatch, wallet checkout, and offline trip recovery.',
  schoolportal: 'Build a school portal for students and staff with grading, attendance, and fee management.',
  shopeasy: 'Build a marketplace app for African merchants with product publishing, order tracking, and wallet checkout.',
  medicare: 'Build a healthcare mini app for appointments, pharmacy delivery, and patient intake.',
};

const DEFAULT_PUBLISHED_APPS: MiniApp[] = [
  {
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
    publishedAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    version: 1,
    templateId: 'ridego',
    sourcePrompt: TEMPLATE_PROMPTS.ridego,
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
  },
];

const DEFAULT_WALLET: PlatformWalletSnapshot = {
  balance: 425500,
  updatedAt: DEFAULT_TIMESTAMP,
  transactions: [
    {
      id: 't1',
      title: 'Shoprite Ikeja',
      category: 'shopping',
      amount: -4500,
      currency: '₦',
      date: 'Today',
      time: '2:45 PM',
      status: 'Completed',
      syncedAt: DEFAULT_TIMESTAMP,
    },
    {
      id: 't2',
      title: 'Abidemi Folake',
      category: 'deposit',
      amount: 12000,
      currency: '₦',
      date: 'Yesterday',
      time: '11:20 AM',
      status: 'Received',
      syncedAt: DEFAULT_TIMESTAMP,
    },
    {
      id: 't3',
      title: 'Eko Electricity',
      category: 'utility',
      amount: -2500,
      currency: '₦',
      date: 'Oct 24',
      time: '6:00 PM',
      status: 'Completed',
      syncedAt: DEFAULT_TIMESTAMP,
    },
    {
      id: 't4',
      title: 'Kenya Airways (KES)',
      category: 'travel',
      amount: -152000,
      currency: '₦',
      date: 'Oct 22',
      time: '10:15 AM',
      status: 'Converted',
      syncedAt: DEFAULT_TIMESTAMP,
    },
  ],
};

const INITIAL_SNAPSHOT = loadCachedPlatformSnapshot(DEFAULT_PUBLISHED_APPS, DEFAULT_WALLET);

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Ignore storage failures and fall back to the system preference.
  }

  const prefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  return prefersDark ? 'dark' : 'light';
}

function formatCurrency(value: number) {
  return `₦${value.toLocaleString()}`;
}

function formatTimestamp(value?: string) {
  if (!value) {
    return 'Not synced yet';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getTemplateById(templateId?: string | null) {
  return staticMiniApps.find((template) => template.id === templateId) ?? staticMiniApps[0];
}

function guessIconForCategory(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes('ride')) return 'local_taxi';
  if (normalized.includes('school')) return 'school';
  if (normalized.includes('market')) return 'storefront';
  if (normalized.includes('health')) return 'medical_services';
  if (normalized.includes('cooperative')) return 'groups';
  if (normalized.includes('logistics') || normalized.includes('delivery')) return 'local_shipping';
  return 'widgets';
}

function buildItemsFromRows(rows: unknown[] | undefined): string[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return ['Draft generated from the prompt.'];
  }

  return rows.slice(0, 4).map((row) => {
    if (typeof row !== 'object' || row === null) {
      return String(row);
    }

    const record = row as Record<string, unknown>;
    const title =
      record.title ?? record.name ?? record.label ?? record.item ?? record.driver ?? record.subject ?? 'Item';
    const detail =
      record.detail ?? record.vehicle ?? record.status ?? record.price ?? record.teacher ?? record.location ?? '';

    return detail ? `${String(title)} - ${String(detail)}` : String(title);
  });
}

function buildLocalDraft(prompt: string, templateId?: string | null): MiniApp {
  const template = getTemplateById(templateId);
  const words = prompt.trim().split(/\s+/).filter(Boolean);
  const inferredName =
    words.slice(0, 3).map((word) => (word ? word[0].toUpperCase() + word.slice(1) : '')).join(' ') ||
    template.name;

  return {
    id: `draft-${Date.now()}`,
    name: `${inferredName} Studio`,
    description: `Offline draft generated from: ${prompt}`,
    category: template.category,
    icon: template.icon || guessIconForCategory(template.category),
    bgColor: `${template.textColor}18`,
    textColor: template.textColor,
    isCustom: true,
    isActive: true,
    creator: 'You',
    sourcePrompt: prompt,
    templateId: template.id,
    syncState: 'draft',
    screens: [
      {
        title: `${inferredName} Workspace`,
        description: template.description,
        items: [
          'Offline draft preserved locally.',
          'Publish when connection returns.',
          'Mesh sync request can be queued now.',
        ],
        actions: [
          { label: 'Queue offline mesh sync', actionType: 'offline' },
          { label: 'Open preview', actionType: 'preview' },
        ],
      },
    ],
  };
}

function buildDraftFromSpec(spec: any, prompt: string, templateId?: string | null): MiniApp {
  const template = getTemplateById(templateId);
  const category =
    typeof spec?.category === 'string' && spec.category.trim() ? spec.category.trim() : template.category;
  const colorTheme =
    typeof spec?.colorTheme === 'string' && spec.colorTheme.trim() ? spec.colorTheme.trim() : template.textColor;
  const name = typeof spec?.name === 'string' && spec.name.trim() ? spec.name.trim() : `${template.name} Draft`;
  const pricingStructure =
    typeof spec?.pricingStructure === 'string' && spec.pricingStructure.trim()
      ? spec.pricingStructure.trim()
      : 'Generated pricing model';
  const adminNotes =
    typeof spec?.adminNotes === 'string' && spec.adminNotes.trim()
      ? spec.adminNotes.trim()
      : `Custom ${category} app generated from the prompt.`;

  return {
    id: `app-${Date.now()}`,
    name,
    description: adminNotes,
    category,
    icon: template.icon || guessIconForCategory(category),
    bgColor: `${colorTheme}18`,
    textColor: colorTheme,
    isCustom: true,
    isActive: true,
    creator: 'You',
    sourcePrompt: prompt,
    templateId: template.id,
    syncState: 'draft',
    screens: [
      {
        title: `${name} Hub`,
        description: pricingStructure,
        items: buildItemsFromRows(spec?.initialData),
        actions: [
          { label: 'Queue offline mesh sync', actionType: 'offline' },
          { label: 'Open preview', actionType: 'preview' },
        ],
      },
    ],
  };
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [publishedApps, setPublishedApps] = useState<MiniApp[]>(INITIAL_SNAPSHOT.miniApps);
  const [wallet, setWallet] = useState<PlatformWalletSnapshot>(INITIAL_SNAPSHOT.wallet);
  const [pendingOperations, setPendingOperations] = useState<OfflineOperation[]>(INITIAL_SNAPSHOT.pendingOperations);
  const [builderPrompt, setBuilderPrompt] = useState(TEMPLATE_PROMPTS[DEFAULT_TEMPLATE_ID]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [generatedDraft, setGeneratedDraft] = useState<MiniApp | null>(null);
  const [activeApp, setActiveApp] = useState<MiniApp | null>(null);
  const [syncState, setSyncState] = useState<'loading' | 'online' | 'offline' | 'syncing'>('loading');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>(
    INITIAL_SNAPSHOT.lastSyncedAt ?? INITIAL_SNAPSHOT.wallet.updatedAt,
  );
  const toastTimerRef = useRef<number | null>(null);

  const queueCount = pendingOperations.length;
  const shelfApps = [...publishedApps].sort((left, right) => {
    const leftTime = new Date(left.updatedAt ?? left.publishedAt ?? 0).getTime();
    const rightTime = new Date(right.updatedAt ?? right.publishedAt ?? 0).getTime();
    return rightTime - leftTime;
  });
  const selectedTemplate = getTemplateById(selectedTemplateId);
  const offlineMode = syncState === 'offline' || queueCount > 0;
  const statusLabel = syncState === 'syncing' ? 'Syncing' : syncState === 'loading' ? 'Loading' : offlineMode ? 'Offline' : 'Online';

  function triggerToast(message: string) {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }

  function mergeRemoteSnapshot(snapshot: PlatformBootstrapPayload) {
    const queued = readQueuedOperations().length;

    setPublishedApps((current) => mergeMiniApps(current, snapshot.deployedApps));
    setWallet((current) => {
      const mergedTransactions = mergeTransactions(current.transactions, snapshot.wallet.transactions);
      return {
        balance: queued > 0 ? current.balance : snapshot.wallet.balance,
        transactions: mergedTransactions,
        updatedAt: queued > 0 ? current.updatedAt : snapshot.wallet.updatedAt,
      };
    });
    setLastSyncedAt(snapshot.serverTime);
  }

  async function syncNow(quiet = false) {
    setIsSyncing(true);
    setSyncState('syncing');

    try {
      const flushResult = await flushQueuedOperations();
      if (flushResult.bootstrap) {
        mergeRemoteSnapshot(flushResult.bootstrap);
      }

      const remoteLoaded = await fetchPlatformBootstrap();
      if (remoteLoaded) {
        mergeRemoteSnapshot(remoteLoaded);
      }

      const queued = readQueuedOperations();
      setPendingOperations(queued);
      setSyncState(navigator.onLine && queued.length === 0 ? 'online' : 'offline');

      if (!quiet) {
        if (flushResult.applied > 0) {
          triggerToast(`Synced ${flushResult.applied} pending change${flushResult.applied === 1 ? '' : 's'}.`);
        } else if (remoteLoaded) {
          triggerToast('Platform state refreshed.');
        } else {
          triggerToast('Offline. Changes will sync when the connection returns.');
        }
      }

      return flushResult.applied;
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleGenerateDraft() {
    if (!builderPrompt.trim()) {
      triggerToast('Describe the app you want to build first.');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-miniapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: builderPrompt }),
      });

      const data = await response.json().catch(() => ({}));
      const draft =
        response.ok && data?.appSpec ? buildDraftFromSpec(data.appSpec, builderPrompt, selectedTemplateId) : buildLocalDraft(builderPrompt, selectedTemplateId);

      setGeneratedDraft(draft);
      triggerToast(response.ok && !data?.fallback ? 'AI draft generated.' : 'Generated a local fallback draft.');
    } catch {
      const draft = buildLocalDraft(builderPrompt, selectedTemplateId);
      setGeneratedDraft(draft);
      triggerToast('Offline draft generated. Publish when you are back online.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handlePublishDraft() {
    if (!generatedDraft) {
      triggerToast('Generate a draft before publishing.');
      return;
    }

    setIsPublishing(true);

    try {
      const result = await publishMiniAppRecord(generatedDraft, {
        prompt: builderPrompt,
        templateId: selectedTemplateId,
        creator: 'You',
      });

      const publishedRecord: MiniApp = {
        ...result.record,
        isCustom: true,
        isActive: true,
        syncState: result.status === 'synced' ? 'synced' : 'queued',
        publishedAt: result.record.publishedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: result.record.version ?? 1,
      };

      setPublishedApps((current) => mergeMiniApps(current, [publishedRecord]));
      setGeneratedDraft(publishedRecord);
      setPendingOperations(readQueuedOperations());

      if (result.status === 'synced') {
        setLastSyncedAt(new Date().toISOString());
      }

      triggerToast(
        result.status === 'synced'
          ? `${publishedRecord.name} published to the shelf.`
          : `${publishedRecord.name} queued for sync.`,
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function applyWalletTransaction(transaction: PlatformTransaction, sourceAppId?: string) {
    const appliedAt = new Date().toISOString();

    setWallet((current) => ({
      balance: Math.max(0, current.balance + transaction.amount),
      transactions: [{ ...transaction, sourceAppId }, ...current.transactions],
      updatedAt: appliedAt,
    }));

    const result = await recordWalletTransaction({ ...transaction, sourceAppId }, { sourceAppId });
    setPendingOperations(readQueuedOperations());

    if (result.status === 'synced') {
      setLastSyncedAt(new Date().toISOString());
    }

    return result;
  }

  async function handleTopUp(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const transaction: PlatformTransaction = {
      id: `dep-${Date.now()}`,
      title: 'Wallet top up',
      category: 'deposit',
      amount,
      currency: '₦',
      date: 'Today',
      time: nowLabel(),
      status: 'Received',
    };

    const result = await applyWalletTransaction(transaction);
    triggerToast(result.status === 'synced' ? `Deposited ${formatCurrency(amount)}.` : 'Wallet change queued for sync.');
  }

  async function handleAppAction(actionType: string, app: MiniApp) {
    if (actionType === 'offline') {
      const operations = queueMeshSyncRequest(app, 'mesh sync requested from launcher');
      setPendingOperations(operations);
      triggerToast('Offline mesh sync queued.');
      return;
    }

    if (actionType === 'pay') {
      const deduction = 1500;
      if (wallet.balance < deduction) {
        triggerToast('Insufficient balance for this action.');
        return;
      }

      const transaction: PlatformTransaction = {
        id: `tx-${Date.now()}`,
        title: `Payment: ${app.name}`,
        category: 'shopping',
        amount: -deduction,
        currency: '₦',
        date: 'Today',
        time: nowLabel(),
        status: 'Completed',
        sourceAppId: app.id,
      };

      const result = await applyWalletTransaction(transaction, app.id);
      triggerToast(
        result.status === 'synced'
          ? `${formatCurrency(deduction)} payment recorded for ${app.name}.`
          : `${app.name} payment queued for sync.`,
      );
      return;
    }

    if (actionType === 'preview') {
      setActiveApp(app);
      return;
    }

    triggerToast(`${app.name} action: ${actionType}`);
  }

  function handleTemplateSelect(templateId: string) {
    setSelectedTemplateId(templateId);
    setBuilderPrompt(TEMPLATE_PROMPTS[templateId] || `Build a ${getTemplateById(templateId).category.toLowerCase()} app.`);
    triggerToast(`Loaded ${getTemplateById(templateId).name} template.`);
  }

  useEffect(() => {
    const root = window.document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.style.colorScheme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures.
    }
  }, [theme]);

  useEffect(() => {
    try {
      saveCachedPlatformSnapshot({
        miniApps: publishedApps,
        wallet,
        lastSyncedAt,
      });
    } catch {
      // Ignore storage failures.
    }
  }, [publishedApps, wallet, lastSyncedAt]);

  useEffect(() => {
    let active = true;

    const onOnline = () => {
      setSyncState('online');
      void syncNow(true);
    };

    const onOffline = () => {
      setSyncState('offline');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    void syncNow(true).finally(() => {
      if (!active) {
        return;
      }

      const queued = readQueuedOperations();
      setPendingOperations(queued);
      setSyncState(navigator.onLine && queued.length === 0 ? 'online' : 'offline');
    });

    return () => {
      active = false;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const recentTransactions = wallet.transactions.slice(0, 5);
  const draftItems = generatedDraft?.screens?.[0]?.items ?? [];
  const draftActions = generatedDraft?.screens?.[0]?.actions ?? [];

  return (
    <div className='app-shell min-h-screen bg-background text-on-surface'>
      {toastMessage ? (
        <div className='fixed left-1/2 top-4 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-surface bg-surface-strong px-4 py-3 shadow-2xl'>
          <span className='material-symbols-outlined text-[18px] text-brand-strong'>info</span>
          <span className='max-w-[72vw] text-sm font-medium text-on-surface'>{toastMessage}</span>
        </div>
      ) : null}

      <header className='sticky top-0 z-40 border-b border-surface bg-surface-strong/95 backdrop-blur-xl'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-strong text-white shadow-md'>
              <span className='material-symbols-outlined text-[24px]'>widgets</span>
            </div>
            <div>
              <p className='text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant'>AfriChat Platform</p>
              <h1 className='text-xl font-semibold leading-tight'>Mini Apps</h1>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <div className='hidden items-center gap-2 rounded-full border border-surface bg-surface px-3 py-2 md:flex'>
              <span className={`h-2.5 w-2.5 rounded-full ${offlineMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className='text-xs font-semibold uppercase tracking-wide text-on-surface-variant'>{statusLabel}</span>
            </div>
            <button
              type='button'
              onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-pressed={theme === 'dark'}
              className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-surface bg-surface text-brand-strong shadow-sm transition-transform hover:scale-105 active:scale-95'
            >
              <span className='material-symbols-outlined text-[20px]'>{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
            </button>
            <button
              type='button'
              onClick={() => void syncNow(false)}
              disabled={isSyncing}
              className='inline-flex items-center gap-2 rounded-full border border-surface bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60'
            >
              <span className='material-symbols-outlined text-[18px]'>sync</span>
              {isSyncing ? 'Syncing' : 'Sync now'}
            </button>
          </div>
        </div>
      </header>

      {offlineMode ? (
        <div className='border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200'>
          <div className='mx-auto flex max-w-6xl items-center gap-2'>
            <span className='material-symbols-outlined text-[18px]'>cloud_off</span>
            <span>Offline changes are queued locally and will sync automatically when the connection returns.</span>
          </div>
        </div>
      ) : null}

      <main className='mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 pb-28'>
        <section className='grid gap-4 rounded-[28px] border border-surface bg-surface-strong p-6 shadow-sm lg:grid-cols-[1.15fr_0.85fr]'>
          <div className='space-y-4'>
            <p className='text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong'>Prompt to build</p>
            <h2 className='max-w-2xl text-4xl font-semibold leading-tight'>Build, publish, and sync mini apps across offline networks.</h2>
            <p className='max-w-2xl text-sm leading-6 text-on-surface-variant'>
              Generate a draft from a prompt, choose a preset template, publish it to the shelf, and keep everything recoverable when the connection drops.
            </p>
          </div>

          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-1'>
            <div className='rounded-[24px] border border-surface bg-background p-4'>
              <p className='text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant'>Published</p>
              <p className='mt-1 text-3xl font-semibold'>{publishedApps.length}</p>
            </div>
            <div className='rounded-[24px] border border-surface bg-background p-4'>
              <p className='text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant'>Queued</p>
              <p className='mt-1 text-3xl font-semibold'>{queueCount}</p>
            </div>
            <div className='rounded-[24px] border border-surface bg-background p-4'>
              <p className='text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant'>Balance</p>
              <p className='mt-1 text-3xl font-semibold'>{formatCurrency(wallet.balance)}</p>
            </div>
            <div className='rounded-[24px] border border-surface bg-background p-4'>
              <p className='text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant'>Last sync</p>
              <p className='mt-1 text-sm font-semibold'>{formatTimestamp(lastSyncedAt)}</p>
            </div>
          </div>
        </section>

        <section className='grid gap-6 lg:grid-cols-[1.25fr_0.75fr]'>
          <div className='space-y-6'>
            <section className='rounded-[28px] border border-surface bg-surface-strong p-5 shadow-sm'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <p className='text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong'>Builder</p>
                  <h3 className='mt-1 text-2xl font-semibold'>Prompt to build</h3>
                </div>
                <button
                  type='button'
                  onClick={() => void handleGenerateDraft()}
                  disabled={isGenerating}
                  className='inline-flex items-center gap-2 rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60'
                >
                  <span className='material-symbols-outlined text-[18px]'>auto_awesome</span>
                  {isGenerating ? 'Generating' : 'Generate draft'}
                </button>
              </div>

              <textarea
                value={builderPrompt}
                onChange={(event) => setBuilderPrompt(event.target.value)}
                rows={5}
                className='app-input mt-5 w-full rounded-[24px] px-4 py-4 text-sm outline-none transition-colors placeholder:text-on-surface-variant'
                placeholder='Describe the app you want to build...'
              />

              <div className='mt-5 flex flex-wrap gap-2'>
                {staticMiniApps.map((template) => (
                  <button
                    key={template.id}
                    type='button'
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                      selectedTemplateId === template.id
                        ? 'border-brand-strong bg-brand-soft text-brand-strong'
                        : 'border-surface bg-background text-on-surface-variant hover:border-brand-strong/30'
                    }`}
                  >
                    <span className='material-symbols-outlined text-[16px]'>{template.icon}</span>
                    {template.name}
                  </button>
                ))}
              </div>

              <div className='mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                {Object.entries(TEMPLATE_PROMPTS).map(([templateId, prompt]) => {
                  const template = getTemplateById(templateId);
                  return (
                    <button
                      key={templateId}
                      type='button'
                      onClick={() => handleTemplateSelect(templateId)}
                      className='group rounded-[24px] border border-surface bg-background p-4 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.99]'
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-xl' style={{ backgroundColor: `${template.textColor}18`, color: template.textColor }}>
                          <span className='material-symbols-outlined text-[20px]'>{template.icon}</span>
                        </div>
                        <span className='text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant'>Template</span>
                      </div>
                      <h4 className='mt-3 text-sm font-semibold text-on-surface'>{template.name}</h4>
                      <p className='mt-1 text-xs leading-5 text-on-surface-variant'>{prompt}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {generatedDraft ? (
              <section className='rounded-[28px] border border-surface bg-surface-strong p-5 shadow-sm'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong'>Draft</p>
                    <h3 className='mt-1 text-2xl font-semibold'>{generatedDraft.name}</h3>
                    <p className='mt-1 text-sm text-on-surface-variant'>{generatedDraft.description}</p>
                  </div>
                  <div className='rounded-full border border-surface px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant'>
                    {generatedDraft.syncState}
                  </div>
                </div>

                <div className='mt-5 grid gap-3 sm:grid-cols-2'>
                  <div className='rounded-[24px] border border-surface bg-background p-4'>
                    <p className='text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant'>Category</p>
                    <p className='mt-1 text-sm font-semibold'>{generatedDraft.category}</p>
                  </div>
                  <div className='rounded-[24px] border border-surface bg-background p-4'>
                    <p className='text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant'>Template</p>
                    <p className='mt-1 text-sm font-semibold'>{selectedTemplate.name}</p>
                  </div>
                </div>

                <div className='mt-5 space-y-3'>
                  {draftItems.map((item, index) => (
                    <div key={`${generatedDraft.id}-${index}`} className='flex items-center justify-between rounded-[22px] border border-surface bg-background px-4 py-3 text-sm'>
                      <span className='pr-4 text-on-surface'>{item}</span>
                      <span className='text-[10px] font-black uppercase tracking-[0.24em] text-brand-strong'>Ready</span>
                    </div>
                  ))}
                </div>

                <div className='mt-5 flex flex-wrap gap-3'>
                  {draftActions.map((action) => (
                    <button
                      key={`${generatedDraft.id}-${action.actionType}-${action.label}`}
                      type='button'
                      onClick={() => void handleAppAction(action.actionType, generatedDraft)}
                      className='inline-flex items-center gap-2 rounded-2xl border border-surface bg-background px-4 py-3 text-sm font-semibold text-on-surface-variant transition-transform hover:scale-[1.01] active:scale-95'
                    >
                      <span className='material-symbols-outlined text-[18px]'>bolt</span>
                      {action.label}
                    </button>
                  ))}
                  <button
                    type='button'
                    onClick={() => void handlePublishDraft()}
                    disabled={isPublishing}
                    className='inline-flex items-center gap-2 rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60'
                  >
                    <span className='material-symbols-outlined text-[18px]'>publish</span>
                    {isPublishing ? 'Publishing' : 'Publish to shelf'}
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setGeneratedDraft(null);
                      triggerToast('Draft cleared.');
                    }}
                    className='inline-flex items-center gap-2 rounded-2xl border border-surface bg-background px-4 py-3 text-sm font-semibold text-on-surface-variant transition-transform hover:scale-[1.01] active:scale-95'
                  >
                    <span className='material-symbols-outlined text-[18px]'>close</span>
                    Discard
                  </button>
                </div>
              </section>
            ) : null}

            <section className='rounded-[28px] border border-surface bg-surface-strong p-5 shadow-sm'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <p className='text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong'>Shelf</p>
                  <h3 className='mt-1 text-2xl font-semibold'>Deployed apps</h3>
                </div>
                <span className='rounded-full border border-surface px-2 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant'>
                  {shelfApps.length} live
                </span>
              </div>

              <div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {shelfApps.map((app) => (
                  <button
                    key={app.id}
                    type='button'
                    onClick={() => setActiveApp(app)}
                    className='group rounded-[26px] border border-surface bg-background p-4 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.99]'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex h-11 w-11 items-center justify-center rounded-2xl' style={{ backgroundColor: app.bgColor, color: app.textColor }}>
                        <span className='material-symbols-outlined text-[22px]'>{app.icon}</span>
                      </div>
                      <div className='rounded-full border border-surface px-2 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant'>
                        {app.syncState || 'synced'}
                      </div>
                    </div>
                    <h4 className='mt-4 text-sm font-semibold text-on-surface'>{app.name}</h4>
                    <p className='mt-1 line-clamp-2 text-xs leading-5 text-on-surface-variant'>{app.description}</p>
                    <div className='mt-4 flex items-center justify-between border-t border-surface pt-3'>
                      <span className='text-[10px] font-black uppercase tracking-[0.24em] text-brand-strong'>{app.category}</span>
                      <span className='material-symbols-outlined text-[18px] text-on-surface-variant transition-transform group-hover:translate-x-1'>chevron_right</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className='space-y-6'>
            <section className='rounded-[28px] border border-surface bg-surface-strong p-5 shadow-sm'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <p className='text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong'>Wallet</p>
                  <h3 className='mt-1 text-2xl font-semibold'>{formatCurrency(wallet.balance)}</h3>
                </div>
                <span className='rounded-full border border-surface px-2 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant'>
                  {wallet.transactions.length} entries
                </span>
              </div>

              <div className='mt-5 grid grid-cols-2 gap-3'>
                {[5000, 25000].map((amount) => (
                  <button
                    key={amount}
                    type='button'
                    onClick={() => void handleTopUp(amount)}
                    className='rounded-[22px] border border-surface bg-background px-4 py-4 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.99]'
                  >
                    <p className='text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant'>Top up</p>
                    <p className='mt-1 text-lg font-semibold'>{formatCurrency(amount)}</p>
                  </button>
                ))}
              </div>

              <div className='mt-5 space-y-3'>
                {recentTransactions.map((transaction) => {
                  const positive = transaction.amount > 0;
                  return (
                    <div key={transaction.id} className='flex items-center justify-between rounded-[22px] border border-surface bg-background px-4 py-3'>
                      <div>
                        <p className='text-sm font-semibold text-on-surface'>{transaction.title}</p>
                        <p className='text-[11px] text-on-surface-variant'>
                          {transaction.date} · {transaction.time}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className={`text-sm font-bold ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {positive ? '+' : '-'}{transaction.currency}{Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <p className='text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant'>{transaction.status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className='rounded-[28px] border border-surface bg-surface-strong p-5 shadow-sm'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <p className='text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong'>Offline mesh</p>
                  <h3 className='mt-1 text-2xl font-semibold'>Sync queue</h3>
                </div>
                <span className='rounded-full border border-surface px-2 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant'>
                  {queueCount} pending
                </span>
              </div>

              <div className='mt-5 space-y-3'>
                {pendingOperations.length === 0 ? (
                  <div className='rounded-[22px] border border-surface bg-background px-4 py-5 text-sm text-on-surface-variant'>
                    Nothing is waiting for sync.
                  </div>
                ) : (
                  pendingOperations.map((operation) => (
                    <div key={operation.id} className='rounded-[22px] border border-surface bg-background px-4 py-3'>
                      <div className='flex items-center justify-between gap-3'>
                        <p className='text-sm font-semibold text-on-surface'>{operation.kind}</p>
                        <span className='text-[10px] font-black uppercase tracking-[0.24em] text-brand-strong'>Queued</span>
                      </div>
                      <p className='mt-1 text-[11px] text-on-surface-variant'>{formatTimestamp(operation.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>

              <button
                type='button'
                onClick={() => void syncNow(false)}
                disabled={isSyncing}
                className='mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60'
              >
                <span className='material-symbols-outlined text-[18px]'>sync</span>
                Sync pending changes
              </button>
            </section>
          </aside>
        </section>
      </main>

      {activeApp ? (
        <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-4 backdrop-blur-sm md:items-center'>
          <div className='w-full max-w-2xl rounded-[28px] border border-surface bg-surface-strong p-5 shadow-2xl'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong'>App preview</p>
                <h3 className='mt-1 text-2xl font-semibold'>{activeApp.name}</h3>
                <p className='mt-1 text-sm text-on-surface-variant'>{activeApp.description}</p>
              </div>
              <button
                type='button'
                onClick={() => setActiveApp(null)}
                className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface bg-background text-on-surface-variant transition-transform hover:scale-105 active:scale-95'
              >
                <span className='material-symbols-outlined text-[20px]'>close</span>
              </button>
            </div>

            <div className='mt-5 grid gap-3 sm:grid-cols-3'>
              <div className='rounded-[24px] border border-surface bg-background p-4'>
                <p className='text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant'>Category</p>
                <p className='mt-1 text-sm font-semibold'>{activeApp.category}</p>
              </div>
              <div className='rounded-[24px] border border-surface bg-background p-4'>
                <p className='text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant'>Version</p>
                <p className='mt-1 text-sm font-semibold'>{activeApp.version ?? 1}</p>
              </div>
              <div className='rounded-[24px] border border-surface bg-background p-4'>
                <p className='text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant'>Sync</p>
                <p className='mt-1 text-sm font-semibold'>{activeApp.syncState || 'synced'}</p>
              </div>
            </div>

            <div className='mt-5 space-y-3'>
              {activeApp.screens?.[0]?.items?.map((item, index) => (
                <div key={`${activeApp.id}-${index}`} className='flex items-center justify-between rounded-[22px] border border-surface bg-background px-4 py-3'>
                  <p className='pr-4 text-sm text-on-surface'>{item}</p>
                  <span className='text-[10px] font-black uppercase tracking-[0.24em] text-brand-strong'>Ready</span>
                </div>
              ))}
            </div>

            <div className='mt-5 flex flex-wrap gap-3'>
              {activeApp.screens?.[0]?.actions?.map((action) => (
                <button
                  key={`${activeApp.id}-${action.actionType}-${action.label}`}
                  type='button'
                  onClick={() => void handleAppAction(action.actionType, activeApp)}
                  className='inline-flex items-center gap-2 rounded-2xl border border-surface bg-background px-4 py-3 text-sm font-semibold text-on-surface-variant transition-transform hover:scale-[1.01] active:scale-95'
                >
                  <span className='material-symbols-outlined text-[18px]'>bolt</span>
                  {action.label}
                </button>
              ))}
              <button
                type='button'
                onClick={() => void handleAppAction('offline', activeApp)}
                className='inline-flex items-center gap-2 rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95'
              >
                <span className='material-symbols-outlined text-[18px]'>sync</span>
                Queue mesh sync
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

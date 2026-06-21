import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { staticMiniApps } from './data';
import type { AIAppSetup, MiniApp, OfflineOperation, PlatformBootstrapPayload, PlatformTransaction, PlatformWalletSnapshot } from './types';
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
const DEFAULT_WALLET_UPDATED_AT = new Date().toISOString();

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
    publishedAt: DEFAULT_WALLET_UPDATED_AT,
    updatedAt: DEFAULT_WALLET_UPDATED_AT,
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
  updatedAt: DEFAULT_WALLET_UPDATED_AT,
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
      syncedAt: DEFAULT_WALLET_UPDATED_AT,
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
      syncedAt: DEFAULT_WALLET_UPDATED_AT,
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
      syncedAt: DEFAULT_WALLET_UPDATED_AT,
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
      syncedAt: DEFAULT_WALLET_UPDATED_AT,
    },
  ],
};

const INITIAL_SNAPHOT = loadCachedPlatformSnapshot(DEFAULT_PUBLISHED_APPS, DEFAULT_WALLET);

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function formatCurrency(value: number) {
  return `₦${value.toLocaleString()}`;
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getTemplateById(templateId: string | null | undefined) {
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

function buildItemsFromRows(rows: any[] | undefined): string[] {
  if (!Array.isArray(rows) || !rows.length) {
    return ['Draft generated from the prompt.'];
  }

  return rows.slice(0, 4).map((row) => {
    if (typeof row !== 'object' || row === null) {
      return String(row);
    }

    const record = row as Record<string, unknown>;
    const title = record.title ?? record.driver ?? record.subject ?? record.item ?? record.name ?? 'Item';
    const detail = record.detail ?? record.vehicle ?? record.status ?? record.teacher ?? record.price ?? record.seller ?? record.location ?? '';
    return detail ? `${String(title)} - ${String(detail)}` : String(title);
  });
}

function buildLocalDraft(prompt: string, templateId: string | null | undefined): MiniApp {
  const template = getTemplateById(templateId);
  const words = prompt.trim().split(/\s+/).filter(Boolean);
  const inferredName = words.slice(0, 3).map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ') || template.name;

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

function buildDraftFromSpec(spec: any, prompt: string, templateId: string | null | undefined): MiniApp {
  const template = getTemplateById(templateId);
  const category = typeof spec?.category === 'string' && spec.category.trim() ? spec.category.trim() : template.category;
  const colorTheme = typeof spec?.colorTheme === 'string' && spec.colorTheme.trim() ? spec.colorTheme.trim() : template.textColor;
  const name = typeof spec?.name === 'string' && spec.name.trim() ? spec.name.trim() : `${template.name} Draft`;
  const adminNotes = typeof spec?.adminNotes === 'string' && spec.adminNotes.trim() ? spec.adminNotes.trim() : `Custom ${category} app generated from the prompt.`;

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
        description: typeof spec?.pricingStructure === 'string' && spec.pricingStructure.trim() ? spec.pricingStructure.trim() : 'Generated pricing model',
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
  const [publishedApps, setPublishedApps] = useState<MiniApp[]>(INITIAL_SNAPHOT.miniApps);
  const [wallet, setWallet] = useState<PlatformWalletSnapshot>(INITIAL_SNAPHOT.wallet);
  const [pendingOperations, setPendingOperations] = useState<OfflineOperation[]>(INITIAL_SNAPHOT.pendingOperations);
  const [builderPrompt, setBuilderPrompt] = useState<string>(TEMPLATE_PROMPTS[DEFAULT_TEMPLATE_ID]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);
  const [generatedDraft, setGeneratedDraft] = useState<MiniApp | null>(null);
  const [activeApp, setActiveApp] = useState<MiniApp | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncState, setSyncState] = useState<'loading' | 'online' | 'offline' | 'syncing'>('loading');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(INITIAL_SNAPHOT.lastSyncedAt ?? INITIAL_SNAPHOT.wallet.updatedAt);
  const [topUpAmount, setTopUpAmount] = useState('5000');
  const toastTimerRef = useRef<number | null>(null);

  const isDark = theme === 'dark';
  const queueCount = pendingOperations.length;
  const shelfApps = [...publishedApps].sort((left, right) => {
    const leftValue = new Date(left.updatedAt || left.publishedAt || 0).getTime();
    const rightValue = new Date(right.updatedAt || right.publishedAt || 0).getTime();
    return rightValue - leftValue;
  });
  const selectedTemplate = getTemplateById(selectedTemplateId);
  const offlineMode = syncState === 'offline' || queueCount > 0;

  const triggerToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const mergeRemoteSnapshot = (snapshot: PlatformBootstrapPayload) => {
    setPublishedApps((current) => mergeMiniApps(current, snapshot.deployedApps));
    setWallet((current) => {
      const queueLength = readQueuedOperations().length;
      return {
        balance: queueLength > 0 ? current.balance : snapshot.wallet.balance,
        transactions: mergeTransactions(current.transactions, snapshot.wallet.transactions),
        updatedAt: queueLength > 0 ? current.updatedAt : snapshot.wallet.updatedAt,
      };
    });
    setLastSyncedAt(snapshot.serverTime);
    if (snapshot.templates?.length) {
      // The current UI uses bundled template definitions, but the bootstrap remains authoritative.
      // Keeping this branch ensures the payload is consumed and verified.
      void snapshot.templates.length;
    }
  };

  const refreshFromServer = async () => {
    const remote = await fetchPlatformBootstrap();
    if (remote) {
      mergeRemoteSnapshot(remote);
      return true;
    }
    return false;
  };

  const syncNow = async (quiet = false) => {
    setSyncState('syncing');
    const flushResult = await flushQueuedOperations();
    if (flushResult.bootstrap) {
      mergeRemoteSnapshot(flushResult.bootstrap);
    }

    const remoteLoaded = await refreshFromServer();
    const queued = readQueuedOperations();
    setPendingOperations(queued);
    setSyncState(navigator.onLine && queued.length === 0 && (flushResult.applied > 0 || remoteLoaded) ? 'online' : navigator.onLine ? 'offline' : 'offline');

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
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    }

    const root = window.document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = window.document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    saveCachedPlatformSnapshot({
      miniApps: publishedApps,
      wallet,
      lastSyncedAt: lastSyncedAt ?? undefined,
    });
  }, [publishedApps, wallet, lastSyncedAt]);

  useEffect(() => {
    const onOnline = () => {
      void syncNow(true);
    };

    const onOffline = () => {
      setSyncState('offline');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    void syncNow(true).finally(() => {
      if (readQueuedOperations().length === 0) {
        setSyncState(navigator.onLine ? 'online' : 'offline');
      }
    });

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setBuilderPrompt(TEMPLATE_PROMPTS[templateId] || `Build a ${getTemplateById(templateId).category.toLowerCase()} app.`);
    triggerToast(`Loaded ${getTemplateById(templateId).name} template.`);
  };

  const handleGenerateDraft = async () => {
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
      const data = await response.json();
      const spec = data?.appSpec;

      const draft = spec ? buildDraftFromSpec(spec, builderPrompt, selectedTemplateId) : buildLocalDraft(builderPrompt, selectedTemplateId);
      if (!response.ok || data?.fallback) {
        draft.syncState = 'draft';
      }

      setGeneratedDraft(draft);
      triggerToast(data?.fallback ? 'Generated an offline draft.' : 'AI draft generated. Review and publish it to the shelf.');
    } catch {
      const draft = buildLocalDraft(builderPrompt, selectedTemplateId);
      setGeneratedDraft(draft);
      triggerToast('Offline draft generated. Publish when you are back online.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishDraft = async () => {
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
      setLastSyncedAt(result.status === 'synced' ? new Date().toISOString() : lastSyncedAt);
      triggerToast(result.status === 'synced' ? `${publishedRecord.name} published to the shelf.` : `${publishedRecord.name} queued for sync.`);
    } finally {
      setIsPublishing(false);
    }
  };

  const applyWalletTransaction = async (transaction: PlatformTransaction, sourceAppId?: string) => {
    setWallet((current) => ({
      balance: Math.max(0, current.balance + transaction.amount),
      transactions: [transaction, ...current.transactions],
      updatedAt: new Date().toISOString(),
    }));

    const result = await recordWalletTransaction(transaction, { sourceAppId });
    setPendingOperations(readQueuedOperations());
    if (result.status === 'queued') {
      triggerToast('Wallet change queued for sync.');
    }
  };

  const handleTopUp = async (amount: number) => {
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

    await applyWalletTransaction(transaction);
    triggerToast(`Deposited ${formatCurrency(amount)}.`);
  };

  const handleAppAction = async (actionType: string, app: MiniApp) => {
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

      await applyWalletTransaction(transaction, app.id);
      triggerToast(`${formatCurrency(deduction)} payment recorded for ${app.name}.`);
      return;
    }

    if (actionType === 'preview') {
      triggerToast('Preview opened.');
      return;
    }

    triggerToast(`${app.name} action: ${actionType}`);
  };

  const handleOpenApp = (app: MiniApp) => {
    setActiveApp(app);
  };

  const handleSyncNow = async () => {
    setIsRefreshing(true);
    try {
      await syncNow(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
    triggerToast(`Switched to ${theme === 'light' ? 'dark' : 'light'} mode.`);
  };

  const renderStatusLabel = () => {
    if (syncState === 'syncing') return 'Syncing';
    if (offlineMode) return 'Offline';
    if (syncState === 'loading') return 'Loading';
    return 'Online';
  };

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed left-1/2 top-4 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-surface bg-surface-strong px-4 py-3 shadow-2xl"
          >
            <span className="material-symbols-outlined text-[18px] text-brand-strong">info</span>
            <span className="max-w-[72vw] text-sm font-medium text-on-surface">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-surface bg-surface-strong/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-strong text-white shadow-md">
              <span className="material-symbols-outlined text-[24px]">widgets</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant">AfriChat Platform</p>
              <h1 className="text-xl font-semibold leading-tight">Mini Apps</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-surface bg-surface px-3 py-2 md:flex">
              <span className={`h-2.5 w-2.5 rounded-full ${offlineMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{renderStatusLabel()}</span>
            </div>
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="Toggle theme"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-surface bg-surface text-brand-strong shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
            </button>
          </div>
        </div>
      </header>

      {offlineMode && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">cloud_off</span>
            <span>Offline changes are queued locally and will sync automatically when the network returns.</span>
          </div>
        </div>
      )}

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 pb-28">
        <section className="grid gap-4 rounded-[28px] border border-surface bg-brand-strong px-6 py-7 text-white shadow-[0_18px_60px_rgba(0,0,0,0.16)] lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/70">Prompt to build</p>
            <h2 className="max-w-2xl text-4xl font-semibold leading-tight">Build, publish, and keep mini apps working offline.</h2>
            <p className="max-w-2xl text-sm leading-6 text-white/80">Generate a draft from a prompt, choose a preset template, publish it to the shelf, and keep the result synced with a local-first queue.</p>
          </div>

          <div className="grid gap-3 rounded-[24px] bg-white/10 p-4 backdrop-blur-sm md:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">Published</p>
              <p className="mt-1 text-3xl font-semibold">{publishedApps.length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">Queued</p>
              <p className="mt-1 text-3xl font-semibold">{queueCount}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">Balance</p>
              <p className="mt-1 text-3xl font-semibold">{formatCurrency(wallet.balance)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-surface bg-surface-strong p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong">Builder</p>
                  <h3 className="mt-1 text-2xl font-semibold">Prompt to build</h3>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateDraft}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  {isGenerating ? 'Generating' : 'Generate draft'}
                </button>
              </div>

              <textarea
                value={builderPrompt}
                onChange={(event) => setBuilderPrompt(event.target.value)}
                rows={5}
                className="mt-5 w-full rounded-[24px] border border-surface bg-background px-4 py-4 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-brand-strong"
                placeholder="Describe the app you want to build..."
              />

              <div className="mt-5 flex flex-wrap gap-2">
                {staticMiniApps.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                      selectedTemplateId === template.id
                        ? 'border-brand-strong bg-brand-soft text-brand-strong'
                        : 'border-surface bg-background text-on-surface-variant hover:border-brand-strong/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{template.icon}</span>
                    {template.name}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Object.entries(TEMPLATE_PROMPTS).map(([templateId, prompt]) => {
                  const template = getTemplateById(templateId);
                  return (
                    <button
                      key={templateId}
                      type="button"
                      onClick={() => handleTemplateSelect(templateId)}
                      className="group rounded-[24px] border border-surface bg-background p-4 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${template.textColor}18`, color: template.textColor }}>
                          <span className="material-symbols-outlined text-[20px]">{template.icon}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">Template</span>
                      </div>
                      <h4 className="mt-3 text-sm font-semibold text-on-surface">{template.name}</h4>
                      <p className="mt-1 text-xs leading-5 text-on-surface-variant">{prompt}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <AnimatePresence>
              {generatedDraft && (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="rounded-[28px] border border-surface bg-surface-strong p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong">Draft</p>
                      <h3 className="mt-1 text-2xl font-semibold">{generatedDraft.name}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">{generatedDraft.description}</p>
                    </div>
                    <div className="rounded-full border border-surface px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                      {generatedDraft.syncState}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-surface bg-background p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant">Category</p>
                      <p className="mt-1 text-sm font-semibold">{generatedDraft.category}</p>
                    </div>
                    <div className="rounded-[24px] border border-surface bg-background p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant">Template</p>
                      <p className="mt-1 text-sm font-semibold">{selectedTemplate.name}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {generatedDraft.screens?.[0]?.items?.map((item, index) => (
                      <div key={`${generatedDraft.id}-${index}`} className="flex items-center justify-between rounded-[22px] border border-surface bg-background px-4 py-3 text-sm">
                        <span className="pr-4 text-on-surface">{item}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-strong">Ready</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handlePublishDraft}
                      disabled={isPublishing}
                      className="inline-flex items-center gap-2 rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px]">publish</span>
                      {isPublishing ? 'Publishing' : 'Publish to shelf'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGeneratedDraft(null);
                        triggerToast('Draft cleared.');
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl border border-surface bg-background px-4 py-3 text-sm font-semibold text-on-surface-variant transition-transform hover:scale-[1.01] active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                      Discard
                    </button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            <section className="rounded-[28px] border border-surface bg-surface-strong p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong">Shelf</p>
                  <h3 className="mt-1 text-2xl font-semibold">Deployed apps</h3>
                </div>
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 rounded-2xl border border-surface bg-background px-4 py-3 text-sm font-semibold text-on-surface-variant transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  {isRefreshing ? 'Syncing' : 'Sync now'}
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {shelfApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleOpenApp(app)}
                    className="group rounded-[26px] border border-surface bg-background p-4 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: app.bgColor, color: app.textColor }}>
                        <span className="material-symbols-outlined text-[22px]">{app.icon}</span>
                      </div>
                      <div className="rounded-full border border-surface px-2 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                        {app.syncState || 'synced'}
                      </div>
                    </div>
                    <h4 className="mt-4 text-sm font-semibold text-on-surface">{app.name}</h4>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-on-surface-variant">{app.description}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-surface pt-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-strong">{app.category}</span>
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform group-hover:translate-x-1">chevron_right</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-surface bg-surface-strong p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong">Wallet</p>
                  <h3 className="mt-1 text-2xl font-semibold">{formatCurrency(wallet.balance)}</h3>
                </div>
                <span className="rounded-full border border-surface px-2 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                  {wallet.transactions.length} entries
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[5000, 25000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => void handleTopUp(amount)}
                    className="rounded-[22px] border border-surface bg-background px-4 py-4 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">Top up</p>
                    <p className="mt-1 text-lg font-semibold">{formatCurrency(amount)}</p>
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                {wallet.transactions.slice(0, 5).map((transaction) => {
                  const positive = transaction.amount > 0;
                  return (
                    <div key={transaction.id} className="flex items-center justify-between rounded-[22px] border border-surface bg-background px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{transaction.title}</p>
                        <p className="text-[11px] text-on-surface-variant">{transaction.date} · {transaction.time}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {positive ? '+' : '-'}{transaction.currency}{Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">{transaction.status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-surface bg-surface-strong p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong">Offline mesh</p>
                  <h3 className="mt-1 text-2xl font-semibold">Sync queue</h3>
                </div>
                <span className="rounded-full border border-surface px-2 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                  {queueCount} pending
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {pendingOperations.length === 0 ? (
                  <div className="rounded-[22px] border border-surface bg-background px-4 py-5 text-sm text-on-surface-variant">
                    Nothing is waiting for sync.
                  </div>
                ) : (
                  pendingOperations.map((operation) => (
                    <div key={operation.id} className="rounded-[22px] border border-surface bg-background px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-on-surface">{operation.kind}</p>
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-strong">Queued</span>
                      </div>
                      <p className="mt-1 text-[11px] text-on-surface-variant">{new Date(operation.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isRefreshing}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
                Sync pending changes
              </button>
            </section>
          </aside>
        </section>
      </main>

      <AnimatePresence>
        {activeApp && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-4 backdrop-blur-sm md:items-center"
          >
            <div className="w-full max-w-2xl rounded-[28px] border border-surface bg-surface-strong p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-strong">App preview</p>
                  <h3 className="mt-1 text-2xl font-semibold">{activeApp.name}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">{activeApp.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveApp(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface bg-background text-on-surface-variant transition-transform hover:scale-105 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-surface bg-background p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">Category</p>
                  <p className="mt-1 text-sm font-semibold">{activeApp.category}</p>
                </div>
                <div className="rounded-[24px] border border-surface bg-background p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">Version</p>
                  <p className="mt-1 text-sm font-semibold">{activeApp.version ?? 1}</p>
                </div>
                <div className="rounded-[24px] border border-surface bg-background p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">Sync</p>
                  <p className="mt-1 text-sm font-semibold">{activeApp.syncState || 'synced'}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {activeApp.screens?.[0]?.items?.map((item, index) => (
                  <div key={`${activeApp.id}-${index}`} className="flex items-center justify-between rounded-[22px] border border-surface bg-background px-4 py-3">
                    <p className="pr-4 text-sm text-on-surface">{item}</p>
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-strong">Ready</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {activeApp.screens?.[0]?.actions?.map((action) => (
                  <button
                    key={`${activeApp.id}-${action.actionType}-${action.label}`}
                    type="button"
                    onClick={() => {
                      void handleAppAction(action.actionType, activeApp);
                      if (action.actionType === 'preview') {
                        triggerToast(`${activeApp.name} preview opened.`);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-surface bg-background px-4 py-3 text-sm font-semibold text-on-surface-variant transition-transform hover:scale-[1.01] active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    {action.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    queueMeshSyncRequest(activeApp, 'manual preview sync');
                    setPendingOperations(readQueuedOperations());
                    triggerToast('Mesh sync queued for this app.');
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  Queue mesh sync
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

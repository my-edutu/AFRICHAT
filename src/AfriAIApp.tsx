import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightLeft,
  Bot,
  Briefcase,
  ChevronRight,
  FileText,
  Languages,
  Moon,
  Send,
  Sparkles,
  SunMedium,
  MessageSquareText,
  Globe2,
} from "lucide-react";

type ThemeMode = "light" | "dark";
type Mode = "chat" | "translate" | "business" | "summary";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const LANGUAGE_OPTIONS = [
  "English",
  "Hausa",
  "Yoruba",
  "Igbo",
  "Swahili",
  "French",
  "Arabic",
  "Amharic",
  "Zulu",
  "Somali",
];

const MODE_META: Record<Mode, { label: string; icon: typeof MessageSquareText; note: string }> = {
  chat: { label: "Chat", icon: MessageSquareText, note: "Ask AfriAI anything" },
  translate: { label: "Translate", icon: Languages, note: "African language translation" },
  business: { label: "Business", icon: Briefcase, note: "Plans, copy, and launch notes" },
  summary: { label: "Summary", icon: FileText, note: "Condense the thread" },
};

const QUICK_PROMPTS = [
  {
    label: "Launch plan",
    icon: Sparkles,
    prompt: "Write a 5-point launch plan for a small fashion business in Lagos, including messaging, pricing, and first-week actions.",
  },
  {
    label: "Localize copy",
    icon: Globe2,
    prompt: "Rewrite this product message for an African market in clear, friendly language: premium delivery for same-day orders.",
  },
  {
    label: "Support reply",
    icon: Bot,
    prompt: "Draft a concise customer-support reply for a delayed delivery and offer the next step.",
  },
];

const BUSINESS_PROMPTS = [
  "Create a launch checklist for a food delivery business in Accra.",
  "Draft a payment and pricing plan for a school portal in Nairobi.",
  "Write a short business pitch for a clothing brand selling across West Africa.",
];

function initialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("afriai-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function safeErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Unknown error";
}

export default function AfriAIApp() {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "I can help with chat, translations, business writing, and thread summaries.",
    },
  ]);
  const [composer, setComposer] = useState("");
  const [translateText, setTranslateText] = useState("Sannu, ya kake? Ina fatan kana cikin koshin lafiya.");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme;
    window.localStorage.setItem("afriai-theme", theme);
  }, [theme]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const modeLabel = MODE_META[mode].label;
  const modeNote = MODE_META[mode].note;
  const ModeIcon = MODE_META[mode].icon;
  const StatusIcon = theme === "dark" ? Moon : SunMedium;

  const recentSummary = useMemo(() => {
    if (!summary) return "No summary yet.";
    return summary;
  }, [summary]);

  async function sendChat(textOverride?: string) {
    const text = (textOverride ?? composer).trim();
    if (!text || isSending) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: `user-${Date.now()}`, role: "user", text },
    ];
    setMessages(nextMessages);
    setComposer("");
    setIsSending(true);
    setStatusText(null);

    try {
      const response = await fetch("/api/chat-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          chatHistory: nextMessages.map((message) => ({
            sender: message.role === "user" ? "me" : "AfriAI",
            senderName: message.role === "user" ? "You" : "AfriAI",
            text: message.text,
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "AfriAI request failed");
      }

      const reply = typeof data.response === "string" && data.response.trim().length > 0
        ? data.response.trim()
        : "AfriAI is ready when the backend is available.";

      setMessages((current) => [
        ...current,
        { id: `assistant-${Date.now()}`, role: "assistant", text: reply },
      ]);
    } catch (err) {
      const message = safeErrorMessage(err);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: "AfriAI is temporarily unavailable. Please try again in a moment.",
        },
      ]);
      setStatusText(message);
    } finally {
      setIsSending(false);
    }
  }

  async function translateTextAction() {
    const value = translateText.trim();
    if (!value || isTranslating) return;

    setIsTranslating(true);
    setStatusText(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, targetLang: targetLanguage }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Translation failed");
      }

      setTranslatedText(typeof data.translatedText === "string" ? data.translatedText : value);
      setStatusText(null);
    } catch (err) {
      setTranslatedText("Translation unavailable right now.");
      setStatusText(safeErrorMessage(err));
    } finally {
      setIsTranslating(false);
    }
  }

  async function summarizeThread() {
    if (isSummarizing || messages.length <= 1) return;

    setIsSummarizing(true);
    setStatusText(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((message) => ({
            senderName: message.role === "user" ? "You" : "AfriAI",
            text: message.text,
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Summary failed");
      }

      setSummary(typeof data.summary === "string" ? data.summary : "Summary unavailable.");
    } catch (err) {
      setSummary("Summary unavailable right now.");
      setStatusText(safeErrorMessage(err));
    } finally {
      setIsSummarizing(false);
    }
  }

  function setQuickPrompt(prompt: string) {
    setMode("chat");
    setComposer(prompt);
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="sticky top-0 z-20 border-b border-surface bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-brand-strong">
              <Bot className="h-4 w-4" /> AfriAI assistant
            </div>
            <h1 className="mt-1 truncate text-xl font-semibold text-on-surface sm:text-2xl">
              Chat, translate, and summarize across African languages
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            className="inline-flex items-center gap-2 rounded-full border border-surface bg-surface-strong px-3 py-2 text-sm font-semibold text-on-surface transition-all hover:shadow-md active:scale-95"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            aria-pressed={theme === "dark"}
          >
            <StatusIcon className="h-4 w-4" />
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.82fr)] lg:px-8">
        <section className="flex min-h-[calc(100vh-9rem)] flex-col rounded-[24px] border border-surface bg-surface-strong shadow-[0_18px_60px_rgba(13,32,23,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface px-5 py-4">
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-strong">Conversation</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-on-surface-variant">
                <ModeIcon className="h-4 w-4" />
                <span className="font-semibold text-on-surface">{modeLabel}</span>
                <span className="hidden sm:inline">{modeNote}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(MODE_META) as Mode[]).map((value) => {
                const Icon = MODE_META[value].icon;
                const active = value === mode;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all active:scale-95 ${
                      active
                        ? "border-brand-strong bg-brand-soft text-brand-strong"
                        : "border-surface bg-surface text-on-surface-variant hover:text-on-surface"
                    }`}
                    aria-pressed={active}
                  >
                    <Icon className="h-4 w-4" />
                    {MODE_META[value].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-[22px] border px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[74%] ${
                      isUser
                        ? "border-transparent bg-brand-strong text-white"
                        : "border-surface bg-surface text-on-surface"
                    }`}
                  >
                    <div className={`mb-1 text-[11px] font-black uppercase tracking-[0.24em] ${isUser ? "text-white/80" : "text-brand-strong"}`}>
                      {isUser ? "You" : "AfriAI"}
                    </div>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="border-t border-surface px-5 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setQuickPrompt(item.prompt)}
                    className="inline-flex items-center gap-2 rounded-full border border-surface bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant transition-all hover:text-on-surface active:scale-95"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendChat();
              }}
              className="space-y-3"
            >
              <textarea
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                rows={4}
                className="app-input min-h-[108px] w-full resize-none rounded-[20px] px-4 py-3 text-sm leading-6"
                placeholder={
                  mode === "translate"
                    ? "Type the message you want translated, then use the translation panel on the right."
                    : mode === "business"
                      ? "Describe the business, market, city, or product you want to launch."
                      : mode === "summary"
                        ? "Ask AfriAI to explain, refine, or summarize the current thread."
                        : "Ask AfriAI anything about chat, business help, or the African market."
                }
              />

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-on-surface-variant">
                  {statusText ? statusText : isSending ? "AfriAI is responding" : "Ready"}
                </div>
                <button
                  type="submit"
                  disabled={isSending || !composer.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-strong px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                >
                  <Send className="h-4 w-4" />
                  {isSending ? "Sending" : "Send"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="grid gap-4 content-start">
          <section className="rounded-[24px] border border-surface bg-surface-strong p-5 shadow-[0_18px_60px_rgba(13,32,23,0.08)]">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-brand-strong">
              <ArrowRightLeft className="h-4 w-4" /> Translate
            </div>
            <h2 className="mt-2 text-base font-semibold text-on-surface">Cross-language translation</h2>
            <div className="mt-4 space-y-3">
              <textarea
                value={translateText}
                onChange={(event) => setTranslateText(event.target.value)}
                rows={5}
                className="app-input w-full resize-none rounded-[18px] px-4 py-3 text-sm leading-6"
                placeholder="Paste text here"
              />
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <select
                  value={targetLanguage}
                  onChange={(event) => setTargetLanguage(event.target.value)}
                  className="app-input min-w-0 rounded-[18px] px-4 py-3 text-sm"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void translateTextAction()}
                  disabled={isTranslating || !translateText.trim()}
                  className="inline-flex items-center gap-2 rounded-[18px] bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                >
                  <Languages className="h-4 w-4" />
                  {isTranslating ? "Translating" : "Translate"}
                </button>
              </div>
              <div className="rounded-[18px] border border-surface bg-surface px-4 py-3 text-sm leading-6 text-on-surface">
                <div className="mb-1 text-[11px] font-black uppercase tracking-[0.24em] text-brand-strong">Result</div>
                <p className="whitespace-pre-wrap text-on-surface-variant">{translatedText ?? "Translation will appear here."}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-surface bg-surface-strong p-5 shadow-[0_18px_60px_rgba(13,32,23,0.08)]">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-brand-strong">
              <FileText className="h-4 w-4" /> Summary
            </div>
            <h2 className="mt-2 text-base font-semibold text-on-surface">Instant thread summary</h2>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => void summarizeThread()}
                disabled={isSummarizing || messages.length <= 1}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              >
                <FileText className="h-4 w-4" />
                {isSummarizing ? "Summarizing" : "Summarize thread"}
              </button>
              <div className="rounded-[18px] border border-surface bg-surface px-4 py-3 text-sm leading-6">
                <div className="mb-1 text-[11px] font-black uppercase tracking-[0.24em] text-brand-strong">Output</div>
                <p className="whitespace-pre-wrap text-on-surface-variant">{recentSummary}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-surface bg-surface-strong p-5 shadow-[0_18px_60px_rgba(13,32,23,0.08)]">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-brand-strong">
              <Briefcase className="h-4 w-4" /> Business
            </div>
            <h2 className="mt-2 text-base font-semibold text-on-surface">Business help prompts</h2>
            <div className="mt-4 space-y-2">
              {BUSINESS_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setQuickPrompt(prompt)}
                  className="group flex w-full items-center justify-between gap-3 rounded-[18px] border border-surface bg-surface px-4 py-3 text-left text-sm font-medium text-on-surface-variant transition-all hover:text-on-surface active:scale-[0.99]"
                >
                  <span className="min-w-0 flex-1">{prompt}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

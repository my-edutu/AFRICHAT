import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface LaunchFlowProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLaunch: () => void;
}

type LaunchStage = "welcome" | "auth" | "launching";

const stageMeta: Record<LaunchStage, { step: string; title: string; copy: string }> = {
  welcome: {
    step: "01 / 03",
    title: "Quick Get Started",
    copy: "A simple presentation flow for AfriChat. No backend, no friction, just the launch story.",
  },
  auth: {
    step: "02 / 03",
    title: "Mock Auth",
    copy: "This is a visual sign-in step only. Use it to frame the product story before the app shell appears.",
  },
  launching: {
    step: "03 / 03",
    title: "Launching",
    copy: "We are preparing the demo shell, theme context, and launch surface.",
  },
};

export default function LaunchFlow({ theme, onToggleTheme, onLaunch }: LaunchFlowProps) {
  const [stage, setStage] = useState<LaunchStage>("welcome");
  const isDark = theme === "dark";

  useEffect(() => {
    if (stage !== "launching") return;
    const timer = window.setTimeout(() => onLaunch(), 1200);
    return () => window.clearTimeout(timer);
  }, [stage, onLaunch]);

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-background text-on-surface">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 right-[-8%] h-72 w-72 rounded-full bg-[rgba(10,143,90,0.14)] blur-3xl" />
        <div className="absolute bottom-[-12%] left-[-10%] h-80 w-80 rounded-full bg-[rgba(244,180,0,0.10)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-5 py-5 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#006A42] text-white flex items-center justify-center shadow-lg shadow-emerald-950/20">
              <span className="material-symbols-outlined text-[24px]">bubble_chart</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-brand">AfriChat Presentation</p>
              <h1 className="font-display text-xl font-black tracking-tight">Launch Preview</h1>
            </div>
          </div>

          <button
            onClick={onToggleTheme}
            className={`flex h-11 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all active:scale-95 ${
              isDark
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-black/5 bg-white/80 text-[#0A8F5A] hover:bg-white"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDark ? "light_mode" : "dark_mode"}
            </span>
            Theme
          </button>
        </div>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-brand">
              <span className="h-2 w-2 rounded-full bg-[#0A8F5A] shadow-[0_0_0_6px_rgba(10,143,90,0.12)]" />
              Presentation mode
            </div>

            <div className="max-w-2xl space-y-4">
              <h2 className="font-display text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                A cleaner launch story for AfriChat.
              </h2>
              <p className="max-w-xl text-sm leading-6 text-on-surface-variant sm:text-base">
                The onboarding is now a simple, guided presentation: get started, mock auth, then reveal the app shell.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: "chat", label: "Messages", tone: "bg-[#006A42]/10 text-[#006A42]" },
                { icon: "payments", label: "Wallet", tone: "bg-[#F4B400]/15 text-[#9A6A00]" },
                { icon: "apps", label: "Mini apps", tone: "bg-[#0A8F5A]/10 text-[#0A8F5A]" },
              ].map((item) => (
                <div key={item.label} className="app-surface rounded-[24px] p-4">
                  <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  </div>
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="mt-1 text-[11px] leading-5 text-on-surface-variant">
                    Mock presentation surface for the launch deck.
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
            className="mx-auto w-full max-w-[460px]"
          >
            <div className="app-surface-strong overflow-hidden rounded-[34px]">
              <div className="flex items-center justify-between border-b border-surface px-5 py-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant">
                    {stageMeta[stage].step}
                  </p>
                  <h3 className="mt-1 text-lg font-display font-black">{stageMeta[stage].title}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-brand-soft text-brand flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    {stage === "welcome" ? "rocket_launch" : stage === "auth" ? "verified_user" : "hourglass_top"}
                  </span>
                </div>
              </div>

              <div className="px-5 py-5">
                <AnimatePresence mode="wait">
                  {stage === "welcome" && (
                    <motion.div
                      key="welcome"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-5"
                    >
                      <div className="space-y-3">
                        <p className="text-sm leading-6 text-on-surface-variant">{stageMeta.welcome.copy}</p>
                        <div className="rounded-[28px] border border-[color:var(--app-border)] bg-[rgba(10,143,90,0.06)] p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand">Demo flow</p>
                              <p className="mt-1 text-sm font-bold">Start with a polished welcome, then a visual sign-in.</p>
                            </div>
                            <span className="material-symbols-outlined text-[32px] text-brand">arrow_right_alt</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setStage("auth")}
                        className="w-full rounded-2xl bg-[#006A42] px-5 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(0,106,66,0.22)] transition-all hover:brightness-110 active:scale-[0.99]"
                      >
                        Get Started
                      </button>
                    </motion.div>
                  )}

                  {stage === "auth" && (
                    <motion.div
                      key="auth"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      <p className="text-sm leading-6 text-on-surface-variant">{stageMeta.auth.copy}</p>

                      <div className="space-y-3">
                        <div className="rounded-[24px] border border-[color:var(--app-border)] bg-surface p-4">
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                            Phone or email
                          </label>
                          <div className="app-input rounded-2xl px-4 py-3 text-sm">godfrey@africhat.app</div>
                        </div>

                        <div className="rounded-[24px] border border-[color:var(--app-border)] bg-surface p-4">
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                            One-time code
                          </label>
                          <div className="grid grid-cols-6 gap-2">
                            {["4", "2", "8", "1", "9", "0"].map((digit, index) => (
                              <div
                                key={`${digit}-${index}`}
                                className="flex h-11 items-center justify-center rounded-2xl border border-[color:var(--app-border)] bg-background text-sm font-black"
                              >
                                {digit}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          onClick={() => setStage("welcome")}
                          className="rounded-2xl border border-[color:var(--app-border)] bg-transparent px-5 py-4 text-sm font-bold text-on-surface transition-colors hover:bg-black/5"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setStage("launching")}
                          className="rounded-2xl bg-[#006A42] px-5 py-4 text-sm font-black text-white transition-all hover:brightness-110 active:scale-[0.99]"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {stage === "launching" && (
                    <motion.div
                      key="launching"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-5"
                    >
                      <p className="text-sm leading-6 text-on-surface-variant">{stageMeta.launching.copy}</p>

                      <div className="rounded-[28px] border border-[color:var(--app-border)] bg-surface p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                              <span className="material-symbols-outlined text-[24px] animate-pulse">progress_activity</span>
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.24em] text-brand">Loading shell</p>
                              <p className="text-sm font-bold">Preparing the navigation system</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-on-surface-variant">78%</span>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-brand" />
                            Theme context
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-brand" />
                            Bottom navigation
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-brand" />
                            Presentation surfaces
                          </div>
                        </div>

                        <button
                          onClick={onLaunch}
                          className="mt-5 w-full rounded-2xl bg-[#0A8F5A] px-5 py-4 text-sm font-black text-white transition-all hover:brightness-110 active:scale-[0.99]"
                        >
                          Enter Demo
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-surface px-5 py-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  <span>{stageMeta[stage].step}</span>
                  <span>Presentation only</span>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

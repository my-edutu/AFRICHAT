import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface MiniAppWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onAddMiniApp: (app: any) => void;
  triggerToast: (msg: string) => void;
}

export default function MiniAppWizardModal({
  isOpen,
  onClose,
  theme,
  onAddMiniApp,
  triggerToast
}: MiniAppWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states matching PRD checklist
  const [prompt, setPrompt] = useState("Build a ride hailing app for Abuja");
  const [appName, setAppName] = useState("Abuja Express");
  const [category, setCategory] = useState("Ride Hailing");
  const [colorTheme, setColorTheme] = useState("#0A8F5A"); // Emerald Green default
  const [pricing, setPricing] = useState("₦1,200 base + ₦200 per KM");
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["AfriPay Wallet", "USSD Payments"]);

  // Compile loader states
  const [progress, setProgress] = useState(0);
  const [currentCompileTask, setCurrentCompileTask] = useState("");

  const presetPrompts = [
    { title: "Ride Hailing App", prompt: "Build a ride hailing app for Abuja", category: "Ride Hailing" },
    { title: "School Portal", prompt: "Build a school portal in Enugu to manage student grades and fees", category: "School Portal" },
    { title: "Church App", prompt: "Build a church app for Lagos parish with donations", category: "Church" },
    { title: "Cooperative Savings", prompt: "Build an agricultural cooperative savings app for cocoa farmers in Akure", category: "Cooperative" },
    { title: "Maid service", prompt: "Build a clean scheduled housekeeping booking app in Nairobi", category: "Logistics" }
  ];

  const handleStartCompiler = () => {
    setStep(3);
    setProgress(0);
    
    const tasks = [
      { pct: 15, msg: "AI generating mobile UI screens... 📱" },
      { pct: 35, msg: "Compiling admin supervisor control panel... 📊" },
      { pct: 60, msg: "Linking secure transactional wallets... 💰" },
      { pct: 85, msg: "Provisioning backend databases & cloud storage... 🗄️" },
      { pct: 100, msg: "Deploying integrated AI Customer Agent co-host... 🤖" }
    ];

    tasks.forEach((task, index) => {
      setTimeout(() => {
        setProgress(task.pct);
        setCurrentCompileTask(task.msg);
        if (index === tasks.length - 1) {
          setTimeout(() => setStep(4), 500);
        }
      }, (index + 1) * 900);
    });
  };

  const handleDeployToHome = () => {
    const icon = category === "Ride Hailing" 
      ? "local_taxi" 
      : category === "School Portal" 
      ? "school" 
      : category === "Church" 
      ? "church" 
      : category === "Cooperative" 
      ? "diversity_3"
      : "apps";

    const customApp = {
      id: "cust-" + Date.now(),
      name: appName,
      description: `Custom ${category} built by AI. Prompt: "${prompt}"`,
      category: category,
      icon: icon,
      bgColor: "rgba(10,143,90,0.1)",
      textColor: colorTheme,
      isCustom: true,
      isActive: true,
      creator: "Godfrey (You)",
      screens: [
        {
          title: `${appName} Active Panel`,
          description: pricing,
          items: category === "Ride Hailing" 
            ? ["🚗 Driver Aisha Yusuf — Toyota — 4.9★", "🚗 Driver Babajide Alabi — Honda — 4.8★"]
            : category === "School Portal"
            ? ["📚 Term 1 Tuition fee: ₦22,000", "📝 Class Grade: Junior Secondary 3 (Maths A)"]
            : ["⛪ General Offering (Sunday Support)", "💰 Cooperative pool contribution: ₦10,000"],
          actions: [
            { label: `Proceed Securely (${pricing.split(" ").slice(0, 1).join("") || "Pay"})`, actionType: "pay" }
          ]
        }
      ]
    };

    onAddMiniApp(customApp);
    triggerToast(`Congratulations! ${appName} is fully hot-deployed to Discover & Home tabs!`);
    onClose();
    // reset
    setStep(1);
    setPrompt("Build a ride hailing app for Abuja");
    setAppName("");
  };

  const togglePaymentMethod = (method: string) => {
    if (paymentMethods.includes(method)) {
      setPaymentMethods(prev => prev.filter(m => m !== method));
    } else {
      setPaymentMethods(prev => [...prev, method]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-[#0E1B14] text-white' : 'bg-[#F8F9FA] text-neutral-900'} overflow-hidden`}>
      {/* Top Banner */}
      <header className="bg-[#006A42] text-white py-4 px-6 flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">AI App Architect</h1>
            <p className="text-[10px] text-emerald-250">Zero Code • Instant Deploy • African Micro OS</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-yellow-400">auto_awesome</span>
      </header>

      {/* Main body with content steps */}
      <div className="flex-grow overflow-y-auto p-6 max-w-2xl mx-auto w-full flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* STEP 1: PROMPT BUILDER */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1 flex flex-col justify-between"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold tracking-widest px-3 py-1 rounded-full uppercase">Step 1 of 3: Describe Program</span>
                  <h2 className="text-xl font-bold">What premium service do you want to compile?</h2>
                  <p className="text-xs text-gray-400">AfriChat's built-in AI will automatically scaffold complete database collections, wallet integrations, and gorgeous mobile client sheets.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Describe your dream Mini App</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-[#15221b]/20 hover:bg-[#15221b]/40 border border-emerald-500/15 focus:border-[#0A8F5A] rounded-2xl p-4 text-sm text-on-surface placeholder-gray-500 outline-none resize-none h-32"
                    placeholder="Describe everything: Ride booking, church tithing, school portals, agricultural cooperative, food deliveries..."
                  />
                </div>

                {/* Presets Grid */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Recommended Presets:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {presetPrompts.map((preset, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setPrompt(preset.prompt);
                          setAppName(preset.title);
                          setCategory(preset.category);
                          triggerToast(`Selected "${preset.title}" preset`);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer text-left flex items-start gap-3 ${
                          prompt === preset.prompt 
                            ? 'bg-[#006a41]/10 border-[#0A8F5A]' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[#F4B400] text-sm mt-0.5">auto_awesome</span>
                        <div>
                          <p className="text-xs font-bold leading-tight">{preset.title}</p>
                          <p className="text-[9px] text-gray-500 truncate w-44">{preset.prompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-[#006A42] hover:bg-[#0A8F5A] text-white py-4 rounded-2xl font-black text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/35 cursor-pointer"
                >
                  Configure Specifications
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: FIELD SPECIFICATIONS (BUSINESS NAME, COLORS, PRICING, PAYMENTS) */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1 flex flex-col justify-between"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 font-extrabold tracking-widest px-3 py-1 rounded-full uppercase">Step 2 of 3: Business Settings</span>
                  <h2 className="text-xl font-bold">Personalize your Super App deployment</h2>
                  <p className="text-xs text-gray-400">Perfect your business colors, transaction values, and payment authorizations with the fields below.</p>
                </div>

                <div className="space-y-4">
                  {/* Business Name */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Business Name</label>
                    <input 
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      type="text"
                      className="w-full bg-black/25 dark:bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 outline-none"
                      placeholder="e.g., Abuja Express, St. Paul Enugu Parish..."
                    />
                  </div>

                  {/* Category & Accent Color Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Main Category</label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#0E1B14] border border-white/10 text-xs text-white rounded-xl px-4 py-3 outline-none"
                      >
                        <option value="Ride Hailing">Ride Hailing 🚗</option>
                        <option value="School Portal">School Portal 🏫</option>
                        <option value="Marketplace">Marketplace 🛒</option>
                        <option value="Healthcare">Healthcare 🏥</option>
                        <option value="Church">Church ⛪</option>
                        <option value="Learning">Learning 🎓</option>
                        <option value="Cooperative">Cooperative 🏦</option>
                        <option value="Streaming">Streaming 🎥</option>
                        <option value="Hotel">Hotel 🏨</option>
                        <option value="Logistics">Logistics 🚚</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Brand Theme Color</label>
                      <div className="flex gap-2.5 h-11 items-center bg-[#0E1B14] border border-white/10 rounded-xl px-3">
                        <button onClick={() => setColorTheme("#0A8F5A")} className={`w-6 h-6 rounded-full bg-[#0A8F5A] border ${colorTheme === '#0A8F5A' ? 'border-white scale-110 shadow' : 'border-transparent'}`} />
                        <button onClick={() => setColorTheme("#F4B400")} className={`w-6 h-6 rounded-full bg-[#F4B400] border ${colorTheme === '#F4B400' ? 'border-white scale-110 shadow' : 'border-transparent'}`} />
                        <button onClick={() => setColorTheme("#1D7AFC")} className={`w-6 h-6 rounded-full bg-[#1D7AFC] border ${colorTheme === '#1D7AFC' ? 'border-white scale-110 shadow' : 'border-transparent'}`} />
                        <button onClick={() => setColorTheme("#E91E63")} className={`w-6 h-6 rounded-full bg-[#E91E63] border ${colorTheme === '#E91E63' ? 'border-white scale-110 shadow' : 'border-transparent'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Rule */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Pricing structure (displayed to users)</label>
                    <input 
                      value={pricing}
                      onChange={(e) => setPricing(e.target.value)}
                      type="text"
                      className="w-full bg-black/25 dark:bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      placeholder="e.g., ₦1,200 base rate + ₦200 per KM, Free Sunday Tithes..."
                    />
                  </div>

                  {/* Payment Checkboxes */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Authorized Wallet channels</label>
                    <div className="flex gap-4">
                      {["AfriPay Wallet", "USSD Payments", "Mobile Money"].map((method) => {
                        const active = paymentMethods.includes(method);
                        return (
                          <div 
                            key={method}
                            onClick={() => togglePaymentMethod(method)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer select-none text-[10px] font-bold uppercase transition-all ${
                              active 
                                ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400 font-extrabold' 
                                : 'bg-transparent border-white/5 text-gray-400'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {active ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                            {method}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  onClick={() => setStep(1)}
                  className="px-5 py-4 bg-transparent border border-white/5 rounded-2xl text-xs font-bold hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleStartCompiler}
                  disabled={!appName.trim()}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-neutral-900 py-4 rounded-2xl font-black text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  Compile App with AI
                  <span className="material-symbols-outlined text-xs font-bold">bolt</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: COMPILE PROGRESS LOADER */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6 pt-12"
            >
              <div className="relative">
                {/* Visual loading spinning orbit */}
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-emerald-400 animate-spin flex items-center justify-center duration-3000"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px] text-yellow-400 animate-bounce">auto_awesome</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-sm tracking-wider uppercase text-emerald-400">Compiling Custom Micro OS...</h3>
                <p className="text-xs text-gray-400 font-mono leading-relaxed h-12 max-w-sm mx-auto">{currentCompileTask}</p>
              </div>

              <div className="w-full max-w-xs bg-neutral-800 h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  style={{ width: `${progress}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                ></div>
              </div>
              <span className="text-[11px] font-mono text-gray-500">{progress}% compiled</span>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS APP DEPLOYED SCREEN (MOCKED MOBILE CLIENT, ADMIN, DB BADGES) */}
          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 flex-1 flex flex-col justify-between"
            >
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[28px]">lock_open</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#6ddb9f]">{appName} Compiled Successfully!</h2>
                  <p className="text-xs text-gray-400">All deployment pipelines generated, sandbox secured, and cloud variables linked.</p>
                </div>

                {/* Grid showing automatically created artifacts */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-300">
                      <span>Mobile View</span>
                      <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Success</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-snug">Scaffolded React sheets with custom brand styling and active lists.</p>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-300">
                      <span>Admin Supervisor</span>
                      <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Active</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-snug">Supervisor Panel created under profile dashboard for staff management.</p>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-300">
                      <span>Sandbox DB</span>
                      <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Mounted</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-snug font-mono">SQLite ledger collections registered inside AfriOS runtime securely.</p>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-300">
                      <span>AI Co-Host Chat</span>
                      <span className="bg-teal-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Ready</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-snug">Autonomous support agent linked to resolve user dispute alerts.</p>
                  </div>
                </div>

                <div className="bg-[#0b1410] border border-[#0A8F5A]/25 p-4 rounded-2xl text-center flex flex-col gap-2">
                  <span className="text-[10px] text-yellow-400 font-extrabold tracking-widest uppercase">Pricing Scheme Locked</span>
                  <span className="text-xs font-bold text-white">{pricing}</span>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleDeployToHome}
                  className="w-full bg-[#006A42] hover:bg-[#0A8F5A] text-white py-4 rounded-2xl font-black text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/35 cursor-pointer"
                >
                  Hot-Deploy to Super App Dock
                  <span className="material-symbols-outlined text-xs">rocket_launch</span>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

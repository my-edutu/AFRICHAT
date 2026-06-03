import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  initialChats, 
  initialTransactions, 
  staticMiniApps 
} from "./data";
import { Chat, Message, Transaction, MiniApp } from "./types";

// Import modular feature modals representing the remaining high fidelity subsystems
import AfriMarketModal from "./components/AfriMarketModal";
import MiniAppWizardModal from "./components/MiniAppWizardModal";
import ServicesModal from "./components/ServicesModal";
import LearnModal from "./components/LearnModal";

export default function App() {
  // Overlays or custom modal open/close states
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isAppWizardOpen, setIsAppWizardOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  // Theme state: default to 'light' to match the provided screenshots perfectly, but toggleable.
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'home' | 'chats' | 'pay' | 'discover' | 'profile'>('home');
  
  // State for active chatbot conversation or normal chat
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  // State for wallets and transactions
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [balance, setBalance] = useState<number>(425500); // Matches the mockup balance ₦425,500.00
  const [profileBalanceHidden, setProfileBalanceHidden] = useState<boolean>(false);
  const [chatFilter, setChatFilter] = useState<'all' | 'groups' | 'channels' | 'voicerooms'>('all');
  const [isVoiceRoomActive, setIsVoiceRoomActive] = useState<boolean>(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [isCurrencyConverted, setIsCurrencyConverted] = useState<boolean>(true);
  const [isAddingMoney, setIsAddingMoney] = useState<boolean>(false);
  const [addAmount, setAddAmount] = useState<string>("5000");
  const [usdWalletBalance, setUsdWalletBalance] = useState<number>(1250);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>("");

  // AI mini program builder state
  const [customMiniApps, setCustomMiniApps] = useState<MiniApp[]>([
    {
      id: "abuja-rides",
      name: "Abuja City Rides",
      description: "Custom ride hailing for Garki.",
      category: "Ride Hailing",
      icon: "local_taxi",
      bgColor: "rgba(109,219,159,0.1)",
      textColor: "#6ddb9f",
      isCustom: true,
      isActive: true,
      creator: "Godfrey",
      screens: [
        {
          title: "Book a Premium Ride",
          description: "Available drivers around Garki Area II:",
          items: [
            "🚗 Babajide Alabi — Toyota Corolla — 4.9★",
            "🚗 Chidi Okafor — Honda Accord — 4.8★",
            "🚗 Aisha Yusuf — Hyundai Elantra — 4.7★"
          ],
          actions: [
            { label: "Request Immediate Pickup (₦1,200)", actionType: "ride" },
            { label: "Schedule Later", actionType: "schedule" }
          ]
        }
      ]
    }
  ]);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isGeneratingApp, setIsGeneratingApp] = useState<boolean>(false);
  const [activeMiniApp, setActiveMiniApp] = useState<MiniApp | null>(null);
  const [miniAppSimulationMessage, setMiniAppSimulationMessage] = useState<string>("");

  // Message compose states
  const [composeText, setComposeText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isAiTranslateActive, setIsAiTranslateActive] = useState<boolean>(true);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

  // Audio Playback simulation
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(33); // percent

  // Bottom action sheet for FAB
  const [showCreateMenu, setShowCreateMenu] = useState<boolean>(false);

  // Toast / Status Indicators
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reputationScore, setReputationScore] = useState<number>(98);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // Sync theme with HTML tag
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Audio Progress simulation on play
  useEffect(() => {
    let timer: any;
    if (isAudioPlaying) {
      timer = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsAudioPlaying(false);
            return 0;
          }
          return prev + 10;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isAudioPlaying]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Escrow wallet deduction simulation for connected subsystems
  const handleDeductBalance = (amount: number, description: string) => {
    setBalance(prev => Math.max(0, prev - amount));
    const newTx: Transaction = {
      id: "tx-deduct-" + Date.now(),
      title: description,
      category: "shopping",
      amount: -amount,
      currency: "₦",
      date: "Today",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Completed"
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // Chat logic: send message and ask server to respond
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!composeText.trim() || !selectedChatId) return;

    const currentChat = chats.find(c => c.id === selectedChatId);
    if (!currentChat) return;

    const userMsg: Message = {
      id: "usr-" + Date.now(),
      sender: "me",
      senderName: "Godfrey",
      text: composeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedChats = chats.map(c => {
      if (c.id === selectedChatId) {
        return {
          ...c,
          lastMessageText: userMsg.text,
          lastMessageTime: userMsg.timestamp,
          messages: [...c.messages, userMsg]
        };
      }
      return c;
    });

    setChats(updatedChats);
    const tempText = composeText;
    setComposeText("");

    // Simulate Amina K smart translation flow or custom chatbot logic
    setIsTyping(true);

    if (selectedChatId === "afri-ai") {
      try {
        const response = await fetch("/api/chat-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: tempText, chatHistory: currentChat.messages }),
        });
        const data = await response.json();
        
        const aiMsg: Message = {
          id: "ai-" + Date.now(),
          sender: "other",
          senderName: "AfriAI",
          text: data.response || "How can I translate or configure payments for you?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setChats(prev => prev.map(c => {
          if (c.id === "afri-ai") {
            return { ...c, lastMessageText: aiMsg.text, messages: [...c.messages, aiMsg] };
          }
          return c;
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setIsTyping(false);
      }
    } else if (selectedChatId === "amina-k") {
      // Smart translations simulation or server translation trigger
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: tempText, targetLang: "Swahili" }),
        });
        const data = await response.json();

        // Amina returns message based on context
        setTimeout(() => {
          const aminaResponse: Message = {
            id: "amina-" + Date.now(),
            sender: "other",
            senderName: "Amina K.",
            originalText: "Hakan ne Godfrey. Na gode kwarai da gaske!",
            text: isAiTranslateActive 
              ? "That's perfect Godfrey. Thank you very much indeed!" 
              : "Hakan ne Godfrey. Na gode kwarai da gaske!",
            language: "Hausa",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          setChats(prev => prev.map(c => {
            if (c.id === "amina-k") {
              return { ...c, lastMessageText: aminaResponse.text, messages: [...c.messages, aminaResponse] };
            }
            return c;
          }));
          setIsTyping(false);
        }, 1500);

      } catch (err) {
        setIsTyping(false);
      }
    } else {
      // General contact response
      setTimeout(() => {
        const fallbackMsg: Message = {
          id: "fb-" + Date.now(),
          sender: "other",
          senderName: currentChat.name,
          text: "I received your message on AfriChat! Let's follow up on the marketplace shortly.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChats(prev => prev.map(c => {
          if (c.id === currentChat.id) {
            return { ...c, lastMessageText: fallbackMsg.text, messages: [...c.messages, fallbackMsg] };
          }
          return c;
        }));
        setIsTyping(false);
      }, 1500);
    }
  };

  // Dynamic summary trigger inside chat using server.ts Summarize API
  const handleSummarizeConversation = async () => {
    const currentChat = chats.find(c => c.id === selectedChatId);
    if (!currentChat) return;

    setIsSummarizing(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentChat.messages }),
      });
      const data = await response.json();
      setChatSummary(data.summary);
    } catch (err) {
      setChatSummary("Amina and Godfrey discussed launching the Abuja tech portal. Godfrey promised to deliver technical blueprints shortly.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // AI Mini program generator
  const handleGenerateMiniApp = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingApp(true);
    triggerToast("AfriChat AI is architecting your micro-program...");

    try {
      const response = await fetch("/api/generate-miniapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await response.json();
      const spec = data.appSpec;

      if (spec) {
        const newApp: MiniApp = {
          id: "custom-" + Date.now(),
          name: spec.name || "My Created Program",
          description: spec.adminNotes || "Custom digital hub built in minutes.",
          category: spec.category || "Cooperative",
          icon: spec.category === "Ride Hailing" ? "local_taxi" : spec.category === "School Portal" ? "school" : "grid_view",
          bgColor: spec.colorTheme ? `${spec.colorTheme}15` : "rgba(243,179,0,0.1)",
          textColor: spec.colorTheme || "#fdbc13",
          isCustom: true,
          isActive: true,
          creator: "Godfrey",
          screens: [
            {
              title: spec.name + " Hub",
              description: spec.pricingStructure || "Free commissions",
              items: (spec.initialData || []).map((row: any) => `${row.title || row.driver || row.subject || "Resource"}: ${row.detail || row.vehicle || row.status || "Ready"}`),
              actions: [
                { label: `Initiate ${spec.category} payment via AfriPay`, actionType: "pay" },
                { label: "Sync Records Offline", actionType: "offline" }
              ]
            }
          ]
        };

        setCustomMiniApps(prev => [newApp, ...prev]);
        setAiPrompt("");
        triggerToast(`Successfully deployed ${newApp.name} to AfriChat!`);
      }
    } catch (err) {
      triggerToast("Fitted custom template app fallback.");
    } finally {
      setIsGeneratingApp(false);
    }
  };

  // Add money to wallet
  const handleAddMoney = () => {
    const amt = parseFloat(addAmount);
    if (!isNaN(amt) && amt > 0) {
      setBalance(prev => prev + amt);
      const newTx: Transaction = {
        id: "dep-" + Date.now(),
        title: "Wallet Deposit",
        category: "deposit",
        amount: amt,
        currency: "₦",
        date: "Today",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "Received"
      };
      setTransactions(prev => [newTx, ...prev]);
      setIsAddingMoney(false);
      triggerToast(`Deposited ₦${amt.toLocaleString()} successfully.`);
    }
  };

  // Currency Conversion Conversion Logic
  const conversionRate = 0.15; // 1 NGN to KES fake multiplier
  const displayWalletCurrency = "₦";

  // Simulate Mini App action triggers
  const handleMiniAppActionClick = (actionType: string, app: MiniApp) => {
    if (actionType === "pay") {
      const deduction = 1500;
      if (balance >= deduction) {
        setBalance(prev => prev - deduction);
        const newTx: Transaction = {
          id: "tx-app-" + Date.now(),
          title: `Payment: ${app.name}`,
          category: "shopping",
          amount: -deduction,
          currency: "₦",
          date: "Today",
          time: "Just Now",
          status: "Completed"
        };
        setTransactions(prev => [newTx, ...prev]);
        setMiniAppSimulationMessage(`Payment of ₦1,500 approved seamlessly inside ${app.name}!`);
      } else {
        setMiniAppSimulationMessage("Insufficient balance in AfriPay wallet!");
      }
    } else if (actionType === "offline") {
      setMiniAppSimulationMessage("Mesh network sync saved structure locally on Bluetooth relays.");
    } else {
      setMiniAppSimulationMessage(`Triggered action inside ${app.name} successfully!`);
    }
  };

  const getFilteredChats = () => {
    if (!searchQuery) return chats;
    return chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  return (
    <div className={`min-h-screen text-on-surface antialiased bg-background pb-24 transition-colors duration-300 ${theme === 'dark' ? 'dark bg-[#09160f] text-[#d7e6db]' : 'light bg-[#f8f9fa] text-[#191c1d]'}`}>
      
      {/* Toast Alert pop-up */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 bg-[#0A8F5A] text-white font-medium rounded-xl shadow-2xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-md">info</span>
            <span className="text-sm border-l border-white/20 pl-2">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER CHAT MODAL DETAILED MODE */}
      <AnimatePresence>
        {selectedChatId && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-[#09160f]' : 'bg-[#f8f9fa]'}`}
          >
            {/* Top Bar matching Screen 2 */}
            <header className={`flex justify-between items-center px-4 h-16 w-full z-45 border-b backdrop-blur-md sticky top-0 ${theme === 'dark' ? 'bg-[#09160f]/95 border-white/10' : 'bg-white/95 border-b-gray-200 shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setSelectedChatId(null); setChatSummary(null); }}
                  className={`p-2 rounded-full hover:bg-neutral-800/10 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="relative">
                  {chats.find(c => c.id === selectedChatId)?.avatar ? (
                    <img 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover border border-emerald-500/20" 
                      src={chats.find(c => c.id === selectedChatId)?.avatar} 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-yellow-400/20 text-yellow-300 flex items-center justify-center">
                      <span className="material-symbols-outlined">groups</span>
                    </div>
                  )}
                  {chats.find(c => c.id === selectedChatId)?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#09160f] rounded-full"></div>
                  )}
                </div>
                <div>
                  <h1 className={`font-semibold text-md ${theme === 'dark' ? 'text-[#d7e6db]' : 'text-neutral-900'}`}>{chats.find(c => c.id === selectedChatId)?.name}</h1>
                  <p className="text-[#0A8F5A] text-[11px] uppercase tracking-widest font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => triggerToast("Initiating voice call on VoIP relays...")}
                  className={`hover:bg-neutral-800/10 p-2 rounded-full ${theme === 'dark' ? 'text-[#bdcabf]' : 'text-neutral-800'}`}
                >
                  <span className="material-symbols-outlined">call</span>
                </button>
                <button 
                  onClick={() => triggerToast("Initiating secure video call...")}
                  className={`hover:bg-neutral-800/10 p-2 rounded-full ${theme === 'dark' ? 'text-[#bdcabf]' : 'text-neutral-800'}`}
                >
                  <span className="material-symbols-outlined">videocam</span>
                </button>
                
                {/* AI Translate Toggle Section */}
                <div className="h-6 w-px bg-white/10"></div>
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border ${theme === 'dark' ? 'bg-[#202d25] border-white/5' : 'bg-emerald-50 border-emerald-100'}`}>
                  <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-tighter">AI Translate</span>
                  <label className="relative inline-flex items-center cursor-pointer scale-75">
                    <input 
                      checked={isAiTranslateActive} 
                      onChange={() => setIsAiTranslateActive(!isAiTranslateActive)}
                      className="sr-only peer" 
                      type="checkbox"
                    />
                    <div className="w-7 h-4 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0A8F5A]"></div>
                  </label>
                </div>
              </div>
            </header>

            {/* Smart Conversation Summary Tooltip */}
            <div className={`p-3 relative z-10 sticky top-16 shadow-lg flex flex-col items-center gap-2 border-b ${theme === 'dark' ? 'bg-[#15221b] border-white/5' : 'bg-[#edeeef] border-gray-200'}`}>
              <div className="flex items-center gap-3 w-full justify-between max-w-4xl">
                <p className="text-xs text-on-surface-variant font-medium">✨ Need a structured summary of this chat?</p>
                <button 
                  onClick={handleSummarizeConversation}
                  disabled={isSummarizing}
                  className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500 active:scale-95 text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  {isSummarizing ? "Synthesizing..." : "Summarize Conversation"}
                </button>
              </div>
              
              {chatSummary && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 p-3 w-full max-w-4xl rounded-xl border text-xs leading-relaxed ${theme === 'dark' ? 'bg-black/30 border-yellow-500/30 text-[#bdcabf]' : 'bg-white border-yellow-500/20 text-neutral-800'}`}
                >
                  <div className="font-bold text-yellow-500 mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    AfriAI Smart Summary:
                  </div>
                  {chatSummary}
                </motion.div>
              )}
            </div>

            {/* Chat message feed container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full custom-scrollbar">
              <div className="flex items-center justify-center my-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-full">Secure E2E Encrypted</span>
              </div>

              {chats.find(c => c.id === selectedChatId)?.messages.map((m, idx) => {
                const isMe = m.sender === 'me';
                return (
                  <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                    <div className={`p-4 shadow-sm border ${
                      isMe 
                        ? (theme === 'dark' ? 'bg-[#003920] border-emerald-500/20 text-white rounded-2xl rounded-tr-none' : 'bg-[#006a41] text-white rounded-2xl rounded-tr-none') 
                        : (theme === 'dark' ? 'bg-[#202d25] border-white/5 text-[#d7e6db] rounded-2xl rounded-tl-none' : 'bg-white border-gray-200 text-neutral-900 rounded-2xl rounded-tl-none shadow-sm')
                    } relative`}>
                      
                      {/* Transcribed text for foreign language chats */}
                      {m.originalText && (
                        <div className="text-[11px] text-gray-400 italic mb-2 border-b border-gray-300/10 pb-1.5 flex items-center justify-between">
                          <span>"{m.originalText}"</span>
                          <span className="bg-yellow-400/20 text-yellow-400 rounded px-1 text-[8px] uppercase">{m.language || 'African'}</span>
                        </div>
                      )}

                      {/* Regular message vs Smart Voice Note player visual layout code (from screenshot 2) */}
                      {m.isVoiceNote ? (
                        <div className="space-y-3 min-w-[240px]">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => {
                                setIsAudioPlaying(!isAudioPlaying);
                                if (!isAudioPlaying) setAudioProgress(0);
                              }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                isAudioPlaying ? 'bg-[#003920] text-emerald-300' : 'bg-yellow-400 text-neutral-900 hover:bg-yellow-500'
                              }`}
                            >
                              <span className="material-symbols-outlined">{isAudioPlaying ? 'pause' : 'play_arrow'}</span>
                            </button>
                            <div className="flex-1 h-2 bg-neutral-700 rounded-full relative overflow-hidden">
                              <div 
                                style={{ width: `${audioProgress}%` }} 
                                className="absolute left-0 top-0 h-full bg-[#0A8F5A] rounded-full transition-all duration-300"
                              ></div>
                              <div className="absolute top-0 left-0 w-full flex justify-between px-1 pointer-events-none opacity-40">
                                <span className="w-[1px] h-3 bg-white"></span>
                                <span className="w-[1px] h-4 bg-white"></span>
                                <span className="w-[1px] h-3 bg-white"></span>
                                <span className="w-[1px] h-5 bg-white"></span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-yellow-400">{m.voiceDuration || '0:14'}</span>
                          </div>

                          {/* Smart Transcription block */}
                          <div className={`p-3 rounded-xl border text-xs ${theme === 'dark' ? 'bg-[#111e17] border-white/5 text-[#bdcabf]' : 'bg-emerald-50/50 border-emerald-100 text-neutral-800'}`}>
                            <div className="flex items-center gap-1.5 mb-1.5 text-[#0A8F5A] font-bold uppercase tracking-wider text-[9px]">
                              <span className="material-symbols-outlined text-[13px]">description</span>
                              Smart Transcript
                            </div>
                            <p className="leading-relaxed">"{m.voiceTranscript}"</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          {!isMe && isAiTranslateActive && m.originalText && (
                            <span className="material-symbols-outlined text-yellow-400 text-[16px] mt-1 shrink-0">translate</span>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] mt-1 pr-1 text-gray-500">{m.timestamp}</span>
                  </div>
                );
              })}

              {/* Pending response animation state */}
              {isTyping && (
                <div className="flex items-center gap-2 self-start bg-neutral-800/10 px-4 py-2 bg-[#202d25] rounded-full border border-white/5 opacity-85">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">Amina is transcribing voice note...</span>
                </div>
              )}
            </div>

            {/* Chat Input area footer matching image */}
            <div className={`p-4 sticky bottom-0 border-t ${theme === 'dark' ? 'bg-[#09160f]/95 border-white/10' : 'bg-white border-gray-200'}`}>
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3 rounded-2xl glass-effect p-2">
                <button 
                  type="button"
                  onClick={() => triggerToast("Hold to record / voice post initialized")}
                  className="p-2 text-gray-400 hover:text-[#0A8F5A]"
                >
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
                <div className="flex-1 bg-black/10 dark:bg-black/30 p-1.5 rounded-xl flex items-center gap-2 border border-white/5">
                  <input 
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    type="text" 
                    className="flex-grow bg-transparent border-none text-sm outline-none px-2 focus:ring-0 text-white placeholder:text-gray-500" 
                    placeholder="Type message..."
                  />
                  <button type="button" className="p-2 text-gray-400 hover:text-yellow-400">
                    <span className="material-symbols-outlined">sentiment_satisfied</span>
                  </button>
                </div>
                <button 
                  type="submit"
                  className="bg-[#006a41] text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-[#0A8F5A] active:scale-95 transition-all shadow-[0_0_15px_rgba(10,143,90,0.3)]"
                >
                  <span className="material-symbols-outlined">mic</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER LIVE IN-APP MINI APPLICATION SIMULATOR MODAL */}
      <AnimatePresence>
        {activeMiniApp && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={`fixed inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-[#09160f]' : 'bg-[#f8f9fa]'}`}
          >
            <header className="flex justify-between items-center px-4 h-16 bg-[#006a41] text-white">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setActiveMiniApp(null); setMiniAppSimulationMessage(""); }}
                  className="p-2 hover:bg-black/10 rounded-full"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                <span className="material-symbols-outlined text-yellow-400">{activeMiniApp.icon}</span>
                <div>
                  <h1 className="font-bold text-sm tracking-tight">{activeMiniApp.name}</h1>
                  <p className="text-[10px] text-emerald-200">Powered by AfriChat AI Engine</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white uppercase">{activeMiniApp.category}</span>
                <span className="material-symbols-outlined text-sm opacity-70">more_vert</span>
              </div>
            </header>

            <div className="flex-grow overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-6">
              {/* Styling and description */}
              <div 
                style={{ borderColor: activeMiniApp.textColor }}
                className="p-6 rounded-2xl border bg-black/10 text-center space-y-2 splash"
              >
                <div style={{ color: activeMiniApp.textColor }} className="text-3xl font-extrabold tracking-tight">
                  {activeMiniApp.name}
                </div>
                <p className="text-sm opacity-80">{activeMiniApp.description}</p>
                <p className="text-xs text-yellow-400 font-mono italic">Pricing: {activeMiniApp.screens?.[0]?.description}</p>
              </div>

              {/* Simulation Screen Content */}
              <div className="bg-neutral-800/20 rounded-2xl p-5 space-y-4 border border-white/5">
                <h3 className="text-sm font-bold border-b border-white/5 pb-2">Active Live Panel</h3>
                
                <ul className="space-y-2 text-sm">
                  {activeMiniApp.screens?.[0]?.items.map((item, idx) => (
                    <li key={idx} className="p-3 bg-neutral-900/30 rounded-xl flex items-center justify-between border border-white/5">
                      <span className="font-medium text-xs">{item}</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">Connected</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dynamic Notification simulator for in-app flow */}
              {miniAppSimulationMessage && (
                <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl text-center text-xs border border-emerald-500/30">
                  ⚡ {miniAppSimulationMessage}
                </div>
              )}

              {/* Custom action buttons */}
              <div className="space-y-3">
                {activeMiniApp.screens?.[0]?.actions.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMiniAppActionClick(act.actionType, activeMiniApp)}
                    style={{ backgroundColor: activeMiniApp.textColor, color: '#000' }}
                    className="w-full text-center py-4 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-xs"
                  >
                    🚀 {act.label}
                  </button>
                ))}
              </div>
            </div>

            <footer className="p-4 border-t border-white/10 text-center text-xs opacity-60">
              AfriPay wallet authorization will trigger transparently on pay instructions.
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE ROOT NAVIGATION CO-ORDINATOR STYLED HEADER (OWN TAILORED HEADERS ON CHATS/PROFILE FOR PIXEL PERFECTION) */}
      {activeTab !== 'home' && activeTab !== 'discover' && activeTab !== 'chats' && activeTab !== 'profile' && (
        <header className="bg-[#006a41] fixed top-0 left-0 right-0 z-40 flex justify-between items-center w-full px-5 h-16 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer" onClick={() => setActiveTab('profile')}>
              <img 
                className="w-10 h-10 rounded-full border border-white/15 object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCUrd8IdmPEwAec_n7YJHz59JrraFEHvie6GsT_mht_-RDEY3Q_vjkmdDYvbgq8nm1C2rqt2syCejFmES6YjjUiMDHFg5XfYDADdGhEwuVGlgT0Fd8yuZUDwM4Ocz_IL3pU_whFOQA1E0Qz4Ym9tak7SlhFu78xDHYwJFaOp0BelKYffJYglAsBLR-PUQzLfusE6HT0by7o7g47BI1n_7_Of40qvClr_CTwQ1P9f_XahWyFKaDZDbK6kx3bKlGeoIx5cH8iFurAGw" 
                alt="Godfrey" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#006a41] rounded-full"></div>
            </div>
            <div>
              <h1 className="font-bold text-white text-md tracking-tight">AfriChat</h1>
              <p className="text-[10px] text-emerald-200">Africa's Digital OS</p>
            </div>
          </div>

          {/* Global Controls */}
          <div className="flex items-center gap-4 text-white">
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
              className="p-1.5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 bg-white/5 border border-white/15 cursor-pointer"
              title="Toggle Light/Dark Design System"
            >
              <span className="material-symbols-outlined text-emerald-300 text-sm">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="text-[10px] font-bold tracking-tight pr-1 uppercase">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>
            
            <button onClick={() => triggerToast("Notification registry: Your Abuja Rides micro-program is deployed.")} className="hover:bg-[#0A8F5A] p-2 rounded-full transition-all">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>
      )}

      {/* VIEWPORT CANVAS (CHANGES ON TABS) */}
      <main className={`max-w-5xl mx-auto transition-all duration-300 ${activeTab === 'home' || activeTab === 'discover' || activeTab === 'chats' || activeTab === 'profile' ? 'pt-0 px-0' : 'pt-20 px-4'}`}>
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOME CONTROLLER (PERFECTLY DESIGNED TO MATCH SCR 1 SCREENSHOT) */}
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col min-h-screen bg-[#F8F9FA] pb-24"
            >
              {/* Green Hero Header Area */}
              <section className="bg-[#006A42] text-white pt-6 px-5 pb-10 flex flex-col gap-5 relative select-none rounded-b-[40px] z-25 shadow-[0_4px_20px_rgba(0,106,66,0.15)]">
                {/* Top Title/Brand Row inside green field */}
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-3">
                    {/* Double circular silhouette button as shown in top left of SCR 1 */}
                    <div 
                      onClick={() => setActiveTab('profile')}
                      className="w-10 h-10 rounded-full border-[1.5px] border-white/35 flex items-center justify-center bg-[#005434] hover:bg-[#004b2e] cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      <div className="w-7 h-7 rounded-full border-[1.5px] border-white/20 flex items-center justify-center bg-white/10">
                        <span className="material-symbols-outlined text-white text-[18px]">person</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-white text-xl sm:text-2xl tracking-normal">AfriChat</span>
                  </div>
                  
                  {/* Right Header icons: Search & Notifications */}
                  <div className="flex items-center gap-4">
                    <span 
                      onClick={() => triggerToast("Global registry filter active.")} 
                      className="material-symbols-outlined text-white text-[22px] cursor-pointer hover:opacity-80 active:scale-90 transition-all font-semibold"
                    >
                      search
                    </span>
                    <span 
                      onClick={() => triggerToast("All systems operational. No unread announcements.")} 
                      className="material-symbols-outlined text-white text-[22px] cursor-pointer hover:opacity-80 active:scale-90 transition-all"
                    >
                      notifications
                    </span>
                  </div>
                </div>

                {/* Styled Search Input Area */}
                <div className="relative mt-2">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-lg">search</span>
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text" 
                    className="w-full bg-[#055734] hover:bg-[#044a2c] focus:bg-[#033f25] border-none rounded-2xl py-3.5 pl-12 pr-11 text-white placeholder-white/55 text-[13px] tracking-normal focus:ring-1 focus:ring-white/20 transition-all outline-none"
                    placeholder="Search anything..."
                  />
                  {searchQuery ? (
                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  ) : (
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-[18px] select-none pointer-events-none">close</span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-x-2 gap-y-4 pt-3 text-center">
                  
                  {/* 1: Chats */}
                  <div 
                    onClick={() => setActiveTab('chats')} 
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] bg-white/10 rounded-[18px] border border-white/5 flex items-center justify-center group-hover:bg-white/15 hover:scale-105 active:scale-95 transition-all duration-150 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[22px]">chat</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/95 mt-0.5">Chats</span>
                  </div>

                  {/* 2: AfriPay */}
                  <div 
                    onClick={() => setActiveTab('pay')} 
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] bg-white/10 rounded-[18px] border border-white/5 flex items-center justify-center group-hover:bg-white/15 hover:scale-105 active:scale-95 transition-all duration-150 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[22px]">payments</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/95 mt-0.5">AfriPay</span>
                  </div>

                  {/* 3: AfriMarket */}
                  <div 
                    onClick={() => setIsMarketOpen(true)} 
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] bg-white/10 rounded-[18px] border border-white/5 flex items-center justify-center group-hover:bg-white/15 hover:scale-105 active:scale-95 transition-all duration-150 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[22px]">shopping_bag</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/95 mt-0.5">Market</span>
                  </div>

                  {/* 4: AfriAI */}
                  <div 
                    onClick={() => {
                      setSelectedChatId('afri-ai');
                      setActiveTab('chats');
                      triggerToast("Loaded AfriAI personal assistant thread.");
                    }} 
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] bg-white/10 rounded-[18px] border border-white/5 flex items-center justify-center group-hover:bg-white/15 hover:scale-105 active:scale-95 transition-all duration-150 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[22px]">smart_toy</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/95 mt-0.5">AfriAI</span>
                  </div>

                  {/* 5: Services */}
                  <div 
                    onClick={() => setIsServicesOpen(true)} 
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] bg-white/10 rounded-[18px] border border-white/5 flex items-center justify-center group-hover:bg-white/15 hover:scale-105 active:scale-95 transition-all duration-150 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[22px]">local_taxi</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/95 mt-0.5">Services</span>
                  </div>

                  {/* 6: Learn */}
                  <div 
                    onClick={() => setIsLearnOpen(true)} 
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] bg-white/10 rounded-[18px] border border-white/5 flex items-center justify-center group-hover:bg-white/15 hover:scale-105 active:scale-95 transition-all duration-150 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[22px]">school</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/95 mt-0.5">Learn</span>
                  </div>

                  {/* 7: Live */}
                  <div 
                    onClick={() => {
                      setIsMarketOpen(true);
                      triggerToast("Launching interactive Live Commerce feeds inside AfriMarket!");
                    }} 
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] bg-white/10 rounded-[18px] border border-white/5 flex items-center justify-center group-hover:bg-white/15 hover:scale-105 active:scale-95 transition-all duration-150 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[22px]">live_tv</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/95 mt-0.5">Live</span>
                  </div>

                  {/* 8: More */}
                  <div 
                    onClick={() => setShowCreateMenu(true)} 
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] bg-white/10 rounded-[18px] border border-white/5 flex items-center justify-center group-hover:bg-white/15 hover:scale-105 active:scale-95 transition-all duration-150 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[22px]">settings_suggest</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/95 mt-0.5">More</span>
                  </div>

                </div>
              </section>

              {/* White overlap content body container nested over green background */}
              <div className="px-5 pt-8 pb-10 space-y-7 -mt-5 bg-[#F8F9FA] rounded-t-[36px] relative z-20">
                
                {/* Promo Segment: Build Your App in Minutes */}
                <section className="bg-white rounded-[28px] border border-neutral-100 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-1 pr-4 space-y-2.5">
                    <h2 className="text-[20px] font-extrabold text-neutral-900 tracking-tight leading-snug">
                      Build Your App in Minutes
                    </h2>
                    <p className="text-[13px] text-neutral-500 font-medium leading-relaxed max-w-[220px]">
                      Create school portals, ride apps, delivery apps and more with AI.
                    </p>
                    <button 
                      onClick={() => setActiveTab('discover')}
                      className="bg-[#006A42] hover:bg-[#005434] font-bold text-white text-[13px] px-[22px] py-3.5 rounded-2xl tracking-normal mt-2 transition-all active:scale-95 hover:shadow-sm"
                    >
                      Create Mini App
                    </button>
                  </div>
                  <div className="w-[110px] sm:w-[120px] flex justify-end shrink-0 select-none">
                    <img 
                      alt="Mini App Builder Graphics" 
                      className="w-full h-auto max-h-[105px] object-contain cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-200" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmnIQ86LDdmfMPp1DY-aWdpxRamuijUDkLNbsU__T7TQqJPnofovaTr4VXz_d_4aM8kxjstNjYC9oyJvmedei6kV-WzNpe0cEt5seTYRbc1tEkSds0Mqh_27qEbJ3MJaShNu1I0Lr1Bg5JghL0hru6DdMBHvuucamoBfrNWo89tZ8dwZX2Enlf_SE6GmBiv3NMaSds1-9XSUApeSqclh3uersO3MFixY9mAEIQLTpBVs1TIgFB7zXsPoxgnJyF9HDqObpbIgEwxd4"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </section>

                {/* AI Recommendation Feed matching PRD */}
                <section className="bg-gradient-to-r from-emerald-900/5 to-yellow-500/5 rounded-3xl p-5 border border-emerald-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-extrabold uppercase tracking-wide">
                    <span className="material-symbols-outlined text-sm text-[16px] text-[#F4B400]">auto_awesome</span>
                    AfriAI Smart Suggestion
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[13.5px] text-neutral-900 dark:text-white leading-tight">Create a School Portal Mini App</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">Based on your transactions inside Abuja, we recommend compiling a customized SchoolPortal template with direct USSD bill clearance.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsAppWizardOpen(true);
                      triggerToast("Prepared School Portal setup wizard parameters with AfriAI guidance.");
                    }}
                    className="w-full bg-[#006A42] hover:bg-[#005434] text-white py-3 rounded-2xl font-bold text-xs tracking-wide transition-all active:scale-95 cursor-pointer"
                  >
                    ⚡ Let AI Compile Design Specs
                  </button>
                </section>

                {/* Recommended Mini Apps Shelf */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="font-extrabold text-neutral-900 text-[15px] tracking-tight">
                      Recommended Mini Apps
                    </h3>
                    <button 
                      onClick={() => setActiveTab('discover')} 
                      className="text-[#006a41] font-extrabold text-xs flex items-center gap-0.5 hover:underline"
                    >
                      View All 
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    
                    {/* 1: RideGo */}
                    <div 
                      onClick={() => {
                        const target = staticMiniApps.find(a => a.id === 'ridego') || staticMiniApps[0];
                        const generatedEquivalent = customMiniApps.find(ca => ca.category === target.category) || {
                          id: target.id,
                          name: target.name,
                          description: target.description,
                          category: target.category,
                          icon: target.icon,
                          bgColor: target.bgColor,
                          textColor: target.textColor,
                          screens: [
                            {
                              title: `${target.name} Portal`,
                              description: "Interactive mock resource portal",
                              items: ["Standard app feature list item 1", "Standard app feature list item 2"],
                              actions: [{ label: "Pay commission", actionType: "pay" }]
                            }
                          ]
                        };
                        setActiveMiniApp(generatedEquivalent);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-[66px] h-[66px] bg-[#E8F4FF] rounded-[22px] flex items-center justify-center border border-blue-50/10 shadow-sm group-hover:-translate-y-1 group-hover:shadow transition-all duration-200">
                        <span className="material-symbols-outlined text-[28px] text-[#1D7AFC]">directions_car</span>
                      </div>
                      <span className="text-[11px] font-semibold tracking-tight text-neutral-700 text-center">RideGo</span>
                    </div>

                    {/* 2: SchoolPortal */}
                    <div 
                      onClick={() => {
                        const target = staticMiniApps.find(a => a.id === 'schoolportal') || staticMiniApps[1];
                        const generatedEquivalent = customMiniApps.find(ca => ca.category === target.category) || {
                          id: target.id,
                          name: target.name,
                          description: target.description,
                          category: target.category,
                          icon: target.icon,
                          bgColor: target.bgColor,
                          textColor: target.textColor,
                          screens: [
                            {
                              title: `${target.name} Portal`,
                              description: "Interactive mock resource portal",
                              items: ["Standard app feature list item 1", "Standard app feature list item 2"],
                              actions: [{ label: "Pay commission", actionType: "pay" }]
                            }
                          ]
                        };
                        setActiveMiniApp(generatedEquivalent);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-[66px] h-[66px] bg-[#FFF2E0] rounded-[22px] flex items-center justify-center border border-orange-50/10 shadow-sm group-hover:-translate-y-1 group-hover:shadow transition-all duration-200">
                        <span className="material-symbols-outlined text-[28px] text-[#FF9500]">school</span>
                      </div>
                      <span className="text-[11px] font-semibold tracking-tight text-neutral-700 text-center">SchoolPortal</span>
                    </div>

                    {/* 3: ShopEasy */}
                    <div 
                      onClick={() => {
                        const target = staticMiniApps.find(a => a.id === 'shopeasy') || staticMiniApps[2];
                        const generatedEquivalent = customMiniApps.find(ca => ca.category === target.category) || {
                          id: target.id,
                          name: target.name,
                          description: target.description,
                          category: target.category,
                          icon: target.icon,
                          bgColor: target.bgColor,
                          textColor: target.textColor,
                          screens: [
                            {
                              title: `${target.name} Portal`,
                              description: "Interactive mock resource portal",
                              items: ["Standard app feature list item 1", "Standard app feature list item 2"],
                              actions: [{ label: "Pay commission", actionType: "pay" }]
                            }
                          ]
                        };
                        setActiveMiniApp(generatedEquivalent);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-[66px] h-[66px] bg-[#FFF0F0] rounded-[22px] flex items-center justify-center border border-red-50/10 shadow-sm group-hover:-translate-y-1 group-hover:shadow transition-all duration-200">
                        <span className="material-symbols-outlined text-[28px] text-[#FF3B30]">shopping_cart</span>
                      </div>
                      <span className="text-[11px] font-semibold tracking-tight text-neutral-700 text-center">ShopEasy</span>
                    </div>

                    {/* 4: MediCare */}
                    <div 
                      onClick={() => {
                        const target = staticMiniApps.find(a => a.id === 'medicare') || staticMiniApps[3];
                        const generatedEquivalent = customMiniApps.find(ca => ca.category === target.category) || {
                          id: target.id,
                          name: target.name,
                          description: target.description,
                          category: target.category,
                          icon: target.icon,
                          bgColor: target.bgColor,
                          textColor: target.textColor,
                          screens: [
                            {
                              title: `${target.name} Portal`,
                              description: "Interactive mock resource portal",
                              items: ["Standard app feature list item 1", "Standard app feature list item 2"],
                              actions: [{ label: "Pay commission", actionType: "pay" }]
                            }
                          ]
                        };
                        setActiveMiniApp(generatedEquivalent);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-[66px] h-[66px] bg-[#EAF9EE] rounded-[22px] flex items-center justify-center border border-emerald-50/10 shadow-sm group-hover:-translate-y-1 group-hover:shadow transition-all duration-200">
                        <span className="material-symbols-outlined text-[28px] text-[#34C759]">medical_services</span>
                      </div>
                      <span className="text-[11px] font-semibold tracking-tight text-neutral-700 text-center">MediCare</span>
                    </div>

                  </div>
                </section>

                {/* Recent Chats Sheet */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="font-extrabold text-neutral-900 text-[15px] tracking-tight">
                      Recent Chats
                    </h3>
                    <span 
                      onClick={() => triggerToast("Filter chat rooms by unread state.")} 
                      className="material-symbols-outlined opacity-60 text-[20px] cursor-pointer hover:opacity-100 transition-all"
                    >
                      more_horiz
                    </span>
                  </div>

                  {/* List of exactly three chats to perfectly mimic Screen 1 */}
                  <div className="space-y-3">
                    
                    {/* chat 1: Best Friends */}
                    {chats.find(c => c.id === 'amina-k') && (() => {
                      const chat = chats.find(c => c.id === 'amina-k')!;
                      return (
                        <div 
                          onClick={() => setSelectedChatId('amina-k')}
                          className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-neutral-100 hover:border-emerald-500 shadow-sm active:bg-neutral-50 transition-all cursor-pointer"
                        >
                          <div className="relative shrink-0 select-none">
                            <img 
                              className="w-[50px] h-[50px] sm:w-14 sm:h-14 rounded-full object-cover shadow-inner" 
                              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" 
                              alt="Best Friends" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 truncate">
                                {chat.name}
                              </h4>
                              <span className="text-[10px] sm:text-xs text-gray-400 font-bold whitespace-nowrap">
                                {chat.lastMessageTime}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 truncate mt-1">
                              {chat.lastMessageText}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* chat 2: Work Group */}
                    {chats.find(c => c.id === 'work-group') && (() => {
                      const chat = chats.find(c => c.id === 'work-group')!;
                      return (
                        <div 
                          onClick={() => setSelectedChatId('work-group')}
                          className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-neutral-100 hover:border-emerald-500 shadow-sm active:bg-neutral-50 transition-all cursor-pointer"
                        >
                          <div className="relative shrink-0 select-none">
                            <div className="w-[50px] h-[50px] sm:w-14 sm:h-14 rounded-full bg-[#FED7AA] flex items-center justify-center relative select-none text-orange-850">
                              <span className="material-symbols-outlined text-[28px]">groups</span>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 truncate">
                                {chat.name}
                              </h4>
                              <span className="text-[10px] sm:text-xs text-gray-400 font-bold whitespace-nowrap">
                                {chat.lastMessageTime}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 truncate mt-1">
                              {chat.lastMessageText}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* chat 3: Mom */}
                    {chats.find(c => c.id === 'mom') && (() => {
                      const chat = chats.find(c => c.id === 'mom')!;
                      return (
                        <div 
                          onClick={() => setSelectedChatId('mom')}
                          className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-neutral-100 hover:border-emerald-500 shadow-sm active:bg-neutral-50 transition-all cursor-pointer"
                        >
                          <div className="relative shrink-0 select-none">
                            <img 
                              className="w-[50px] h-[50px] sm:w-14 sm:h-14 rounded-full object-cover shadow-inner" 
                              src="https://images.unsplash.com/photo-1473830394358-91588751b241?w=150&auto=format&fit=crop&q=80" 
                              alt="Mom" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gray-300 border-2 border-white rounded-full"></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 truncate">
                                {chat.name}
                              </h4>
                              <span className="text-[10px] sm:text-xs text-gray-400 font-bold whitespace-nowrap">
                                {chat.lastMessageTime}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 truncate mt-1">
                              {chat.lastMessageText}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </section>

              </div>
            </motion.div>
          )}

          {/* TAB 2: CHATS LIST (REDESIGNED TO MATCH MOCKUP PERFECTLY) */}
          {activeTab === 'chats' && (
            <motion.div 
              key="chats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col min-h-screen bg-[#f8f9fa] dark:bg-[#09110d] pb-24 text-on-surface"
            >
              {/* Custom TopAppBar for Chats */}
              <header className="flex justify-between items-center px-4 h-16 w-full z-40 bg-white/95 dark:bg-[#0e1b14]/95 backdrop-blur-md sticky top-0 border-b border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setActiveTab('profile')}
                    className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 cursor-pointer hover:opacity-90 active:scale-95 transition-transform"
                  >
                    <img 
                      alt="User Profile" 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYtwbxp_VB5JHh27eGaJWpRbY1k_3Ybsczc9VLlyD4nV7L8uGxtXpg8Dd-iS4-L3SEQKArd4bR_LmSyfHyM5O4yIkUKEiHHTgqtcHTiC16QudLo-oQ9A2v63uXFHcoIJJD2GTAbPeS0eFwZc6zTm4llLbdpbni4lHF5Pt3qTLp5YpCzOeBIzekXM-8RR4PBcJTyGtDJKE4V9-bsW-Be_z1Hk_wG4Nh_9PjiCte-ml1Tb5ykb9dJgYFF82WFn44e5yZ74xW3wfmdz0" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-md font-bold text-[#006a41] dark:text-[#6ddb9f] tracking-tight">AfriChat</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full items-center gap-2 border border-emerald-100 dark:border-emerald-900/30">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-[#6ddb9f] text-[18px]">account_balance_wallet</span>
                    <span className="text-[11px] font-bold text-[#006a41] dark:text-[#6ddb9f]">$1,250.00</span>
                  </div>
                  <button 
                    onClick={() => {
                      setTheme(theme === 'light' ? 'dark' : 'light');
                      triggerToast(`Switched to ${theme === 'light' ? 'Dark' : 'Light'} theme.`);
                    }} 
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-gray-500 hover:text-emerald-600">
                      {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                  </button>
                  <button 
                    onClick={() => triggerToast("System settings: Verified AfriPay channels active.")} 
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-gray-500">more_vert</span>
                  </button>
                </div>
              </header>

              {/* Filter Bar / Tabs */}
              <div className="sticky top-16 z-30 bg-white/90 dark:bg-[#0e1b14]/90 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between px-4 overflow-x-auto no-scrollbar">
                  <div className="flex gap-6 h-12 items-center whitespace-nowrap">
                    <button 
                      onClick={() => setChatFilter('all')}
                      className={`font-semibold text-xs px-1 h-full flex items-center transition-all ${
                        chatFilter === 'all' 
                          ? 'border-b-2 border-[#006a41] dark:border-[#6ddb9f] text-[#006a41] dark:text-[#6ddb9f] font-bold' 
                          : 'text-gray-500 hover:text-emerald-600'
                      }`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setChatFilter('groups')}
                      className={`font-semibold text-xs px-1 h-full flex items-center transition-all ${
                        chatFilter === 'groups' 
                          ? 'border-b-2 border-[#006a41] dark:border-[#6ddb9f] text-[#006a41] dark:text-[#6ddb9f] font-bold' 
                          : 'text-gray-500 hover:text-emerald-600'
                      }`}
                    >
                      Groups
                    </button>
                    <button 
                      onClick={() => setChatFilter('channels')}
                      className={`font-semibold text-xs px-1 h-full flex items-center transition-all ${
                        chatFilter === 'channels' 
                          ? 'border-b-2 border-[#006a41] dark:border-[#6ddb9f] text-[#006a41] dark:text-[#6ddb9f] font-bold' 
                          : 'text-gray-500 hover:text-emerald-600'
                      }`}
                    >
                      Channels
                    </button>
                    <button 
                      onClick={() => setChatFilter('voicerooms')}
                      className={`font-semibold text-xs px-1 h-full flex items-center transition-all ${
                        chatFilter === 'voicerooms' 
                          ? 'border-b-2 border-[#006a41] dark:border-[#6ddb9f] text-[#006a41] dark:text-[#6ddb9f] font-bold' 
                          : 'text-gray-500 hover:text-emerald-600'
                      }`}
                    >
                      Voice Rooms
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat List Container */}
              <div className="w-full px-4 py-4 space-y-4">
                {/* Embedded Search Input */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text" 
                    className="w-full bg-white dark:bg-[#12241a] border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 outline-none text-xs text-on-surface focus:border-[#006a41] dark:focus:border-[#6ddb9f]"
                    placeholder="Search messages, hubs and news..."
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>

                {/* Vertical list of chats */}
                <div className="space-y-2.5">
                  
                  {/* FLAGSHIP VOICE ROOM (Show always when voicerooms selected, or in All if matches search) */}
                  {(chatFilter === 'all' || chatFilter === 'voicerooms') && 
                   (!searchQuery || "lagos tech mixer scaling fintech in nigeria".includes(searchQuery.toLowerCase())) && (
                    <div 
                      onClick={() => {
                        setIsVoiceRoomActive(true);
                        triggerToast("Entering Lagos Tech Mixer room...");
                      }}
                      className="group flex flex-col p-4 bg-emerald-50/70 hover:bg-emerald-50 dark:bg-[#12241a]/60 dark:hover:bg-[#12241a] rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 hover:border-emerald-500/30 hover:shadow-xs transition-all cursor-pointer animate-pulse-slow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#006a41] to-[#0A8F5A] flex items-center justify-center text-white relative shadow-sm">
                          <span className="material-symbols-outlined text-3xl animate-bounce">spatial_audio_off</span>
                          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h3 className="text-xs font-extrabold text-emerald-800 dark:text-[#6ddb9f] flex items-center gap-1.5 uppercase tracking-wide">
                              Live Voice Room
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                            </h3>
                            <span className="text-[10px] text-[#006a41] font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">headphones</span>
                              142 listening
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">Lagos Tech Mixer</h4>
                          <p className="text-xs text-secondary font-medium truncate mt-0.5">Topic: Scaling Fintech in Nigeria</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                      </div>
                    </div>
                  )}

                  {/* 1. KOFI MENSAH (Individual Chat) */}
                  {(chatFilter === 'all') && 
                   (!searchQuery || "kofi mensah the trade agreement is signed".includes(searchQuery.toLowerCase())) && (
                    <div 
                      onClick={() => setSelectedChatId("amina-k")} // Link to existing amina-k chat flow or general chat
                      className="group flex items-center p-3 gap-4 bg-white dark:bg-[#12241a]/30 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      <div className="relative flex-shrink-0">
                        <img 
                          alt="Kofi Mensah" 
                          className="w-14 h-14 rounded-full object-cover" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0oaPhMV6aQlYQ_s3UbJn8hAIF9_CfRX2Y0Qh1XVfw1gFPDms-OPdIwnriLLE1GsjifEsh7qMh0ycTiVjM6UknN03sOg-0RC4Pi0Q_CdNcosytOeqNBDRq7qfj20viyjyB8qs3lW784q2a5VQ5-VWL4wqcHpwTFfsoUURbyv87Vr5DIdiqmCAmE0HGeWfJPHZDXvXOcFrJ2O6-I87mrTsvCkUls_QJnoeznpAjZ_XIDBIkqLGpxSD2GiVVc6V3SuzW6kW6Uvz8iCU" 
                        />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#09110d] rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="text-xs font-bold text-neutral-900 dark:text-gray-100 truncate">Kofi Mensah</h3>
                          <span className="text-[10px] text-gray-400 font-medium">10:42 AM</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-[#6ddb9f]" style={{ fontVariationSettings: "'FILL' 1" }}>g_translate</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Translated: "The trade agreement is signed!"</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="bg-[#006a41] dark:bg-emerald-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">2</span>
                      </div>
                    </div>
                  )}

                  {/* 2. TECH HUB (Group Chat) */}
                  {(chatFilter === 'all' || chatFilter === 'groups') && 
                   (!searchQuery || "tech hub amara who's joining the lagos dev meetup tomorrow".includes(searchQuery.toLowerCase())) && (
                    <div 
                      onClick={() => {
                        setSelectedChatId("work-group");
                        triggerToast("Opening Tech Hub group discussion...");
                      }}
                      className="group flex items-center p-3 gap-4 bg-white dark:bg-[#12241a]/30 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/20 flex items-center justify-center border border-teal-100/35 dark:border-teal-900/10 flex-shrink-0">
                        <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-3xl">hub</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="text-xs font-bold text-neutral-900 dark:text-gray-100 truncate">Tech Hub  🚀</h3>
                          <span className="text-[10px] text-gray-400 font-medium">09:15 AM</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">Amara:</span> Who's joining the Lagos dev meetup tomorrow?
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="bg-amber-400 text-amber-950 text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">12</span>
                      </div>
                    </div>
                  )}

                  {/* 3. GLOBAL NEWS (Channel) */}
                  {(chatFilter === 'all' || chatFilter === 'channels') && 
                   (!searchQuery || "global news breaking new economic digital policies".includes(searchQuery.toLowerCase())) && (
                    <div 
                      onClick={() => triggerToast("Opening Global News Broadcast feed...")}
                      className="group flex items-center p-3 gap-4 bg-white dark:bg-[#12241a]/30 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center border border-amber-100/35 dark:border-[#bdcabf]/30 overflow-hidden flex-shrink-0">
                        <img 
                          alt="Global News" 
                          className="w-full h-full object-cover" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBruK4BJek998zYQlNzNBm1AAv4qzj_jlFtD55T45o7GJXa4ndK5LhBfClMW0TetA86_hatq3iocnGh9HfmB96Yih2KR5YHRt9Qh0AVv_nS5i-Gu_8tq4d9QlovRnSOA_GC0CqBeJLV9nBhnpIbwYZY798MWdQ41G6EHBrcHIF4rSzGhL2F9y7-JEuM02SZs1WxzGXdNOWe2o_ymZuABO2xv0xS-0MDRBpxlmmXyy0afPPYKlj6KxK0BBP8E56IwxkzUnwC6CTQis0" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <div className="flex items-center gap-1">
                            <h3 className="text-xs font-bold text-neutral-900 dark:text-gray-100 truncate">Global News</h3>
                            <span className="material-symbols-outlined text-emerald-600 dark:text-[#6ddb9f] text-[15px] fill-icon" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">08:00 AM</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Breaking: New economic digital policies announced for the region...</p>
                      </div>
                      <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                    </div>
                  )}

                  {/* 4. ZAINAB ALIYU (Individual Chat) */}
                  {(chatFilter === 'all') && 
                   (!searchQuery || "zainab aliyu details for marketplace order".includes(searchQuery.toLowerCase())) && (
                    <div 
                      onClick={() => {
                        triggerToast("Direct secure chat with Zainab Aliyu initiated.");
                      }}
                      className="group flex items-center p-3 gap-4 bg-white dark:bg-[#12241a]/30 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      <img 
                        alt="Zainab Aliyu" 
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVWx6g4iNSXz322s-exe0TqhkuWkeYj5aEF94I25LKekP9I6GTZ-YDVjVKi3w2akQEQxBGQ9mFYKMjiezSd6VxVA2nY6dQzk5yGDKP7XXr-HwPpneKHnsYEi97LnJ7Cbfm5yvxY5OY7pusN1FNRbxry-_lnJpAtXpLEVDbJXhyUFhvNPLQrHf8p0o9-W4flBntcW-cVWDgU8-PTbQvhkTsGUXz3-f5uyk-lhxzDl2M3EONHpQ8lP6_f_6hVwwdhwgNOJgnSrzZYi0" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="text-xs font-bold text-neutral-900 dark:text-gray-100 truncate">Zainab Aliyu</h3>
                          <span className="text-[10px] text-gray-400 font-medium">Yesterday</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">I've sent the payment details for the marketplace order.</p>
                      </div>
                      <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                    </div>
                  )}

                  {/* 5. FATIMA DIOP (Muted/read Individual Chat) */}
                  {(chatFilter === 'all') && 
                   (!searchQuery || "fatima diop conference call starts in".includes(searchQuery.toLowerCase())) && (
                    <div 
                      onClick={() => triggerToast("Direct secure chat with Fatima Diop...")}
                      className="group flex items-center p-3 gap-4 bg-white dark:bg-[#12241a]/30 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 hover:shadow-sm transition-all duration-200 cursor-pointer opacity-80"
                    >
                      <img 
                        alt="Fatima Diop" 
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAF_FPsprLFHJSXhLB4mBg0tAZjPORKesgzAmrcF2qfXN8xxsQ0ShKl1Rjgv0d_8k3K5LVz_AIgsk0OWfc1244mdvdcVC0kYItNCF6yXu1HCOsAXHgRandA1mYICmNzCfD63AIFhG94MH1zpEBuRUkc4bILsDcxcnJGsQ9imIymWuPe3M-3LRJkMl-l7QMUKSUy-HMisytjXpfwsQNpXOUdoCKWTruHYnM_xCHUim_Nqf71QTcgdYHJVP-KGx5D8y_Rfr5ZFRl63w" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="text-xs font-bold text-neutral-900 dark:text-gray-100 truncate">Fatima Diop</h3>
                          <span className="text-[10px] text-gray-400 font-medium">Tuesday</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">done_all</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">The conference call starts in 5 minutes.</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                    </div>
                  )}

                  {/* AI COMPANION (Always handy in chats) */}
                  {(chatFilter === 'all') && 
                   (!searchQuery || "afriai artificial intelligence assistant business builder".includes(searchQuery.toLowerCase())) && (
                    <div 
                      onClick={() => {
                        setSelectedChatId("afri-ai");
                        triggerToast("AfriAI workspace active.");
                      }}
                      className="group flex items-center p-3 gap-4 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-2xl border border-emerald-50 dark:border-emerald-950/20 hover:border-emerald-500/30 hover:shadow-xs transition-all duration-200 cursor-pointer"
                    >
                      <img 
                        alt="AfriAI Bot" 
                        className="w-14 h-14 rounded-full object-cover border border-emerald-500/20 flex-shrink-0" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmnIQ86LDdmfMPp1DY-aWdpxRamuijUDkLNbsU__T7TQqJPnofovaTr4VXz_d_4aM8kxjstNjYC9oyJvmedei6kV-WzNpe0cEt5seTYRbc1tEkSds0Mqh_27qEbJ3MJaShNu1I0Lr1Bg5JghL0hru6DdMBHvuucamoBfrNWo89tZ8dwZX2Enlf_SE6GmBiv3NMaSds1-9XSUApeSqclh3uersO3MFixY9mAEIQLTpBVs1TIgFB7zXsPoxgnJyF9HDqObpbIgEwxd4" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <div className="flex items-center gap-1">
                            <h3 className="text-xs font-bold text-neutral-900 dark:text-gray-100 truncate">AfriAI Workspace</h3>
                            <span className="px-1.5 py-0.5 bg-yellow-400/20 text-yellow-500 dark:text-yellow-400 text-[8px] font-black rounded uppercase">Built-In AI</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">Now</span>
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-[#6ddb9f] font-medium truncate">Try: "Start a clothing business in Abuja"</p>
                      </div>
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">arrow_forward</span>
                    </div>
                  )}

                  {/* If no items match search query */}
                  {searchQuery && (
                    <div className="text-center py-8 text-xs text-gray-400">
                      No matching chats found for "{searchQuery}"
                    </div>
                  )}

                </div>
              </div>

              {/* Floating Action Button inside Chat list to compile/create */}
              <button 
                onClick={() => setShowCreateMenu(true)}
                className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-tr from-[#006a41] to-[#0A8F5A] text-white rounded-2xl shadow-xl hover:rotate-90 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center z-40"
              >
                <span className="material-symbols-outlined text-[28px]">add_circle</span>
              </button>
            </motion.div>
          )}

          {/* TAB 3: AFRIPAY SUPER WALLET (DARK THEME SYSTEM PARADIGM - SCREEN 3) */}
          {activeTab === 'pay' && (
            <motion.div 
              key="pay"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Wallet Hero Card Panel matches image 3 precisely */}
              <section className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#09160f] to-[#15221b] border border-white/10 shadow-2xl">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-yellow-400/5 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col items-center py-4 text-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Total Balance</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-yellow-400">{displayWalletCurrency}</span>
                    <h1 className="text-4xl font-extrabold tracking-tighter">
                      {isCurrencyConverted 
                        ? balance.toLocaleString() 
                        : Math.round(balance * conversionRate).toLocaleString()
                      }
                      <span className="opacity-50 text-xl">.00</span>
                    </h1>
                  </div>

                  <div className="mt-6 w-full flex flex-col gap-4">
                    <button 
                      onClick={() => setIsAddingMoney(true)}
                      className="w-full bg-yellow-400 text-neutral-900 py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2 hover:bg-yellow-500 active:scale-95 transition-transform"
                    >
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Add Money
                    </button>

                    {/* Instant African Conversion Toggle */}
                    <div className="flex items-center justify-between bg-[#111e17] border border-white/5 p-3 rounded-xl mt-2">
                      <div className="flex items-center gap-3 text-left">
                        <span className="material-symbols-outlined text-[#0A8F5A] text-2xl">currency_exchange</span>
                        <div>
                          <p className="text-xs font-bold">Instant African Conversion</p>
                          <p className="text-[10px] text-gray-400">Convert Nigeria ₦ and Kenya KES instantly</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          checked={isCurrencyConverted} 
                          onChange={() => {
                            setIsCurrencyConverted(!isCurrencyConverted);
                            triggerToast(isCurrencyConverted ? "Converted currency context to KES" : "Switched currency to NGN");
                          }}
                          className="sr-only peer" 
                          type="checkbox"
                        />
                        <div className="w-11 h-6 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A8F5A]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              {/* Add Money dynamic overlay/drawer */}
              {isAddingMoney && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-neutral-900/40 rounded-3xl border border-yellow-500/10 space-y-4"
                >
                  <h3 className="text-xs font-bold text-[#0A8F5A] uppercase tracking-wider">Top Up Wallet</h3>
                  <div className="flex gap-2">
                    <input 
                      value={addAmount} 
                      onChange={(e) => setAddAmount(e.target.value)}
                      type="number" 
                      className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs"
                      placeholder="Amount in NGN"
                    />
                    <button onClick={handleAddMoney} className="bg-[#0A8F5A] text-white px-4 py-2 rounded-xl text-xs font-bold">
                      Add
                    </button>
                    <button onClick={() => setIsAddingMoney(false)} className="bg-neutral-800 text-gray-300 px-4 py-2 rounded-xl text-xs">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Action Bar Bento Grid matching screenshot 3 exactly */}
              <section className="grid grid-cols-4 gap-3 text-center">
                <button 
                  onClick={() => triggerToast("Launching secure QR Code Scanner...")}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 dark:bg-[#15221b] rounded-2xl border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                    <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Scan</span>
                </button>

                <button 
                  onClick={() => triggerToast("Send Money: Please verify recipient AfriID")}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 dark:bg-[#15221b] rounded-2xl border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center text-[#6ddb9f]">
                    <span className="material-symbols-outlined text-[28px]">send</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Send</span>
                </button>

                <button 
                  onClick={() => triggerToast("Request payment: Send link to groups")}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 dark:bg-[#15221b] rounded-2xl border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-neutral-300/10 flex items-center justify-center text-neutral-300">
                    <span className="material-symbols-outlined text-[28px]">request_quote</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Request</span>
                </button>

                <button 
                  onClick={() => triggerToast("Select active business storefront checkout")}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 dark:bg-[#15221b] rounded-2xl border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-orange-400/10 flex items-center justify-center text-orange-400">
                    <span className="material-symbols-outlined text-[28px]">storefront</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pay</span>
                </button>
              </section>

              {/* Spend Insight Widgets (from image 3) */}
              <section className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 dark:bg-[#111e17] p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Weekly Spend</p>
                  <p className="text-sm font-extrabold">{displayWalletCurrency}12,400</p>
                  <div className="w-full bg-neutral-800 h-1 rounded-full mt-3 overflow-hidden">
                    <div className="bg-[#0A8F5A] h-full w-2/3"></div>
                  </div>
                </div>

                <div className="bg-white/5 dark:bg-[#111e17] p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Goal: Savannah Car</p>
                  <p className="text-sm font-extrabold">{displayWalletCurrency}2.4M / 5M</p>
                  <div className="w-full bg-neutral-800 h-1 rounded-full mt-3 overflow-hidden">
                    <div className="bg-yellow-400 h-full w-[48%]"></div>
                  </div>
                </div>
              </section>

              {/* Recent Transactions List with detailed conversion tags */}
              <section className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-[#6ddb9f]">Recent Transactions</h2>
                  <button onClick={() => triggerToast("Historical statements downloaded")} className="text-yellow-400 text-[10px] font-bold">View All</button>
                </div>

                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 dark:bg-[#111e17] rounded-3xl border border-white/5 hover:border-yellow-400/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-yellow-400">
                            <span className="material-symbols-outlined">
                              {tx.category === 'deposit' ? 'account_balance_wallet' : tx.category === 'travel' ? 'language' : 'shopping_cart'}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-bold">{tx.title}</p>
                            <p className="text-[10px] text-gray-500">{tx.date}, {tx.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-bold ${isPositive ? 'text-[#6ddb9f]' : 'text-rose-450'}`}>
                            {isPositive ? '+' : '-'}{tx.currency}{Math.abs(tx.amount).toLocaleString()}
                          </p>
                          <span className="text-[8px] uppercase font-bold text-gray-500 tracking-wider">
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Promoted card layout matches bottom of wallet */}
              <section className="p-6 rounded-3xl relative overflow-hidden group cursor-pointer glass-effect bg-gradient-to-br from-[#111e17] to-[#09160f] border border-emerald-500/10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="bg-[#006a41]/30 text-[#6ddb9f] px-2 py-0.5 rounded text-[8px] font-bold uppercase border border-[#006a41]/50">New Feature</span>
                    <h3 className="text-sm font-extrabold text-white mt-1">Virtual USD Card</h3>
                    <p className="text-xs text-gray-400">Pay for international services instantly with 0% markup fee.</p>
                  </div>
                  <div className="w-14 h-14 opacity-25">
                    <span className="material-symbols-outlined text-[54px] text-yellow-400">credit_card</span>
                  </div>
                </div>
                <button onClick={() => triggerToast("Opening USD card application platform")} className="mt-4 text-yellow-400 text-xs font-bold flex items-center gap-1">
                  Get Started <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </section>
            </motion.div>
          )}

          {/* TAB 4: DISCOVER MINI-PROGRAMS MARKETPLACE (SCREEN 4) */}
          {activeTab === 'discover' && (
            <motion.div 
              key="discover"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col min-h-screen bg-[#F8F9FA] pb-24"
            >
              {/* Premium Dark Green Header Band for Discover page matching screen 2 */}
              <header className="bg-[#006A42] text-white pt-6 px-5 pb-6 flex items-center justify-between select-none shadow-[0_2px_10px_rgba(0,106,66,0.1)]">
                <div className="flex items-center gap-3">
                  {/* Glossy Orbit Sphere style logo on left of "Discover" */}
                  <div className="w-[34px] h-[34px] rounded-full overflow-hidden bg-[#2D3130] flex items-center justify-center border border-white/20 relative shadow-inner select-none pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-b-xl"></div>
                    <span className="material-symbols-outlined text-white text-[16px] animate-spin-slow">explore</span>
                  </div>
                  <span className="font-extrabold text-white text-xl tracking-normal">Discover</span>
                </div>
                
                {/* Notification bell on the right */}
                <button 
                  onClick={() => triggerToast("You are up to date. All system indexes synchronized.")}
                  className="hover:bg-[#005434] p-2 rounded-full transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-white text-[22px]">notifications</span>
                </button>
              </header>

              {/* Styled Search input row */}
              <section className="px-5 mt-5">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[20px] select-none pointer-events-none">search</span>
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-neutral-200/90 rounded-2xl py-3.5 pl-12 pr-11 text-neutral-800 placeholder-neutral-400/80 text-[13px] font-semibold tracking-normal shadow-[0_1px_3px_rgba(0,0,0,0.02)] focus:border-[#006A42] hover:border-neutral-300 transition-all outline-none"
                    placeholder="Mini apps, businesses, jobs, events, et..."
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-all">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              </section>

              {/* Horizontal Scroll category nodes (MINI APPS, BUSINESSES, JOBS) */}
              <section className="px-5 mt-4 select-none">
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hidden">
                  
                  {/* Card 1: MINI APPS */}
                  <div 
                    onClick={() => triggerToast("Mini apps catalogue filtered. Scroll down to view available modules.")}
                    className="w-[126px] h-[126px] sm:w-[135px] sm:h-[135px] shrink-0 rounded-[22px] relative overflow-hidden bg-black group cursor-pointer hover:shadow-md transition-shadow active:scale-95 duration-200"
                  >
                    <img 
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                      src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&q=80"
                      alt="Mini Apps Category"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>
                    <span className="absolute bottom-3 left-4 text-[10px] font-black tracking-wider text-white uppercase font-sans">
                      Mini Apps
                    </span>
                  </div>

                  {/* Card 2: BUSINESSES */}
                  <div 
                    onClick={() => triggerToast("Local businesses and stores list centered below.")}
                    className="w-[126px] h-[126px] sm:w-[135px] sm:h-[135px] shrink-0 rounded-[22px] relative overflow-hidden bg-black group cursor-pointer hover:shadow-md transition-shadow active:scale-95 duration-200"
                  >
                    <img 
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                      src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80"
                      alt="Businesses Category"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>
                    <span className="absolute bottom-3 left-4 text-[10px] font-black tracking-wider text-white uppercase font-sans">
                      Businesses
                    </span>
                  </div>

                  {/* Card 3: JOBS */}
                  <div 
                    onClick={() => triggerToast("Active recruitment postings centered below.")}
                    className="w-[126px] h-[126px] sm:w-[135px] sm:h-[135px] shrink-0 rounded-[22px] relative overflow-hidden bg-black group cursor-pointer hover:shadow-md transition-shadow active:scale-95 duration-200"
                  >
                    <img 
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80"
                      alt="Jobs Category"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>
                    <span className="absolute bottom-3 left-4 text-[10px] font-black tracking-wider text-white uppercase font-sans">
                      Jobs
                    </span>
                  </div>

                </div>
              </section>

              {/* Trending Mini Apps */}
              <section className="space-y-3">
                <div className="flex justify-between items-center px-5 mt-6">
                  <h3 className="font-extrabold text-[#111e17] text-[15px] tracking-tight">Trending Mini Apps</h3>
                  <button 
                    onClick={() => triggerToast("All system integrated microprograms are fully synchronized.")} 
                    className="text-[#006a41] font-extrabold text-[12px] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 px-5">
                  
                  {/* AfriPay */}
                  <div 
                    onClick={() => {
                      setActiveTab('pay');
                      triggerToast("Launching AfriPay secure wallet module...");
                    }} 
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-[66px] h-[66px] bg-[#EAF9EE] rounded-[22px] flex items-center justify-center border border-emerald-50/10 shadow-sm group-hover:-translate-y-0.5 group-hover:shadow transition-all duration-200">
                      <span className="material-symbols-outlined text-[26px] text-[#34C759]">payments</span>
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight text-neutral-700 text-center">AfriPay</span>
                  </div>

                  {/* Foodie */}
                  <div 
                    onClick={() => triggerToast("Foodie mini-program loaded! Sourcing the most delicious local meals nearby...")}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-[66px] h-[66px] bg-[#FFF2E0] rounded-[22px] flex items-center justify-center border border-orange-50/10 shadow-sm group-hover:-translate-y-0.5 group-hover:shadow transition-all duration-200">
                      <span className="material-symbols-outlined text-[26px] text-[#FF9500]">lunch_dining</span>
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight text-neutral-700 text-center">Foodie</span>
                  </div>

                  {/* GoRide */}
                  <div 
                    onClick={() => {
                      const target = staticMiniApps.find(a => a.id === 'ridego') || staticMiniApps[0];
                      const generatedEquivalent = customMiniApps.find(ca => ca.category === target.category) || {
                        id: target.id,
                        name: target.name,
                        description: target.description,
                        category: target.category,
                        icon: target.icon,
                        bgColor: target.bgColor,
                        textColor: target.textColor,
                        screens: [
                          {
                            title: `${target.name} Portal`,
                            description: "Interactive ride coordinator and billing client",
                            items: ["Nile Drive Commute Request", "Abuja Express Line Taxi"],
                            actions: [{ label: "Book Commute", actionType: "pay" }]
                          }
                        ]
                      };
                      setActiveMiniApp(generatedEquivalent);
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-[66px] h-[66px] bg-[#E8F4FF] rounded-[22px] flex items-center justify-center border border-blue-50/10 shadow-sm group-hover:-translate-y-0.5 group-hover:shadow transition-all duration-200">
                      <span className="material-symbols-outlined text-[26px] text-[#1D7AFC]">directions_car</span>
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight text-neutral-700 text-center">GoRide</span>
                  </div>

                  {/* Tele */}
                  <div 
                    onClick={() => triggerToast("Tele program initialized. High connectivity peer connection secured.")}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-[66px] h-[66px] bg-[#F3E8FF] rounded-[22px] flex items-center justify-center border border-purple-50/10 shadow-sm group-hover:-translate-y-0.5 group-hover:shadow transition-all duration-200">
                      <span className="material-symbols-outlined text-[26px] text-[#8B5CF6]">alternate_email</span>
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight text-neutral-700 text-center truncate w-full max-w-[66px]">Tele</span>
                  </div>

                </div>
              </section>

              {/* Featured Creators Section */}
              <section className="space-y-3">
                <div className="flex justify-between items-center px-5 mt-6">
                  <h3 className="font-extrabold text-[#111e17] text-[15px] tracking-tight">Featured Creators</h3>
                  <button 
                    onClick={() => triggerToast("Loading creative system developers portfolio indices...")} 
                    className="text-[#006a41] font-extrabold text-[12px] hover:underline cursor-pointer"
                  >
                    Discover More
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2.5 px-5 text-center">
                  
                  {/* Amara */}
                  <div 
                    onClick={() => triggerToast("Viewing Amara's interactive workspace & creator portfolio.")}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div className="w-[64px] h-[64px] rounded-full border-2 border-emerald-600 overflow-hidden p-[1.5px] bg-white mx-auto shadow-sm transition-all hover:scale-105 cursor-pointer flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&auto=format&fit=crop&q=80" 
                        alt="Amara" 
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-neutral-700 mt-1">Amara</span>
                  </div>

                  {/* Kofi */}
                  <div 
                    onClick={() => triggerToast("Viewing Kofi's interactive workspace & creator portfolio.")}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div className="w-[64px] h-[64px] rounded-full border-2 border-emerald-600 overflow-hidden p-[1.5px] bg-white mx-auto shadow-sm transition-all hover:scale-105 cursor-pointer flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80" 
                        alt="Kofi" 
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-neutral-700 mt-1">Kofi</span>
                  </div>

                  {/* Zainab */}
                  <div 
                    onClick={() => triggerToast("Viewing Zainab's interactive workspace & creator portfolio.")}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div className="w-[64px] h-[64px] rounded-full border-2 border-emerald-600 overflow-hidden p-[1.5px] bg-white mx-auto shadow-sm transition-all hover:scale-105 cursor-pointer flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80" 
                        alt="Zainab" 
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-neutral-700 mt-1">Zainab</span>
                  </div>

                  {/* Tunde */}
                  <div 
                    onClick={() => triggerToast("Viewing Tunde's interactive workspace & creator portfolio.")}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div className="w-[64px] h-[64px] rounded-full border-2 border-emerald-600 overflow-hidden p-[1.5px] bg-white mx-auto shadow-sm transition-all hover:scale-105 cursor-pointer flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80" 
                        alt="Tunde" 
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-neutral-700 mt-1">Tunde</span>
                  </div>

                </div>
              </section>

              {/* Local Services & Businesses */}
              <section className="space-y-3">
                <div className="px-5 mt-6">
                  <h3 className="font-extrabold text-[#111e17] text-[15px] tracking-tight">Local Services & Businesses</h3>
                </div>

                <div className="space-y-3 px-5">
                  
                  {/* Item 1: Lagos Finest Tailors */}
                  <div className="bg-white rounded-[24px] border border-neutral-100 p-4 flex items-center justify-between shadow-sm hover:shadow transition-all relative">
                    <div className="flex items-center gap-4">
                      <img 
                        className="w-[66px] h-[66px] rounded-[18px] object-cover border border-neutral-55/20 shrink-0 shadow-sm"
                        src="https://images.unsplash.com/photo-1590534247854-e97d5e3feef6?w=150&q=80"
                        alt="Lagos Finest Tailors"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-extrabold text-[14px] text-neutral-900 leading-snug">Lagos Finest Tailors</h4>
                        <p className="text-[11px] text-neutral-450 font-bold mt-0.5">1.2km away • Top Rated</p>
                        <span className="inline-block mt-1.5 bg-emerald-50 text-[9px] font-black tracking-wide text-[#006A42] px-2 py-0.5 rounded-md border border-emerald-100">
                          OPEN NOW
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerToast("Connecting secure messaging channel with Lagos Finest Tailors...")}
                      className="w-[42px] h-[42px] rounded-full bg-[#FAFAFA] hover:bg-emerald-50 hover:text-emerald-600 border border-neutral-100 flex items-center justify-center text-neutral-600 transition-colors active:scale-95 shrink-0 shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] font-bold text-emerald-800">call</span>
                    </button>
                  </div>

                  {/* Item 2: Mama's Kitchen */}
                  <div className="bg-white rounded-[24px] border border-neutral-100 p-4 flex items-center justify-between shadow-sm hover:shadow transition-all relative">
                    <div className="flex items-center gap-4">
                      <img 
                        className="w-[66px] h-[66px] rounded-[18px] object-cover border border-neutral-55/20 shrink-0 shadow-sm"
                        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&q=80"
                        alt="Mama's Kitchen"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-extrabold text-[14px] text-neutral-900 leading-snug">Mama's Kitchen</h4>
                        <p className="text-[11px] text-neutral-450 font-bold mt-0.5">0.8km away • Restaurant</p>
                        <span className="inline-block mt-1.5 bg-amber-50 text-[9px] font-black tracking-wide text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">
                          BUSY
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerToast("Loading interactive food delivery card menu for Mama's Kitchen...")}
                      className="w-[42px] h-[42px] rounded-full bg-[#FAFAFA] hover:bg-emerald-50 hover:text-[#006A42] border border-neutral-100 flex items-center justify-center text-neutral-600 transition-colors active:scale-95 shrink-0 shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] font-semibold text-emerald-800">shopping_cart</span>
                    </button>
                  </div>

                </div>
              </section>

              {/* Upcoming Events */}
              <section className="space-y-3">
                <div className="flex justify-between items-center px-5 mt-6">
                  <h3 className="font-extrabold text-[#111e17] text-[15px] tracking-tight">Upcoming Events</h3>
                  <button 
                    onClick={() => triggerToast("Consulting active event calendar maps...")} 
                    className="text-[#006a41] font-extrabold text-[12px] hover:underline cursor-pointer"
                  >
                    View Calendar
                  </button>
                </div>

                {/* Horizontal Scroll Events */}
                <div className="flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-hidden">
                  
                  {/* Event Node 1 */}
                  <div className="min-w-[242px] w-[242px] bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm shrink-0 hover:shadow-md transition-shadow">
                    <div className="h-28 bg-neutral-900 overflow-hidden relative select-none">
                      <img 
                        className="w-full h-full object-cover opacity-80"
                        src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80"
                        alt="Tech Fusion Conference"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/20 to-transparent"></div>
                    </div>
                    <div className="p-4 space-y-1">
                      <span className="text-[10px] font-black text-[#006a41] tracking-wide block">
                        DEC 15, 2023 • LAGOS
                      </span>
                      <h4 className="font-extrabold text-[13.5px] text-neutral-900 leading-snug">Tech Fusion Conference</h4>
                      <p className="text-[11px] text-neutral-400 font-bold leading-relaxed">The biggest tech meetup in West Africa.</p>
                    </div>
                  </div>

                  {/* Event Node 2 */}
                  <div className="min-w-[242px] w-[242px] bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm shrink-0 hover:shadow-md transition-shadow">
                    <div className="h-28 bg-neutral-900 overflow-hidden relative select-none">
                      <img 
                        className="w-full h-full object-cover opacity-80"
                        src="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&q=80"
                        alt="Cultural Art Expo"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/20 to-transparent"></div>
                    </div>
                    <div className="p-4 space-y-1">
                      <span className="text-[10px] font-black text-[#006a41] tracking-wide block">
                        DEC 20, 2023 • ACCRA
                      </span>
                      <h4 className="font-extrabold text-[13.5px] text-neutral-900 leading-snug">Cultural Art Festival</h4>
                      <p className="text-[11px] text-neutral-400 font-bold leading-relaxed">Celebrating heritage and craft works.</p>
                    </div>
                  </div>

                </div>
              </section>

              {/* New Jobs */}
              <section className="space-y-3">
                <div className="flex justify-between items-center px-5 mt-6">
                  <h3 className="font-extrabold text-[#111e17] text-[15px] tracking-tight">New Jobs</h3>
                  <button 
                    onClick={() => triggerToast("Loading job listings aggregator.")} 
                    className="text-[#006a41] font-extrabold text-[12px] hover:underline cursor-pointer"
                  >
                    Browse All
                  </button>
                </div>

                <div className="space-y-2.5 px-5">
                  
                  {/* Job item 1: UI/UX Designer */}
                  <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-neutral-100 shadow-sm hover:shadow transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-[44px] h-[44px] bg-[#EAF9EE] text-[#006A42] border border-emerald-50 rounded-xl flex items-center justify-center font-black text-lg select-none">
                        G
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[13px] text-neutral-900">UI/UX Designer</h4>
                        <p className="text-[10px] text-neutral-400 font-bold mt-0.5">Globacom • Remote</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerToast("Your profile summary submitted. Globacom HR recruitment suite alerted.")} 
                      className="text-[11px] font-extrabold py-2 px-3.5 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] text-neutral-850 transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      Apply Now
                    </button>
                  </div>

                  {/* Job item 2: Marketing Lead */}
                  <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-neutral-100 shadow-sm hover:shadow transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-[44px] h-[44px] bg-[#EAF9EE] text-[#006A42] border border-emerald-50 rounded-xl flex items-center justify-center font-black text-lg select-none">
                        A
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[13px] text-neutral-900">Marketing Lead</h4>
                        <p className="text-[10px] text-neutral-400 font-bold mt-0.5">AfriPay • Lagos, NG</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerToast("Your client profile summary submitted. AfriPay recruitment suite alerted.")} 
                      className="text-[11px] font-extrabold py-2 px-3.5 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] text-neutral-850 transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      Apply Now
                    </button>
                  </div>

                </div>
              </section>

              {/* Top AI Agents */}
              <section className="space-y-3">
                <div className="flex justify-between items-center px-5 mt-6">
                  <h3 className="font-extrabold text-[#111e17] text-[15px] tracking-tight">Top AI Agents</h3>
                  <button 
                    onClick={() => triggerToast("Loading complete digital coordinate agents directory.")} 
                    className="text-[#006a41] font-extrabold text-[12px] hover:underline cursor-pointer"
                  >
                    See All
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 px-5">
                  
                  {/* Somi */}
                  <div className="bg-white rounded-[26px] p-5 border border-neutral-100 shadow-sm flex flex-col items-center justify-between text-center min-h-[190px] hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#EAF9EE] text-[#006A42] flex items-center justify-center border border-emerald-50 shadow-inner">
                        <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[13.5px] text-neutral-900 leading-none">Somi</h4>
                        <p className="text-[10px] text-neutral-405 font-bold mt-1">Cultural Guide</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedChatId('afri-ai');
                        setActiveTab('chats');
                        triggerToast("Loaded Somi AI prompt channel.");
                      }} 
                      className="w-full bg-[#006A42] hover:bg-[#005434] text-white font-extrabold text-[12px] py-3 rounded-2xl tracking-normal mt-3 transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      Chat
                    </button>
                  </div>

                  {/* FinBot */}
                  <div className="bg-white rounded-[26px] p-5 border border-neutral-100 shadow-sm flex flex-col items-center justify-between text-center min-h-[190px] hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#FFF9E6] text-[#FFBF0F] flex items-center justify-center border border-amber-50 shadow-inner">
                        <span className="material-symbols-outlined text-[24px]">account_balance</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[13.5px] text-neutral-900 leading-none">FinBot</h4>
                        <p className="text-[10px] text-neutral-405 font-bold mt-1">Finance Expert</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerToast("FinBot AI initialized. Analyzing your aggregate transaction indexes...")} 
                      className="w-full bg-[#FFBF0F] hover:bg-[#E5AB00] text-neutral-900 font-extrabold text-[12px] py-3 rounded-2xl tracking-normal mt-3 transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      Analyze
                    </button>
                  </div>

                </div>
              </section>

              {/* Horizontal Scroll My Custom Created Programs */}
              {customMiniApps.length > 0 && (
                <section className="space-y-3 px-5 mt-6">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-extrabold text-[15px] tracking-tight text-neutral-950">
                      My Deployed Apps
                    </h3>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-[9px] font-black tracking-wide text-[#006A42] rounded-md border border-emerald-100">
                      {customMiniApps.length} Active
                    </span>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hidden">
                    {customMiniApps.map((app) => (
                      <div 
                        key={app.id}
                        className="min-w-[240px] w-[240px] bg-white p-4 rounded-3xl flex flex-col gap-3 border border-neutral-100 shadow-sm hover:border-[#006A42] transition-all shrink-0"
                      >
                        <div className="flex justify-between items-start">
                          <div className="w-10 h-10 rounded-xl bg-[#EAF9EE] text-[#006A42] flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">{app.icon}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-[#006A42] text-[9px] font-bold uppercase rounded border border-emerald-200">
                            Active
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-neutral-900">{app.name}</h4>
                          <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">{app.description || 'AI Deployed Program.'}</p>
                        </div>
                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                          <span className="text-[10px] text-[#006A42] font-black uppercase tracking-wider">{app.category}</span>
                          <button 
                            onClick={() => setActiveMiniApp(app)}
                            className="text-[#006A42] text-xs font-bold hover:underline"
                          >
                            Launch App
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* PREMIUM COMPILER PANEL DECK FOOTER */}
              <section className="px-5 mt-6 pb-6">
                <div className="relative overflow-hidden rounded-[26px] bg-[#111e17] p-5 border border-emerald-500/10 shadow-xl text-white">
                  <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-[100px] text-emerald-500">auto_awesome</span>
                  </div>

                  <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-[#6ddb9f]">
                      <span className="material-symbols-outlined text-[11px] font-bold text-emerald-300">bolt</span>
                      <span className="text-[8px] font-extrabold uppercase tracking-widest">Compiler Panel</span>
                    </div>

                    <h3 className="text-sm font-bold tracking-tight text-white">AI App Architect</h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">Enter prompts to compile, blueprint, and hot-deploy new custom micro-programs directly in your workspace drawer.</p>
                    
                    <div className="space-y-3 pt-1">
                      <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Build a service provider booking program in Nairobi with calendar scheduling..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#006A42] transition-colors text-white resize-none"
                        rows={2}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                          🚀 Spec Ready
                        </span>
                        <button 
                          onClick={handleGenerateMiniApp}
                          disabled={isGeneratingApp}
                          className="bg-[#006A42] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#005434] text-xs active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          {isGeneratingApp ? "Compiling..." : "Build App"}
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </motion.div>
          )}

          {/* TAB 5: PROFILE SETTINGS & VERIFIED PARADIGM (REDESIGNED) */}
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col min-h-screen bg-[#f8f9fa] dark:bg-[#09110d] pb-24 text-on-surface"
            >
              {/* Top AppBar Component */}
              <header className="bg-[#006a41] sticky top-0 z-40 flex justify-between items-center w-full px-4 h-16 rounded-b-none shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-emerald-900">
                    <img 
                      alt="AfriChat Logo" 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYtwbxp_VB5JHh27eGaJWpRbY1k_3Ybsczc9VLlyD4nV7L8uGxtXpg8Dd-iS4-L3SEQKArd4bR_LmSyfHyM5O4yIkUKEiHHTgqtcHTiC16QudLo-oQ9A2v63uXFHcoIJJD2GTAbPeS0eFwZc6zTm4llLbdpbni4lHF5Pt3qTLp5YpCzOeBIzekXM-8RR4PBcJTyGtDJKE4V9-bsW-Be_z1Hk_wG4Nh_9PjiCte-ml1Tb5ykb9dJgYFF82WFn44e5yZ74xW3wfmdz0" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h1 className="font-bold text-md text-white">AfriChat</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => triggerToast("Notification registry: Your current security keys are synced.")} 
                    className="p-2 text-white hover:bg-white/10 rounded-full transition-transform active:scale-95"
                  >
                    <span className="material-symbols-outlined">notifications</span>
                  </button>
                </div>
              </header>

              <main className="flex-grow px-4 pt-6 space-y-6">
                {/* Profile Header Section */}
                <section className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full border-4 border-white dark:border-emerald-950 shadow-lg overflow-hidden relative">
                      <img 
                        alt="Godfrey" 
                        className="w-full h-full object-cover" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYtwbxp_VB5JHh27eGaJWpRbY1k_3Ybsczc9VLlyD4nV7L8uGxtXpg8Dd-iS4-L3SEQKArd4bR_LmSyfHyM5O4yIkUKEiHHTgqtcHTiC16QudLo-oQ9A2v63uXFHcoIJJD2GTAbPeS0eFwZc6zTm4llLbdpbni4lHF5Pt3qTLp5YpCzOeBIzekXM-8RR4PBcJTyGtDJKE4V9-bsW-Be_z1Hk_wG4Nh_9PjiCte-ml1Tb5ykb9dJgYFF82WFn44e5yZ74xW3wfmdz0"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <button 
                      onClick={() => triggerToast("Profile picture editor: select alternative graphic from gallery.")}
                      className="absolute bottom-0 right-0 bg-[#006a41] text-white p-1.5 rounded-full border-2 border-white shadow-md active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 justify-center">
                    <h2 className="font-bold text-xl text-neutral-900 dark:text-white">Godfrey</h2>
                    <span className="material-symbols-outlined text-[#006a41] text-[18px] fill-icon" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono">@godfrey_afri</p>
                </section>

                {/* Wallet Balance Card (AfriPay) */}
                <div className="relative overflow-hidden rounded-[24px] bg-[#006a41] text-white p-5 shadow-lg">
                  {/* Background Decorative Element */}
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl"></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-emerald-200">account_balance_wallet</span>
                        <span className="text-[11px] font-semibold tracking-wider text-emerald-100 uppercase">AfriPay NGN Balance (Tap to Hide)</span>
                      </div>
                      <div 
                        onClick={() => {
                          setProfileBalanceHidden(!profileBalanceHidden);
                          triggerToast(profileBalanceHidden ? "Balance unhidden" : "Balance secret hidden");
                        }}
                        className="text-2xl font-extrabold tracking-tight cursor-pointer select-none py-1 hover:text-emerald-100 transition-colors"
                      >
                        {profileBalanceHidden ? "₦ • • • • • •" : `₦${balance.toLocaleString()}.00`}
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-lg px-2.5 py-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-amber-300">trending_up</span>
                      <span className="text-[10px] font-bold text-white">+2.4%</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 relative z-10">
                    <button 
                      onClick={() => {
                        setIsAddingMoney(true);
                        triggerToast("Launched Upward Cash top up portal.");
                        // Go check or auto add money
                        setBalance(prev => prev + 50000);
                        triggerToast("Demo top up: Automatically added ₦50,000.00 to AfriPay balance!");
                      }} 
                      className="flex-1 bg-amber-400 hover:bg-amber-500 text-amber-950 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      Top Up (₦50k)
                    </button>
                    <button 
                      onClick={() => {
                        if (balance < 10000) {
                          triggerToast("Insufficient AfriPay balance to send assets.");
                        } else {
                          setBalance(prev => prev - 10000);
                          triggerToast("Demo transaction: Dispatched ₦10,000.00 transfer to Ayo Balogun.");
                        }
                      }}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      Send (₦10k)
                    </button>
                  </div>
                </div>

                {/* Menu List Section */}
                <section className="space-y-4">
                  <div>
                    <h3 className="px-2 py-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Services &amp; Tools</h3>
                    
                    <div className="bg-white dark:bg-[#12241a]/30 border border-gray-150 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                      {/* My Businesses */}
                      <div 
                        onClick={() => triggerToast("Opening My Businesses Hub: Abuja Rides, Gudu Groceries dashboard ready.")}
                        className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <span className="material-symbols-outlined text-lg">storefront</span>
                          </div>
                          <span className="text-sm font-semibold text-neutral-800 dark:text-gray-100">My Businesses</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                      </div>
                      
                      <div className="mx-4 border-t border-gray-100 dark:border-white/5"></div>
                      
                      {/* My Mini Apps */}
                      <div 
                        onClick={() => {
                          setActiveTab('discover');
                          triggerToast("Opening Custom Mini-Apps compilation workspace...");
                        }}
                        className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <span className="material-symbols-outlined text-lg">widgets</span>
                          </div>
                          <span className="text-sm font-semibold text-neutral-800 dark:text-gray-100">My Mini Apps</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                      </div>
                      
                      <div className="mx-4 border-t border-gray-100 dark:border-white/5"></div>
                      
                      {/* My AI Agents */}
                      <div 
                        onClick={() => {
                          setActiveTab('chats');
                          setSelectedChatId("afri-ai");
                          triggerToast("Chat workspace set to AfriAI business coordinator.");
                        }}
                        className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <span className="material-symbols-outlined text-lg">psychology</span>
                          </div>
                          <span className="text-sm font-semibold text-neutral-800 dark:text-gray-100">My AI Agents</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="px-2 py-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Account &amp; System</h3>
                    
                    <div className="bg-white dark:bg-[#12241a]/30 border border-gray-150 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                      {/* Settings */}
                      <div 
                        onClick={() => triggerToast("System configuration: mesh relay encryption and automatic translations synced.")}
                        className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                            <span className="material-symbols-outlined text-lg">settings</span>
                          </div>
                          <span className="text-sm font-semibold text-neutral-800 dark:text-gray-100">Settings</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                      </div>
                      
                      <div className="mx-4 border-t border-gray-100 dark:border-white/5"></div>
                      
                      {/* Support */}
                      <div 
                        onClick={() => triggerToast("Connecting secure live messaging lane with terminal support engineers...")}
                        className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-[#006a41] dark:text-[#6ddb9f]">
                            <span className="material-symbols-outlined text-lg">contact_support</span>
                          </div>
                          <span className="text-sm font-semibold text-neutral-800 dark:text-gray-100">Support Terminal</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Logout Action */}
                <button 
                  onClick={() => {
                    triggerToast("Logout routine synchronized: secure local key ring was flushed.");
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 text-rose-600 font-bold text-xs border border-rose-200/50 dark:border-rose-900/35 bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Logout Space Session
                </button>
                <div className="h-6"></div>
              </main>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* DYNAMIC ACTION SHEET / MENU FOR LARGE CREATOR "+" BUTTON */}
      <AnimatePresence>
        {showCreateMenu && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              onClick={() => setShowCreateMenu(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></div>
            {/* Bottom Panel */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className={`absolute bottom-0 left-0 right-0 rounded-t-[32px] p-6 text-on-surface border-t shadow-2xl ${theme === 'dark' ? 'bg-[#15221b] border-white/10 text-white' : 'bg-white border-gray-200'}`}
            >
              <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-6"></div>
              
              <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4 text-[#0A8F5A] dark:text-yellow-400 text-center">AfriChat Creator Deck</h3>
              <div className="grid grid-cols-2 gap-4">
                
                {/* 1 */}
                <div 
                  onClick={() => { setShowCreateMenu(false); setIsAppWizardOpen(true); }}
                  className="p-4 bg-black/20 hover:bg-[#006a41]/25 border border-white/5 rounded-2xl cursor-pointer flex flex-col items-center gap-2 text-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[#6ddb9f] text-2xl">auto_awesome</span>
                  <div>
                    <p className="text-xs font-bold">Launch Custom App</p>
                    <p className="text-[10px] text-gray-500">Compile brand templates with AI</p>
                  </div>
                </div>

                {/* 2 */}
                <div 
                  onClick={() => { setShowCreateMenu(false); setIsMarketOpen(true); }}
                  className="p-4 bg-black/20 hover:bg-[#006a41]/25 border border-white/5 rounded-2xl cursor-pointer flex flex-col items-center gap-2 text-center transition-colors"
                >
                  <span className="material-symbols-outlined text-yellow-400 text-2xl">shopping_cart</span>
                  <div>
                    <p className="text-xs font-bold">AfriMarket Shop</p>
                    <p className="text-[10px] text-gray-500">List products & view live auctions</p>
                  </div>
                </div>

                {/* 3 */}
                <div 
                  onClick={() => { setShowCreateMenu(false); setIsServicesOpen(true); }}
                  className="p-4 bg-black/20 hover:bg-[#006a41]/25 border border-white/5 rounded-2xl cursor-pointer flex flex-col items-center gap-2 text-center transition-colors"
                >
                  <span className="material-symbols-outlined text-blue-400 text-2xl">local_taxi</span>
                  <div>
                    <p className="text-xs font-bold">Book AfriServices</p>
                    <p className="text-[10px] text-gray-500">On-demand rides, food & mechanics</p>
                  </div>
                </div>

                {/* 4 */}
                <div 
                  onClick={() => { setShowCreateMenu(false); setIsLearnOpen(true); }}
                  className="p-4 bg-black/20 hover:bg-[#006a41]/25 border border-white/5 rounded-2xl cursor-pointer flex flex-col items-center gap-2 text-center transition-colors"
                >
                  <span className="material-symbols-outlined text-pink-400 text-2xl">school</span>
                  <div>
                    <p className="text-xs font-bold">Explore AfriLearn</p>
                    <p className="text-[10px] text-gray-500">Skill curriculums & reward quizzes</p>
                  </div>
                </div>

              </div>

              <button 
                onClick={() => setShowCreateMenu(false)}
                className="w-full mt-6 bg-neutral-850 py-3 rounded-xl border border-white/5 text-xs text-gray-300 font-bold"
              >
                Close Creator Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMMERSIVE LIVE VOICE ROOM (LAGOS TECH MIXER OVERLAY) */}
      <AnimatePresence>
        {isVoiceRoomActive && (
          <div className="fixed inset-0 z-50 bg-[#050c08] text-white flex flex-col">
            {/* Top Bar Navigation */}
            <header className="flex justify-between items-center px-6 h-18 border-b border-white/5 bg-black/20">
              <button 
                onClick={() => {
                  setIsVoiceRoomActive(false);
                  triggerToast("Voice Session minimized. Double tap the headphones icon in bottom bar to rejoin.");
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-emerald-300"
              >
                <span className="material-symbols-outlined text-[28px]">keyboard_arrow_down</span>
              </button>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  LAGOS TECH MIXER
                </div>
                <p className="text-[10px] text-gray-400">Scaling Fintech in Nigeria</p>
              </div>

              <button 
                onClick={() => {
                  setIsVoiceRoomActive(false);
                  triggerToast("Left Lagos Tech Mixer.");
                }}
                className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all"
              >
                Leave Room
              </button>
            </header>

            {/* Immersive Speakers Stage */}
            <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              
              {/* Category Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#6ddb9f]">Speakers Section</h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-full font-bold">3 Active Co-Hosts</span>
              </div>

              {/* Grid of Speakers */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* 1. Ayo Balogun (Speaking Co-Host) */}
                <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/30 flex flex-col items-center text-center relative overflow-hidden">
                  {/* Waveform ripple backdrop */}
                  <div className="absolute inset-0 bg-emerald-500/10 animate-pulse-slow"></div>
                  
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-400 shadow-lg p-0.5 animate-bounce-slow">
                      <img 
                        alt="Ayo Balogun" 
                        className="w-full h-full object-cover rounded-full" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYtwbxp_VB5JHh27eGaJWpRbY1k_3Ybsczc9VLlyD4nV7L8uGxtXpg8Dd-iS4-L3SEQKArd4bR_LmSyfHyM5O4yIkUKEiHHTgqtcHTiC16QudLo-oQ9A2v63uXFHcoIJJD2GTAbPeS0eFwZc6zTm4llLbdpbni4lHF5Pt3qTLp5YpCzOeBIzekXM-8RR4PBcJTyGtDJKE4V9-bsW-Be_z1Hk_wG4Nh_9PjiCte-ml1Tb5ykb9dJgYFF82WFn44e5yZ74xW3wfmdz0" 
                      />
                    </div>
                    {/* Speaks indicator */}
                    <span className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1 animate-pulse">
                      <span className="material-symbols-outlined text-xs">volume_up</span>
                    </span>
                  </div>
                  
                  <div className="mt-3 relative z-10">
                    <h4 className="font-bold text-xs truncate">Ayo Balogun</h4>
                    <span className="text-[9px] bg-amber-400 text-amber-950 font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Co-Host</span>
                  </div>
                </div>

                {/* 2. Chioma Ade (Speaking Co-Host) */}
                <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#006a41]/5"></div>
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-400 shadow-md p-0.5">
                      <img 
                        alt="Chioma Ade" 
                        className="w-full h-full object-cover rounded-full" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0oaPhMV6aQlYQ_s3UbJn8hAIF9_CfRX2Y0Qh1XVfw1gFPDms-OPdIwnriLLE1GsjifEsh7qMh0ycTiVjM6UknN03sOg-0RC4Pi0Q_CdNcosytOeqNBDRq7qfj20viyjyB8qs3lW784q2a5VQ5-VWL4wqcHpwTFfsoUURbyv87Vr5DIdiqmCAmE0HGeWfJPHZDXvXOcFrJ2O6-I87mrTsvCkUls_QJnoeznpAjZ_XIDBIkqLGpxSD2GiVVc6V3SuzW6kW6Uvz8iCU" 
                      />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1">
                      <span className="material-symbols-outlined text-xs">volume_up</span>
                    </span>
                  </div>
                  
                  <div className="mt-3 relative z-10">
                    <h4 className="font-bold text-xs truncate">Chioma Ade</h4>
                    <span className="text-[9px] bg-teal-500 text-white font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block text-[8px]">Fintech Dev Lead</span>
                  </div>
                </div>

                {/* 3. Godfrey (You) */}
                <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <div className="relative">
                    <img 
                      alt="Godfrey" 
                      className={`w-20 h-20 rounded-full object-cover border-4 ${isVoiceMuted ? 'border-red-500' : 'border-emerald-400'}`} 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYtwbxp_VB5JHh27eGaJWpRbY1k_3Ybsczc9VLlyD4nV7L8uGxtXpg8Dd-iS4-L3SEQKArd4bR_LmSyfHyM5O4yIkUKEiHHTgqtcHTiC16QudLo-oQ9A2v63uXFHcoIJJD2GTAbPeS0eFwZc6zTm4llLbdpbni4lHF5Pt3qTLp5YpCzOeBIzekXM-8RR4PBcJTyGtDJKE4V9-bsW-Be_z1Hk_wG4Nh_9PjiCte-ml1Tb5ykb9dJgYFF82WFn44e5yZ74xW3wfmdz0" 
                    />
                    <span className={`absolute bottom-1 right-1 rounded-full p-1 text-white ${isVoiceMuted ? 'bg-red-500' : 'bg-emerald-500'}`}>
                      <span className="material-symbols-outlined text-xs">
                        {isVoiceMuted ? 'mic_off' : 'mic'}
                      </span>
                    </span>
                    {isHandRaised && (
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 rounded-full p-1 animate-bounce">
                        <span className="material-symbols-outlined text-xs font-bold">front_hand</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="font-bold text-xs">Godfrey (You)</h4>
                    <span className="text-[9px] bg-white/20 text-emerald-200 px-2 py-0.5 rounded mt-1 inline-block">Speaker</span>
                  </div>
                </div>

                {/* 4. Zainab Aliyu */}
                <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <div className="relative">
                    <img 
                      alt="Zainab Aliyu" 
                      className="w-20 h-20 rounded-full object-cover border-4 border-white/12" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVWx6g4iNSXz322s-exe0TqhkuWkeYj5aEF94I25LKekP9I6GTZ-YDVjVKi3w2akQEQxBGQ9mFYKMjiezSd6VxVA2nY6dQzk5yGDKP7XXr-HwPpneKHnsYEi97LnJ7Cbfm5yvxY5OY7pusN1FNRbxry-_lnJpAtXpLEVDbJXhyUFhvNPLQrHf8p0o9-W4flBntcW-cVWDgU8-PTbQvhkTsGUXz3-f5uyk-lhxzDl2M3EONHpQ8lP6_f_6hVwwdhwgNOJgnSrzZYi0" 
                    />
                    <span className="absolute bottom-1 right-1 bg-gray-500 text-white rounded-full p-1">
                      <span className="material-symbols-outlined text-xs">mic_off</span>
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="font-bold text-xs truncate">Zainab Aliyu</h4>
                    <span className="text-[9px] bg-white/10 text-gray-400 px-2 py-0.5 rounded mt-1 inline-block">Speaker</span>
                  </div>
                </div>

              </div>

              {/* Subtitles / Real-Time Transcriptions */}
              <div className="bg-[#0b1410] border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex gap-2 items-center text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                  <span className="material-symbols-outlined text-xs">g_translate</span>
                  Live Translation Feed
                </div>
                <div className="text-xs text-gray-300 font-medium leading-relaxed">
                  <span className="font-bold text-white mr-1">🎙️ Ayo Balogun ( Hausa &rarr; English ):</span> 
                  "...the deployment of local mesh relays is a critical first step. By utilizing Neighbor sync, we bypass physical carrier outages entirely..."
                </div>
              </div>

              {/* Listeners section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Listeners (142)</span>
                  <span className="text-[10px] hover:underline cursor-pointer">View All</span>
                </div>
                <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center font-bold text-xs text-emerald-300">MB</div>
                    <span className="text-[9px] text-gray-500">Musa</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center font-bold text-xs text-purple-300">EF</div>
                    <span className="text-[9px] text-gray-500">Efe</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center font-bold text-xs text-blue-300">YO</div>
                    <span className="text-[9px] text-gray-500">Yomi</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-pink-900/30 flex items-center justify-center font-bold text-xs text-pink-300">AM</div>
                    <span className="text-[9px] text-gray-500">Amina</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-gray-300">+138</div>
                    <span className="text-[9px] text-gray-500">Others</span>
                  </div>
                </div>
              </div>

            </main>

            {/* Sticky Foot Toolbar Control Deck */}
            <footer className="h-28 bg-[#0b1410] border-t border-white/5 px-6 flex justify-between items-center pb-safe">
              
              {/* Hand raise */}
              <button 
                onClick={() => {
                  setIsHandRaised(!isHandRaised);
                  triggerToast(isHandRaised ? "Lowered your hand." : "Hand raised! Notified host Ayo Balogun.");
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isHandRaised 
                    ? 'bg-amber-400 text-amber-950 scale-105 shadow-md shadow-amber-400/20' 
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isHandRaised ? "'FILL' 1" : "'FILL' 0" }}>front_hand</span>
              </button>

              {/* Large central Mute/Unmute */}
              <button 
                onClick={() => {
                  setIsVoiceMuted(!isVoiceMuted);
                  triggerToast(isVoiceMuted ? "Microphone active. You are speaking." : "You are now muted.");
                }}
                className={`w-18 h-18 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isVoiceMuted 
                    ? 'bg-red-600/90 text-white scale-95 hover:bg-red-650' 
                    : 'bg-[#006a41] text-white hover:bg-[#0A8F5A]'
                }`}
              >
                <span className="material-symbols-outlined text-[32px]">
                  {isVoiceMuted ? 'mic_off' : 'mic'}
                </span>
              </button>

              {/* Heart burst reactions */}
              <button 
                onClick={() => {
                  triggerToast("Sent ❤️ reaction to the room!");
                }}
                className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/15 text-rose-400 flex items-center justify-center active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">favorite</span>
              </button>

            </footer>
          </div>
        )}
      </AnimatePresence>

      {/* FIXED PLATFORM BOTTOM NAVIGATION ANCHOR (5 TABS MATCHING IMAGES) */}
      <nav className={`fixed bottom-0 left-0 w-full z-45 h-20 pb-safe flex justify-around items-center px-4 border-t shadow-lg backdrop-blur-lg ${theme === 'dark' ? 'bg-[#15221b]/95 border-white/10' : 'bg-white/95 border-t-gray-200'}`}>
        
        {/* Navigation Tab: Home */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'home' 
              ? 'text-[#0A8F5A] dark:text-[#6ddb9f] font-bold scale-105' 
              : 'text-gray-400 group-hover:text-emerald-500'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="text-[10px] mt-0.5 tracking-tighter uppercase">Home</span>
        </button>

        {/* Navigation Tab: Chats */}
        <button 
          onClick={() => setActiveTab('chats')}
          className={`flex flex-col items-center justify-center transition-all relative ${
            activeTab === 'chats' 
              ? 'text-[#0A8F5A] dark:text-[#6ddb9f] font-bold scale-105' 
              : 'text-gray-400'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activeTab === 'chats' ? "'FILL' 1" : "'FILL' 0" }}>chat</span>
          <span className="text-[10px] mt-0.5 tracking-tighter uppercase">Chats</span>
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#15221b]"></div>
        </button>

        {/* Navigation Tab: FAB Middle button */}
        <div className="relative -top-5">
          <button 
            onClick={() => setShowCreateMenu(true)}
            className="w-14 h-14 bg-gradient-to-tr from-[#006a41] to-[#0A8F5A] text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-900/40 hover:rotate-90 hover:brightness-110 active:scale-90 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-3xl">add</span>
          </button>
        </div>

        {/* Navigation Tab: Discover / Super Wallets & Programs */}
        <button 
          onClick={() => setActiveTab('discover')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'discover' 
              ? 'text-yellow-400 font-bold scale-105' 
              : 'text-gray-400'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activeTab === 'discover' ? "'FILL' 1" : "'FILL' 0" }}>explore</span>
          <span className="text-[10px] mt-0.5 tracking-tighter uppercase">Discover</span>
        </button>

        {/* Navigation Tab: Profile credentials */}
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'profile' 
              ? 'text-[#0A8F5A] dark:text-[#6ddb9f] font-bold scale-105' 
              : 'text-gray-400'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
          <span className="text-[10px] mt-0.5 tracking-tighter uppercase">Profile</span>
        </button>

      </nav>

      {/* Immersive Modular Subsystems */}
      <AfriMarketModal 
        isOpen={isMarketOpen}
        onClose={() => setIsMarketOpen(false)}
        theme={theme}
        balance={balance}
        onDeductBalance={handleDeductBalance}
        triggerToast={triggerToast}
      />

      <MiniAppWizardModal 
        isOpen={isAppWizardOpen}
        onClose={() => setIsAppWizardOpen(false)}
        theme={theme}
        onAddMiniApp={(newApp) => {
          setCustomMiniApps(prev => [newApp, ...prev]);
        }}
        triggerToast={triggerToast}
      />

      <ServicesModal 
        isOpen={isServicesOpen}
        onClose={() => setIsServicesOpen(false)}
        theme={theme}
        balance={balance}
        onDeductBalance={handleDeductBalance}
        triggerToast={triggerToast}
      />

      <LearnModal 
        isOpen={isLearnOpen}
        onClose={() => setIsLearnOpen(false)}
        theme={theme}
        triggerToast={triggerToast}
      />

      {/* Atmospheric bottom glows for luxurious spacing dark vibe */}
      {theme === 'dark' && (
        <>
          <div className="fixed top-[-10%] right-[-15%] w-[45%] h-[45%] bg-[#0A8F5A]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
          <div className="fixed bottom-[-5%] left-[-10%] w-[35%] h-[35%] bg-yellow-400/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
        </>
      )}

    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  initialChats, 
  initialTransactions, 
  staticMiniApps 
} from "./data";
import { Chat, Message, Transaction, MiniApp } from "./types";

export default function App() {
  // Theme state: default to 'dark' for premium, but toggleable matching screenshots
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState<'home' | 'chats' | 'pay' | 'discover' | 'profile'>('home');
  
  // State for active chatbot conversation or normal chat
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  // State for wallets and transactions
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [balance, setBalance] = useState<number>(85000);
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

      {/* CORE ROOT NAVIGATION CO-ORDINATOR STYLED HEADER */}
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

      {/* VIEWPORT CANVAS (CHANGES ON TABS) */}
      <main className="pt-20 px-4 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOME CONTROLLER (LIGHT DESIGN SYSTEM SCHEME - SCREEN 1) */}
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Hero Search Area (Grounding header component) */}
              <section className="bg-[#006a41] rounded-3xl p-6 text-white space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#0A8F5A]/20 rounded-full blur-3xl"></div>
                
                {/* Search box placeholder */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-sm">search</span>
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text" 
                    className="w-full bg-white/10 border-none rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-white/60 focus:ring-2 focus:ring-yellow-400 focus:bg-white/20 transition-all outline-none text-xs"
                    placeholder="Search messages, transactions, mini apps..."
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  )}
                </div>

                {/* Category grid buttons */}
                <div className="grid grid-cols-4 gap-4 pt-2 text-center">
                  <div onClick={() => setActiveTab('chats')} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all active:scale-95 duration-100">
                      <span className="material-symbols-outlined text-white text-2xl">chat_bubble</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-tight">Chats</span>
                  </div>

                  <div onClick={() => setActiveTab('pay')} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all active:scale-95 duration-100">
                      <span className="material-symbols-outlined text-white text-2xl">payments</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-tight">AfriPay</span>
                  </div>

                  <div onClick={() => setActiveTab('discover')} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all active:scale-95 duration-100">
                      <span className="material-symbols-outlined text-white text-2xl">apps</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-tight">MiniApps</span>
                  </div>

                  <div onClick={() => triggerToast("AfriMarket is loading integrated Jumia stores...")} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all active:scale-95 duration-100">
                      <span className="material-symbols-outlined text-white text-2xl">shopping_bag</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-tight">Market</span>
                  </div>
                </div>
              </section>

              {/* Unified Promo Banner matching image 1 exactly */}
              <section className="relative overflow-hidden bg-white dark:bg-[#15221b] border dark:border-white/5 rounded-3xl p-6 shadow-lg flex items-center justify-between">
                <div className="flex-1 space-y-3 z-10">
                  <h2 className="text-xl font-extrabold text-[#006a41] dark:text-yellow-400 tracking-tight leading-snug">Build Your App in Minutes</h2>
                  <p className="text-xs text-neutral-500 dark:text-gray-400 leading-relaxed max-w-[200px]">Create school portals, ride apps, delivery apps and more with AI.</p>
                  <button 
                    onClick={() => setActiveTab('discover')}
                    className="bg-[#006a41] text-white hover:bg-[#0A8F5A] active:scale-95 text-xs font-semibold px-5 py-3 rounded-xl transition-all"
                  >
                    Create Mini App
                  </button>
                </div>
                <div className="w-1/3 flex justify-end">
                  <img 
                    alt="Mini App Builder" 
                    className="w-32 h-auto object-contain squirclish shadow-md" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmnIQ86LDdmfMPp1DY-aWdpxRamuijUDkLNbsU__T7TQqJPnofovaTr4VXz_d_4aM8kxjstNjYC9oyJvmedei6kV-WzNpe0cEt5seTYRbc1tEkSds0Mqh_27qEbJ3MJaShNu1I0Lr1Bg5JghL0hru6DdMBHvuucamoBfrNWo89tZ8dwZX2Enlf_SE6GmBiv3NMaSds1-9XSUApeSqclh3uersO3MFixY9mAEIQLTpBVs1TIgFB7zXsPoxgnJyF9HDqObpbIgEwxd4"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </section>

              {/* Recommended Mini Programs Carousel */}
              <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-emerald-600 dark:text-[#6ddb9f]">Recommended Mini Apps</h3>
                  <button onClick={() => setActiveTab('discover')} className="text-[#0A8F5A] font-bold text-xs flex items-center gap-0.5">
                    View All <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {staticMiniApps.map((app) => (
                    <div 
                      key={app.id} 
                      onClick={() => {
                        const generatedEquivalent = customMiniApps.find(ca => ca.category === app.category) || {
                          id: app.id,
                          name: app.name,
                          description: app.description,
                          category: app.category,
                          icon: app.icon,
                          bgColor: app.bgColor,
                          textColor: app.textColor,
                          screens: [
                            {
                              title: `${app.name} Portal`,
                              description: "Interactive mock resource portal",
                              items: ["Standard app feature list item 1", "Standard app feature list item 2"],
                              actions: [{ label: "Pay commission", actionType: "pay" }]
                            }
                          ]
                        };
                        setActiveMiniApp(generatedEquivalent);
                      }}
                      className="flex flex-col items-center gap-2 cursor-pointer group"
                    >
                      <div 
                        style={{ backgroundColor: app.bgColor }} 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-white/5 shadow-sm group-hover:-translate-y-1 transition-all duration-200"
                      >
                        <span style={{ color: app.textColor }} className="material-symbols-outlined text-3xl">{app.icon}</span>
                      </div>
                      <span className="text-[11px] font-bold tracking-tight text-neutral-600 dark:text-gray-300">{app.name}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recent Chats list */}
              <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-emerald-600 dark:text-[#6ddb9f]">Recent Chats</h3>
                  <span className="material-symbols-outlined opacity-50 cursor-pointer">more_horiz</span>
                </div>

                <div className="space-y-3">
                  {getFilteredChats().map((chat) => (
                    <div 
                      key={chat.id} 
                      onClick={() => setSelectedChatId(chat.id)}
                      className="flex items-center gap-4 bg-white dark:bg-[#15221b] p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:border-[#0A8F5A] active:bg-neutral-100 dark:active:bg-neutral-800 transition-all cursor-pointer"
                    >
                      <div className="relative">
                        {chat.avatar ? (
                          <img 
                            className="w-14 h-14 rounded-full object-cover" 
                            src={chat.avatar} 
                            alt={chat.name} 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[#fdbc13]/10 text-[#fdbc13] flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">groups</span>
                          </div>
                        )}
                        {chat.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#15221b] rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">{chat.name}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">{chat.lastMessageTime}</span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-gray-400 truncate mt-0.5">{chat.lastMessageText}</p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-[#006a41] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

            </motion.div>
          )}

          {/* TAB 2: CHATS LIST (DIRECT PREVIEW CHATS CONTROL) */}
          {activeTab === 'chats' && (
            <motion.div 
              key="chats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-1">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">My Chats</h2>
                  <p className="text-xs text-gray-500">Auto-translated, secured by local keys.</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedChatId("afri-ai");
                    triggerToast("AfriAI workspace initialized.");
                  }}
                  className="bg-[#006a41] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-[#0A8F5A]"
                >
                  <span className="material-symbols-outlined text-sm">psychology</span>
                  Ask AfriAI
                </button>
              </div>

              {/* Chat search bar */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="text" 
                  className="w-full bg-neutral-100 dark:bg-[#15221b] border-none rounded-2xl py-3 pl-11 pr-4 outline-none text-xs text-on-surface"
                  placeholder="Search messages..."
                />
              </div>

              {/* Chat room blocks */}
              <div className="space-y-3">
                {getFilteredChats().map((chat) => (
                  <div 
                    key={chat.id} 
                    onClick={() => setSelectedChatId(chat.id)}
                    className="flex items-center gap-4 bg-white dark:bg-[#15221b] p-4 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#0A8F5A] active:bg-neutral-100 dark:active:bg-neutral-800 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="relative">
                      {chat.avatar ? (
                        <img 
                          className="w-14 h-14 rounded-full object-cover" 
                          src={chat.avatar} 
                          alt={chat.name} 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-yellow-400/20 text-yellow-300 flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl">groups</span>
                        </div>
                      )}
                      {chat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#15221b] rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">{chat.name}</h4>
                        <span className="text-[10px] text-gray-400 font-medium">{chat.lastMessageTime}</span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-gray-400 truncate mt-0.5">{chat.lastMessageText}</p>
                    </div>
                  </div>
                ))}
              </div>
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
              className="space-y-6"
            >
              {/* Dynamic AI app generator prompt box (matches screen 4 top) */}
              <section>
                <div className="relative overflow-hidden rounded-3xl bg-[#111e17] p-6 border border-[#6ddb9f]/20 shadow-xl">
                  <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                    <span className="material-symbols-outlined text-[120px] text-[#6ddb9f]">auto_awesome</span>
                  </div>

                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006a41]/20 border border-[#6ddb9f]/30 text-[#6ddb9f] mb-3">
                      <span className="material-symbols-outlined text-xs font-bold">bolt</span>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider">AI Generator</span>
                    </div>

                    <h2 className="text-lg font-bold tracking-tight mb-2">Create Mini App with AI</h2>
                    <p className="text-xs text-gray-400 mb-4">Describe your micro-program, and our AI will architect, design, and deploy your personalized mini-app instantly inside AfriChat.</p>
                    
                    <div className="space-y-3">
                      <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Build a cooperative savings app / ride hailing program in Nairobi with payment integration..."
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-yellow-400 transition-colors text-white resize-none"
                        rows={2}
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={handleGenerateMiniApp}
                          disabled={isGeneratingApp}
                          className="bg-yellow-400 text-neutral-900 px-5 py-2.5 rounded-xl font-bold hover:bg-yellow-500 text-xs active:scale-95 transition-transform flex items-center gap-1.5"
                        >
                          {isGeneratingApp ? "Deploying App..." : "Generate & Deploy App"}
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Horizontal Scroll My Custom Created Programs */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-emerald-600 dark:text-[#6ddb9f] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">grid_view</span>
                    My Apps
                  </h3>
                  <button onClick={() => triggerToast("Your catalog contains 1 active program.")} className="text-yellow-400 text-[10px] font-bold">
                    View All
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {customMiniApps.map((app) => (
                    <div 
                      key={app.id}
                      className="min-w-[280px] bg-white dark:bg-[#15221b] p-4 rounded-2xl flex flex-col gap-3 border border-gray-100 dark:border-white/15 shadow-sm hover:border-[#0A8F5A] transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-11 h-11 rounded-xl bg-[#006a41]/10 flex items-center justify-center text-[#6ddb9f]">
                          <span className="material-symbols-outlined text-xl">{app.icon}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase rounded border border-emerald-500/20">
                          Active
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">{app.name}</h4>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{app.description}</p>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[9px] text-[#0A8F5A] font-bold uppercase tracking-wider">{app.category}</span>
                        <button 
                          onClick={() => setActiveMiniApp(app)}
                          className="text-yellow-500 text-xs font-bold hover:underline"
                        >
                          Launch App
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Create New Program Card button indicator */}
                  <div 
                    onClick={() => triggerToast("Please enter application prompt above to initiate deploy.")}
                    className="min-w-[150px] border-2 border-dashed border-[#bdcabf]/30 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#15221b]/30 cursor-pointer text-gray-400 group transition-all"
                  >
                    <span className="material-symbols-outlined text-lg opacity-60 group-hover:text-yellow-400">add</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-yellow-400">New App</span>
                  </div>
                </div>
              </section>

              {/* Popular Marketplace Programs Grid (Matches Screen 4 bottom) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-emerald-600 dark:text-[#6ddb9f] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">explore</span>
                    Popular Apps
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* SwiftRide Pro */}
                  <div className="bg-white dark:bg-[#15221b] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-lg group">
                    <div className="h-36 relative overflow-hidden bg-black/10">
                      <img 
                        alt="SwiftRide" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuACv1MZvdv9vsxUQi-dTaQrmXJqKPr0P6F9IZuQD6U9BwGbPJFyFYkc_sP90tODR5H1RmUMQ7wvOkfsMqXgB3l-K8AzwGy3P3yQ_UEscGOeG2xOgTchABTgeTJvAqF-rPaKfo3t13mqkPqWVMTJ9NVKdEdGraKn6N-gJ50Ygl7435EoSXYHpMiBKyvsfjraLE-GAfyrTB9gokqWmhbqWVIEBVrehopkQcmpGWvEIeFXgwt8HFnVXx7QhYD7V8xC_CW8uYdo93_qmGw"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-yellow-400 font-extrabold text-[8px] uppercase tracking-widest">
                        Trending
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-xs">SwiftRide Pro</h4>
                          <p className="text-[10px] text-gray-500 mt-1 lines-2">Complete ride-hailing ecosystem with integrated fleet coordination.</p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-between items-center text-xs">
                        <button 
                          onClick={() => triggerToast("Installed SwiftRide Pro mockup.")}
                          className="flex-1 bg-yellow-400 text-neutral-900 text-[10px] font-bold py-2 rounded-lg text-center active:scale-95 transition-transform"
                        >
                          Get App
                        </button>
                        <button className="p-2 border border-white/5 rounded-lg text-gray-400 hover:text-white">
                          <span className="material-symbols-outlined text-sm">bookmark</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MediPulse Plus */}
                  <div className="bg-white dark:bg-[#15221b] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-lg group">
                    <div className="h-36 relative overflow-hidden bg-black/10">
                      <img 
                        alt="MediPulse" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBA1lrNZizTRpMjpJlyAEPt-c0tfr39L60_CGC15jiqOIZ09Br6zp0e4BReX6k25S98_W_RF0m9G0yLOJoQcmxWJxtem_NdofYJ-B1BnddzfX20iPpSD8g4X-PzhT1Ky5fFOAipZKFmJmlb47t402fl8G02DyZQfsQYgqsLcmPe-I2PN3-eh3f_CCRnpJn5SDeFrRmqOW497ql7iukk29FnwKpzwm1HLWU6JD4w_YNM0O64oqP4ZmVx9_WECT7R0X1kXgX7D2aFcME"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-xs">MediPulse Plus</h4>
                          <p className="text-[10px] text-gray-500 mt-1 lines-2">Telemedicine platform with real-time prescription dispatch.</p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-between items-center text-xs">
                        <button 
                          onClick={() => triggerToast("Opening preview of MediPulse telemedicine program...")}
                          className="flex-1 border border-yellow-400 text-yellow-400 text-[10px] font-bold py-2 rounded-lg text-center hover:bg-yellow-400/10 active:scale-95 transition-transform"
                        >
                          Preview App
                        </button>
                        <button className="p-2 border border-white/5 rounded-lg text-gray-400 hover:text-white">
                          <span className="material-symbols-outlined text-sm">bookmark</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EduGlobal Hub */}
                  <div className="bg-white dark:bg-[#15221b] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-lg group">
                    <div className="h-36 relative overflow-hidden bg-black/10">
                      <img 
                        alt="EduGlobal" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLTDnhLbTEDxd8Paity-M8DGIvyaKQ9TqWesMzILn8cdnq-1XpEsfO-nRMeTfigvU7B0C1WqBGFoxU2JbO-O32B9NfrsOfwTwn7t_jLQlPQ9dnCi3E_Y9nYsgY_yi9CZvhnemw07nAvagPAEJNP9P2IoMG9qoY7UtZSNRjXidlEkd_mfsDENdhjQVaWn9Fp8M3ttc6lKB0JrHBD-TSIwe1lwjo2DtqYzBRWb9IiTcebu8AQMKPERksM7GD_PlUCKcptbYgFbQo1TY"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-xs">EduGlobal Hub</h4>
                          <p className="text-[10px] text-gray-500 mt-1 lines-2">Comprehensive school management, student portals and grading.</p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-between items-center text-xs">
                        <button 
                          onClick={() => triggerToast("Deployed EduGlobal client.")}
                          className="flex-1 bg-yellow-400 text-neutral-900 text-[10px] font-bold py-2 rounded-lg text-center active:scale-95 transition-transform"
                        >
                          Get App
                        </button>
                        <button className="p-2 border border-white/5 rounded-lg text-gray-400 hover:text-white">
                          <span className="material-symbols-outlined text-sm">bookmark</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {/* TAB 5: PROFILE SETTINGS & VERIFIED PARADIGM */}
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Profile card with AfriID credentials status */}
              <section className="bg-white dark:bg-[#15221b] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-md space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCUrd8IdmPEwAec_n7YJHz59JrraFEHvie6GsT_mht_-RDEY3Q_vjkmdDYvbgq8nm1C2rqt2syCejFmES6YjjUiMDHFg5XfYDADdGhEwuVGlgT0Fd8yuZUDwM4Ocz_IL3pU_whFOQA1E0Qz4Ym9tak7SlhFu78xDHYwJFaOp0BelKYffJYglAsBLR-PUQzLfusE6HT0by7o7g47BI1n_7_Of40qvClr_CTwQ1P9f_XahWyFKaDZDbK6kx3bKlGeoIx5cH8iFurAGw" 
                      alt="Godfrey" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-[#15221b] rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] text-white font-black">done</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-base">Godfrey</h2>
                      <span className="bg-[#0A8F5A]/20 text-[#6ddb9f] border border-[#0A8F5A]/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[11px] text-yellow-400">verified</span>
                        Verified ID
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">AfriID: #NGA-73892-GOD</p>
                    <p className="text-xs text-[#0A8F5A] font-bold">Trust Rating: {reputationScore}% Approved</p>
                  </div>
                </div>

                {/* Micro loans limits */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Cooperative Earnings</span>
                    <p className="text-sm font-extrabold text-yellow-400">₦240,500.00</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Micro Loan Limit</span>
                    <p className="text-sm font-extrabold text-[#6ddb9f]">₦1,500,000.00</p>
                  </div>
                </div>
              </section>

              {/* AfriID verification tracker section */}
              <section className="bg-white dark:bg-[#15221b] rounded-3xl p-5 border border-gray-100 dark:border-white/5 shadow-md space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-[#6ddb9f]">AfriID Digital Credentials</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-neutral-900/10 dark:bg-neutral-900/30 rounded-xl border border-white/5 text-xs text-on-surface">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#6ddb9f]">check_circle</span>
                      Phone Number Verified
                    </div>
                    <span className="text-[10px] uppercase font-bold text-gray-500">+234 •••• 12</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900/10 dark:bg-neutral-900/30 rounded-xl border border-white/5 text-xs text-on-surface">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#6ddb9f]">check_circle</span>
                      National ID Verified (KYC)
                    </div>
                    <span className="text-[10px] uppercase font-bold text-gray-500">NIN Verified</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900/10 dark:bg-neutral-900/30 rounded-xl border border-white/5 text-xs text-on-surface">
                    <div className="flex items-center gap-2 opacity-50">
                      <span className="material-symbols-outlined text-gray-400">pending</span>
                      Business Registration (CAC)
                    </div>
                    <button 
                      onClick={() => triggerToast("Redirecting to online CAC submission hub...")}
                      className="text-yellow-400 text-[10px] font-bold hover:underline"
                    >
                      Verify Now
                    </button>
                  </div>
                </div>
              </section>

              {/* Offline settings toggle and metadata details */}
              <section className="bg-[#111e17] rounded-3xl p-5 border border-[#6ddb9f]/20 shadow-md space-y-4 text-white">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6ddb9f] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">wifi_off</span>
                  AfriOffline Mesh Network
                </h3>
                <p className="text-xs text-gray-400">You are in a low connectivity zone? Switch on Local network sharing to route messages over neighboring Bluetooth and Wi-Fi Direct nodes securely.</p>

                <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl">
                  <span className="text-xs font-medium">Activate Bluetooth Relay Sync</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      checked={isOfflineMode} 
                      onChange={() => {
                        setIsOfflineMode(!isOfflineMode);
                        triggerToast(isOfflineMode ? "Standard internet routing active" : "Mesh local relay sync enabled offline");
                      }}
                      className="sr-only peer" 
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A8F5A]"></div>
                  </label>
                </div>
              </section>
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
                  onClick={() => { setShowCreateMenu(false); setActiveTab('discover'); }}
                  className="p-4 bg-black/20 hover:bg-[#006a41]/25 border border-white/5 rounded-2xl cursor-pointer flex flex-col items-center gap-2 text-center"
                >
                  <span className="material-symbols-outlined text-[#6ddb9f] text-2xl">auto_awesome</span>
                  <div>
                    <p className="text-xs font-bold">Launch Custom App</p>
                    <p className="text-[10px] text-gray-500">Compile brand templates with AI</p>
                  </div>
                </div>

                {/* 2 */}
                <div 
                  onClick={() => { setShowCreateMenu(false); triggerToast("Broadcast channel initiated: Create campaign draft."); }}
                  className="p-4 bg-black/20 hover:bg-[#006a41]/25 border border-white/5 rounded-2xl cursor-pointer flex flex-col items-center gap-2 text-center"
                >
                  <span className="material-symbols-outlined text-yellow-400 text-2xl">rss_feed</span>
                  <div>
                    <p className="text-xs font-bold">New Broadcast</p>
                    <p className="text-[10px] text-gray-500">Announce items to 50,000 users</p>
                  </div>
                </div>

                {/* 3 */}
                <div 
                  onClick={() => { setShowCreateMenu(false); triggerToast("Village co-op contribution pool registered."); }}
                  className="p-4 bg-black/20 hover:bg-[#006a41]/25 border border-white/5 rounded-2xl cursor-pointer flex flex-col items-center gap-2 text-center"
                >
                  <span className="material-symbols-outlined text-blue-400 text-2xl">diversity_3</span>
                  <div>
                    <p className="text-xs font-bold">Register Collective</p>
                    <p className="text-[10px] text-gray-500">Savings cooperative setup</p>
                  </div>
                </div>

                {/* 4 */}
                <div 
                  onClick={() => { setShowCreateMenu(false); triggerToast("AfriLearn tutor program initiated."); }}
                  className="p-4 bg-black/20 hover:bg-[#006a41]/25 border border-white/5 rounded-2xl cursor-pointer flex flex-col items-center gap-2 text-center"
                >
                  <span className="material-symbols-outlined text-pink-400 text-2xl">school</span>
                  <div>
                    <p className="text-xs font-bold">New AfriLearn Course</p>
                    <p className="text-[10px] text-gray-500">Upload skill videos & AI quizzes</p>
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

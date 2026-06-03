import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  rating: string;
  image: string;
  seller: string;
  isCustom?: boolean;
}

interface AfriMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  balance: number;
  onDeductBalance: (amount: number, description: string) => void;
  triggerToast: (msg: string) => void;
}

export default function AfriMarketModal({
  isOpen,
  onClose,
  theme,
  balance,
  onDeductBalance,
  triggerToast
}: AfriMarketModalProps) {
  // Pre-loaded high-fidelity African listings
  const [products, setProducts] = useState<Product[]>([
    {
      id: "prod-1",
      name: "Handwoven Ghana Kente Scarf",
      price: 9500,
      category: "Fashion",
      description: "Authentic premium silk and cotton blend scarf directly from weavers in Kumasi, Ghana.",
      rating: "4.9 ★",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80",
      seller: "Kofi's Heritage Shop"
    },
    {
      id: "prod-2",
      name: "Organic Shea Body Gold Butter (500g)",
      price: 5400,
      category: "Wellness",
      description: "100% pure raw unrefined grade-A whipped Shea Butter infused with lavender oils and vitamin E.",
      rating: "4.8 ★",
      image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80",
      seller: "Amara Naturals"
    },
    {
      id: "prod-3",
      name: "Beaded Maasai Ceremonial Necklace",
      price: 14200,
      category: "Jewelry",
      description: "Intricately detailed handheld beadwork crafted by traditional Maasai women in Narok.",
      rating: "5.0 ★",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80",
      seller: "Nairobi Crafts Collective"
    },
    {
      id: "prod-4",
      name: "Ebony Carved Nigerian Tribal Mask",
      price: 21000,
      category: "Art & Decor",
      description: "Heavy solid ebony timber handframed visual art with brass wire inlay accents.",
      rating: "4.7 ★",
      image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
      seller: "Gbenga Curio Hub"
    }
  ]);

  // AI Product Generator state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPrice, setAiPrice] = useState("15000");
  const [aiCategory, setAiCategory] = useState("Fashion");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [generatedProduct, setGeneratedProduct] = useState<Product | null>(null);

  // Live selling channel state
  const [activeLiveChannel, setActiveLiveChannel] = useState<string | null>(null);
  const [liveComments, setLiveComments] = useState<{ user: string; text: string }[]>([
    { user: "Tunde Alabi", text: "Wow, is that the pure gold thread model?" },
    { user: "Zainab_92", text: "I bought one last week, highly recommended!" },
    { user: "Efe_Fintech", text: "Do you ship to Port Harcourt?" },
    { user: "Musa_K", text: "Perfect fabric, ordering 4 yards now!" }
  ]);
  const [newLiveComment, setNewLiveComment] = useState("");

  // Checkout simulation
  const [selectedProductForPurchase, setSelectedProductForPurchase] = useState<Product | null>(null);

  const handleGenerateAIProduct = () => {
    if (!aiPrompt.trim()) {
      triggerToast("Please describe the product first");
      return;
    }
    setIsGenerating(true);
    setGeneratedProduct(null);
    setGenerationSteps([]);

    const steps = [
      "AI interpreting prompt constraints... 👤",
      "Drafting premium product coordinates... 📐",
      "Sourcing traditional African pattern pairings... ✨",
      "Optimizing pricing curves against inflation index... 📈",
      "Ready to deploy!"
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setGenerationSteps(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsGenerating(false);
          const priceVal = parseInt(aiPrice) || 12000;
          setGeneratedProduct({
            id: "ai-prod-" + Date.now(),
            name: "Lagos Custom " + aiPrompt.split(" ").slice(0, 3).join(" ") + " Spec",
            price: priceVal,
            category: aiCategory,
            description: `AI-crafted exclusive ${aiPrompt}. Features exquisite handworked detailing, reinforced seams, and breathable fabric suited for warm climates. Built with premium materials.`,
            rating: "5.0 ★",
            image: aiCategory === "Fashion" 
              ? "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=400&q=80" 
              : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80",
            seller: "My AI Virtual Store",
            isCustom: true
          });
        }
      }, (idx + 1) * 750);
    });
  };

  const handlePublishGeneratedProduct = () => {
    if (generatedProduct) {
      setProducts(prev => [generatedProduct, ...prev]);
      setGeneratedProduct(null);
      setAiPrompt("");
      triggerToast(`Published ${generatedProduct.name} to the public catalog!`);
    }
  };

  const handleConfirmPurchase = () => {
    if (!selectedProductForPurchase) return;
    if (balance < selectedProductForPurchase.price) {
      triggerToast("Insufficient balance in AfriPay Wallet!");
      setSelectedProductForPurchase(null);
      return;
    }

    onDeductBalance(selectedProductForPurchase.price, `Marketplace purchase: ${selectedProductForPurchase.name}`);
    triggerToast(`Payment successful! Ordered ${selectedProductForPurchase.name}. Seller has been notified.`);
    setSelectedProductForPurchase(null);
  };

  const handleAddLiveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiveComment.trim()) return;
    setLiveComments(prev => [...prev, { user: "You (Godfrey)", text: newLiveComment }]);
    setNewLiveComment("");
    setTimeout(() => {
      // Simulate automatic seller reply
      setLiveComments(prev => [...prev, { user: "Kemi (Host)", text: "Thanks Godfrey! Yes, that's available in standard NGN and USD currency!" }]);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-on-surface overflow-hidden">
      {/* Header */}
      <header className="bg-[#006A42] text-white py-4 px-6 flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">AfriMarket</h1>
            <p className="text-[10px] text-emerald-200">Shop • Trade • AI Live Commerce</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-black/15 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-yellow-400">AfriPay</span>
            <span className="text-xs font-black">₦{balance.toLocaleString()}</span>
          </div>
          <span className="material-symbols-outlined cursor-pointer hover:opacity-80">shopping_cart</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Banner */}
        <section className="bg-gradient-to-r from-[#006A42] to-[#0A8F5A] px-6 py-8 text-white relative flex flex-col justify-center">
          <h2 className="text-2xl font-black tracking-tight leading-tight">Instagram-style Social Retail</h2>
          <p className="text-xs text-emerald-100 mt-2 max-w-md">Discover authentic products, join interactive live selling auctions, or launch products instantly with our AI Product Generator.</p>
        </section>

        {/* Live commerce streaming channels widget */}
        <section className="px-6 mt-6 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm tracking-tight uppercase text-emerald-600 dark:text-[#6ddb9f]">🔴 Live Selling Commerce</h3>
            <span className="text-[10px] font-bold text-[#F4B400] animate-pulse">4 Streams active</span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hidden">
            {/* Live Card 1 */}
            <div 
              onClick={() => setActiveLiveChannel("Kemi's Premium Ankara Design")}
              className="min-w-[180px] w-[180px] h-[240px] rounded-3xl relative overflow-hidden bg-black group shadow cursor-pointer border border-red-500/30"
            >
              <img 
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                src="https://images.unsplash.com/photo-1590534247854-e97d5e3feef6?w=250&q=80" 
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent"></div>
              <div className="absolute top-3 left-3 bg-[#E53935] text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                LIVE
              </div>
              <div className="absolute top-3 right-3 bg-black/40 text-white font-bold text-[8px] px-2 py-0.5 rounded-md">
                👥 432
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <h4 className="font-extrabold text-[#F4B400] text-xs leading-none truncate">Kemi's Ankara Hub</h4>
                <p className="text-[10px] text-gray-300 mt-1">Ankara Silk & Lace Sale</p>
              </div>
            </div>

            {/* Live Card 2 */}
            <div 
              onClick={() => setActiveLiveChannel("Tunde's African Artifact Auction")}
              className="min-w-[180px] w-[180px] h-[240px] rounded-3xl relative overflow-hidden bg-black group shadow cursor-pointer border border-transparent hover:border-[#0A8F5A]"
            >
              <img 
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=250&q=80" 
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent"></div>
              <div className="absolute top-3 left-3 bg-[#E53935] text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                LIVE
              </div>
              <div className="absolute top-3 right-3 bg-black/40 text-white font-bold text-[8px] px-2 py-0.5 rounded-md">
                👥 188
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <h4 className="font-extrabold text-[#F4B400] text-xs leading-none truncate">Tunde's Bead Co.</h4>
                <p className="text-[10px] text-gray-300 mt-1">Handcarved Art Pieces</p>
              </div>
            </div>

            {/* Live Card 3 */}
            <div 
              onClick={() => triggerToast("Join Nairobi Shea Cream live selling next week")}
              className="min-w-[180px] w-[180px] h-[240px] rounded-3xl relative overflow-hidden bg-black opacity-75 group shadow cursor-pointer"
            >
              <img 
                className="w-full h-full object-cover" 
                src="https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=250&q=80" 
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent"></div>
              <div className="absolute top-3 left-3 bg-gray-600 text-white font-semibold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                SCHEDULED (6PM)
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <h4 className="font-extrabold text-white text-xs leading-none truncate">Amara Naturals</h4>
                <p className="text-[10px] text-gray-400 mt-1"> whipped wellness demo</p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Product Generator section card dashboard */}
        <section className="px-6 mt-8">
          <div className="bg-gradient-to-br from-[#0F2E21] to-[#0A1F16] rounded-3xl p-6 border border-[#0A8F5A]/40 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 font-black text-white/5 pointer-events-none select-none">
              <span className="material-symbols-outlined text-[130px]">auto_awesome</span>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F4B400]">auto_awesome</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#6ddb9f]">AI Storefront Product Generator</h3>
              </div>
              <p className="text-xs text-gray-300">Type what you want to sell. AfriAI will instantly generate descriptions, pricing recommendations, rating specifications, and automatically publish to the market.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Product Concept Prompt</label>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full bg-black/40 border border-[#0A8F5A]/20 focus:border-[#0A8F5A] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 outline-none resize-none h-20"
                    placeholder="e.g., Handmade Yoruba-themed adire graphic shirt for university students..."
                  />
                </div>
                <div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Target Price (₦)</label>
                      <input 
                        value={aiPrice}
                        onChange={(e) => setAiPrice(e.target.value)}
                        type="number"
                        className="w-full bg-black/40 border border-[#0A8F5A]/20 focus:border-[#0A8F5A] rounded-xl px-4 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Category</label>
                      <select 
                        value={aiCategory}
                        onChange={(e) => setAiCategory(e.target.value)}
                        className="w-full bg-[#0A1F16] border border-[#0A8F5A]/20 text-xs text-white rounded-xl px-4 py-2 outline-none"
                      >
                        <option value="Fashion">Fashion</option>
                        <option value="Wellness">Wellness</option>
                        <option value="Jewelry">Jewelry</option>
                        <option value="Art & Decor">Art & Decor</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleGenerateAIProduct}
                  disabled={isGenerating}
                  className="bg-[#0A8F5A] hover:bg-[#006A42] text-white text-xs font-black px-6 py-3 rounded-2xl flex items-center gap-2 transition-transform active:scale-95 shadow-lg cursor-pointer"
                >
                  {isGenerating ? "Synthesizing Specification..." : "Generate Product Catalog"}
                  <span className="material-symbols-outlined text-xs">settings_suggest</span>
                </button>
              </div>

              {/* Progress Steps */}
              {isGenerating && (
                <div className="bg-black/30 p-4 rounded-2xl border border-[#0A8F5A]/10 space-y-2 mt-3 animate-pulse duration-1000">
                  <div className="flex items-center gap-2 text-xs text-[#6ddb9f] font-bold">
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    AfriAI Synthesizer Active:
                  </div>
                  <div className="space-y-1">
                    {generationSteps.map((step, idx) => (
                      <div key={idx} className="text-[10px] text-gray-400 font-mono">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Result Preview */}
              {generatedProduct && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#1F332A] rounded-2xl p-5 border border-yellow-400/20 space-y-4"
                >
                  <div className="flex items-center gap-2 text-xs text-yellow-400 font-bold">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Product Specifications Draft Ready!
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    <img className="w-20 h-20 rounded-xl object-cover" src={generatedProduct.image} alt="" />
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">{generatedProduct.category}</span>
                      <h4 className="font-extrabold text-sm">{generatedProduct.name}</h4>
                      <p className="text-[11px] text-yellow-400 font-extrabold">₦{generatedProduct.price.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-300 leading-snug">{generatedProduct.description}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      onClick={() => setGeneratedProduct(null)} 
                      className="px-4 py-2 bg-transparent text-gray-400 hover:text-white text-xs"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={handlePublishGeneratedProduct}
                      className="bg-yellow-400 text-neutral-900 font-black text-xs px-5 py-2 rounded-xl hover:bg-yellow-500 active:scale-95 transition-all"
                    >
                      Publish & Deploy
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* Product Catalog list */}
        <section className="px-6 mt-8 space-y-4">
          <h3 className="font-extrabold text-sm tracking-tight uppercase text-emerald-600 dark:text-[#6ddb9f]">Discover Marketplace</h3>

          <div className="grid grid-cols-2 gap-4">
            {products.map((p) => (
              <div 
                key={p.id}
                className={`rounded-3xl border overflow-hidden p-3 flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-md ${
                  theme === 'dark' 
                    ? 'bg-black/20 border-white/5 text-white' 
                    : 'bg-white border-neutral-100 text-neutral-900 shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="h-32 rounded-2xl overflow-hidden relative select-none bg-neutral-800">
                    <img className="w-full h-full object-cover" src={p.image} alt={p.name} />
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white font-bold text-[9px] px-2 py-0.5 rounded-full">
                      {p.rating}
                    </span>
                    {p.isCustom && (
                      <span className="absolute top-2 right-2 bg-yellow-400 text-black font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded border border-black/10 shadow animate-bounce">
                        AI Build
                      </span>
                    )}
                  </div>

                  <div className="px-1 space-y-1">
                    <span className="text-[8px] uppercase font-bold text-gray-500 tracking-wider block">{p.seller}</span>
                    <h4 className="font-extrabold text-xs leading-snug truncate-2-lines min-h-[32px]">{p.name}</h4>
                    <p className="text-[10px] text-gray-400 leading-snug line-clamp-2">{p.description}</p>
                  </div>
                </div>

                <div className="pt-2 px-1 flex items-center justify-between border-t border-gray-100/10 mt-3">
                  <span className="text-xs font-black text-[#0A8F5A] dark:text-[#6ddb9f]">₦{p.price.toLocaleString()}</span>
                  <button 
                    onClick={() => setSelectedProductForPurchase(p)}
                    className="bg-[#006A42] hover:bg-[#0A8F5A] text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    Quick Buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Live Auction Player Full Overlay */}
      <AnimatePresence>
        {activeLiveChannel && (
          <div className="fixed inset-0 z-55 bg-black text-white flex flex-col md:flex-row">
            {/* Left/Top: Live Feed video placeholder */}
            <div className="flex-1 relative bg-neutral-950 flex items-center justify-center min-h-[40vh] md:min-h-0">
              <img 
                className="w-full h-full object-cover absolute inset-0 opacity-70" 
                src="https://images.unsplash.com/photo-1590534247854-e97d5e3feef6?w=800&q=80" 
                alt="Streaming Feed"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
              
              {/* Dynamic streamer details */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="bg-red-600 text-white font-black text-[10px] px-3 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                  ● LIVE BROADCAST
                </span>
                <span className="bg-black/50 text-xs px-2.5 py-0.5 rounded-md text-white font-semibold">
                  👥 1,524 Watching
                </span>
              </div>

              {/* Close channel */}
              <button 
                onClick={() => setActiveLiveChannel(null)} 
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/75 p-2 rounded-full"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>

              {/* Central Selling Promo banner overlay */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-3xl bg-black/60 backdrop-blur-md border border-yellow-400/20 flex justify-between items-center max-w-xl mx-auto shadow-2xl animate-bounce-slow">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#F97316] flex items-center justify-center font-bold text-xs">👗</div>
                  <div>
                    <h5 className="font-extrabold text-xs text-yellow-400">Limited Royal Lagos Lace (4 yards)</h5>
                    <p className="text-[10px] text-gray-300">Reserve price: <span className="font-bold text-white">₦24,500</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (balance < 24500) {
                      triggerToast("Insufficient Wallet balance to join bid!");
                      return;
                    }
                    onDeductBalance(24500, "Live Selling: Royal Lagos Lace");
                    triggerToast("Bidding successful! Product locked in. Checkout approved.");
                    setActiveLiveChannel(null);
                  }}
                  className="bg-yellow-400 hover:bg-yellow-500 text-neutral-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Right/Bottom: Comment deck */}
            <div className="w-full md:w-80 h-[40vh] md:h-full bg-[#0b1410] border-t md:border-t-0 md:border-l border-white/5 flex flex-col">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div>
                  <h4 className="font-extrabold text-xs text-emerald-400 truncate w-48">{activeLiveChannel}</h4>
                  <p className="text-[10px] text-gray-400">Secure Live Auction Room</p>
                </div>
                <span className="material-symbols-outlined text-[#F4B400] text-sm">favorite</span>
              </div>

              {/* Scrolling comments feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {liveComments.map((com, idx) => (
                  <div key={idx} className="text-xs bg-white/5 p-2 rounded-xl border border-white/3">
                    <span className="font-extrabold text-yellow-400 mr-1.5">{com.user}:</span>
                    <span className="text-gray-200">{com.text}</span>
                  </div>
                ))}
              </div>

              {/* Comment compose form */}
              <form onSubmit={handleAddLiveComment} className="p-3 border-t border-white/5 bg-black/40 flex gap-2">
                <input 
                  value={newLiveComment}
                  onChange={(e) => setNewLiveComment(e.target.value)}
                  placeholder="Ask seller or enter bid..."
                  type="text"
                  className="flex-grow bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#0A8F5A] text-white"
                />
                <button type="submit" className="bg-[#0A8F5A] text-white px-3 py-1.5 rounded-xl text-xs font-bold">
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Purchase Slide Up Modal */}
      <AnimatePresence>
        {selectedProductForPurchase && (
          <div className="fixed inset-0 z-55 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedProductForPurchase(null)}></div>
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`w-full max-w-lg rounded-t-[32px] p-6 border-t shadow-2xl relative z-10 ${
                theme === 'dark' ? 'bg-[#15221b] border-white/10 text-white' : 'bg-white border-gray-200 text-neutral-900'
              }`}
            >
              <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-5"></div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[28px]">payments</span>
                </div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-emerald-600 dark:text-yellow-400">Secure Purchase Authorization</h3>
                
                <p className="text-xs text-gray-500">You are authorizing direct payment from your super wallet balance. Funds will be deposited in the seller's verified escrow instantly.</p>

                <div className="bg-black/10 dark:bg-black/20 p-4 rounded-2xl flex items-center justify-between text-left mt-4 border border-white/5">
                  <div>
                    <h4 className="font-extrabold text-xs text-white-900">{selectedProductForPurchase.name}</h4>
                    <span className="text-[10px] text-gray-400">Sold by {selectedProductForPurchase.seller}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-[#0A8F5A] dark:text-[#6ddb9f]">₦{selectedProductForPurchase.price.toLocaleString()}</p>
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Instant Escrow</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setSelectedProductForPurchase(null)}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel Order
                  </button>
                  <button 
                    onClick={handleConfirmPurchase}
                    className="flex-1 bg-[#0A8F5A] hover:bg-[#006A42] text-white py-3 rounded-xl text-xs font-black transition-all shadow-md"
                  >
                    Approve & Pay (₦{selectedProductForPurchase.price.toLocaleString()})
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

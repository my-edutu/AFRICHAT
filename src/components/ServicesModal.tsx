import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ServiceProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  balance: number;
  onDeductBalance: (amount: number, description: string) => void;
  triggerToast: (msg: string) => void;
}

interface Provider {
  id: string;
  name: string;
  service: string;
  rating: string;
  trips: string;
  price: number;
  eta: string;
  avatar: string;
}

export default function ServicesModal({
  isOpen,
  onClose,
  theme,
  balance,
  onDeductBalance,
  triggerToast
}: ServiceProps) {
  const [selectedSubCategory, setSelectedSubCategory] = useState<"ride" | "delivery" | "mechanic" | "beauty">("ride");
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [bookingStage, setBookingStage] = useState<"idle" | "authorizing" | "enroute" | "arrived">("idle");
  const [etaTimer, setEtaTimer] = useState<string>("5 mins");

  const providers: Record<string, Provider[]> = {
    ride: [
      { id: "p-1", name: "Aisha Yusuf", service: "Premium Abuja Hatchback", rating: "4.9 ★", trips: "1,240 trips", price: 1800, eta: "3 mins", avatar: "👩🏽‍✈️" },
      { id: "p-2", name: "Babajide Alabi", service: "Comfort Lagos Sedan", rating: "4.8 ★", trips: "980 trips", price: 2300, eta: "6 mins", avatar: "👨🏾‍✈️" }
    ],
    delivery: [
      { id: "p-3", name: "Chinedu Okafor", service: "Ikeja Express Food Cycle", rating: "4.7 ★", trips: "2,150 drops", price: 805, eta: "12 mins", avatar: "🚴🏾" },
      { id: "p-4", name: "Fatima Bello", service: "Abuja Grocery Porter", rating: "4.9 ★", trips: "450 drops", price: 1200, eta: "15 mins", avatar: "👩🏾‍🍳" }
    ],
    mechanic: [
      { id: "p-5", name: "Kunle Solaja", service: "Toyota/Honda Engine Expert", rating: "5.0 ★", trips: "320 callouts", price: 4500, eta: "25 mins", avatar: "👨🏾‍🔧" },
      { id: "p-6", name: "Okoro mechanic", service: "Brake & Electrical Specialist", rating: "4.6 ★", trips: "610 callouts", price: 3500, eta: "30 mins", avatar: "🔧" }
    ],
    beauty: [
      { id: "p-7", name: "Kemi Adesina", service: "Home Braiding & Makeup", rating: "4.9 ★", trips: "170 visits", price: 8000, eta: "Today 4pm", avatar: "💇🏾‍♀️" },
      { id: "p-8", name: "Zainab Lasisi", service: "Manicure & Organic Spa Nails", rating: "4.8 ★", trips: "260 visits", price: 5500, eta: "Tomorrow 10am", avatar: "💅🏾" }
    ]
  };

  const handleStartBookingProcess = (provider: Provider) => {
    setBookingProvider(provider);
    setBookingStage("authorizing");
  };

  const handleConfirmSecureBooking = () => {
    if (!bookingProvider) return;
    if (balance < bookingProvider.price) {
      triggerToast("Insufficient Wallet Balance!");
      setBookingStage("idle");
      setBookingProvider(null);
      return;
    }

    onDeductBalance(bookingProvider.price, `Booked ${bookingProvider.service}: ${bookingProvider.name}`);
    triggerToast(`Wallet Authorized: ₦${bookingProvider.price}. Contacting ${bookingProvider.name}...`);
    
    setBookingStage("enroute");
    setEtaTimer(bookingProvider.eta);

    // Simulate driver traveling
    setTimeout(() => {
      setBookingStage("arrived");
      triggerToast(`🔔 Notification: ${bookingProvider.name} is arriving at your digital coordinate!`);
    }, 4500);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-[#0E1B14] text-white' : 'bg-[#F8F9FA] text-neutral-900'} overflow-hidden`}>
      {/* Header */}
      <header className="bg-[#006A42] text-white py-4 px-6 flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">AfriServices</h1>
            <p className="text-[10px] text-emerald-200">On-Demand Rides, Deliveries, Experts nearby</p>
          </div>
        </div>
        <div className="bg-black/15 px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold text-yellow-400">
          ₦{balance.toLocaleString()}
        </div>
      </header>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Visual Map Simulator */}
        <section className="h-44 bg-[#EAF9EE] relative overflow-hidden select-none border-b border-[#0A8F5A]/10">
          {/* Mock Grid Lines as map aesthetic elements */}
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-6 opacity-[0.06] bg-black"></div>
          
          <div className="absolute inset-x-8 bottom-3 bg-white/90 backdrop-blur border border-emerald-500/10 p-3.5 rounded-2xl shadow-lg text-neutral-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-sm">my_location</span>
              <div>
                <p className="text-[10px] font-bold text-gray-400 leading-none uppercase">Location Coordinate</p>
                <p className="text-xs font-black mt-0.5 whitespace-nowrap truncate w-44">Ikeja Main, Lagos, Nigeria</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/15 text-[#006A42] font-extrabold px-2.5 py-1 rounded-lg border border-emerald-500/20">GPS Match</span>
          </div>

          {/* Glowing pinpoint */}
          <div className="absolute top-12 left-1/3 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute top-12 left-1/3 w-2.5 h-2.5 bg-red-650 rounded-full border-2 border-white shadow"></div>

          {/* Cars floating on map */}
          <span className="absolute top-8 right-1/4 text-2xl animate-pulse">🚗</span>
          <span className="absolute bottom-12 right-1/3 text-2xl select-none">🏍️</span>
        </section>

        {/* Tab Subcategories selector */}
        <section className="px-6 mt-6 flex justify-between items-center gap-2">
          {[
            { id: "ride", label: "Ride", icon: "local_taxi" },
            { id: "delivery", label: "Delivery", icon: "sports_motorsports" },
            { id: "mechanic", label: "Mechanic", icon: "construction" },
            { id: "beauty", label: "Beauty", icon: "content_cut" }
          ].map((cat) => {
            const active = selectedSubCategory === cat.id;
            return (
              <button 
                key={cat.id}
                onClick={() => {
                  setSelectedSubCategory(cat.id as any);
                  triggerToast(`Loading verified ${cat.label} operators in Lagos.`);
                }}
                className={`flex-1 py-3 rounded-2xl border transition-all flex flex-col items-center gap-1 cursor-pointer hover:scale-[1.02] ${
                  active 
                    ? 'bg-[#006a41]/10 border-[#0A8F5A] text-[#0A8F5A] font-extrabold shadow-sm' 
                    : 'bg-white/5 border-white/5 text-gray-400'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{cat.label}</span>
              </button>
            );
          })}
        </section>

        {/* Active Providers List */}
        <section className="px-6 mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm tracking-tight uppercase text-emerald-600 dark:text-[#6ddb9f]">
              Lagos Top Verified Operators
            </h3>
            <span className="text-[10px] font-black text-gray-500 uppercase">Interactive List</span>
          </div>

          <div className="space-y-3">
            {providers[selectedSubCategory].map((provider) => (
              <div 
                key={provider.id}
                className={`p-4 rounded-3xl border flex items-center justify-between transition-shadow hover:shadow-md ${
                  theme === 'dark' ? 'bg-black/20 border-white/5 text-white' : 'bg-white border-neutral-100 text-neutral-900 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl w-12 h-12 bg-neutral-900/10 rounded-full flex items-center justify-center">
                    {provider.avatar}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-xs">{provider.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{provider.service}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold mt-1">
                      <span className="text-[#F4B400] bg-[#F4B400]/10 px-1.5 py-0.5 rounded text-[8px]">{provider.rating}</span>
                      <span className="text-gray-500">{provider.trips}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className="text-xs font-black text-[#0A8F5A] dark:text-[#6ddb9f]">₦{provider.price.toLocaleString()}</span>
                  <button 
                    onClick={() => handleStartBookingProcess(provider)}
                    className="bg-[#006A42] hover:bg-[#0A8F5A] text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    Select ETA {provider.eta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Booking State Bottom Sheet Overlay */}
      <AnimatePresence>
        {bookingProvider && bookingStage !== "idle" && (
          <div className="fixed inset-0 z-55 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => { if (bookingStage !== "enroute") setBookingProvider(null); }}></div>
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`w-full max-w-lg rounded-t-[32px] p-6 border-t shadow-2xl relative z-10 ${
                theme === 'dark' ? 'bg-[#15221b] border-white/10 text-white' : 'bg-white border-gray-200 text-neutral-900'
              }`}
            >
              <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-5"></div>

              {bookingStage === "authorizing" && (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[28px]">payments</span>
                  </div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-amber-600 dark:text-yellow-400">Confirm AfriServices Authorization</h3>
                  
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Approve secure withdrawal representing {bookingProvider.service} from your wallet account.
                  </p>

                  <div className="bg-black/10 p-4 rounded-2xl flex justify-between text-left items-center border border-white/5">
                    <div>
                      <p className="font-black text-xs text-white-900">{bookingProvider.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{bookingProvider.service}</p>
                    </div>
                    <span className="font-black text-xs text-[#0A8F5A]">₦{bookingProvider.price}</span>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button 
                      onClick={() => { setBookingStage("idle"); setBookingProvider(null); }}
                      className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-300 py-3 rounded-xl text-xs font-bold"
                    >
                      Cancel Booking
                    </button>
                    <button 
                      onClick={handleConfirmSecureBooking}
                      className="flex-1 bg-[#0A8F5A] hover:bg-[#006A42] text-white py-3 rounded-xl text-xs font-black"
                    >
                      Authorize Payment
                    </button>
                  </div>
                </div>
              )}

              {bookingStage === "enroute" && (
                <div className="text-center space-y-5 py-4">
                  <div className="w-16 h-16 rounded-full border-4 border-dashed border-emerald-400 animate-spin flex items-center justify-center mx-auto">
                    <span className="text-3xl animate-bounce">🚗</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[#6ddb9f] text-sm uppercase tracking-wider">Driver En-Route</h3>
                    <p className="text-[11px] text-gray-400">GPS verified Aisha Yusuf is traveling toward your designated pickup point.</p>
                  </div>

                  <div className="bg-[#0b1410] border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                    <div className="text-left">
                      <span className="text-[9px] text-[#F4B400] uppercase font-bold tracking-widest block">Estimated Arrival</span>
                      <span className="text-xs font-extrabold text-white">{etaTimer}</span>
                    </div>
                    <span className="bg-[#0A8F5A] text-white text-[9px] font-bold px-3 py-1 rounded border border-emerald-500/20">LIVE TRANSIT</span>
                  </div>
                </div>
              )}

              {bookingStage === "arrived" && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-12 h-12 bg-emerald-500/15 text-[#006A42] rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[32px]">check_circle</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-emerald-500 text-sm">Operator Has Arrived!</h3>
                    <p className="text-xs text-gray-500">{bookingProvider.name} is waiting for you in Ikeja main lane.</p>
                  </div>

                  <button 
                    onClick={() => { setBookingStage("idle"); setBookingProvider(null); }}
                    className="w-full bg-[#0A8F5A] text-white py-3 mt-4 rounded-xl text-xs font-extrabold shadow-md"
                  >
                    Complete Session & Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

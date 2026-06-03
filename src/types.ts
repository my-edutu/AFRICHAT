export interface Message {
  id: string;
  sender: 'me' | 'other' | 'system';
  senderName: string;
  text: string;
  originalText?: string; // For translated messages
  language?: string;     // Language code/string
  timestamp: string;
  isVoiceNote?: boolean;
  voiceDuration?: string;
  voiceTranscript?: string;
  isRead?: boolean;
}

export interface Chat {
  id: string;
  name: string;
  avatar?: string;
  isGroup?: boolean;
  isOnline?: boolean;
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
  messages: Message[];
}

export interface Transaction {
  id: string;
  title: string;
  category: 'shopping' | 'transfer' | 'utility' | 'travel' | 'deposit';
  amount: number; // Positive for deposit, negative for spending
  currency: string;
  date: string;
  time: string;
  status: 'Completed' | 'Pending' | 'Received' | 'Converted';
}

export interface MiniApp {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string; // Material symbol name
  bgColor: string; // Tailwind hex or class accent
  textColor: string;
  isCustom?: boolean;
  isActive?: boolean;
  creator?: string;
  screens?: {
    title: string;
    description: string;
    items: string[];
    actions: { label: string; actionType: string }[];
  }[];
}

export interface AIAppSetup {
  name: string;
  category: 'Ride Hailing' | 'School Portal' | 'Marketplace' | 'Healthcare' | 'Cooperative' | 'Logistics' | 'Delivery';
  colorTheme: string; // hex color
  pricingStructure: string;
  paymentMethods: string[];
  initialData: any[]; // generic mocked rows for the app to showcase
  adminNotes: string;
}

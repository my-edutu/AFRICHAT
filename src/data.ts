import { Chat, Transaction, MiniApp } from './types';

export const initialChats: Chat[] = [
  {
    id: "amina-k",
    name: "Best Friends",
    avatar: "/africhat-mark.svg",
    isOnline: true,
    unreadCount: 0,
    lastMessageText: "See you at 6pm! 👋",
    lastMessageTime: "11:30 AM",
    messages: [
      {
        id: "m1",
        sender: "other",
        senderName: "Best Friends",
        originalText: "Sannu, ya kake? Ina fatan kana cikin koshin lafiya.",
        text: "Hello, how are you? I hope you are in good health.",
        language: "Hausa",
        timestamp: "10:42 AM"
      },
      {
        id: "m2",
        sender: "me",
        senderName: "Godfrey",
        text: "I'm doing great, guys! See you later.",
        timestamp: "10:45 AM"
      },
      {
        id: "m3",
        sender: "other",
        senderName: "Best Friends",
        text: "See you at 6pm! 👋",
        timestamp: "11:30 AM"
      }
    ]
  },
  {
    id: "work-group",
    name: "Work Group",
    isGroup: true,
    avatar: "groups",
    isOnline: true,
    unreadCount: 0,
    lastMessageText: "Project update has been uploaded.",
    lastMessageTime: "10:20 AM",
    messages: [
      {
        id: "w1",
        sender: "other",
        senderName: "Abidemi Folake",
        text: "Are the branding slides ready for the investor pitch?",
        timestamp: "9:15 AM"
      },
      {
        id: "w2",
        sender: "me",
        senderName: "Godfrey",
        text: "Project update has been uploaded.",
        timestamp: "10:20 AM"
      }
    ]
  },
  {
    id: "mom",
    name: "Mom",
    avatar: "/africhat-mark.svg",
    isOnline: false,
    unreadCount: 0,
    lastMessageText: "Please call me when you are free.",
    lastMessageTime: "Yesterday",
    messages: [
      {
        id: "mom1",
        sender: "other",
        senderName: "Mom",
        text: "Hello dear, let me know when you arrive in Abuja.",
        timestamp: "Wednesday"
      },
      {
        id: "mom3",
        sender: "other",
        senderName: "Mom",
        text: "Please call me when you are free.",
        timestamp: "Yesterday"
      }
    ]
  },
  {
    id: "afri-ai",
    name: "AfriAI",
    avatar: "/africhat-mark.svg",
    isOnline: true,
    unreadCount: 0,
    lastMessageText: "How can I accelerate your business builder today?",
    lastMessageTime: "Now",
    messages: [
      {
        id: "ai1",
        sender: "other",
        senderName: "AfriAI",
        text: "Habari! Warm greetings. I am AfriAI, Africa's built-in digital operating system assistant. I can help translate Yoruba text, outline cooperations, generate payment schemes, or automatically build full-stack mini apps! Ask me anything, or try: 'Start a clothing business'!",
        timestamp: "10:00 AM"
      }
    ]
  }
];

export const initialTransactions: Transaction[] = [
  {
    id: "t1",
    title: "Shoprite Ikeja",
    category: "shopping",
    amount: -4500,
    currency: "₦",
    date: "Today",
    time: "2:45 PM",
    status: "Completed"
  },
  {
    id: "t2",
    title: "Abidemi Folake",
    category: "deposit",
    amount: 12000,
    currency: "₦",
    date: "Yesterday",
    time: "11:20 AM",
    status: "Received"
  },
  {
    id: "t3",
    title: "Eko Electricity",
    category: "utility",
    amount: -2500,
    currency: "₦",
    date: "Oct 24",
    time: "6:00 PM",
    status: "Completed"
  },
  {
    id: "t4",
    title: "Kenya Airways (KES)",
    category: "travel",
    amount: -152000,
    currency: "₦", // 152,000 NGN converted to KES
    date: "Oct 22",
    time: "10:15 AM",
    status: "Converted"
  }
];

export const staticMiniApps: MiniApp[] = [
  {
    id: "ridego",
    name: "RideGo",
    description: "Premium on-demand ride hailing in Nigeria's capital.",
    category: "Ride Hailing",
    icon: "directions_car",
    bgColor: "#E7F3FF",
    textColor: "#1D7AFC"
  },
  {
    id: "schoolportal",
    name: "SchoolPortal",
    description: "Connect lessons, announcements, and track grading.",
    category: "School Portal",
    icon: "school",
    bgColor: "#FFF5E6",
    textColor: "#FF9500"
  },
  {
    id: "shopeasy",
    name: "ShopEasy",
    description: "Peer storefront selling African crafts and everyday goods.",
    category: "Marketplace",
    icon: "shopping_cart",
    bgColor: "#FFEBEB",
    textColor: "#FF3B30"
  },
  {
    id: "medicare",
    name: "MediCare",
    description: "Book doctors, order pharmacy delivery and consultation.",
    category: "Healthcare",
    icon: "medical_services",
    bgColor: "#F0FDF4",
    textColor: "#34C759"
  }
];

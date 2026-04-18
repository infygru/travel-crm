import {
  LayoutDashboard,
  Users,
  TrendingUp,
  CalendarCheck,
  Package,
  ListTodo,
  BarChart3,
  Settings2,
  Megaphone,
  Route,
  Headphones,
  Palette,
  Warehouse,
  ScrollText,
  Building2,
  Plane,
} from "lucide-react";

export const NAV_GROUPS = [
  {
    label: "Sales",
    color: "indigo" as const,
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Contacts", href: "/contacts", icon: Users },
      { title: "Companies", href: "/companies", icon: Building2 },
      { title: "Deals", href: "/deals", icon: TrendingUp },
      { title: "Quotes", href: "/quotes", icon: ScrollText },
    ],
  },
  {
    label: "Travel",
    color: "cyan" as const,
    items: [
      { title: "Packages", href: "/packages", icon: Package },
      { title: "Itineraries", href: "/itineraries", icon: Route },
      { title: "Bookings", href: "/bookings", icon: Plane },
      { title: "Suppliers", href: "/suppliers", icon: Warehouse },
    ],
  },
  {
    label: "Marketing",
    color: "rose" as const,
    items: [
      { title: "Campaigns", href: "/marketing", icon: Megaphone },
      { title: "Design Studio", href: "/posters", icon: Palette },
    ],
  },
  {
    label: "Operations",
    color: "amber" as const,
    items: [
      { title: "Tasks", href: "/tasks", icon: ListTodo },
      { title: "Support", href: "/tickets", icon: Headphones },
      { title: "Reports", href: "/reports", icon: BarChart3 },
      { title: "Settings", href: "/settings", icon: Settings2 },
    ],
  },
];

// Keep flat list for any code that still references NAV_ITEMS
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  PROPOSAL_SENT: "bg-orange-100 text-orange-700",
  NEGOTIATION: "bg-indigo-100 text-indigo-700",
  CONVERTED: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
  UNQUALIFIED: "bg-gray-100 text-gray-700",
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  REFUNDED: "bg-gray-100 text-gray-700",
  OVERDUE: "bg-orange-100 text-orange-700",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export const DEAL_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
};

export const STAGE_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD"];

export const TICKET_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  PENDING_CUSTOMER: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-700",
};

export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  SENDING: "bg-yellow-100 text-yellow-700",
  SENT: "bg-green-100 text-green-700",
  PAUSED: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export const ITINERARY_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SHARED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  BOOKED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-emerald-100 text-emerald-700",
};

export const SUPPLIER_PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

export const SUPPLIER_CATEGORY_LABELS: Record<string, string> = {
  HOTEL: "Hotel",
  AIRLINE: "Airline",
  TRANSFER: "Transfer",
  ACTIVITY: "Activity",
  RESTAURANT: "Restaurant",
  VISA_AGENT: "Visa Agent",
  INSURANCE: "Insurance",
  CRUISE: "Cruise",
  OTHER: "Other",
};

export const LEAD_SOURCES = [
  "WEBSITE",
  "REFERRAL",
  "SOCIAL_MEDIA",
  "COLD_CALL",
  "EMAIL_CAMPAIGN",
  "TRADE_SHOW",
  "PARTNER",
  "ADVERTISEMENT",
  "OTHER",
];

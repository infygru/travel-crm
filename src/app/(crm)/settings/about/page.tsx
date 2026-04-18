import Image from "next/image";
import {
  Plane,
  Users,
  Route,
  FileText,
  BarChart3,
  Headphones,
  Globe,
  ShieldCheck,
  Zap,
  Building2,
} from "lucide-react";

const FEATURES = [
  { icon: Users, label: "Contact & Lead Management", desc: "Full lifecycle from lead capture to loyal customer." },
  { icon: Building2, label: "Company CRM", desc: "Manage corporate accounts, travel desks, and B2B deals." },
  { icon: FileText, label: "Quotes & Proposals", desc: "Send branded proposals with client accept/decline portal." },
  { icon: Route, label: "Itinerary Builder", desc: "Day-by-day itineraries with PDF export and client sharing." },
  { icon: Plane, label: "Booking Management", desc: "End-to-end booking with payment tracking and e-invoices." },
  { icon: BarChart3, label: "Reports & Analytics", desc: "Revenue charts, agent leaderboards, conversion metrics." },
  { icon: Headphones, label: "Support Tickets", desc: "Customer issue tracking from open to resolved." },
  { icon: Globe, label: "Client Portal", desc: "Self-service portal for customers to track bookings & itineraries." },
  { icon: ShieldCheck, label: "Role-Based Access", desc: "Admin, Manager, Agent — each with the right permissions." },
  { icon: Zap, label: "Automations & Cron Jobs", desc: "Scheduled follow-ups, overdue alerts, and passport expiry warnings." },
];

const STACK = [
  { name: "Next.js 15", role: "Framework" },
  { name: "Prisma + Neon", role: "Database" },
  { name: "NextAuth v5", role: "Authentication" },
  { name: "Tailwind CSS 4", role: "Styling" },
  { name: "Resend", role: "Email" },
  { name: "React PDF", role: "PDF Generation" },
  { name: "Vercel", role: "Hosting" },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl space-y-10">

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0b1437] via-[#0d1b4b] to-[#0a1628] px-10 py-12">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 70%)" }}
        />
        <div className="relative flex flex-col items-center text-center gap-5">
          <Image
            src="/Zenotrip-logo.jpg"
            alt="Zeno Trip"
            width={200}
            height={68}
            className="object-contain brightness-0 invert"
            priority
          />
          <p className="text-white/80 text-base max-w-xl leading-relaxed">
            Zeno Trip is a full-stack travel agency CRM built for modern tour operators and travel agencies.
            Manage your entire business — from the first inquiry to the post-trip invoice — in one place.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Grade
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-xs font-semibold">
              <Globe className="w-3.5 h-3.5" /> Multi-Currency (₹ default)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" /> Real-time Updates
            </span>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="bg-white rounded-2xl border border-violet-100/60 p-8 card-glow">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed text-sm">
          Travel agencies waste hours juggling spreadsheets, WhatsApp threads, and disconnected tools.
          Zeno Trip brings everything into one elegant platform — so your team spends time closing deals
          and crafting dream trips, not chasing paperwork. Built specifically for the Indian travel market
          with INR-first pricing, but ready for any global agency.
        </p>
      </div>

      {/* Features grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">What&apos;s Included</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 bg-white rounded-xl border border-violet-100/60 p-4 card-glow">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="bg-white rounded-2xl border border-violet-100/60 p-6 card-glow">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Built With</h2>
        <div className="flex flex-wrap gap-2">
          {STACK.map(({ name, role }) => (
            <div key={name} className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg">
              <span className="text-sm font-semibold text-violet-700">{name}</span>
              <span className="text-xs text-gray-400">— {role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Version & contact */}
      <div className="bg-white rounded-2xl border border-violet-100/60 p-6 card-glow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-800">Zeno Trip CRM</p>
          <p className="text-xs text-gray-400 mt-0.5">Version 1.0 · Built for travel agencies</p>
        </div>
        <div className="text-xs text-gray-400">
          <p>Domain: <span className="text-violet-600 font-semibold">zenotrip.com</span></p>
          <p className="mt-0.5">© {new Date().getFullYear()} Zeno Trip. All rights reserved.</p>
        </div>
      </div>

    </div>
  );
}

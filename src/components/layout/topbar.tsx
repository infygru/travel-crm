"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, User, LogOut, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function Topbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    toast.success("Signed out successfully");
    router.push("/login");
  };

  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header
      className="h-16 border-b border-violet-100/60 flex items-center justify-between px-6 flex-shrink-0 z-10"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-300" />
          <input
            type="text"
            placeholder="Search contacts, deals, bookings..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-violet-50/60 border border-violet-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300 placeholder-violet-300 text-gray-700 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] text-violet-300 bg-white border border-violet-100 rounded px-1.5 py-0.5 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
          >
            <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-violet-100 rounded-2xl shadow-xl shadow-violet-100/40 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-violet-50 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                <span className="ml-auto text-xs bg-rose-100 text-rose-600 font-bold px-1.5 py-0.5 rounded-full">3</span>
              </div>
              <div className="divide-y divide-violet-50/80">
                {[
                  { title: "New booking confirmed", desc: "Booking #TRV-001 has been confirmed", time: "2m ago", dot: "bg-emerald-500" },
                  { title: "Payment received", desc: "$2,500 received for booking TRV-002", time: "1h ago", dot: "bg-blue-500" },
                  { title: "Task due today", desc: "Follow up with John Smith", time: "3h ago", dot: "bg-amber-500" },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-violet-50/50 cursor-pointer transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{n.time}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-violet-50">
                <button className="w-full text-xs text-violet-600 hover:text-violet-700 font-semibold transition-colors">
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-violet-100" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-violet-50 transition-all"
          >
            {session?.user?.image ? (
              <img src={session.user.image} alt={session.user.name ?? "User"} className="w-7 h-7 rounded-full ring-2 ring-violet-200" />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
              >
                {userInitials}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-semibold text-gray-800 leading-none">{session?.user?.name ?? "User"}</p>
              <p className="text-[10px] text-violet-400 mt-0.5 capitalize font-medium">
                {((session?.user as { role?: string })?.role ?? "agent").toLowerCase()}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-md border border-violet-100 rounded-2xl shadow-xl shadow-violet-100/40 z-50 overflow-hidden">
              <div className="p-1.5">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-violet-50 rounded-xl transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-violet-50 rounded-xl transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Settings className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  Settings
                </Link>
                <div className="mx-2 my-1 h-px bg-violet-50" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowUserMenu(false); setShowNotifications(false); }}
        />
      )}
    </header>
  );
}

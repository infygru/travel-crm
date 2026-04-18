"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Image from "next/image";
import { NAV_GROUPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type GroupColor = "indigo" | "cyan" | "rose" | "amber";

const GROUP_PALETTE: Record<GroupColor, {
  label: string;
  icon: string;
  activeBg: string;
  activeBorder: string;
  activeIcon: string;
  activeText: string;
  chipActive: string;
  chipInactive: string;
}> = {
  indigo: {
    label: "text-indigo-300",
    icon: "text-indigo-400",
    activeBg: "bg-indigo-500/10",
    activeBorder: "border-l-indigo-400",
    activeIcon: "text-indigo-300",
    activeText: "text-indigo-100",
    chipActive: "bg-indigo-500/20 ring-1 ring-indigo-500/30",
    chipInactive: "bg-white/5",
  },
  cyan: {
    label: "text-cyan-300",
    icon: "text-cyan-400",
    activeBg: "bg-cyan-500/10",
    activeBorder: "border-l-cyan-400",
    activeIcon: "text-cyan-300",
    activeText: "text-cyan-100",
    chipActive: "bg-cyan-500/20 ring-1 ring-cyan-500/30",
    chipInactive: "bg-white/5",
  },
  rose: {
    label: "text-rose-300",
    icon: "text-rose-400",
    activeBg: "bg-rose-500/10",
    activeBorder: "border-l-rose-400",
    activeIcon: "text-rose-300",
    activeText: "text-rose-100",
    chipActive: "bg-rose-500/20 ring-1 ring-rose-500/30",
    chipInactive: "bg-white/5",
  },
  amber: {
    label: "text-amber-300",
    icon: "text-amber-400",
    activeBg: "bg-amber-500/10",
    activeBorder: "border-l-amber-400",
    activeIcon: "text-amber-300",
    activeText: "text-amber-100",
    chipActive: "bg-amber-500/20 ring-1 ring-amber-500/30",
    chipInactive: "bg-white/5",
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <aside
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out relative",
        collapsed ? "w-[64px]" : "w-[230px]"
      )}
      style={{
        background: "linear-gradient(180deg, #0b1437 0%, #0d1b4b 50%, #0a1628 100%)",
      }}
    >
      {/* Subtle top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div className="relative flex items-center justify-between h-16 px-4 border-b border-white/[0.06] flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center min-w-0">
            <div className="bg-white rounded-xl px-2.5 py-1.5">
              <Image
                src="/Zenotrip-logo.jpg"
                alt="Zeno Trip"
                width={110}
                height={37}
                className="object-contain"
                priority
              />
            </div>
          </div>
        )}
        {collapsed && (
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl mx-auto text-white font-black text-lg"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" }}
          >
            Z
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="relative flex-1 py-3 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="space-y-1">
          {NAV_GROUPS.map((group) => {
            const palette = GROUP_PALETTE[group.color];
            return (
              <div key={group.label} className="mb-1">
                {!collapsed ? (
                  <div className="flex items-center gap-2 px-4 mb-1 mt-3">
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", palette.label)}>
                      {group.label}
                    </span>
                    <div className={cn("flex-1 h-px opacity-30", `bg-current`, palette.label)} />
                  </div>
                ) : (
                  <div className="mx-4 h-px bg-white/10 mt-3 mb-1" />
                )}

                <ul className="space-y-0.5 px-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={collapsed ? item.title : undefined}
                          className={cn(
                            "flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150 group relative border-l-2",
                            isActive
                              ? cn(palette.activeBg, palette.activeBorder)
                              : "border-l-transparent hover:bg-white/[0.04]",
                            collapsed && "justify-center px-2 border-l-0 border-l-transparent"
                          )}
                        >
                          {/* Icon chip */}
                          <div
                            className={cn(
                              "flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 transition-all",
                              isActive ? palette.chipActive : palette.chipInactive
                            )}
                          >
                            <Icon
                              className={cn(
                                "transition-colors",
                                isActive ? palette.activeIcon : "text-slate-500 group-hover:text-slate-300"
                              )}
                              style={{ width: 14, height: 14 }}
                            />
                          </div>

                          {!collapsed && (
                            <span
                              className={cn(
                                "text-[13px] font-medium truncate transition-colors",
                                isActive
                                  ? palette.activeText
                                  : "text-slate-400 group-hover:text-slate-200"
                              )}
                            >
                              {item.title}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-2 border-t border-white/[0.06]">
          <button
            onClick={() => setCollapsed(false)}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* User footer */}
      <div
        className={cn(
          "relative border-t border-white/[0.06] p-3",
          collapsed && "p-2"
        )}
      >
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name ?? "User"}
                className="w-8 h-8 rounded-full ring-2 ring-indigo-500/40"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)" }}
              >
                {userInitials}
              </div>
            )}
            {/* Online dot */}
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0b1437]" />
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[12px] font-semibold truncate leading-tight">
                  {session?.user?.name ?? "User"}
                </p>
                <p className="text-slate-500 text-[10px] truncate capitalize leading-tight mt-0.5">
                  {((session?.user as { role?: string })?.role ?? "agent").toLowerCase()}
                </p>
              </div>
              <Link
                href="/api/auth/signout"
                className="flex-shrink-0 text-slate-600 hover:text-slate-300 transition-colors"
                title="Sign out"
              >
                <LogOut style={{ width: 13, height: 13 }} />
              </Link>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

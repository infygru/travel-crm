"use client";

import { useRef, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { Loader2, Users, Briefcase, CalendarCheck } from "lucide-react";
import { LEAD_STATUS_COLORS } from "@/lib/constants";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  leadStatus: string;
  leadScore: number;
  totalSpent: number;
  createdAt: string | Date;
  company?: { id: string; name: string } | null;
  owner?: { id: string; name?: string | null } | null;
  _count: { deals: number; bookings: number; tasks: number };
};

type FetchResult = {
  contacts: Contact[];
  nextCursor: string | null;
  hasMore: boolean;
};

async function fetchContacts(params: {
  cursor?: string;
  search?: string;
  status?: string;
  source?: string;
}): Promise<FetchResult> {
  const url = new URL("/api/contacts", window.location.origin);
  url.searchParams.set("limit", "50");
  if (params.cursor) url.searchParams.set("cursor", params.cursor);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.source) url.searchParams.set("source", params.source);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch contacts");
  return res.json();
}

export function ContactsVirtualList({
  initialData,
  search,
  status,
  source,
}: {
  initialData: FetchResult;
  search?: string;
  status?: string;
  source?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["contacts-virtual", search, status, source],
      queryFn: ({ pageParam }) =>
        fetchContacts({ cursor: pageParam as string | undefined, search, status, source }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData: {
        pages: [initialData],
        pageParams: [undefined],
      },
      staleTime: 30_000,
    });

  const allContacts = data?.pages.flatMap((p) => p.contacts) ?? [];

  const virtualizer = useVirtualizer({
    count: allContacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Load more when user scrolls near the bottom
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const [expandedErrors] = useState(false);
  void expandedErrors;

  return (
    <div className="relative">
      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_60px] gap-0 bg-gray-50 border-b border-gray-100">
        {["Contact", "Stage", "Lead Score", "Activity", "Spend", "Owner", "Added", ""].map((h) => (
          <div key={h} className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</div>
        ))}
      </div>

      {/* Virtual scrollable area */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: Math.min(allContacts.length * 56, 600) || 200 }}
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : allContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32">
            <Users className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No contacts found</p>
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualItems.map((vItem) => {
              const contact = allContacts[vItem.index];
              if (!contact) return null;
              return (
                <div
                  key={contact.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: vItem.size,
                    transform: `translateY(${vItem.start}px)`,
                  }}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_60px] gap-0 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  {/* Name */}
                  <div className="px-4 py-3 flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {contact.firstName[0]}{contact.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/contacts/${contact.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 truncate block">
                        {contact.firstName} {contact.lastName}
                      </Link>
                      <p className="text-xs text-gray-400 truncate">{contact.email ?? contact.phone ?? ""}</p>
                    </div>
                  </div>
                  {/* Stage */}
                  <div className="px-4 py-3 flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LEAD_STATUS_COLORS[contact.leadStatus as keyof typeof LEAD_STATUS_COLORS] ?? "bg-gray-100 text-gray-600"}`}>
                      {contact.leadStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                  {/* Lead Score */}
                  <div className="px-4 py-3 flex items-center gap-1.5">
                    <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${contact.leadScore >= 80 ? "bg-green-500" : contact.leadScore >= 60 ? "bg-indigo-500" : contact.leadScore >= 40 ? "bg-amber-400" : "bg-gray-200"}`}
                        style={{ width: `${contact.leadScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{contact.leadScore}</span>
                  </div>
                  {/* Activity */}
                  <div className="px-4 py-3 flex items-center gap-2">
                    {contact._count.deals > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Briefcase className="w-3 h-3 text-indigo-400" />{contact._count.deals}
                      </span>
                    )}
                    {contact._count.bookings > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <CalendarCheck className="w-3 h-3 text-green-500" />{contact._count.bookings}
                      </span>
                    )}
                    {contact._count.deals === 0 && contact._count.bookings === 0 && (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                  {/* Spend */}
                  <div className="px-4 py-3 flex items-center">
                    {contact.totalSpent > 0 ? (
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{contact.totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </div>
                  {/* Owner */}
                  <div className="px-4 py-3 flex items-center">
                    {contact.owner ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {contact.owner.name?.[0] ?? "?"}
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-[70px]">{contact.owner.name}</span>
                      </div>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </div>
                  {/* Added */}
                  <div className="px-4 py-3 flex items-center">
                    <span className="text-xs text-gray-400">{format(new Date(contact.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  {/* Open */}
                  <div className="px-2 py-3 flex items-center">
                    <Link href={`/contacts/${contact.id}`} className="text-xs text-gray-400 hover:text-indigo-600 font-medium">
                      →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Load more indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-3 border-t border-gray-100">
          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin mr-2" />
          <span className="text-xs text-gray-400">Loading more...</span>
        </div>
      )}

      {!hasNextPage && allContacts.length > 0 && (
        <div className="text-center py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">All {allContacts.length} contacts loaded</span>
        </div>
      )}
    </div>
  );
}

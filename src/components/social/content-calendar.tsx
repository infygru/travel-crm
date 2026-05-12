"use client"

import { useState } from "react"
import Link from "next/link"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { PlatformIcon } from "@/components/social/platform-icon"
import type { SocialPlatform, SocialPostStatus } from "@prisma/client"

type CalendarPost = {
  id: string
  caption: string
  status: SocialPostStatus
  scheduledAt: Date | null
  publishedAt: Date | null
  createdAt: Date
  targets: {
    id: string
    account: {
      id: string
      platform: SocialPlatform
      accountName: string
    }
  }[]
}

interface ContentCalendarProps {
  posts: CalendarPost[]
  year: number
  month: number
}

const STATUS_DOT: Record<SocialPostStatus, string> = {
  DRAFT: "bg-gray-400",
  SCHEDULED: "bg-blue-500",
  PUBLISHING: "bg-yellow-500",
  PUBLISHED: "bg-green-500",
  FAILED: "bg-red-500",
  PARTIALLY_PUBLISHED: "bg-orange-500",
}

const STATUS_CARD: Record<SocialPostStatus, string> = {
  DRAFT: "bg-gray-50 border-gray-200 text-gray-700",
  SCHEDULED: "bg-blue-50 border-blue-200 text-blue-800",
  PUBLISHING: "bg-yellow-50 border-yellow-200 text-yellow-800",
  PUBLISHED: "bg-green-50 border-green-200 text-green-800",
  FAILED: "bg-red-50 border-red-200 text-red-800",
  PARTIALLY_PUBLISHED: "bg-orange-50 border-orange-200 text-orange-800",
}

function getPostDate(post: CalendarPost): Date {
  if (post.status === "PUBLISHED" || post.status === "PARTIALLY_PUBLISHED" || post.status === "FAILED") {
    return post.publishedAt ?? new Date(post.createdAt)
  }
  return post.scheduledAt ?? new Date(post.createdAt)
}

export function ContentCalendar({ posts, year, month }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(year, month - 1, 1))
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad with empty days for first week
  const startPad = getDay(monthStart) // 0=Sun
  const paddedDays: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...days,
  ]

  // Group posts by day
  const postsByDay = new Map<string, CalendarPost[]>()
  for (const post of posts) {
    const d = getPostDate(post)
    const key = format(d, "yyyy-MM-dd")
    if (!postsByDay.has(key)) postsByDay.set(key, [])
    postsByDay.get(key)!.push(post)
  }

  const currentMonthLabel = format(currentDate, "MMMM yyyy")

  function goToPrevMonth() {
    setCurrentDate((d) => subMonths(d, 1))
    setSelectedPost(null)
  }

  function goToNextMonth() {
    setCurrentDate((d) => addMonths(d, 1))
    setSelectedPost(null)
  }

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <h2 className="font-semibold text-gray-900 text-lg w-44 text-center">{currentMonthLabel}</h2>
          <button
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
          {(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"] as SocialPostStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
              <span className="capitalize">{s.toLowerCase().replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {paddedDays.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="border-b border-r border-gray-100 min-h-[90px]" />
          }

          const key = format(day, "yyyy-MM-dd")
          const dayPosts = postsByDay.get(key) ?? []
          const today = isToday(day)
          const dateStr = format(day, "yyyy-MM-dd'T'08:00")

          return (
            <div
              key={key}
              className={`border-b border-r border-gray-100 min-h-[90px] p-1.5 ${today ? "bg-indigo-50/50" : "hover:bg-gray-50"} transition-colors`}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                    today
                      ? "bg-indigo-600 text-white"
                      : "text-gray-500"
                  }`}
                >
                  {format(day, "d")}
                </span>
                <Link
                  href={`/social/compose?date=${encodeURIComponent(dateStr)}`}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-indigo-100 rounded transition-all"
                  title="Create post for this day"
                >
                  <Plus className="w-3 h-3 text-indigo-400" />
                </Link>
              </div>

              {/* Post pills */}
              <div className="space-y-0.5">
                {dayPosts.slice(0, 3).map((post) => (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                    className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium border truncate flex items-center gap-1 hover:opacity-80 transition-opacity ${STATUS_CARD[post.status]}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[post.status]}`} />
                    <span className="truncate">
                      {post.caption.slice(0, 20)}{post.caption.length > 20 ? "…" : ""}
                    </span>
                  </button>
                ))}
                {dayPosts.length > 3 && (
                  <p className="text-[10px] text-gray-400 pl-1">+{dayPosts.length - 3} more</p>
                )}
              </div>

              {/* Add post button on hover */}
              {dayPosts.length === 0 && (
                <Link
                  href={`/social/compose?date=${encodeURIComponent(dateStr)}`}
                  className="mt-1 w-full h-6 flex items-center justify-center rounded border border-dashed border-gray-200 text-gray-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors"
                  title="Create post for this day"
                >
                  <Plus className="w-3 h-3" />
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Post detail panel */}
      {selectedPost && (
        <div className="border-t border-gray-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_CARD[selectedPost.status]}`}
                >
                  {selectedPost.status.replace("_", " ")}
                </span>
                <div className="flex items-center gap-1">
                  {selectedPost.targets.map((t) => (
                    <PlatformIcon key={t.id} platform={t.account.platform} size={13} />
                  ))}
                </div>
                {selectedPost.scheduledAt && (
                  <span className="text-xs text-gray-400">
                    {format(new Date(selectedPost.scheduledAt), "MMM d, h:mm a")}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 line-clamp-3">{selectedPost.caption}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(selectedPost.status === "DRAFT" || selectedPost.status === "SCHEDULED") && (
                <Link
                  href={`/social/compose?edit=${selectedPost.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  Edit
                </Link>
              )}
              <button
                onClick={() => setSelectedPost(null)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

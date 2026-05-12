import Link from "next/link"
import { ArrowLeft, CalendarDays, Plus } from "lucide-react"
import { getPostsForCalendar } from "@/lib/actions/social"
import { ContentCalendar } from "@/components/social/content-calendar"

export default async function SocialCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1

  const posts = await getPostsForCalendar(year, month)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/social"
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-indigo-500" />
              Content Calendar
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Visual overview of your scheduled and published posts
            </p>
          </div>
        </div>
        <Link
          href="/social/compose"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      <ContentCalendar posts={posts} year={year} month={month} />
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  Image as ImageIcon,
  Video,
  Calendar,
  Send,
  X,
  Plus,
  Hash,
  MessageSquare,
  ChevronDown,
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  Monitor,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlatformIcon } from "@/components/social/platform-icon"
import {
  createSocialPost,
  publishSocialPost,
  updateSocialPost,
  generateSocialCaption,
} from "@/lib/actions/social"
import { PLATFORM_CONFIGS } from "@/lib/social-constants"
import type { SocialAccount, SocialMediaType } from "@prisma/client"

const MEDIA_TYPES: { value: SocialMediaType; label: string; icon: typeof ImageIcon }[] = [
  { value: "TEXT", label: "Text Only", icon: MessageSquare },
  { value: "IMAGE", label: "Image", icon: ImageIcon },
  { value: "CAROUSEL", label: "Carousel", icon: ImageIcon },
  { value: "VIDEO", label: "Video", icon: Video },
  { value: "REEL", label: "Reel / Short", icon: Video },
]

const TONES = ["Inspiring", "Informative", "Casual", "Luxurious", "Adventurous", "Professional"]
const TRAVEL_TYPES = ["Beach", "Mountain", "City Break", "Safari", "Cultural Tour", "Honeymoon", "Family", "Adventure", "Cruise"]

interface PostComposerProps {
  accounts: SocialAccount[]
  defaultAccountIds?: string[]
  defaultCaption?: string
  defaultMediaUrls?: string[]
  editPost?: {
    id: string
    caption: string
    mediaUrls: string[]
    mediaType: SocialMediaType
    scheduledAt: Date | null
    firstComment: string | null
    tags: string[]
    accountIds: string[]
  }
}

export function PostComposer({
  accounts,
  defaultAccountIds = [],
  defaultCaption = "",
  defaultMediaUrls = [],
  editPost,
}: PostComposerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isGenerating, startGenTransition] = useTransition()

  const isEditing = !!editPost

  const [caption, setCaption] = useState(editPost?.caption ?? defaultCaption)
  const [mediaType, setMediaType] = useState<SocialMediaType>(editPost?.mediaType ?? "TEXT")
  const [mediaUrls, setMediaUrls] = useState<string[]>(editPost?.mediaUrls ?? defaultMediaUrls)
  const [mediaInput, setMediaInput] = useState("")
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
    new Set(editPost?.accountIds ?? defaultAccountIds)
  )
  const [scheduledAt, setScheduledAt] = useState(
    editPost?.scheduledAt ? format(new Date(editPost.scheduledAt), "yyyy-MM-dd'T'HH:mm") : ""
  )
  const [firstComment, setFirstComment] = useState(editPost?.firstComment ?? "")
  const [tagsInput, setTagsInput] = useState((editPost?.tags ?? []).join(", "))
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [action, setAction] = useState<"draft" | "schedule" | "publish">("draft")
  const [showPreview, setShowPreview] = useState(false)

  // AI caption state
  const [showAI, setShowAI] = useState(false)
  const [aiDestination, setAiDestination] = useState("")
  const [aiTravelType, setAiTravelType] = useState("")
  const [aiTone, setAiTone] = useState("Inspiring")
  const [aiContext, setAiContext] = useState("")

  // Group accounts by platform
  const platformGroups = accounts.reduce<Record<string, SocialAccount[]>>((acc, account) => {
    if (!acc[account.platform]) acc[account.platform] = []
    acc[account.platform].push(account)
    return acc
  }, {})

  function toggleAccount(id: string) {
    setSelectedAccounts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addMediaUrl() {
    const url = mediaInput.trim()
    if (!url) return
    if (!url.startsWith("http")) {
      toast.error("Please enter a valid URL starting with http")
      return
    }
    setMediaUrls((prev) => [...prev, url])
    setMediaInput("")
  }

  function removeMediaUrl(idx: number) {
    setMediaUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  function getCharLimit(): number {
    const platforms = accounts
      .filter((a) => selectedAccounts.has(a.id))
      .map((a) => a.platform)
    if (platforms.length === 0) return 63206
    const limits = platforms.map((p) => PLATFORM_CONFIGS[p].charLimit)
    return Math.min(...limits)
  }

  const charLimit = getCharLimit()
  const charCount = caption.length
  const charOverLimit = charCount > charLimit

  function handleGenerateCaption() {
    const selectedPlatforms = accounts
      .filter((a) => selectedAccounts.has(a.id))
      .map((a) => PLATFORM_CONFIGS[a.platform].name)

    startGenTransition(async () => {
      try {
        const { caption: generated } = await generateSocialCaption({
          destinations: aiDestination || undefined,
          travelType: aiTravelType || undefined,
          tone: aiTone,
          platforms: selectedPlatforms,
          additionalContext: aiContext || undefined,
        })
        setCaption(generated)
        setShowAI(false)
        toast.success("Caption generated!")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to generate caption")
      }
    })
  }

  async function handleSubmit() {
    if (!caption.trim()) {
      toast.error("Caption is required")
      return
    }
    if (selectedAccounts.size === 0) {
      toast.error("Select at least one account")
      return
    }
    if (action === "schedule" && !scheduledAt) {
      toast.error("Select a scheduled date and time")
      return
    }

    const tags = tagsInput
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean)

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateSocialPost(editPost.id, {
            caption,
            mediaUrls,
            mediaType,
            accountIds: Array.from(selectedAccounts),
            scheduledAt: action === "schedule" ? scheduledAt : action === "draft" ? null : undefined,
            firstComment: firstComment || undefined,
            tags,
          })

          if (action === "publish") {
            const result = await publishSocialPost(editPost.id)
            if (result.success) {
              toast.success("Post published successfully!")
            } else if (result.partialSuccess) {
              toast.warning("Post partially published", {
                description: result.failedPlatforms.join(", "),
              })
            } else {
              toast.error("Publishing failed", {
                description: result.failedPlatforms.join(", "),
              })
            }
          } else if (action === "schedule") {
            toast.success(`Post scheduled for ${format(new Date(scheduledAt), "MMM d, yyyy 'at' h:mm a")}`)
          } else {
            toast.success("Draft saved")
          }
        } else {
          const post = await createSocialPost({
            caption,
            mediaUrls,
            mediaType,
            accountIds: Array.from(selectedAccounts),
            scheduledAt: action === "schedule" ? scheduledAt : undefined,
            firstComment: firstComment || undefined,
            tags,
          })

          if (action === "publish") {
            const result = await publishSocialPost(post.id)
            if (result.success) {
              toast.success("Post published successfully!")
            } else if (result.partialSuccess) {
              toast.warning("Post partially published", {
                description: result.failedPlatforms.join(", "),
              })
            } else {
              toast.error("Publishing failed", {
                description: result.failedPlatforms.join(", "),
              })
            }
          } else if (action === "schedule") {
            toast.success(`Post scheduled for ${format(new Date(scheduledAt), "MMM d, yyyy 'at' h:mm a")}`)
          } else {
            toast.success("Draft saved")
          }
        }

        router.push("/social")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save post")
      }
    })
  }

  const selectedAccountsList = accounts.filter((a) => selectedAccounts.has(a.id))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Left: Composer ─────────────────────────── */}
      <div className="lg:col-span-2 space-y-5">
        {/* Account selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <Label className="text-sm font-semibold text-gray-700 mb-3 block">
            Post to these accounts
          </Label>

          {accounts.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                No social accounts connected.{" "}
                <a href="/social/accounts" className="underline font-medium">
                  Connect accounts
                </a>{" "}
                to start posting.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(platformGroups).map(([platform, accts]) => (
                <div key={platform}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    {PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS]?.name ?? platform}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {accts.map((account) => {
                      const selected = selectedAccounts.has(account.id)
                      return (
                        <button
                          key={account.id}
                          onClick={() => toggleAccount(account.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                            selected
                              ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <PlatformIcon platform={account.platform} size={14} />
                          <span>{account.accountName}</span>
                          {selected && (
                            <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-gray-700">Caption</Label>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium tabular-nums ${
                  charOverLimit
                    ? "text-red-500"
                    : charCount > charLimit * 0.9
                      ? "text-amber-500"
                      : "text-gray-400"
                }`}
              >
                {charCount}/{charLimit}
              </span>
              <button
                onClick={() => setShowAI(!showAI)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-3 h-3" />
                AI Write
              </button>
            </div>
          </div>

          {/* AI Caption Panel */}
          {showAI && (
            <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-indigo-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-indigo-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Caption Generator
                </p>
                <button onClick={() => setShowAI(false)}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Destination(s)</Label>
                  <Input
                    value={aiDestination}
                    onChange={(e) => setAiDestination(e.target.value)}
                    placeholder="e.g. Bali, Maldives"
                    className="text-sm border-indigo-200 bg-white h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Travel Type</Label>
                  <select
                    value={aiTravelType}
                    onChange={(e) => setAiTravelType(e.target.value)}
                    className="w-full h-8 px-2 text-sm border border-indigo-200 rounded-md bg-white text-gray-700"
                  >
                    <option value="">Any</option>
                    {TRAVEL_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Tone</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setAiTone(tone)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        aiTone === tone
                          ? "border-indigo-400 bg-indigo-100 text-indigo-700"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Additional Context</Label>
                <Input
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="e.g. Highlight the snorkeling, family-friendly..."
                  className="text-sm border-indigo-200 bg-white h-8"
                />
              </div>

              <Button
                onClick={handleGenerateCaption}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-8 text-sm"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                )}
                {isGenerating ? "Generating..." : "Generate Caption"}
              </Button>
            </div>
          )}

          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write your post caption here... #travel #wanderlust"
            className="min-h-[140px] resize-none border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 text-sm"
          />
          {charOverLimit && (
            <p className="text-xs text-red-500 mt-1.5">
              Caption exceeds the {charLimit}-character limit for one of your selected platforms.
            </p>
          )}
        </div>

        {/* Media */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <Label className="text-sm font-semibold text-gray-700 mb-3 block">Media</Label>

          {/* Media type */}
          <div className="flex flex-wrap gap-2 mb-4">
            {MEDIA_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setMediaType(value)
                  if (value === "TEXT") setMediaUrls([])
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  mediaType === value
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {mediaType !== "TEXT" && (
            <>
              {/* URL input */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={mediaInput}
                  onChange={(e) => setMediaInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMediaUrl())}
                  placeholder={
                    mediaType === "VIDEO" || mediaType === "REEL"
                      ? "Paste video URL (MP4, MOV)..."
                      : "Paste image URL (JPG, PNG, WebP)..."
                  }
                  className="flex-1 text-sm border-gray-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMediaUrl}
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {/* Added URLs */}
              {mediaUrls.length > 0 && (
                <div className="space-y-2">
                  {mediaUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      {(mediaType === "IMAGE" || mediaType === "CAROUSEL") && (
                        <img
                          src={url}
                          alt=""
                          className="w-10 h-10 rounded object-cover shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                      )}
                      <span className="flex-1 text-xs text-gray-600 truncate">{url}</span>
                      <button
                        onClick={() => removeMediaUrl(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                {mediaType === "CAROUSEL"
                  ? "Add up to 10 image URLs for a carousel post"
                  : "You can paste URLs from Canva, Cloudinary, or any public image/video host"}
              </p>
            </>
          )}
        </div>

        {/* Advanced options */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700"
          >
            Advanced Options
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
          </button>

          {showAdvanced && (
            <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
              <div className="pt-4">
                <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  First Comment
                </Label>
                <Input
                  value={firstComment}
                  onChange={(e) => setFirstComment(e.target.value)}
                  placeholder="Auto-post first comment (e.g. hashtags)..."
                  className="text-sm border-gray-200"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Supported on Instagram. Great for hiding hashtags in first comment.
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  Tags
                </Label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="travel, adventure, holiday (comma or space separated)"
                  className="text-sm border-gray-200"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Actions ─────────────────────────── */}
      <div className="space-y-4">
        {/* Platform Preview toggle */}
        {selectedAccountsList.length > 0 && caption && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors"
          >
            {showPreview ? <Monitor className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? "Hide Preview" : "Preview Post"}
          </button>
        )}

        {/* Platform Previews */}
        {showPreview && selectedAccountsList.length > 0 && (
          <div className="space-y-3">
            {selectedAccountsList.slice(0, 3).map((account) => {
              const config = PLATFORM_CONFIGS[account.platform]
              const truncatedCaption =
                caption.length > config.charLimit
                  ? caption.slice(0, config.charLimit - 3) + "..."
                  : caption
              return (
                <div key={account.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div
                    className="px-3 py-2 flex items-center gap-2"
                    style={{ backgroundColor: config.color + "15" }}
                  >
                    <PlatformIcon platform={account.platform} size={14} />
                    <span className="text-xs font-semibold" style={{ color: config.color }}>
                      {config.name} Preview
                    </span>
                  </div>
                  <div className="p-3">
                    {/* Profile row */}
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: config.color }}
                      >
                        {account.accountName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800 leading-none">
                          {account.accountName}
                        </p>
                        <p className="text-[10px] text-gray-400">Just now</p>
                      </div>
                    </div>
                    {/* Media preview */}
                    {mediaUrls[0] && mediaType !== "TEXT" && (
                      <div className="mb-2 rounded-lg overflow-hidden bg-gray-100 aspect-video">
                        <img
                          src={mediaUrls[0]}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                      </div>
                    )}
                    {/* Caption */}
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-4">
                      {truncatedCaption}
                    </p>
                    {/* Engagement row */}
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">❤️ Like</span>
                      <span className="text-[10px] text-gray-400">💬 Comment</span>
                      <span className="text-[10px] text-gray-400">↗️ Share</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {selectedAccountsList.length > 3 && (
              <p className="text-xs text-gray-400 text-center">
                +{selectedAccountsList.length - 3} more platforms
              </p>
            )}
          </div>
        )}

        {/* Preview summary */}
        {!showPreview && selectedAccounts.size > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Publishing to
            </p>
            <div className="space-y-2">
              {selectedAccountsList.map((account) => (
                <div key={account.id} className="flex items-center gap-2">
                  <PlatformIcon platform={account.platform} size={16} showBg />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{account.accountName}</p>
                    <p className="text-xs text-gray-400 capitalize">{account.accountType}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Schedule (Optional)
          </Label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            className="text-sm border-gray-200"
          />
          {scheduledAt && (
            <p className="text-xs text-indigo-600 mt-1.5">
              Will publish on {format(new Date(scheduledAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => { setAction("publish"); handleSubmit() }}
            disabled={isPending || selectedAccounts.size === 0}
          >
            {isPending && action === "publish" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Publish Now
          </Button>

          <Button
            variant="outline"
            className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            onClick={() => { setAction("schedule"); handleSubmit() }}
            disabled={isPending || !scheduledAt || selectedAccounts.size === 0}
          >
            {isPending && action === "schedule" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            Schedule
          </Button>

          <Button
            variant="ghost"
            className="w-full text-gray-500"
            onClick={() => { setAction("draft"); handleSubmit() }}
            disabled={isPending}
          >
            {isPending && action === "draft" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isEditing ? "Save Changes" : "Save as Draft"}
          </Button>
        </div>

        {/* Platform character limits */}
        {selectedAccounts.size > 0 && (
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Character Limits
            </p>
            <div className="space-y-1.5">
              {selectedAccountsList.map((account) => {
                const limit = PLATFORM_CONFIGS[account.platform].charLimit
                const pct = Math.min((charCount / limit) * 100, 100)
                const over = charCount > limit
                return (
                  <div key={account.id}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-gray-600">{PLATFORM_CONFIGS[account.platform].name}</span>
                      <span className={over ? "text-red-500" : "text-gray-400"}>
                        {charCount}/{limit}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct > 90 ? "bg-amber-500" : "bg-indigo-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

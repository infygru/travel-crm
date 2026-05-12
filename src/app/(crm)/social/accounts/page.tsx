import Link from "next/link"
import { ArrowLeft, Plus, Info } from "lucide-react"
import { getSocialAccounts } from "@/lib/actions/social"
import { AccountCard } from "@/components/social/account-card"
import { PlatformIcon } from "@/components/social/platform-icon"
import { PLATFORM_CONFIGS } from "@/lib/social"
import type { SocialPlatform } from "@prisma/client"

const PLATFORMS: { key: SocialPlatform; envVars: string[] }[] = [
  { key: "FACEBOOK", envVars: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"] },
  { key: "INSTAGRAM", envVars: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"] },
  { key: "TWITTER", envVars: ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET"] },
  { key: "LINKEDIN", envVars: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"] },
  { key: "TIKTOK", envVars: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"] },
  { key: "YOUTUBE", envVars: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"] },
]

function isConfigured(envVars: string[]): boolean {
  return envVars.every((v) => !!process.env[v])
}

export default async function SocialAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const { connected, error } = await searchParams
  const accounts = await getSocialAccounts()

  const connectedPlatforms = new Set(accounts.map((a) => a.platform))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/social"
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Connect your social media accounts to post from the CRM</p>
        </div>
      </div>

      {/* Notifications */}
      {connected && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <span>✅</span>
          <span>
            Successfully connected your{" "}
            <strong className="capitalize">{connected}</strong> account.
          </span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <span>⚠️</span>
          <span>Connection failed: {decodeURIComponent(error)}</span>
        </div>
      )}

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Connected Accounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>
      )}

      {/* Available platforms to connect */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Connect New Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map(({ key, envVars }) => {
            const config = PLATFORM_CONFIGS[key]
            const configured = isConfigured(envVars)
            const alreadyConnected = connectedPlatforms.has(key)

            return (
              <div
                key={key}
                className="bg-white rounded-2xl border border-gray-200 p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <PlatformIcon platform={key} size={24} showBg />
                  <div>
                    <p className="font-semibold text-gray-900">{config.name}</p>
                    <p className="text-xs text-gray-400">{config.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {config.supportsImages && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Images</span>
                  )}
                  {config.supportsVideos && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Videos</span>
                  )}
                  {config.supportsReels && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Reels</span>
                  )}
                  {config.supportsCarousel && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Carousel</span>
                  )}
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {config.charLimit.toLocaleString()} chars
                  </span>
                </div>

                {!configured ? (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      Configure {envVars[0]} and {envVars[1]} in your environment to enable.
                    </span>
                  </div>
                ) : (
                  <a
                    href={`/api/social/connect/${key.toLowerCase()}`}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {alreadyConnected ? "Add Another Account" : "Connect"}
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Setup guide */}
      <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Setup Guide</h3>
            <div className="text-sm text-blue-700 space-y-1.5">
              <p><strong>Facebook & Instagram:</strong> Create a Meta Developer App at developers.facebook.com and set FACEBOOK_APP_ID + FACEBOOK_APP_SECRET</p>
              <p><strong>Twitter/X:</strong> Create an app at developer.twitter.com with OAuth 2.0 and set TWITTER_CLIENT_ID + TWITTER_CLIENT_SECRET</p>
              <p><strong>LinkedIn:</strong> Create an app at linkedin.com/developers with Sign In with LinkedIn scope and set LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET</p>
              <p><strong>TikTok:</strong> Register at developers.tiktok.com and set TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET</p>
              <p><strong>YouTube:</strong> Create OAuth credentials in Google Cloud Console and set YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

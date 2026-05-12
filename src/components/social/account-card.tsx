"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Wifi, WifiOff, Trash2, RotateCcw, Clock, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PlatformIcon } from "@/components/social/platform-icon"
import { disconnectSocialAccount, reconnectSocialAccount } from "@/lib/actions/social"
import { PLATFORM_CONFIGS } from "@/lib/social-constants"
import type { SocialPlatform } from "@prisma/client"

type SocialAccountData = {
  id: string
  platform: SocialPlatform
  accountId: string
  accountName: string
  accountType: string | null
  avatarUrl: string | null
  isActive: boolean
  tokenExpiry: Date | null
  createdAt: Date
}

interface AccountCardProps {
  account: SocialAccountData
}

export function AccountCard({ account }: AccountCardProps) {
  const [isPending, startTransition] = useTransition()
  const config = PLATFORM_CONFIGS[account.platform]

  const isExpired = account.tokenExpiry ? new Date(account.tokenExpiry) < new Date() : false
  const expiresIn = account.tokenExpiry
    ? Math.ceil((new Date(account.tokenExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  function handleDisconnect() {
    if (!confirm(`Disconnect ${account.accountName} from ${config.name}?`)) return
    startTransition(async () => {
      try {
        await disconnectSocialAccount(account.id)
        toast.success(`${account.accountName} disconnected`)
      } catch {
        toast.error("Failed to disconnect account")
      }
    })
  }

  function handleReconnect() {
    startTransition(async () => {
      try {
        await reconnectSocialAccount(account.id)
        toast.success(`${account.accountName} reconnected`)
      } catch {
        toast.error("Failed to reconnect")
      }
    })
  }

  return (
    <div
      className={`bg-white rounded-2xl border p-5 transition-all ${
        account.isActive ? "border-gray-200" : "border-gray-200 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {account.avatarUrl ? (
            <div className="relative">
              <img
                src={account.avatarUrl}
                alt={account.accountName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1">
                <PlatformIcon platform={account.platform} size={14} showBg />
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <PlatformIcon platform={account.platform} size={22} />
            </div>
          )}

          <div>
            <p className="font-semibold text-gray-900 text-sm">{account.accountName}</p>
            <p className="text-xs text-gray-400 capitalize">{account.accountType ?? "account"}</p>
          </div>
        </div>

        <Badge
          className={`text-xs ${
            !account.isActive
              ? "bg-gray-100 text-gray-500"
              : isExpired
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-700"
          }`}
        >
          {!account.isActive ? (
            <><WifiOff className="w-3 h-3 mr-1" />Disconnected</>
          ) : isExpired ? (
            <><Clock className="w-3 h-3 mr-1" />Token Expired</>
          ) : (
            <><Wifi className="w-3 h-3 mr-1" />Connected</>
          )}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
        <span>{config.name} • {config.description}</span>
        {expiresIn !== null && expiresIn > 0 && (
          <span>Expires in {expiresIn}d</span>
        )}
        {isExpired && (
          <span className="text-red-500">Token expired</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isExpired || !account.isActive ? (
          <a
            href={`/api/social/connect/${account.platform.toLowerCase()}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reconnect
          </a>
        ) : null}

        <button
          onClick={handleDisconnect}
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          Disconnect
        </button>
      </div>

      <p className="text-xs text-gray-300 mt-3">
        Connected {format(new Date(account.createdAt), "MMM d, yyyy")}
      </p>
    </div>
  )
}

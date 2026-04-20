import { getConversations } from "@/lib/actions/conversations";
import { format } from "date-fns";
import Link from "next/link";
import { MessageCircle, MessageSquare, Mail, Users } from "lucide-react";

interface InboxPageProps {
  searchParams: Promise<{ channel?: string; status?: string; search?: string }>;
}

const CHANNEL_TABS = [
  { id: "", label: "All", icon: Users },
  { id: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { id: "SMS", label: "SMS", icon: MessageSquare },
  { id: "EMAIL", label: "Email", icon: Mail },
];

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  RESOLVED: "bg-gray-100 text-gray-600",
  PENDING: "bg-yellow-100 text-yellow-700",
};

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: "bg-emerald-100 text-emerald-700",
  SMS: "bg-blue-100 text-blue-700",
  EMAIL: "bg-indigo-100 text-indigo-700",
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const { channel, status, search } = await searchParams;

  const conversations = await getConversations({ channel, status, search });

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Inbox</h1>
        <span className="text-sm text-gray-400">{conversations.length} conversations</span>
      </div>

      {/* Channel tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {CHANNEL_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = (channel ?? "") === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.id ? `/inbox?channel=${tab.id}` : "/inbox"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Conversations list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {conversations.length === 0 ? (
          <div className="py-16 text-center">
            <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No conversations yet</p>
            <p className="text-xs text-gray-300 mt-1">Messages from WhatsApp and SMS will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {conversations.map((conv) => {
              const lastMsg = conv.messages[0];
              const initials = `${conv.contact.firstName[0]}${conv.contact.lastName[0]}`.toUpperCase();
              return (
                <Link
                  key={conv.id}
                  href={`/inbox/${conv.id}`}
                  className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-900">
                        {conv.contact.firstName} {conv.contact.lastName}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CHANNEL_COLORS[conv.channel]}`}>
                        {conv.channel}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[conv.status]}`}>
                        {conv.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {lastMsg
                        ? `${lastMsg.direction === "OUTBOUND" ? "You: " : ""}${lastMsg.body}`
                        : "No messages yet"}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {conv.lastMessageAt && (
                      <p className="text-xs text-gray-400">
                        {format(new Date(conv.lastMessageAt), "MMM d, h:mm a")}
                      </p>
                    )}
                    {conv.assignedTo && (
                      <p className="text-xs text-gray-300 mt-0.5">→ {conv.assignedTo.name}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

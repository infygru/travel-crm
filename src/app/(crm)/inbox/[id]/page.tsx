import { getConversationById } from "@/lib/actions/conversations";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { ReplyBox } from "@/components/inbox/reply-box";
import { ResolveButton } from "@/components/inbox/conversation-actions";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

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

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;
  const conversation = await getConversationById(id);
  if (!conversation) notFound();

  const contactName = `${conversation.contact.firstName} ${conversation.contact.lastName}`;
  const contactPhone = conversation.contact.mobile ?? conversation.contact.phone ?? "";

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/inbox" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Inbox
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: "70vh" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {contactName[0]}{contactName.split(" ")[1]?.[0] ?? ""}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/contacts/${conversation.contact.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              {contactName}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              {contactPhone && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Phone className="w-3 h-3" />
                  {contactPhone}
                </span>
              )}
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CHANNEL_COLORS[conversation.channel]}`}>
                {conversation.channel}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[conversation.status]}`}>
                {conversation.status}
              </span>
            </div>
          </div>
          <ResolveButton conversationId={conversation.id} status={conversation.status} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {conversation.messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No messages yet</p>
            </div>
          ) : (
            conversation.messages.map((msg) => {
              const isOutbound = msg.direction === "OUTBOUND";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isOutbound
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-900 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                    <div className={`flex items-center gap-1.5 mt-1 ${isOutbound ? "justify-end" : ""}`}>
                      <p className={`text-[10px] ${isOutbound ? "text-indigo-200" : "text-gray-400"}`}>
                        {format(new Date(msg.sentAt), "h:mm a")}
                      </p>
                      {isOutbound && msg.sentBy && (
                        <p className="text-[10px] text-indigo-200">· {msg.sentBy.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply box */}
        {conversation.status !== "RESOLVED" && (
          <ReplyBox conversationId={conversation.id} />
        )}
        {conversation.status === "RESOLVED" && (
          <div className="border-t border-gray-100 p-3 bg-gray-50 text-center">
            <p className="text-xs text-gray-400">This conversation is resolved</p>
          </div>
        )}
      </div>
    </div>
  );
}

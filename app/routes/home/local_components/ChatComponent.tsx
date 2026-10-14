import { useEffect, useState, type FormEvent } from "react"
import { useWebSocket } from "~/custom-hooks/context-hooks"
import type { WebSocketServerMessage } from "~/utils/validation/zod-validation"

type ChatMessage = Extract<
  WebSocketServerMessage,
  { event: "receive_message" }
>["data"]

function mergeMessages(
  currentMessages: ChatMessage[],
  incomingMessages: ChatMessage[]
): ChatMessage[] {
  const messagesById = new Map<number, ChatMessage>()
  for (const message of currentMessages) {
    messagesById.set(message.id, message)
  }
  for (const message of incomingMessages) {
    messagesById.set(message.id, message)
  }
  return Array.from(messagesById.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime() || a.id - b.id
  )
}

export default function TicketChatComponent({
  ticketId,
  ticketStatus,
  isAdmin = false
}: {
  ticketId: number
  ticketStatus?: string
  isAdmin?: boolean
}) {
  const { isConnected, sendMessage, joinTicket, lastMessage } =
    useWebSocket()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasJoined, setHasJoined] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      setHasJoined(false)
      return
    }

    setHasJoined(false)
    joinTicket(ticketId)
  }, [isConnected, ticketId])

  useEffect(() => {
    setMessages([])
  }, [ticketId])

  const [inputContent, setInputContent] = useState("")
  useEffect(() => {
    if (!lastMessage) return
    if (lastMessage.event === "joined_ticket") {
      setHasJoined(true)
    } else if (
      lastMessage.event === "ticket_history" &&
      lastMessage.data.ticketId === ticketId
    ) {
      setMessages((prev) =>
        mergeMessages([...prev], lastMessage.data.messages)
      )
    } else if (
      lastMessage.event === "receive_message" &&
      lastMessage.data.ticket_id === ticketId
    ) {
      setMessages((prev) =>
        mergeMessages([...prev], [lastMessage.data])
      )
    }
  }, [lastMessage, ticketId])

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = inputContent.trim()
    if (
      !content ||
      ticketStatus === "RESOLVED" ||
      !isConnected ||
      !hasJoined
    )
      return

    sendMessage({
      event: "send_message",
      data: { ticketId, content }
    })
    setInputContent("")
  }

  return (
    <section className="p-6">
      <h1 className="text-xl font-bold">Ticket #{ticketId}</h1>
      <p className="text-sm text-gray-500">
        WS status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
      </p>
      {isAdmin && (
        <p className="text-sm text-slate-400">
          Viewing as support administrator
        </p>
      )}
      <div className="border h-96 overflow-y-auto p-4 my-4 rounded">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="font-semibold">
              {msg.user?.name || "User"}:{" "}
            </span>
            <span>{msg.content}</span>
            <time
              dateTime={msg.createdAt}
              className="ml-2 text-xs text-slate-500"
            >
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </time>
          </div>
        ))}
      </div>
      {ticketStatus === "RESOLVED" && (
        <p className="mb-2 text-sm text-slate-400">
          This ticket is resolved or closed by admin and can no longer
          receive messages.
        </p>
      )}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          placeholder="Write a message..."
          className="border p-2 rounded flex-1"
        />
        <button
          type="submit"
          disabled={ticketStatus === "RESOLVED"}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send a message
        </button>
      </form>
    </section>
  )
}

import axios from "axios"
import { useState } from "react"
import { toast } from "react-toastify"
import { api } from "~/axios/axios"
import type { AdminTickets, Ticket } from "~/types/feature-types"

export default function TicketsList({
  tickets,
  setSelectedTicketId,
  setTickets,
  isAdmin
}: {
  tickets: AdminTickets[]
  setSelectedTicketId: (
    value: React.SetStateAction<number | null>
  ) => void
  setTickets: React.Dispatch<React.SetStateAction<AdminTickets[]>>
  isAdmin: boolean
}) {
  const [closingTicketId, setClosingTicketId] = useState<
    number | null
  >(null)

  const closeTicket = async (ticketId: number) => {
    if (closingTicketId !== null) return

    setClosingTicketId(ticketId)
    try {
      const response = await api.patch<{
        success: boolean
        message?: string
        ticket?: Ticket
      }>(`/tickets/${ticketId}/close`)
      const updatedTicket = response.data.ticket

      if (!response.data.success || !updatedTicket) {
        toast.error(response.data.message || "Failed to close ticket")
        return
      }

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket.id === ticketId ? updatedTicket : ticket
        )
      )
      toast.success("Ticket closed")
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Failed to close ticket"
      toast.error(errorMessage)
    } finally {
      setClosingTicketId(null)
    }
  }

  return (
    <div className="space-y-3 mt-4">
      {tickets.map((ticket) => {
        const isActive =
          ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"

        return (
          <div
            key={ticket.id}
            className="flex w-full items-center gap-2 rounded border p-2"
          >
            <button
              type="button"
              onClick={() => setSelectedTicketId(ticket.id)}
              className="min-w-0 flex-1 p-1 text-left"
            >
              #{ticket.id} - {ticket.subject} ({ticket.status})
              {isAdmin && ticket.user && (
                <span className="mt-1 block text-xs text-slate-400">
                  Opened by {ticket.user.name} ({ticket.user.email})
                </span>
              )}
            </button>
            {isActive && (
              <button
                type="button"
                onClick={() => closeTicket(ticket.id)}
                disabled={closingTicketId !== null}
                aria-label={`Close ticket ${ticket.id}`}
                title="Close ticket"
                className="shrink-0 rounded px-2 py-1 text-lg leading-none text-slate-400 hover:bg-red-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

import { useState, type FormEvent } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { api } from "~/axios/axios"
import { useTickets } from "~/custom-hooks/ticket-hooks"
import type { Ticket } from "~/types/feature-types"
import TicketChatComponent from "./ChatComponent"
import TicketCreationForm from "./TicketCreationForm"
import TicketsList from "./TicketsList"

export default function FloatingTicketWidget() {
  const {
    tickets,
    setTickets,
    isLoading,
    hasLoadError,
    isAdmin
  } = useTickets()
  const [isOpen, setIsOpen] = useState(false)
  const [newTicketSubject, setNewTicketSubject] = useState("")
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<
    number | null
  >(null)

  const handleCreateTicket = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    const subject = newTicketSubject.trim()
    if (!subject || isCreatingTicket) return

    setIsCreatingTicket(true)
    try {
      const response = await api.post<{
        success: boolean
        ticket: Ticket
      }>("/tickets/", { subject })

      if (!response.data.success) {
        toast.error("Failed to create ticket")
        return
      }

      const createdTicket = response.data.ticket
      setTickets((currentTickets) => [
        createdTicket,
        ...currentTickets.filter(
          (ticket) => ticket.id !== createdTicket.id
        )
      ])
      setNewTicketSubject("")
      setSelectedTicketId(createdTicket.id)
    } catch (error) {
      let errorMessage = "An unexpected error occurred"
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      toast.error(errorMessage)
    } finally {
      setIsCreatingTicket(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <section
        id="live-support-panel"
        className={`mb-3 flex h-[min(42rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl ${
          isOpen ? "" : "hidden"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h2 className="font-semibold">
              {isAdmin ? "Support tickets" : "Live support"}
            </h2>
            <p className="text-xs text-slate-400">
              {selectedTicketId === null
                ? isAdmin
                  ? "Choose a customer ticket"
                  : "Create a ticket or choose an existing one"
                : `Ticket #${selectedTicketId}`}
            </p>
          </div>
          {selectedTicketId !== null && (
            <button
              type="button"
              onClick={() => setSelectedTicketId(null)}
              className="mr-2 flex shrink-0 items-center gap-1 rounded px-2 py-1 text-sm text-slate-300 hover:bg-slate-800"
            >
              <span>←</span>
              <span>Back</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded px-2 py-1 text-xl leading-none text-slate-300 hover:bg-slate-800"
          >
            ×
          </button>
        </header>

        {selectedTicketId === null ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!isAdmin && (
              <TicketCreationForm
                handleCreateTicket={handleCreateTicket}
                newTicketSubject={newTicketSubject}
                setNewTicketSubject={setNewTicketSubject}
                isCreatingTicket={isCreatingTicket}
              />
            )}
            <TicketsList
              tickets={tickets}
              setSelectedTicketId={setSelectedTicketId}
              setTickets={setTickets}
              isAdmin={isAdmin}
            />
            {isLoading && tickets.length === 0 && (
              <p className="mt-4 text-sm text-slate-400">
                Loading support tickets...
              </p>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <TicketChatComponent
              ticketId={selectedTicketId}
              isAdmin={isAdmin}
              ticketStatus={
                tickets.find((ticket) => ticket.id === selectedTicketId)
                  ?.status
              }
            />
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="ml-auto cursor-pointer flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
      >
        <span>●</span>
        Live support
      </button>
    </div>
  )
}

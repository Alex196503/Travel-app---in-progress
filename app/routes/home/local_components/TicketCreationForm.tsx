import type { FormEvent } from "react"

export default function TicketCreationForm({
  handleCreateTicket,
  newTicketSubject,
  setNewTicketSubject,
  isCreatingTicket
}: {
  handleCreateTicket: (event: FormEvent<HTMLFormElement>) => void
  newTicketSubject: string
  setNewTicketSubject: (value: React.SetStateAction<string>) => void
  isCreatingTicket: boolean
}) {
  return (
    <form onSubmit={handleCreateTicket} className="flex gap-2">
      <input
        type="text"
        value={newTicketSubject}
        onChange={(event) => setNewTicketSubject(event.target.value)}
        maxLength={255}
        required
        placeholder="What do you need help with?"
        aria-label="New ticket subject"
        className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
      />
      { 
        <button
          type="submit"
          disabled={isCreatingTicket || !newTicketSubject.trim()}
          className="rounded bg-indigo-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreatingTicket ? "Creating..." : "Create ticket"}
        </button>
      }
    </form>
  )
}

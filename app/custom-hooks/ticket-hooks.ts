import { api } from "~/axios/axios"
import { type AdminTickets, type Ticket } from "~/types/feature-types"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import axios from "axios"

// Custom hook to fetch tickets from the server and update the state accordingly
export function useTickets() {
  const [tickets, setTickets] = useState<AdminTickets[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadError, setHasLoadError] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true
    const fetchTickets = async () => {
      try {
        try {
          const adminResponse = await api.get<{
            success: boolean
            tickets: AdminTickets[]
          }>("/tickets/admin")
          if (!active) return

          if (!adminResponse.data.success) {
            throw new Error("Failed to fetch admin tickets")
          }

          setTickets(adminResponse.data.tickets)
          setIsAdmin(true)
          return
        } catch (error) {
          if (
            !axios.isAxiosError(error) ||
            error.response?.status !== 403
          ) {
            throw error
          }
        }

        const response = await api.get<{
          success: boolean
          tickets?: Ticket[]
        }>("/tickets/")
        if (!active) return

        if (!response.data.success) {
          throw new Error("Failed to fetch tickets")
        }

        const serverTickets = response.data.tickets || []
        setTickets((currentTickets) => {
          const ticketMap = new Map<number, AdminTickets>()
          serverTickets.forEach((ticket) =>
            ticketMap.set(ticket.id, ticket)
          )
          currentTickets.forEach((ticket) => {
            if (!ticketMap.has(ticket.id)) {
              ticketMap.set(ticket.id, ticket)
            }
          })
          return Array.from(ticketMap.values()).sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          )
        })
        setIsAdmin(false)
      } catch (error) {
        if (!active) return
        setHasLoadError(true)
        let errorMessage = "Failed to fetch tickets"
        if (axios.isAxiosError(error)) {
          errorMessage =
            error.response?.data?.message ||
            error.message ||
            errorMessage
        } else if (error instanceof Error) {
          errorMessage = error.message
        }
        toast.error(errorMessage)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }
    let timer = setTimeout(() => {
      fetchTickets()
    }, 500)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [])

  return {
    tickets,
    setTickets,
    isLoading,
    hasLoadError,
    isAdmin
  }
}

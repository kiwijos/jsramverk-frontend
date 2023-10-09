import type { Ticket } from "./Ticket.model";

export interface TicketResponse {
    data: Ticket;
    error: String;
    ok: Boolean;
}

import type { Ticket } from "@/models/Ticket.model";
import type { TicketCode } from "@/models/TicketCode.model";
import type { TrainDelay } from "@/models/TrainDelay.model";
import type { TicketCreateDto } from "@/models/TicketCreateDto.model";
import axios from "axios";

export default {
    async getDelayedTrains(): Promise<TrainDelay[]> {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/delayed`, {
            headers: {
                "x-access-token": sessionStorage.getItem("x-access-token")
            }
        });
        return response.data.data;
    },
    async getTickets(): Promise<Ticket[]> {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/tickets`, {
            headers: {
                "x-access-token": sessionStorage.getItem("x-access-token")
            }
        });
        return response.data.data;
    },
    async getTicketCodes(): Promise<TicketCode[]> {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/codes`, {
            headers: {
                "x-access-token": sessionStorage.getItem("x-access-token")
            }
        });
        return response.data.data;
    },
    async createTicket(request: TicketCreateDto): Promise<Ticket> {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/tickets`, request, {
            headers: {
                "x-access-token": sessionStorage.getItem("x-access-token")
            }
        });
        return response.data.data;
    }
};

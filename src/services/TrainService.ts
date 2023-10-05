import type { Ticket } from "@/models/Ticket.model";
import type { TicketCode } from "@/models/TicketCode.model";
import type { TrainDelay } from "@/models/TrainDelay.model";
import type { TicketCreateDto } from "@/models/TicketCreateDto.model";
import axios from "axios";

export default {
    async getDelayedTrains(): Promise<TrainDelay[]> {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/delayed`);
        return response.data.data;
    },
    async getTickets(): Promise<Ticket[]> {
        const graphqlEndpoint = `${import.meta.env.VITE_API_URL}/graphql`;

        // Retrieve all tickets with all fields included
        const graphqlQuery = {
            query: `query GetAllTickets {
                tickets { 
                    id code trainnumber traindate
                }
            }`
        };

        const response = await axios({
            url: graphqlEndpoint,
            method: "post",
            data: graphqlQuery
        });

        return response.data.data.tickets;
    },
    async getTicketCodes(): Promise<TicketCode[]> {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/codes`);
        return response.data.data;
    },
    async createTicket(request: TicketCreateDto): Promise<Ticket> {
        const graphqlEndpoint = `${import.meta.env.VITE_API_URL}/graphql`;

        const graphqlQuery = {
            query: `mutation (
                $code: String!,
                $trainnumber: String!,
                $traindate: String!
                ) {
                createTicket (
                    code: $code,
                    trainnumber: $trainnumber,
                    traindate: $traindate
                    ) { 
                        ok error data {
                            id
                        }
                }
            }`,
            variables: {
                code: request.code,
                trainnumber: request.trainnumber,
                traindate: request.traindate
            }
        };

        const response = await axios({
            url: graphqlEndpoint,
            method: "post",
            data: graphqlQuery
        });

        return response.data.data;
    }
};

import type { Ticket } from "@/models/Ticket.model";
import type { TicketCode } from "@/models/TicketCode.model";
import type { TrainDelay } from "@/models/TrainDelay.model";
import type { TicketCreateDto } from "@/models/TicketCreateDto.model";
import type { TicketUpdateDto } from "@/models/TicketUpdateDto.model";
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
        const graphqlEndpoint = `${import.meta.env.VITE_API_URL}/graphql`;

        const graphqlQuery = {
            query: `query {
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
    async getTicketById(request: { id: string }): Promise<Ticket[]> {
        const graphqlEndpoint = `${import.meta.env.VITE_API_URL}/graphql`;

        const graphqlQuery = {
            query: `query (
                $id: ID!
                ){
                ticket (id: $id) { 
                    id code trainnumber traindate
                }
            }`,
            variables: { id: request.id }
        };

        const response = await axios({
            url: graphqlEndpoint,
            method: "post",
            data: graphqlQuery
        });

        return response.data.data.ticket;
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
                            code
                            trainnumber
                            traindate
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

        return response.data.data.createTicket.data;
    },
    async updateTicket(request: TicketUpdateDto): Promise<Ticket> {
        const graphqlEndpoint = `${import.meta.env.VITE_API_URL}/graphql`;

        const graphqlQuery = {
            query: `mutation (
                $id: ID!,
                $code: String,
                $trainnumber: String,
                $traindate: String
                ) {
                updateTicket (
                    id: $id,
                    code: $code,
                    trainnumber: $trainnumber,
                    traindate: $traindate
                    ) { 
                        ok error data {
                            id
                            code
                            trainnumber
                            traindate
                        }
                }
            }`,
            variables: {
                id: request.id,
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

        return response.data.data.updateTicket.data;
    },
    async deleteTicket(request: { id: string }): Promise<Ticket> {
        const graphqlEndpoint = `${import.meta.env.VITE_API_URL}/graphql`;

        const graphqlQuery = {
            query: `mutation (
                $id: ID!,
                ) {
                deleteTicket (
                    id: $id,
                    ) { 
                        ok error data {
                            id
                            code
                            trainnumber
                            traindate
                        }
                }
            }`,
            variables: { id: request.id }
        };

        const response = await axios({
            url: graphqlEndpoint,
            method: "post",
            data: graphqlQuery
        });

        return response.data.data.deleteTicket.data;
    }
};

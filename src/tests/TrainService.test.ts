import type { Ticket } from "./../models/Ticket.model";
import type { TrainDelay } from "./../models/TrainDelay.model";
import type { TicketCode } from "./../models/TicketCode.model";
// Test calls to api using TrainService

import TrainService from "../services/TrainService";
import { expect, test, beforeAll } from "vitest";
import AuthService from "@/services/AuthService";

beforeAll(async () => {
    await AuthService.loginGrapQL("kent", "kent");
});

test("TrainService get ticket codes", async () => {
    const codes = await TrainService.getTicketCodes();
    expect(codes).toBeInstanceOf(Array<TicketCode>);
});

test("TrainService get delayed trains", async () => {
    const codes = await TrainService.getDelayedTrains();
    expect(codes).toBeInstanceOf(Array<TrainDelay>);
});

test("TrainService get all tickets", async () => {
    const codes = await TrainService.getTickets();
    expect(codes).toBeInstanceOf(Array<Ticket>);
});

test("TrainService create ticket", async () => {
    const date = new Date();
    const ticket = await TrainService.createTicket({
        code: "ABC123",
        trainnumber: "123",
        traindate: date
    });
    expect(ticket.code).equals("ABC123");
    expect(ticket.trainnumber).equals("123");
    expect(ticket.traindate).equals(date.toISOString());
});

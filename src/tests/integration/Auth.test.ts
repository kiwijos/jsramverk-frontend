import TrainService from "@/services/TrainService";
import AuthService from "@/services/AuthService";
import { expect, test } from "vitest";
import jwt_decode from "jwt-decode";
import axios from "axios";

test("Access token is valid/not expired", async () => {
    const result = await AuthService.loginGrapQL("kent", "kent");
    expect(result.success).toBe(true);
    const token = sessionStorage.getItem("x-access-token");
    const decoded: any = jwt_decode(token!);
    const exp = decoded.exp;
    const date = new Date(0);
    date.setUTCSeconds(exp);
    expect(date > new Date()).toBe(true);
    sessionStorage.removeItem("x-access-token");
});

test("Use expired or invalid access token", async () => {
    sessionStorage.setItem("x-access-token", "invalid");
    // try and access a protected route
    const graphqlEndpoint = `${import.meta.env.VITE_API_URL}/graphql`;

    const graphqlQuery = {
        query: `query {
        trainStations {
            ok error data {
                AdvertisedLocationName
            }
        }
    }`
    };
    try {
        const response = await axios({
            url: graphqlEndpoint,
            method: "post",
            data: graphqlQuery,
            headers: {
                "x-access-token": sessionStorage.getItem("x-access-token")
            }
        });
    } catch (error: any) {
        expect(error.response.status).toBe(401);
    }
});

test("Use valid access token", async () => {
    const result = await AuthService.loginGrapQL("kent", "kent");
    // try and access a protected route
    const graphqlEndpoint = `${import.meta.env.VITE_API_URL}/graphql`;

    const graphqlQuery = {
        query: `query {
        trainStations {
            ok error data {
                AdvertisedLocationName
            }
        }
    }`
    };
    const response = await axios({
        url: graphqlEndpoint,
        method: "post",
        data: graphqlQuery,
        headers: {
            "x-access-token": sessionStorage.getItem("x-access-token")
        }
    });
    expect(response.status).toBe(200);
});

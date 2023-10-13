import type { LoginResult } from "./../models/LoginResult.model";
import axios from "axios";
import type { RegisterUser } from "@/models/RegisterUser.model";
import { socket } from "@/socket";

export default {
    async login(username: string, password: string): Promise<LoginResult> {
        return axios
            .post(`${import.meta.env.VITE_API_URL}/auth/login`, { username, password })
            .then((response) => {
                // Get and save token to session
                socket.connect();
                const token = response.data.data.token;
                sessionStorage.setItem("x-access-token", token);
                return {
                    success: true,
                    title: "Login successful",
                    detail: "You have been logged in"
                };
            })
            .catch((error) => {
                console.log(error.response.data.errors);
                return {
                    success: false,
                    title: error.response.data.errors.title,
                    detail: error.response.data.errors.details
                };
            })
            .finally(() => {
                return {
                    success: false,
                    title: "Login failed",
                    detail: "Something went wrong"
                };
            });
    },
    async register(request: RegisterUser): Promise<LoginResult> {
        return axios
            .post(`${import.meta.env.VITE_API_URL}/auth/register`, request)
            .then(() => {
                return {
                    success: true,
                    title: "Registration successful",
                    detail: "You have been registered"
                };
            })
            .catch((error) => {
                console.log(error.response.data.errors);
                return {
                    success: false,
                    title: error.response.data.errors.title,
                    detail: error.response.data.errors.details
                };
            })
            .finally(() => {
                return {
                    success: false,
                    title: "Registration failed",
                    detail: "Something went wrong"
                };
            });
    },
    logout() {
        sessionStorage.removeItem("x-access-token");
        socket.disconnect();
    }
};

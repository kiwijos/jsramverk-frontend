import type { LoginResult } from "./../models/LoginResult.model";
import axios from "axios";
import type { RegisterUser } from "@/models/RegisterUser.model";
import { socket, state } from "@/socket";

export default {
    async login(username: string, password: string): Promise<LoginResult> {
        return axios
            .post(`${import.meta.env.VITE_API_URL}/auth/login`, { username, password })
            .then((response) => {
                // Get and save token to session
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
    async loginGrapQL(username: string, password: string): Promise<LoginResult> {
        this.logout();
        const graphqlEndpoint = `${import.meta.env.VITE_API_URL}/auth`;
        const graphqlQuery = {
            query: `mutation (
                    $username: String!,
                    $password: String!
                    ) {
                    login (
                        username: $username,
                        password: $password
                        ) {
                            ok error data {
                                token
                                user {
                                    username email
                                }
                            }
                        }
                    }`,
            variables: {
                username: username,
                password: password
            }
        };
        const response = await axios({
            url: graphqlEndpoint,
            method: "post",
            data: graphqlQuery
        });
        if (response.data.data.login.ok) {
            const token = response.data.data.login.data.token;
            sessionStorage.setItem("x-access-token", token);
            if (state.connected === false) {
                socket.connect();
            }
            return {
                success: true,
                title: "Login successful",
                detail: "You have been logged in"
            };
        } else {
            return {
                success: false,
                title: "Login failed",
                detail: response.data.data.login.error
            };
        }
    },
    async registerGrapQL(request: RegisterUser): Promise<LoginResult> {
        this.logout();
        const graphqlEndpoint = `${import.meta.env.VITE_API_URL}/auth`;
        const graphqlQuery = {
            query: `mutation (
                    $username: String!,
                    $password: String!,
                    $email: String!
                    ) {
                    register (
                        username: $username,
                        password: $password,
                        email: $email
                        ) {
                            ok error data
                        }
                    }`,
            variables: {
                username: request.username,
                password: request.password,
                email: request.email
            }
        };
        const response = await axios({
            url: graphqlEndpoint,
            method: "post",
            data: graphqlQuery
        });
        if (response.data.data.register.ok) {
            return {
                success: true,
                title: response.data.data.register.data,
                detail: response.data.data.register.data
            };
        } else {
            return {
                success: false,
                title: response.data.data.register.error,
                detail: response.data.data.register.error
            };
        }
    },
    logout() {
        sessionStorage.removeItem("x-access-token");
        if (state.connected === true) {
            socket.disconnect();
        }
    }
};

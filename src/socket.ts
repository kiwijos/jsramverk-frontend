import { reactive } from "vue";
import { io } from "socket.io-client";

// This state is reactive, so it can be shared by multiple instances
export const state = reactive({
    connected: false
});

export const socket = io(import.meta.env.VITE_API_URL, {
    // send token on connection
    auth: (cb) => {
        cb({
            token: sessionStorage.getItem("x-access-token")
        });
    }
});

// Listen for events
socket.on("connect", () => {
    state.connected = true;
});

socket.on("disconnect", () => {
    state.connected = false;
});

socket.on("connect_error", (err) => {
    console.error(`connect_error due to ${err.name}: ${err.message}`);
});

import { reactive } from "vue";
import { io } from "socket.io-client";

// This state is reactive, so it can be shared by multiple instances
export const state = reactive({
    connected: false
});

export const socket = io(import.meta.env.VITE_API_URL, {
    // Don't connect automatically, we want to wait for the user to log in
    autoConnect: false
});

// Listen for events
socket.on("connect", () => {
    state.connected = true;
});

socket.on("disconnect", () => {
    state.connected = false;
});

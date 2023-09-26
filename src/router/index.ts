// Index vue routing
import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/HomeView.vue";

const routes = [
    {
        path: "/",
        name: "Home",
        component: Home,
        children: [
            {
                // Dashboard page
                path: "",
                name: "Dashboard",
                component: () =>
                    import(
                        /* webpackChunkName: "dashboard" */ "../components/DashboardComponent.vue"
                    )
            },
            {
                // Delayed trains page
                path: "delayed",
                name: "Delayed",
                component: () =>
                    import(/* webpackChunkName: "delayed" */ "../components/DelayedComponent.vue")
            },
            {
                // Ticket page
                path: "tickets",
                name: "Tickets",
                component: () => import(/* webpackChunkName: "ticket" */ "../components/TicketComponent.vue")
            },
        ]
    },
    {
        // Login page
        path: "/login",
        name: "Login",
        component: () => import(/* webpackChunkName: "login" */ "../views/LoginView.vue")
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

export default router;

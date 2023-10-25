// Index vue routing
import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/HomeView.vue";
import User from "../views/UserView.vue";
import jwt_decode from "jwt-decode";

const routes = [
    {
        path: "/",
        name: "Home",
        component: Home,
        children: [
            {
                // Delayed trains page
                meta: { requiresAuth: true },
                path: "/",
                name: "Delayed",
                component: () =>
                    import(/* webpackChunkName: "delayed" */ "../components/DelayedComponent.vue")
            },
            {
                // Ticket page
                meta: { requiresAuth: true },
                path: "tickets",
                name: "Tickets",
                component: () =>
                    import(/* webpackChunkName: "ticket" */ "../components/TicketComponent.vue")
            }
        ]
    },
    {
        path: "/user",
        name: "User",
        component: User,
        children: [
            {
                // Login page
                path: "login",
                name: "Login",
                component: () =>
                    import(/* webpackChunkName: "login" */ "../components/LoginComponent.vue")
            },
            {
                // Register page
                path: "register",
                name: "Register",
                component: () =>
                    import(/* webpackChunkName: "register" */ "../components/RegisterComponent.vue")
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach((to) => {
    // Check if route requires authentication
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        // Check if user is logged in
        if (sessionStorage.getItem("x-access-token") == null) {
            // Redirect to login page
            return {
                name: "Login"
            };
        } else {
            // Check if token is expired
            const token = sessionStorage.getItem("x-access-token");
            const decoded: any = jwt_decode(token!);
            const exp = decoded.exp;
            const date = new Date(0);
            date.setUTCSeconds(exp);
            if (date < new Date()) {
                // Redirect to login page
                return {
                    name: "Login"
                };
            }
        }
    }
});

export default router;

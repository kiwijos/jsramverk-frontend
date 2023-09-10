// Index vue routing
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/HomeView.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home,
    },
    {
        // Login page
        path: '/login',
        name: 'Login',
        component: () => import(/* webpackChunkName: "login" */'../views/LoginView.vue'),
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

export default router

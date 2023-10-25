<script setup lang="ts">
import AuthService from "@/services/AuthService";
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const active = ref(0);
const items = ref([
    {
        label: "Försenade tåg",
        icon: "pi pi-fw pi-stopwatch",
        route: "/delayed"
    },
    {
        label: "Ärenden",
        icon: "pi pi-fw pi-ticket",
        route: "/tickets"
    },
    {
        label: "Logga ut",
        icon: "pi pi-fw pi-sign-out",
        route: "/logout"
    }
]);

onMounted(() => {
    active.value = items.value.findIndex((item) => route.path === router.resolve(item.route).path);
});

watch(
    route,
    () => {
        active.value = items.value.findIndex(
            (item) => route.path === router.resolve(item.route).path
        );
    },
    { immediate: true }
);

function logout() {
    AuthService.logout();
    router.push("/user/login");
}
</script>

<template>
    <div class="w-full">
        <div class="flex pt-3 justify-content-center">
            <h3 class="banner-text">Train Delay Company</h3>
        </div>
        <div class="flex justify-content-between align-items-center">
            <nav class="w-full">
                <TabMenu v-model:activeIndex="active" :model="items">
                    <template #item="{ label, item, props }">
                        <router-link
                            v-if="item.route !== '/logout'"
                            v-slot="routerProps"
                            :to="item.route"
                            custom
                        >
                            <a
                                :href="routerProps.href"
                                v-bind="props.action"
                                @click="($event) => routerProps.navigate($event)"
                            >
                                <span v-bind="props.icon" />
                                <span v-bind="props.label">{{ label }}</span>
                            </a>
                        </router-link>
                        <router-link v-else :to="item.route" custom>
                            <a v-bind="props.action" @click="() => logout()">
                                <span v-bind="props.icon" />
                                <span v-bind="props.label">{{ label }}</span>
                            </a>
                        </router-link>
                    </template>
                </TabMenu>
            </nav>
        </div>
        <router-view />
    </div>
</template>

<style scoped>
.banner-text {
    font-size: 1.5rem;
    font-weight: 600;
    font-family: monospace;
    margin: 0;
    padding: 0;
}
</style>

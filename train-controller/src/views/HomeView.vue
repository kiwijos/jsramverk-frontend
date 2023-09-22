<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const active = ref(0);
const items = ref([
    {
        label: "Hem",
        icon: "pi pi-fw pi-home",
        route: "/"
    },
    {
        label: "Försenade tåg",
        icon: "pi pi-fw pi-stopwatch",
        route: "/delayed"
    },
    {
        label: "Ärenden",
        icon: "pi pi-fw pi-ticket",
        route: "/tickets"
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
</script>

<template>
    <div class="w-full">
        <div class="flex justify-content-between align-items-center">
            <nav class="w-full">
                <TabMenu v-model:activeIndex="active" :model="items">
                    <template #item="{ label, item, props }">
                        <router-link v-if="item.route" v-slot="routerProps" :to="item.route" custom>
                            <a
                                :href="routerProps.href"
                                v-bind="props.action"
                                @click="($event) => routerProps.navigate($event)"
                            >
                                <span v-bind="props.icon" />
                                <span v-bind="props.label">{{ label }}</span>
                            </a>
                        </router-link>
                        <a v-else :href="item.url" :target="item.target" v-bind="props.action">
                            <span v-bind="props.icon" />
                            <span v-bind="props.label">{{ label }}</span>
                        </a>
                    </template>
                </TabMenu>
            </nav>
        </div>
        <router-view />
    </div>
</template>

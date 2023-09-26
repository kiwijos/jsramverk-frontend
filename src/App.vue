<script setup lang="ts"></script>

<template>
    <div class="w-full">
        <router-view />
    </div>
</template>

<style>
@import "../node_modules/primevue/resources/themes/saga-blue/theme.css";
@import "../node_modules/primeflex/primeflex.css";
@import "../node_modules/primeicons/primeicons.css";
@import "../node_modules/maplibre-gl/dist/maplibre-gl.css";

body #app {
    font-family: var(--font-family);
    background-color: white;
    background: white;
    color: var(--text-color);
    padding: 0;
    margin: 0;
    max-width: none;
    min-width: none;
    width: 100%;
    display: block;
    min-height: 100vh;
}
</style>

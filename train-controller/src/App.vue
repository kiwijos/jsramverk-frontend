<script setup lang="ts">
    import LoginComponent from './components/LoginComponent.vue';
</script>

<template>
    <div>
        <router-link to="/">Home</router-link>
        <router-link to="/">Delays</router-link>
        <router-link to="/">Tickets</router-link>
    </div>
    <router-view/>
</template>

<style scoped>

</style>

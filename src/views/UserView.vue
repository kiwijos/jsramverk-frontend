<!--Import and use LoginComponent in script too-->
<script setup lang="ts"></script>

<template>
    <div class="centering">
        <router-view />
    </div>
</template>

<style scoped>
.centering {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}
</style>

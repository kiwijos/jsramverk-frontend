<template>
    <div class="flex align-items-center gap-5">
        <img src="../assets/logo.jpg" height="300" width="300" />
        <div class="divider-height">
            <Divider :layout="'vertical'" />
        </div>
        <form class="flex flex-column gap-4 mt-5 login-form">
            <h2>Logga in</h2>
            <InputText
                type="text"
                v-model="username"
                inputId="username"
                placeholder="Användarnamn"
                class="w-full"
            />
            <Password
                v-model="password"
                inputId="password"
                :feedback="false"
                class="w-full"
                placeholder="Lösenord"
                toggle-mask
            />
            <Button label="Logga in" @click="login" class="w-full" />
            <p class="text-red-500">{{ errorMessage }}</p>
            <!-- Router link to register new user-->
            <router-link to="/user/register" class="p-button-text">
                <span>Inget konto? Registrera ny användare</span>
            </router-link>
        </form>
    </div>
</template>

<!-- Fake login script in vue-->
<script setup lang="ts">
import router from "@/router";
import AuthService from "@/services/AuthService";
import { ref } from "vue";

const username = ref("");
const password = ref("");
const errorMessage = ref("");

async function login() {
    const result = await AuthService.loginGrapQL(username.value, password.value);
    if (result.success) {
        // Redirect to home page
        router.push("/delayed");
    } else {
        errorMessage.value = result.title;
    }
}
</script>

<style>
.loginForm {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.form-width {
    width: 500px;
}

.divider-height {
    height: 30em;
}
</style>

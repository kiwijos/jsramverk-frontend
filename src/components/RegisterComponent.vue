<script setup lang="ts">
import type { RegisterUser } from "@/models/RegisterUser.model";
import router from "@/router";
import AuthService from "@/services/AuthService";
import { ref } from "vue";
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");

async function register() {
    if (confirmPassword.value !== password.value) {
        errorMessage.value = "Lösenorden matchar inte";
        return;
    }
    const request: RegisterUser = {
        username: username.value,
        email: email.value,
        password: password.value
    };
    const result = await AuthService.registerGrapQL(request);
    if (result.success) {
        alert("Användare registrerad");
        router.push("/user/login");
    } else {
        errorMessage.value = result.title;
    }
}
</script>

<template>
    <div class="flex gap-5 align-items-center">
        <img src="../assets/logo.jpg" alt="logo" height="300" width="300" />
        <div class="height">
            <Divider layout="vertical" />
        </div>
        <form class="flex flex-column gap-3">
            <h2>Registrera ny användare</h2>
            <InputText
                type="text"
                v-model="username"
                inputId="username"
                placeholder="Användarnamn"
            />
            <InputText type="text" v-model="email" inputId="email" placeholder="Email" />
            <Password
                v-model="password"
                inputId="password"
                :toggle-mask="true"
                placeholder="Lösenord"
            />
            <Password
                v-model="confirmPassword"
                inputId="confirmPassword"
                :feedback="false"
                placeholder="Bekräfta lösenord"
            />
            <Button @click="register" label="Registrera" />
            <p class="text-red-500">{{ errorMessage }}</p>
            <router-link to="Login">
                <span>Har du redan ett konto? Logga in här</span>
            </router-link>
        </form>
    </div>
</template>

<style>
.height {
    height: 30em;
}
</style>

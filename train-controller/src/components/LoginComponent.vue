<template>
    <div>
        <h1>Login/Logo</h1>
        <Divider />
        <form class="flex gap-3 mt-5">
            <span class="p-float-label">
                <InputText type="text" v-model="username" inputId="username" />
                <label for="username">Username</label>
            </span>
            <span class="p-float-label">
                <Password v-model="password" toggleMask inputId="password" :feedback="false" />
                <label for="password">Password</label>
            </span>
            <Button label="Login" @click="login" />
        </form>
    </div>
</template>

<!-- Fake login script in vue-->
<script lang="ts">
export default {
    name: "LoginComponent",
    data() {
        return {
            username: "",
            password: ""
        };
    },
    methods: {
        login() {
            if (this.username === "admin" && this.password === "admin") {
                console.log("Logged in");
                this.$router.push("/");
            } else {
                alert("Wrong credentials");
            }
        }
    }
};
</script>

<style scoped>
.loginForm {
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>

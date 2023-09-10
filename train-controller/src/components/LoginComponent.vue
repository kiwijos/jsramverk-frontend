<!--Basic login page in vue-->
<template>
    <div class="login">
        <h1>Login</h1>
        <form>
            <input type="text" placeholder="Username" v-model="username" />
            <input type="password" placeholder="Password" v-model="password" />
            <input type="submit" value="Login" @click="login" />
        </form>
    </div>
</template>

<!-- Fake login script in vue-->
<script lang="ts">
export default {
    name: 'LoginComponent',
    data() {
        return {
            username: '',
            password: ''
        }
    },
    methods: {
        login() {
            if (this.username === 'admin' && this.password === 'admin') {
                console.log('Logged in');
            } else {
                alert('Wrong credentials');
            }
        }
    }
}
</script>

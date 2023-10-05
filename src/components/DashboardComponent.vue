<template>
    <h1 class="pt-3 px-3">Dashboard</h1>
    <Divider></Divider>
    <div class="flex p-3">
        <router-link to="Delayed">
            <Card>
                <template #title>
                    <h3>Försenade tåg</h3>
                </template>
                <template #content>
                    <p>23 försenade tåg</p>
                </template>
            </Card>
        </router-link>
    </div>
</template>

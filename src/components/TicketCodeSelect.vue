<template>
    <label for="code">Kod</label>
    <Dropdown
        v-model="value"
        id="code"
        :options="props.ticketCodes"
        placeholder="Orsakskod"
        :class="{ 'p-invalid': errorMessage && meta.touched }"
        aria-describedby="code-error"
    >
        <template #option="{ option }">
            <span>{{ option?.Code }} - {{ option?.Level1Description }}</span>
        </template>
        <template #value="{ value }">
            <span v-if="value">{{ value?.Code }} - {{ value?.Level1Description }}</span>
            <span v-else>{{ placeholder }}</span>
        </template>
    </Dropdown>
    <small class="p-error" id="code-error">{{ (errorMessage && meta.touched) || "&nbsp;" }}</small>
</template>

<script setup lang="ts">
import type { TicketCode } from "@/models/TicketCode.model";
import { useField } from "vee-validate";

const props = defineProps<{
    name: string;
    ticketCodes: TicketCode[];
    placeholder: string;
}>();

// The "name" is returned in a function because we want to make sure it stays reactive
// If the name changes we want "useField" to be able to pick it up
const { value, meta, errorMessage } = useField(() => props.name);
</script>

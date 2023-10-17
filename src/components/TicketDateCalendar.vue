<template>
    <label for="traindate">Datum</label>
    <Calendar
        id="traindate"
        v-model="value"
        dateFormat="yy-mm-dd"
        showIcon
        showButtonBar
        showTime
        hourFormat="24"
        :class="{ 'p-invalid': errorMessage }"
        aria-describedby="date-error"
        :placeholder="placeholder"
    >
    </Calendar>
    <small class="p-error" id="date-error">{{ errorMessage || "&nbsp;" }}</small>
</template>

<script setup lang="ts">
import { useField } from "vee-validate";

const props = defineProps<{
    name: string;
    placeholder: string;
}>();

// The "name" is returned in a function because we want to make sure it stays reactive
// If the name changes we want "useField" to be able to pick it up
const { value, errorMessage } = useField(() => props.name);
</script>

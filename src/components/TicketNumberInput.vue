<template>
    <label for="selectedNumber">Tågnummer</label>
    <InputNumber
        id="trainnumber"
        v-model="value"
        :class="{ 'p-invalid': errorMessage }"
        :useGrouping="false"
        aria-describedby="number-error"
        :placeholder="placeholder"
    />
    <small class="p-error" id="number-error">{{ errorMessage || "&nbsp;" }}</small>
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

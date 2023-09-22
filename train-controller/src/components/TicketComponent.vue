<script setup lang="ts">
// Get tickets on mount
import { ref, onMounted } from "vue";
import type { Ticket } from "@/models/Ticket.model";
import TrainService from "@/services/TrainService";

const tickets = ref<Ticket[]>([]);
onMounted(async () => {
    tickets.value = await TrainService.getTickets();
});
</script>

<template>
    <h1>Ärenden</h1>
    <Divider />
    <div class="flex gap-3">
        <DataTable
            :value="tickets"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :loading="tickets.length === 0"
            :stripedRows="true"
            class="w-5"
        >
            <Column field="code" header="Kod"></Column>
            <Column field="trainnumber" header="Tåg"></Column>
            <Column field="traindate" header="Datum"></Column>
        </DataTable>
    </div>
</template>

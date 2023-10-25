<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import type { Ref } from "vue";

import type { Ticket } from "@/models/Ticket.model";
import type { TicketCode } from "@/models/TicketCode.model";
import TrainService from "@/services/TrainService";

import { socket } from "@/socket";

import TicketFormComponent from "./TicketFormComponent.vue";

// Declare reactive variables
const tickets: Ref<Ticket[]> = ref([]);
const selectedTicket: Ref<Ticket | null> = ref(null); // Ticket selected from table
const ticketCodes: Ref<TicketCode[]> = ref([]);
const ticketLockedByOther: Ref<boolean> = ref(false);

// Get all tickets and codes when the component is mounted
onMounted(async () => {
    tickets.value = await TrainService.getTickets();
    ticketCodes.value = await TrainService.getTicketCodes();
});

// Unlock the ticket when the user navigates away from the page
onBeforeUnmount(() => {
    if (selectedTicket.value?.id) {
        socket.emit("unlockTicket", selectedTicket.value?.id);
    }
});

// Listen for new data from the server
socket.on("newdata", async (data) => {
    if (data.deleted) {
        // Remove the ticket from the list (and insert nothing)
        tickets.value.splice(
            tickets.value.findIndex((ticket) => ticket.id === data.id),
            1
        );
    } else {
        // Update the ticket in the list
        const updatedTicket: Ticket = await TrainService.getTicketById({ id: data.id });

        tickets.value.splice(
            tickets.value.findIndex((ticket) => ticket.id === data.id),
            1,
            updatedTicket
        );
    }
});

socket.on("ticketLockedByOther", (id) => {
    if (selectedTicket.value?.id !== id) {
        return;
    }

    ticketLockedByOther.value = true;
});

socket.on("ticketLockedByMe", () => {
    ticketLockedByOther.value = false;
});

interface TicketEvent extends Event {
    data: {
        id: string;
    };
}

const onRowSelect = (event: TicketEvent): void => {
    socket.emit("lockTicket", event.data.id);
};

const onRowUnselect = (event: TicketEvent): void => {
    socket.emit("unlockTicket", event.data.id);
};
</script>

<template>
    <div class="flex gap-6">
        <!-- Left-side table -->
        <DataTable
            :value="tickets"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :loading="tickets.length === 0"
            :stripedRows="true"
            sortField="traindate"
            tableStyle="min-width: 30rem"
            :sortOrder="-1"
            removableSort
            selectionMode="single"
            dataKey="id"
            :metaKeySelection="false"
            v-model:selection="selectedTicket"
            @row-select="onRowSelect"
            @row-unselect="onRowUnselect"
        >
            <Column field="code" header="Kod" sortable style="width: 30%"></Column>
            <Column field="trainnumber" header="Tågnummer" sortable style="width: 35%"></Column>
            <Column field="traindate" header="Datum" sortable style="width: 35%">
                <!-- Display only yy-mm-dd -->
                <template #body="slotProps">
                    {{ slotProps.data.traindate.substring(0, 10) }}
                </template>
            </Column>
        </DataTable>

        <!-- Right-side form (displayed when a ticket is selected) -->
        <div v-if="selectedTicket" class="w-5">
            <div v-if="ticketLockedByOther">
                <h2 class="p-error">Ärendet behandlas just nu av en annan användare</h2>
            </div>
            <div v-else>
                <h2>Redigera ärende: {{ selectedTicket.id }}</h2>
            </div>
            <TicketFormComponent
                :selectedTicket="selectedTicket"
                :ticketCodes="ticketCodes"
                :locked="ticketLockedByOther"
            />
        </div>
    </div>
</template>

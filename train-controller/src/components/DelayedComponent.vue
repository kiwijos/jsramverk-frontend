<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { TrainDelay } from "@/models/TrainDelay.model";
import TrainService from "@/services/TrainService";
import type { TicketCode } from "@/models/TicketCode.model";

const delayedTrains = ref<TrainDelay[]>([]);
const dialogVisible = ref<boolean>(false);
const dialogData = ref<TrainDelay | null>(null);

const ticketCodes = ref<TicketCode[]>([]);
const selectedTicketCode = ref<TicketCode | null>(null);

onMounted(async () => {
    delayedTrains.value = await TrainService.getDelayedTrains();
    ticketCodes.value = await TrainService.getTicketCodes();
});
</script>

<template>
    <h1 class="mt-3 ml-3">Försenade tåg</h1>
    <Divider />
    <div class="flex gap-3 p-3">
        <DataTable
            :value="delayedTrains"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :loading="delayedTrains.length === 0"
            :stripedRows="true"
            class="w-5"
        >
            <Column field="OperationalTrainNumber" header="Tågnummer"></Column>
            <Column field="LocationSignature" header="Position"></Column>
            <Column field="ToLocation" header="Rutt">
                <template #body="{ data }">
                    <span>{{
                        data.FromLocation ? data.FromLocation[0].LocationName + "->" : ""
                    }}</span>
                    <span>{{ data.ToLocation ? data.ToLocation[0].LocationName : "" }}</span>
                </template>
            </Column>
            <Column field="AdvertisedTimeAtLocation" header="Försening">
                <template #body="{ data }">
                    <span>
                        {{
                            new Date(
                                new Date(data.EstimatedTimeAtLocation).getTime() -
                                    new Date(data.AdvertisedTimeAtLocation).getTime()
                            ).getMinutes()
                        }}
                        minuter
                    </span>
                </template>
            </Column>
            <Column>
                <template #body="{ data }">
                    <Button
                        label=""
                        icon="pi pi-plus"
                        class="p-button-rounded p-button-success p-button-sm"
                        @click="() => {
                            dialogVisible = true;
                            dialogData = data;
                        }"
                    />
                </template>
            </Column>
        </DataTable>
        <!-- leaflet map-->
        <MapComponent class="w-7" />
    </div>
    <Dialog v-model:visible="dialogVisible" class="w-7 h-22rem">
        <div class="flex gap-3 align-content-center align-items-center">
            <h2 class="p-0">Nytt ärende</h2>
            <h3 class="p-0">Tågnummer: {{ dialogData?.OperationalTrainNumber }}</h3>
        </div>
        <Divider />
        <div class="flex gap-3">
            <div class="w-5">
                <h3>Orsakskod</h3>
                <Dropdown v-model:modelValue="selectedTicketCode" :options="ticketCodes">
                    
                </Dropdown>
            </div>
        </div>
    </Dialog>
</template>

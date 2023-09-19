<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";
import type { TrainDelay } from "@/models/TrainDelay.model";

const delayedTrains = ref<TrainDelay[]>([]);

onMounted(async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/delayed`);
    delayedTrains.value = response.data.data;
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
        </DataTable>
        <!-- leaflet map-->
        <MapComponent class="w-7" />
    </div>
</template>

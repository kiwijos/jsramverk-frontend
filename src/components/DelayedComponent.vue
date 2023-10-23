<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Ref } from "vue";
import type { TrainDelay } from "@/models/TrainDelay.model";
import TrainService from "@/services/TrainService";
import type { TicketCode } from "@/models/TicketCode.model";
import type { TrainStation } from "@/models/TrainStation.model";
import type { TrainDelayWithStationDto } from "@/models/TrainDelayWithStationDto.model";
import type { TrainDelayGroup } from "@/models/TrainDelayGroup.model";

const trainStations: Ref<TrainStation[]> = ref([]);
const delayedTrains: Ref<TrainDelayGroup[]> = ref([]);
const dialogVisible: Ref<boolean> = ref(false);
const dialogData: Ref<TrainDelay | null> = ref(null);
const ticketCodes: Ref<TicketCode[]> = ref([]);
const selectedTicketCode: Ref<TicketCode | null> = ref(null);
const addLoading: Ref<boolean> = ref(false);

// This could be just a sub-set of delayedTrains, or all of them, or none of them
const expandedRows: Ref<TrainDelayGroup[] | null> = ref(null);

const createTicket = async () => {
    const request = {
        code: selectedTicketCode.value?.Code as string,
        traindate: new Date(),
        trainnumber: dialogData.value?.OperationalTrainNumber as string
    };
    addLoading.value = true;
    await TrainService.createTicket(request);
    addLoading.value = false;
    dialogVisible.value = false;
};

const expandAll = () => {
    expandedRows.value = delayedTrains.value.filter((delay) => delay.id);
};
const collapseAll = () => {
    expandedRows.value = null;
};

// const onRowExpand = (event) => {
//     //
// };

// const onRowCollapse = (event) => {
//     //
// };

const getStationBySignature = (signature: string) => {
    return trainStations.value.find((station) => station.LocationSignature === signature);
};

onMounted(() => {
    addLoading.value = true;
    Promise.all([TrainService.getTrainStations(), TrainService.getDelayedTrains()]).then(
        ([stations, delays]) => {
            trainStations.value = stations;
            // Create a datastructure with OperationalTrainNumber as key and group
            // all delays for that train under that key

            // e.g. OperationalTrainNumber: 1234, delays: [{...}, {...}]
            // acc is the accumulator, the object we are building
            const data = delays.reduce(
                (acc: { [key: string]: TrainDelayGroup }, delay: TrainDelay) => {
                    if (!acc[delay.OperationalTrainNumber]) {
                        acc[delay.OperationalTrainNumber] = {
                            id: delay.OperationalTrainNumber,
                            data: []
                        };
                    }

                    // Create a new delay object with the station so we can show the station name in the table,
                    // instead of just the LocationSignature
                    const delayWithStation: TrainDelayWithStationDto = {
                        ...delay,
                        Station: getStationBySignature(delay.LocationSignature)
                    };

                    acc[delay.OperationalTrainNumber].data.push(delayWithStation);

                    return acc;
                },
                {}
            );
            delayedTrains.value = Object.values(data);
            addLoading.value = false;
        }
    );

    TrainService.getTicketCodes().then((data) => {
        ticketCodes.value = data;
    });
});
</script>

<template>
    <div class="flex">
        <DataTable
            v-model:expandedRows="expandedRows"
            :value="delayedTrains"
            dataKey="id"
            tableStyle="min-width: 40rem"
            paginator
            :first="0"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 25]"
            :loading="addLoading"
            :stripedRows="true"
        >
            <template #header>
                <div class="flex flex-wrap justify-content-end flex gap-2">
                    <Button text icon="pi pi-plus" label="Öppna Alla" @click="expandAll"></Button>
                    <Button
                        text
                        icon="pi pi-minus"
                        label="Stäng Alla"
                        @click="collapseAll"
                    ></Button>
                </div>
            </template>
            <Column expander style="width: 5rem" />
            <Column field="id" header="Tåg" />
            <Column header="Sträcka">
                <template #body="{ data }">
                    <span>{{
                        getStationBySignature(data?.data[0].FromLocation[0].LocationName)
                            ?.AdvertisedLocationName
                    }}</span>
                    <span> - </span>
                    <span>{{
                        getStationBySignature(data?.data[0].ToLocation[0].LocationName)
                            ?.AdvertisedLocationName
                    }}</span>
                </template>
            </Column>
            <Column headerStyle="width:4rem">
                <template #body="{ data }">
                    <Button
                        icon="pi pi-plus"
                        severity="info"
                        text
                        rounded
                        aria-label="Nytt Ärende"
                        @click="
                            () => {
                                dialogData = data;
                                dialogVisible = true;
                            }
                        "
                    ></Button>
                </template>
            </Column>
            <template #expansion="slotProps">
                <div class="p-3">
                    <div class="flex flex-wrap justify-content-between flex gap-2">
                        <h5>Förseningar för tåg {{ slotProps.data.id }}</h5>
                        <Button
                            text
                            icon="pi pi-map"
                            label="Visa Sträcka"
                            @click="toggleMapRoute(slotProps.data)"
                        ></Button>
                    </div>
                    <DataTable
                        :value="slotProps.data.data"
                        dataKey="slotProps.data.delays.ActivityId"
                        sortField="slotProps.data.delays.AdvertisedTimeAtLocation"
                        :sortOrder="-1"
                    >
                        <Column header="Station">
                            <template #body="{ data }">
                                <span>{{
                                    data.Station
                                        ? data.Station.AdvertisedLocationName
                                        : data.LocationSignature
                                }}</span>
                            </template>
                        </Column>
                        <Column header="Beräknad avgång">
                            <template #body="{ data }">
                                <span class="line-through">{{
                                    new Date(data.AdvertisedTimeAtLocation).toLocaleTimeString(
                                        "sv-SE"
                                    )
                                }}</span>
                                <span>&nbsp;</span>
                                <span class="font-bold">{{
                                    new Date(data.EstimatedTimeAtLocation).toLocaleTimeString(
                                        "sv-SE"
                                    )
                                }}</span>
                            </template>
                        </Column>
                        <Column header="Försening">
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
                        <Column header="Status" headerStyle="width:4rem">
                            <template #body="slotProps">
                                <Tag
                                    :value="slotProps.data.Cancelled ? 'Inställt' : 'Försenat'"
                                    :severity="slotProps.data.Cancelled ? 'danger' : 'warning'"
                                />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </template>
        </DataTable>

        <!-- leaflet map-->
        <MapComponent class="w-7" />
    </div>
    <Dialog v-model:visible="dialogVisible" class="w-6">
        <div class="h-22rem">
            <h2 class="p-0">Registrera nytt ärende</h2>
            <Divider />
            <div class="flex flex-column gap-3 align-items-center" v-if="dialogData">
                <h3 class="p-0">Tågnummer: {{ dialogData?.OperationalTrainNumber }}</h3>
                <div class="w-5 flex flex-column gap-3">
                    <h3>Orsakskod</h3>
                    <Dropdown
                        v-model:modelValue="selectedTicketCode"
                        :options="ticketCodes"
                        :disabled="addLoading"
                        placeholder="Välj orsak"
                    >
                        <template #option="{ option }">
                            <span>{{ option?.Code }} - {{ option?.Level1Description }}</span>
                        </template>
                        <template #value="{ value }">
                            <span v-if="value"
                                >{{ value?.Code }} - {{ value?.Level1Description }}</span
                            >
                            <span v-else>Välj orsak</span>
                        </template>
                    </Dropdown>
                    <Button
                        label="Skapa ärende"
                        class="p-button-rounded p-button-success p-button-sm"
                        :loading="addLoading"
                        @click="createTicket"
                    ></Button>
                </div>
            </div>
        </div>
    </Dialog>
</template>

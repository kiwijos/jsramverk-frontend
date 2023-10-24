<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Ref } from "vue";
import { FilterMatchMode, FilterService } from "primevue/api";
import { useToast } from "primevue/usetoast";

import { socket } from "@/socket";

import type { TrainDelay } from "@/models/TrainDelay.model";
import TrainService from "@/services/TrainService";
import type { TicketCode } from "@/models/TicketCode.model";
import type { TrainStation } from "@/models/TrainStation.model";
import type { TrainDelayWithStationDto } from "@/models/TrainDelayWithStationDto.model";
import type { TrainDelayGroup } from "@/models/TrainDelayGroup.model";
import type { TrainRoute } from "@/models/TrainRoute.model";

const toast = useToast();

// Route to display on the map
const selectedRoute: Ref<TrainRoute | null> = ref(null);

const trainStations: Ref<TrainStation[]> = ref([]);
const delayedTrains: Ref<TrainDelayGroup[]> = ref([]);
const dialogVisible: Ref<boolean> = ref(false);
const dialogData: Ref<TrainDelayGroup | null> = ref(null);
const ticketCodes: Ref<TicketCode[]> = ref([]);
const selectedTicketCode: Ref<TicketCode | null> = ref(null);
const addLoading: Ref<boolean> = ref(false);

// This could be just a sub-set of delayedTrains, or all of them, or none of them
const expandedRows: Ref<TrainDelayGroup[] | null> = ref(null);

const YOUR_FILTER = ref("YOUR FILTER");

const filters = ref({
    id: { value: null, matchMode: YOUR_FILTER.value },
    "fromStation.AdvertisedLocationName": {
        value: null,
        matchMode: YOUR_FILTER.value
    },
    "toStation.AdvertisedLocationName": {
        value: null,
        matchMode: YOUR_FILTER.value
    }
});

const matchModeOptions = ref([
    { label: "Exakt", value: YOUR_FILTER.value },
    { label: "Börjar på", value: FilterMatchMode.STARTS_WITH },
    { label: "Innehåller", value: FilterMatchMode.CONTAINS },
    { label: "Slutar på", value: FilterMatchMode.ENDS_WITH }
]);

const createTicket = async () => {
    const request = {
        code: selectedTicketCode.value?.Code as string,
        traindate: new Date(),
        trainnumber: dialogData.value?.id as string
    };

    addLoading.value = true;

    const ticket = await TrainService.createTicket(request);

    if (ticket.ok === false) {
        toast.add({
            severity: "error",
            summary: "Ett fel uppstod",
            detail: ticket.error,
            life: 3000
        });
    } else {
        socket.emit("create", ticket.data.id);
        toast.add({
            severity: "success",
            summary: "Ärende skapat",
            detail: ticket.data.id,
            life: 3000
        });
    }
    dialogVisible.value = false;
    dialogData.value = null;
    addLoading.value = false;
};

const expandAll = () => {
    expandedRows.value = delayedTrains.value.filter((delay) => delay.id);
};
const collapseAll = () => {
    expandedRows.value = null;
};

const getStationBySignature = (signature: string): TrainStation | null => {
    return (
        trainStations.value.find(
            (station: TrainStation) => station.LocationSignature === signature
        ) || null
    );
};

const updateTable = (trainNumber: string) => {
    // Clear all other filters
    filters.value["fromStation.AdvertisedLocationName"].value = null;
    filters.value["toStation.AdvertisedLocationName"].value = null;

    // Update the table filter to only show the train with the given train number
    // (This is a bit hacky, but it works)
    // @ts-ignore
    YOUR_FILTER.value = FilterMatchMode.EXACT;
    // @ts-ignore
    filters.value.id.value = trainNumber;
};

const selectRoute = (route: TrainDelayGroup) => {
    if (selectedRoute.value?.id === route.id) {
        selectedRoute.value = null;
        return;
    }

    // loop through all the delays for this route and keep only the Station for each delay
    // (we don't need the full delay object)
    let stations: TrainStation[] = route.data.map((delay) => delay.Station as TrainStation);

    selectedRoute.value = {
        id: route.id,
        fromStation: route.fromStation,
        toStation: route.toStation,
        viaStations: stations
    };
};

onMounted(async () => {
    addLoading.value = true;

    FilterService.register(YOUR_FILTER.value, (value, filter) => {
        if (filter === undefined || filter === null || filter.trim() === "") {
            return true;
        }

        if (value === undefined || value === null) {
            return false;
        }

        return value.toString() === filter.toString();
    });

    trainStations.value = await TrainService.getTrainStations();

    const delays = await TrainService.getDelayedTrains();

    // Create a datastructure with OperationalTrainNumber as key and group
    // all delays for that train under that key
    // e.g. OperationalTrainNumber: 1234, delays: [{...}, {...}]
    // acc is the accumulator, the object we are building
    const data = delays.reduce((acc: { [key: string]: TrainDelayGroup }, delay: TrainDelay) => {
        if (!acc[delay.OperationalTrainNumber]) {
            let fromStation: TrainStation | null = null;
            let toStation: TrainStation | null = null;

            if (delay.FromLocation?.length > 0) {
                fromStation = getStationBySignature(delay.FromLocation[0].LocationName);
            }

            if (delay.ToLocation?.length > 0) {
                toStation = getStationBySignature(delay.ToLocation[0].LocationName);
            }

            acc[delay.OperationalTrainNumber] = {
                id: delay.OperationalTrainNumber,
                fromStation,
                toStation,
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
    }, {});

    delayedTrains.value = Object.values(data);

    ticketCodes.value = await TrainService.getTicketCodes();

    addLoading.value = false;
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
            :rows="10"
            :rowsPerPageOptions="[5, 10, 25]"
            :loading="addLoading"
            :stripedRows="true"
            v-model:filters="filters"
            filterDisplay="row"
        >
            <template #loading> Laddar ändringar... </template>
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
            <Column field="id" header="Tåg" :filterMatchModeOptions="matchModeOptions">
                <template #body="{ data }">
                    <span>{{ data?.id }}</span>
                </template>
                <template #filter="{ filterModel, filterCallback }">
                    <InputText
                        v-model="filterModel.value"
                        type="text"
                        @input="filterCallback()"
                        class="p-column-filter"
                        placeholder="Sök..."
                    />
                </template>
            </Column>
            <Column
                header="Från"
                filterField="fromStation.AdvertisedLocationName"
                :filterMatchModeOptions="matchModeOptions"
            >
                <template #body="{ data }">
                    <span>{{ data?.fromStation?.AdvertisedLocationName }}</span>
                </template>
                <template #filter="{ filterModel, filterCallback }">
                    <InputText
                        v-model="filterModel.value"
                        type="text"
                        @input="filterCallback()"
                        class="p-column-filter"
                        placeholder="Sök..."
                    />
                </template>
            </Column>
            <Column
                header="Till"
                filterField="toStation.AdvertisedLocationName"
                :filterMatchModeOptions="matchModeOptions"
            >
                <template #body="{ data }">
                    <span>{{ data?.toStation?.AdvertisedLocationName }}</span>
                </template>
                <template #filter="{ filterModel, filterCallback }">
                    <InputText
                        v-model="filterModel.value"
                        type="text"
                        @input="filterCallback()"
                        class="p-column-filter"
                        placeholder="Sök..."
                    />
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
                            :icon="
                                selectedRoute?.id === slotProps.data.id
                                    ? 'pi pi-times'
                                    : 'pi pi-map'
                            "
                            :severity="selectedRoute?.id === slotProps.data.id ? 'danger' : 'info'"
                            :label="
                                selectedRoute?.id === slotProps.data.id ? 'Stäng' : 'Visa Sträcka'
                            "
                            @click="selectRoute(slotProps.data)"
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
        <MapComponent @opened-popup="updateTable" class="w-7" :route="selectedRoute" />
    </div>
    <Toast />
    <Dialog v-model:visible="dialogVisible" class="w-6">
        <div class="h-22rem">
            <h2 class="p-0">Registrera nytt ärende</h2>
            <Divider />
            <div class="flex flex-column gap-3 align-items-center" v-if="dialogData">
                <h3 class="p-0">Tågnummer: {{ dialogData?.id }}</h3>
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

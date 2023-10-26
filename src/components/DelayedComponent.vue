<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
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
const ticketLockedByOther: Ref<boolean> = ref(false);

// This could be just a sub-set of delayedTrains, or all of them, or none of them
const expandedRows: Ref<TrainDelayGroup[] | null> = ref(null);

// When dialogData changes, this most likely means that the user has selected a train to create a ticket for
// This is a good time to lock the train so that no other user can create a ticket for it at the same time
watch(dialogData, (newData, oldData) => {
    // If the user has selected a train, lock it
    if (newData?.OperationalTrainNumber) {
        socket.emit("lockTicket", newData.OperationalTrainNumber);
    }
    // If the user has closed the dialog, unlock the train
    if (oldData?.OperationalTrainNumber) {
        socket.emit("unlockTicket", oldData.OperationalTrainNumber);
    }
});

// Cofirmation that the train has been locked
socket.on("ticketLockedByMe", () => {
    ticketLockedByOther.value = false;
});

// Message that the train has already been locked by another user
socket.on("ticketLockedByOther", (id: string) => {
    if (dialogData.value?.OperationalTrainNumber !== id) {
        return;
    }

    ticketLockedByOther.value = true;
});

// Make sure that the dialog data is cleared when the dialog is closed
const handleClose = () => {
    dialogData.value = null;
};

const YOUR_FILTER = ref("YOUR FILTER");

const filters = ref({
    OperationalTrainNumber: { value: null, matchMode: YOUR_FILTER.value },
    "FromStation.AdvertisedLocationName": {
        value: null,
        matchMode: YOUR_FILTER.value
    },
    "ToStation.AdvertisedLocationName": {
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
        trainnumber: dialogData.value?.OperationalTrainNumber as string
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
    expandedRows.value = delayedTrains.value.filter((delay) => delay.OperationalTrainNumber);
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
    filters.value["FromStation.AdvertisedLocationName"].value = null;
    filters.value["ToStation.AdvertisedLocationName"].value = null;

    // Update the table filter to only show the train with the given train number
    // (This is a bit hacky, but it works)
    // @ts-ignore
    YOUR_FILTER.value = FilterMatchMode.EXACT;
    // @ts-ignore
    filters.value.OperationalTrainNumber.value = trainNumber;
};

const selectRoute = (route: TrainDelayGroup) => {
    if (selectedRoute.value?.OperationalTrainNumber === route.OperationalTrainNumber) {
        selectedRoute.value = null;
        return;
    }

    // loop through all the delays for this route and keep only the Station for each delay
    // (we don't need the full delay object)
    let stations: TrainStation[] = route.Data.map((delay) => delay.Station as TrainStation);

    selectedRoute.value = {
        OperationalTrainNumber: route.OperationalTrainNumber,
        FromStation: route.FromStation,
        ToStation: route.ToStation,
        ViaStations: stations
    };
};

// Doubly make sure that the dialog data is cleared when the component is unmounted
// (like when the user navigates away from the page)
onBeforeUnmount(() => {
    dialogData.value = null;
});

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
                OperationalTrainNumber: delay.OperationalTrainNumber,
                FromStation: fromStation,
                ToStation: toStation,
                Data: []
            };
        }

        // Create a new delay object with the station so we can show the station name in the table,
        // instead of just the LocationSignature
        const delayWithStation: TrainDelayWithStationDto = {
            ...delay,
            Station: getStationBySignature(delay.LocationSignature)
        };

        acc[delay.OperationalTrainNumber].Data.push(delayWithStation);

        return acc;
    }, {});
    delayedTrains.value = Object.values(data);

    ticketCodes.value = await TrainService.getTicketCodes();

    addLoading.value = false;
});

const tableVisible = ref(true);
</script>

<template>
    <Button
        icon="pi pi-arrow-right"
        class="fixed bg-white text-color z-5 m-3"
        :class="{ hidden: tableVisible }"
        @click="tableVisible = true"
    ></Button>
    <DataTable
        v-model:expandedRows="expandedRows"
        :value="delayedTrains"
        dataKey="OperationalTrainNumber"
        class="sm:w-full md:w-9 lg:w-7 xl:w-6 table-float"
        paginator
        :rows="10"
        :rowsPerPageOptions="[5, 10, 25]"
        :loading="addLoading"
        :stripedRows="true"
        v-model:filters="filters"
        filterDisplay="row"
        scrollable
        scrollHeight="flex"
        :class="{ '-translate-x-100': !tableVisible }"
    >
        <template #loading><ProgressSpinner animationDuration=".5s" /></template>
        <template #header>
            <div class="flex justify-content-between">
                <Button icon="pi pi-arrow-left" @click="tableVisible = false"></Button>
                <div class="flex flex-wrap justify-content-end flex gap-2">
                    <Button text icon="pi pi-plus" label="Öppna Alla" @click="expandAll"></Button>
                    <Button
                        text
                        icon="pi pi-minus"
                        label="Stäng Alla"
                        @click="collapseAll"
                    ></Button>
                </div>
            </div>
        </template>
        <Column expander style="width: min-w-min" />
        <Column
            field="OperationalTrainNumber"
            header="Tågnummer"
            :filterMatchModeOptions="matchModeOptions"
        >
            <template #body="{ data }">
                <span>{{ data?.OperationalTrainNumber }}</span>
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
            filterField="FromStation.AdvertisedLocationName"
            :filterMatchModeOptions="matchModeOptions"
        >
            <template #body="{ data }">
                <span>{{ data?.FromStation?.AdvertisedLocationName }}</span>
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
            filterField="ToStation.AdvertisedLocationName"
            :filterMatchModeOptions="matchModeOptions"
        >
            <template #body="{ data }">
                <span>{{ data?.ToStation?.AdvertisedLocationName }}</span>
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
                <div class="flex flex-wrap justify-content-between align-items-center">
                    <h5>Förseningar för tåg {{ slotProps.data.OperationalTrainNumber }}</h5>
                    <Button
                        text
                        :icon="
                            selectedRoute?.OperationalTrainNumber ===
                            slotProps.data.OperationalTrainNumber
                                ? 'pi pi-times'
                                : 'pi pi-map'
                        "
                        :severity="
                            selectedRoute?.OperationalTrainNumber ===
                            slotProps.data.OperationalTrainNumber
                                ? 'danger'
                                : 'info'
                        "
                        :label="
                            selectedRoute?.OperationalTrainNumber ===
                            slotProps.data.OperationalTrainNumber
                                ? 'Stäng'
                                : 'Visa Sträcka'
                        "
                        @click="selectRoute(slotProps.data)"
                    ></Button>
                </div>
                <DataTable
                    :value="slotProps.data.Data"
                    dataKey="slotProps.data.Data.ActivityId"
                    sortField="slotProps.data.Data.AdvertisedTimeAtLocation"
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
                    <Column header="Avgång">
                        <template #body="{ data }">
                            <span class="line-through">{{
                                new Date(data.AdvertisedTimeAtLocation).toLocaleTimeString("sv-SE")
                            }}</span>
                            <span>&nbsp;</span>
                            <span class="font-bold">
                                {{
                                    new Date(
                                        data.TimeAtLocation
                                            ? data.TimeAtLocation
                                            : data.EstimatedTimeAtLocation
                                    ).toLocaleTimeString("sv-SE")
                                }}
                                <span v-if="!data.TimeAtLocation">*</span>
                            </span>
                        </template>
                    </Column>
                    <Column header="Försening">
                        <template #body="{ data }">
                            <span>
                                {{
                                    new Date(
                                        new Date(
                                            data.TimeAtLocation
                                                ? data.TimeAtLocation
                                                : data.EstimatedTimeAtLocation
                                        ).getTime() -
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
                                class="flex flex-grow-0 flex-shrink-0"
                                :value="
                                    slotProps.data.TimeAtLocation
                                        ? 'Avgått'
                                        : slotProps.data.Cancelled
                                        ? 'Inställt'
                                        : 'Försenat'
                                "
                                :severity="
                                    slotProps.data.TimeAtLocation
                                        ? 'info'
                                        : slotProps.data.Cancelled
                                        ? 'danger'
                                        : 'warning'
                                "
                            />
                        </template>
                    </Column>
                </DataTable>
                <h5 class="font-italic">* Betyder att tiden är uppskattad.</h5>
            </div>
        </template>
    </DataTable>

    <!-- leaflet map-->
    <MapComponent
        @opened-popup="updateTable"
        :route="selectedRoute"
        :delayedTrains="delayedTrains"
    />
    <Toast />
    <Dialog v-model:visible="dialogVisible" class="w-6" @update:visible="handleClose">
        <div class="h-22rem">
            <div v-if="ticketLockedByOther">
                <h2 class="p-0 p-error">Ärendet hanteras just nu av en annan användare</h2>
            </div>
            <div v-else>
                <h2 class="p-0">Registrera nytt ärende</h2>
            </div>
            <Divider />
            <div class="flex flex-column gap-3 align-items-center" v-if="dialogData">
                <h3 class="p-0">Tågnummer: {{ dialogData?.OperationalTrainNumber }}</h3>
                <div class="w-5 flex flex-column gap-3">
                    <h3>Orsakskod</h3>
                    <Dropdown
                        v-model:modelValue="selectedTicketCode"
                        :options="ticketCodes"
                        :disabled="addLoading || ticketLockedByOther"
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
                        :disabled="ticketLockedByOther"
                        @click="createTicket"
                    ></Button>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<style scoped>
.table-float {
    position: fixed;
    z-index: 10;
    height: calc(100vh - 95px);
    min-height: calc(100vh - 95px);
    transform: translateX(0%);
    transition: transform 0.3s ease-in-out;
}
</style>
<style>
.p-datatable-wrapper {
    background: white;
}
</style>

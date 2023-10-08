<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import type { Ticket } from "@/models/Ticket.model";
import type { TicketCode } from "@/models/TicketCode.model";
import TrainService from "@/services/TrainService";

import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/yup";
import * as yup from "yup";

const toast = useToast();
const confirm = useConfirm();

// Declare reactive variables
const tickets = ref<Ticket[]>([]);
const selectedTicket = ref<Ticket | null>(null); // Ticket selected from table
const ticketCodes = ref<TicketCode[]>([]);
const addLoading = ref<boolean>(false); // Shows if operation is in progress

// Define a validation schema
// (Because no field is strictly required, make nullable)
const schema = yup.object({
    selectedCode: yup.object().nullable(),
    selectedNumber: yup
        .number()
        .nullable()
        .positive()
        .test("len", "Lämna tomt eller ange ett nummer (3-5 siffror)", (val) => {
            if (val === undefined || val === null) {
                return true;
            }
            return val >= 100 && val < 100000;
        }),
    selectedDate: yup.date().nullable()
});

// Create a form context
const { meta, errors, defineComponentBinds, handleSubmit, resetForm } = useForm({
    validationSchema: toTypedSchema(schema)
});

// Define binds to form fields
const selectedCode = defineComponentBinds("selectedCode");
const selectedNumber = defineComponentBinds("selectedNumber");
const selectedDate = defineComponentBinds("selectedDate");

// Get all tickets and codes when the component is mounted
onMounted(async () => {
    tickets.value = await TrainService.getTickets();
    ticketCodes.value = await TrainService.getTicketCodes();
});

// Dialog showed when attempting to update a ticket
const confirmUpdate = () => {
    confirm.require({
        message: "Det här kommer att ÄNDRA ett befintligt ärende",
        header: "Bekräfta ändring",
        icon: "pi pi-info-circle",
        accept: () => {
            submitUpdate();
        },
        reject: () => {
            toast.add({
                severity: "error",
                summary: "Avbröt ändring",
                detail: "Ingen ändring har skett",
                life: 3000
            });
        }
    });
};

// Dialog showed when attempting to delete a ticket
const confirmDelete = () => {
    confirm.require({
        message: "Det här kommer att TA BORT ett befintligt ärende?",
        header: "Bekräfta borttagning",
        icon: "pi pi-exclamation-triangle",
        acceptClass: "p-button-danger",
        accept: () => {
            onDeleteTicket();
        },
        reject: () => {
            toast.add({
                severity: "error",
                summary: "Avbröt borttagning",
                detail: "Ingen ändring har skett",
                life: 3000
            });
        }
    });
};

// Log values and errors if validation fails
// (Remove when in production)
function onInvalidSubmit({
    values,
    errors,
    results
}: {
    values: object;
    errors: object;
    results: object;
}) {
    console.log(values); // current form values
    console.log(errors); // a map of field names and their first error message
    console.log(results); // a detailed map of field names and their validation results
}

// Use handleSumbit to let vee-validate call the appropriate callback
const submitUpdate = handleSubmit(onUpdateTicket, onInvalidSubmit);

// Attempt to update the selected ticket
async function onUpdateTicket(values: {
    selectedCode: TicketCode;
    selectedNumber: number;
    selectedDate: Date;
}) {
    if (selectedTicket.value === null) {
        toast.add({
            severity: "error",
            summary: "Ett fel uppstod",
            detail: "Inget ärende är valt",
            life: 3000
        });
        return;
    }

    const request = {
        id: selectedTicket.value.id,
        code: values.selectedCode ? values.selectedCode.Code : undefined,
        trainnumber: values.selectedNumber ? values.selectedNumber.toString() : undefined,
        traindate: values.selectedDate
    };

    console.log(request);
    addLoading.value = true;
    const result = await TrainService.updateTicket(request);
    addLoading.value = false;

    if (result.ok) {
        toast.add({
            severity: "info",
            summary: "Ärende ändrat",
            detail: result.data.id,
            life: 3000
        });
    } else {
        toast.add({
            severity: "error",
            summary: "Ett fel uppstod",
            detail: result.error,
            life: 3000
        });
    }
}

// Attempt to delete the selected ticket
async function onDeleteTicket(): Promise<void> {
    if (selectedTicket.value === null) {
        toast.add({
            severity: "error",
            summary: "Ett fel uppstod",
            detail: "Inget ärende är valt",
            life: 3000
        });
        return;
    }

    const request = {
        id: selectedTicket.value.id
    };

    addLoading.value = true;
    const result = await TrainService.deleteTicket(request);
    addLoading.value = false;

    if (result.ok) {
        toast.add({
            severity: "info",
            summary: "Ärende borttaget",
            detail: result.data.id,
            life: 3000
        });
        resetForm();
        selectedTicket.value = null; // This will also hide the form
    } else {
        toast.add({
            severity: "error",
            summary: "Ett fel uppstod",
            detail: result.error,
            life: 3000
        });
    }
}
</script>

<template>
    <h1 class="pt-3 px-3">Ärenden</h1>
    <Divider />
    <div class="flex gap-3">
        <!-- Left-side table -->
        <DataTable
            :value="tickets"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :loading="tickets.length === 0"
            :stripedRows="true"
            class="w-5"
            sortField="traindate"
            :sortOrder="-1"
            removableSort
            selectionMode="single"
            v-model:selection="selectedTicket"
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
            <form class="flex flex-column gap-3">
                <h2>Redigera ärende: {{ selectedTicket.id }}</h2>
                <Divider />
                <label for="code">Kod</label>
                <Dropdown
                    v-bind="selectedCode"
                    inputId="code"
                    :options="ticketCodes"
                    :disabled="addLoading"
                    placeholder="Orsakskod"
                >
                    <template #option="{ option }">
                        <span>{{ option?.Code }} - {{ option?.Level1Description }}</span>
                    </template>
                    <template #value="{ value }">
                        <span v-if="value">{{ value?.Code }} - {{ value?.Level1Description }}</span>
                        <span v-else>{{ selectedTicket.code }}</span>
                    </template>
                </Dropdown>
                <small class="p-error" id="code-error">{{ errors.selectedCode || "&nbsp;" }}</small>
                <label for="trainnumber">Tågnummer</label>
                <InputNumber
                    v-bind="selectedNumber"
                    inputId="trainnumber"
                    :useGrouping="false"
                    :class="{ 'p-invalid': errors.selectedNumber }"
                />
                <small class="p-error" id="number-error">{{
                    errors.selectedNumber || "&nbsp;"
                }}</small>
                <label for="traindate">Datum</label>
                <Calendar
                    v-bind="selectedDate"
                    inputId="traindate"
                    dateFormat="yy-mm-dd"
                    showIcon
                    showButtonBar
                    showTime
                    hourFormat="24"
                    :class="{ 'p-invalid': errors.selectedDate }"
                />
                <small class="p-error" id="date-error">{{ errors.selectedDate || "&nbsp;" }}</small>
                <ConfirmDialog></ConfirmDialog>
                <div class="card flex flex-wrap gap-2">
                    <Button
                        @click="confirmUpdate()"
                        icon="pi pi-check"
                        label="Ändra"
                        :disabled="!meta.dirty"
                    ></Button>
                    <Button
                        @click="confirmDelete()"
                        icon="pi pi-times"
                        severity="danger"
                        label="Ta bort"
                    ></Button>
                </div>
            </form>
        </div>
        <Toast />
    </div>
</template>

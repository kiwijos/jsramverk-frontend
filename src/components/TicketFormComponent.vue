<template>
    <form class="flex flex-column gap-3">
        <h2>Redigera ärende: {{ selectedTicket.id }}</h2>
        <Divider />
        <TicketCodeSelect
            name="selectedCode"
            :ticketCodes="ticketCodes"
            :placeholder="selectedTicket.code"
        />
        <TicketNumberInput name="selectedNumber" :placeholder="selectedTicket.trainnumber" />
        <TicketDateCalendar name="selectedDate" :placeholder="selectedTicket.traindate" />
        <ConfirmDialog></ConfirmDialog>
        <div class="card flex flex-wrap gap-2">
            <Button
                @click="confirmUpdate()"
                icon="pi pi-check"
                label="Ändra"
                :disabled="addLoading"
            ></Button>
            <Button
                @click="confirmDelete()"
                icon="pi pi-times"
                severity="danger"
                label="Ta bort"
                :disabled="addLoading"
            ></Button>
        </div>
    </form>
    <Toast />
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { object, number, date } from "yup";
import { toTypedSchema } from "@vee-validate/yup";

import { ref, markRaw } from "vue";
import type { Ref } from "vue";

import TicketNumberInput from "./TicketNumberInput.vue";
import TicketDateCalendar from "./TicketDateCalendar.vue";
import TicketCodeSelect from "./TicketCodeSelect.vue";

import type { Ticket } from "@/models/Ticket.model";
import type { TicketCode } from "@/models/TicketCode.model";
import type { TicketUpdateDto } from "@/models/TicketUpdateDto.model";

import TrainService from "@/services/TrainService";

import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";

import { socket } from "@/socket";

const toast = useToast();
const confirm = useConfirm();

const addLoading: Ref<boolean> = ref(false); // Shows if operation is in progress

// Define a validation schema
// Because no field is strictly required, make them nullable
// Also, mark the schema as raw to avoid the overhead that otherwise comes with having it be reactive (which it doesn't need to be)
const schema = markRaw(
    object({
        selectedCode: object().nullable(),
        selectedNumber: number()
            .nullable()
            .positive()
            .test("len", "Lämna tomt eller ange ett nummer (3-5 siffror)", (val) => {
                if (val === undefined || val === null) {
                    return true;
                }
                return val >= 100 && val < 100000;
            }),
        selectedDate: date().nullable()
    })
);

// Create a form context
const { handleSubmit, resetForm } = useForm({
    validationSchema: toTypedSchema(schema) // Convert the schema to a type-safe object
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
        reject: () => {}
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
        reject: () => {}
    });
};

// Log values and errors if validation fails
function onInvalidSubmit({
    values,
    errors,
    results
}: {
    values: object;
    errors: object;
    results: object;
}) {
    toast.add({
        severity: "error",
        summary: "Valideringsfel",
        detail: "Se konsolen för mer information",
        life: 3000
    });
    console.log(values); // current form values
    console.log(errors); // a map of field names and their first error message
    console.log(results); // a detailed map of field names and their validation results
}

// Use handleSumbit to let vee-validate call the appropriate callback
const submitUpdate = handleSubmit(onUpdateTicket, onInvalidSubmit);

// Attempt to update the selected ticket
async function onUpdateTicket(values: {
    selectedCode: TicketCode | null;
    selectedNumber: number | null;
    selectedDate: Date | null;
}) {
    const request: TicketUpdateDto = {
        id: props.selectedTicket.id,
        code: values.selectedCode ? values.selectedCode.Code : undefined,
        trainnumber: values.selectedNumber ? values.selectedNumber.toString() : undefined,
        traindate: values.selectedDate ? values.selectedDate : undefined
    };

    addLoading.value = true;
    const result = await TrainService.updateTicket(request);
    addLoading.value = false;

    if (result.ok) {
        socket.emit("update", result.data.id);
        toast.add({
            severity: "success",
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
    const request = {
        id: props.selectedTicket.id
    };

    addLoading.value = true;
    const result = await TrainService.deleteTicket(request);
    addLoading.value = false;

    if (result.ok) {
        socket.emit("delete", result.data.id);
        toast.add({
            severity: "success",
            summary: "Ärende borttaget",
            detail: result.data.id,
            life: 3000
        });
        resetForm();
    } else {
        toast.add({
            severity: "error",
            summary: "Ett fel uppstod",
            detail: result.error,
            life: 3000
        });
    }
}

const props = defineProps<{
    selectedTicket: Ticket;
    ticketCodes: TicketCode[];
}>();
</script>

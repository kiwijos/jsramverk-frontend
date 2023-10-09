import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import Button from "primevue/button";
import Password from "primevue/password";
import InputText from "primevue/inputtext";
import TabMenu from "primevue/tabmenu";
import Divider from "primevue/divider";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import MapComponent from "./components/MapComponent.vue";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import Calendar from "primevue/calendar";
import InputNumber from "primevue/inputnumber";
import Toast from "primevue/toast";
import Card from "primevue/card";
import ConfirmDialog from "primevue/confirmdialog";

createApp(App)
    .use(PrimeVue)
    .use(router)
    .use(ToastService)
    .use(ConfirmationService)
    .component("Button", Button)
    .component("Password", Password)
    .component("InputText", InputText)
    .component("TabMenu", TabMenu)
    .component("Divider", Divider)
    .component("DataTable", DataTable)
    .component("Column", Column)
    .component("MapComponent", MapComponent)
    .component("Dialog", Dialog)
    .component("ConfirmDialog", ConfirmDialog)
    .component("Dropdown", Dropdown)
    .component("Calendar", Calendar)
    .component("InputNumber", InputNumber)
    .component("Toast", Toast)
    .component("Card", Card)
    .mount("#app");

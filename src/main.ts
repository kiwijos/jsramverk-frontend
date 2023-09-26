import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";
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

createApp(App)
    .use(PrimeVue)
    .use(router)
    .component("Button", Button)
    .component("Password", Password)
    .component("InputText", InputText)
    .component("TabMenu", TabMenu)
    .component("Divider", Divider)
    .component("DataTable", DataTable)
    .component("Column", Column)
    .component("MapComponent", MapComponent)
    .component("Dialog", Dialog)
    .component("Dropdown", Dropdown)
    .mount("#app");

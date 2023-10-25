import { expect, test } from "vitest";
import DelayedComponent from "../../components/DelayedComponent.vue";
import { mount } from "@vue/test-utils";

test.skip("DelayedComponent", async () => {
    const wrapper = await mount(DelayedComponent, {
        global: {
            components: {
                Divider: { template: "<div></div>" },
                Column: { template: "<div></div>" },
                Button: { template: "<div></div>" },
                DataTable: { template: "<div></div>" },
                MapComponent: { template: "<div></div>" },
                Dropdown: { template: "<div></div>" },
                Dialog: { template: "<div></div>" }
            }
        }
    });
    expect(wrapper.html()).toContain("Försenade tåg");
});

<template>
    <div class="map-wrap">
        <div class="map" ref="mapContainer"></div>
    </div>
</template>

<script lang="ts">
import type { Train } from "@/models/Train.model";
import * as Libre from "maplibre-gl";
import { shallowRef, onMounted, onUnmounted, markRaw, type Raw, type PropType, ref } from "vue";
import { io } from "socket.io-client";
import { stringifyQuery } from "vue-router";
const trainMarkers = ref(new Map<string, Libre.Marker>());

export default {
    name: "MapComponent",
    setup() {
        const mapContainer = shallowRef<string | HTMLElement | null>(null);
        const map = shallowRef<Raw<Libre.Map> | null>(null);
        onMounted(() => {
            const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

            const initialState = { lng: 15.704, lat: 58.553, zoom: 5 };

            map.value = markRaw(
                new Libre.Map({
                    container: mapContainer.value as HTMLElement | string,
                    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
                    center: [initialState.lng, initialState.lat],
                    zoom: initialState.zoom
                })
            );
            openSocket();
        });
        onUnmounted(() => {
            map.value?.remove();
        });

        return {
            map,
            mapContainer
        };

        function openSocket() {
            const socket = io(import.meta.env.VITE_API_URL);
            socket.on("message", (data: Train) => {
                // add and update train markers
                const train = trainMarkers.value.get(data.trainnumber);
                if (train) {
                    train.setLngLat([data.position[1], data.position[0]]);
                } else {
                    const marker = new Libre.Marker({ color: "red" })
                        .setLngLat([data.position[1], data.position[0]])
                        .setPopup(
                            new Libre.Popup({ offset: 25 }) // add popups
                                .setHTML(
                                    `
                                    <h3>Tåg: ${data.trainnumber}</h3>
                                    <p>${data.speed ?? 0} km/h</p>
                                    <p>
                                    ${data.position[0].toFixed(4)}, ${data.position[1].toFixed(4)}
                                    </p>
                                    `
                                )
                        )
                        .addTo(map.value as Libre.Map);
                    trainMarkers.value.set(data.trainnumber, marker);
                }
            });
        }
    }
};
</script>

<style scoped>
.map-wrap {
    position: relative;
    width: 100%;
    height: calc(100vh - 200px); /* calculate height of the screen minus the heading */
}

.map {
    position: absolute;
    width: 100%;
    height: 100%;
}

.watermark {
    position: absolute;
    left: 10px;
    bottom: 10px;
    z-index: 999;
}
</style>

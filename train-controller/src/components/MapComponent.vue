<template>
    <div class="map-wrap">
        <div class="map" ref="mapContainer"></div>
    </div>
</template>

<script lang="ts">
import type { Train } from "@/models/Train.model";
import { Map, Marker, NavigationControl, Popup } from "maplibre-gl";
import { shallowRef, onMounted, onUnmounted, markRaw, type Raw, type PropType, ref } from "vue";
import { io } from "socket.io-client";
import { stringifyQuery } from "vue-router";

interface TrainMarker {
    trainnumber: string;
    marker: Marker;
}

const trainMarkers = ref<TrainMarker[]>([]);

export default {
    name: "MapComponent",
    props: ["markers"],
    setup(props) {
        const mapContainer = shallowRef<string | HTMLElement | null>(null);
        const map = shallowRef<Raw<Map> | null>(null);
        onMounted(() => {
            const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

            const initialState = { lng: 15.704, lat: 58.553, zoom: 5 };

            map.value = markRaw(
                new Map({
                    container: mapContainer.value as HTMLElement | string,
                    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
                    center: [initialState.lng, initialState.lat],
                    zoom: initialState.zoom
                })
            );
            const socket = io(import.meta.env.VITE_API_URL);

            socket.on("message", (data: Train) => {
                // add and update train markers
                const train = trainMarkers.value.find((t) => t.trainnumber === data.trainnumber);
                if (train) {
                    train.marker.setLngLat([data.position[1], data.position[0]]);
                } else {
                    const marker = new Marker({ color: "red" })
                        .setLngLat(data.position)
                        .setPopup(
                            new Popup({ offset: 25 }) // add popups
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
                        .addTo(map.value as Map);
                    trainMarkers.value.push({ trainnumber: data.trainnumber, marker: marker });
                }
            });
        });
        onUnmounted(() => {
            map.value?.remove();
        });

        return {
            map,
            mapContainer
        };
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

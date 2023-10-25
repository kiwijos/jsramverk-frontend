<template>
    <div class="map-wrap">
        <div class="map" ref="mapContainer"></div>
    </div>
</template>

<script setup lang="ts">
import type { Train } from "@/models/Train.model";
import * as Libre from "maplibre-gl";
import { shallowRef, onMounted, onUnmounted, markRaw, watch, type Raw, ref } from "vue";
import { socket } from "@/socket";

import type { TrainRoute } from "@/models/TrainRoute.model";

const props = defineProps<{
    route?: TrainRoute | null;
}>();

watch(
    () => props.route,
    (newRoute, oldRoute) => {
        // This should not happen as we are setting the route object to null on consecutive clicks,
        // but if it does, we don't want to do anything
        if (newRoute?.OperationalTrainNumber === oldRoute?.OperationalTrainNumber) {
            return;
        }

        if (newRoute === null || newRoute === undefined) {
            // loop through all markers and unhide them
            trainMarkers.value.forEach((marker) => {
                marker.removeClassName("hidden");
            });
        } else {
            // loop through all markers and hide them
            // except the one that matches the selected route id
            trainMarkers.value.forEach((marker, key) => {
                if (key === newRoute.OperationalTrainNumber) {
                    marker.removeClassName("hidden");
                } else {
                    // close popup if open
                    if (marker.getPopup()?.isOpen()) {
                        marker.getPopup()?.remove();
                    }
                    marker.addClassName("hidden");
                }
            });

            // draw the route
            // loop thorugh the route object and extract the lat and lng from both the origin and destination and via stations
            const latLng: any = [];
            latLng.push([newRoute.FromStation?.Longitude, newRoute.FromStation?.Latitude]);
            newRoute.ViaStations?.forEach((station) => {
                latLng.push([station.Longitude, station.Latitude]);
            });
            latLng.push([newRoute.ToStation?.Longitude, newRoute.ToStation?.Latitude]);

            drawGeoJsonLine(latLng);
            drawGeoJsonPoints(newRoute);
        }
    }
);

const emit = defineEmits<{
    (e: "openedPopup", value: string): void;
}>();

function openedPopup(value: string) {
    emit("openedPopup", value);
}

const trainMarkers = ref(new Map<string, Libre.Marker>());

const mapContainer = shallowRef<string | HTMLElement | null>(null);
const map = shallowRef<Raw<Libre.Map> | null>(null);

const drawGeoJsonLine = (latLng: []) => {
    map.value?.addSource("route", {
        type: "geojson",
        data: {
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: latLng
            }
        }
    });
    map.value?.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
            "line-join": "round",
            "line-cap": "round"
        },
        paint: {
            "line-color": "red",
            "line-width": 4
        }
    });
};

const drawGeoJsonPoints = (route: TrainRoute) => {
    const features = [];
    // for each station in the route, create a feature

    features.push({
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [route.FromStation?.Longitude, route.FromStation?.Latitude]
        },
        properties: { name: route.FromStation?.AdvertisedLocationName }
    });

    route.ViaStations?.forEach((station) => {
        features.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [station.Longitude, station.Latitude]
            },
            properties: { name: station.AdvertisedLocationName }
        });
    });

    features.push({
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [route.ToStation?.Longitude, route.ToStation?.Latitude]
        },
        properties: { name: route.ToStation?.AdvertisedLocationName }
    });

    map.value?.addSource("stations", {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: features
        }
    });

    map.value?.addLayer({
        id: "stations",
        type: "symbol",
        source: "stations",
        layout: {
            // get the name from the source's "name" property
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 1.25],
            "text-anchor": "top"
        }
    });
};

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

function openSocket() {
    socket.on("message", (data: Train) => {
        // add and openedPopup train markers
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
                        .on("open", () => {
                            openedPopup(data.trainnumber);
                        })
                )
                .addTo(map.value as Libre.Map);

            if (props.route === null || props.route === undefined) {
                marker.removeClassName("hidden");
            } else {
                if (data.trainnumber === props.route.OperationalTrainNumber) {
                    marker.removeClassName("hidden");
                } else {
                    marker.addClassName("hidden");
                }
            }

            trainMarkers.value.set(data.trainnumber, marker);
        }
    });
}
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

.hidden {
    opacity: 0;
}
</style>

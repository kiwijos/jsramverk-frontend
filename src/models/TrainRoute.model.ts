import type { TrainStation } from "./TrainStation.model";

export interface TrainRoute {
    id: string;
    fromStation: TrainStation | null;
    toStation: TrainStation | null;
    viaStations: TrainStation[];
}

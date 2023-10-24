import type { TrainStation } from "./TrainStation.model";

export interface TrainRoute {
    id: string;
    fromStation: TrainStation;
    toStation: TrainStation;
    viaStations: TrainStation[];
}

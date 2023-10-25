import type { TrainStation } from "./TrainStation.model";

export interface TrainRoute {
    OperationalTrainNumber: string;
    FromStation: TrainStation | null;
    ToStation: TrainStation | null;
    ViaStations: TrainStation[];
}

import type { TrainDelayWithStationDto } from "./TrainDelayWithStationDto.model";
import type { TrainStation } from "./TrainStation.model";

export interface TrainDelayGroup {
    id: string;
    fromStation: TrainStation;
    toStation: TrainStation;
    data: TrainDelayWithStationDto[];
}

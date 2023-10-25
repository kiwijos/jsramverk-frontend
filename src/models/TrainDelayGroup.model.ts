import type { TrainDelayWithStationDto } from "./TrainDelayWithStationDto.model";
import type { TrainStation } from "./TrainStation.model";

export interface TrainDelayGroup {
    OperationalTrainNumber: string;
    FromStation: TrainStation | null;
    ToStation: TrainStation | null;
    Data: TrainDelayWithStationDto[];
}

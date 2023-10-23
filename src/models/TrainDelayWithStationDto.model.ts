import type { TrainDelay } from "./TrainDelay.model";
import type { TrainStation } from "./TrainStation.model";

export interface TrainDelayWithStationDto extends TrainDelay {
    Station?: TrainStation;
}

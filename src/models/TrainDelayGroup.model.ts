import type { TrainDelayWithStationDto } from "./TrainDelayWithStationDto.model";

export interface TrainDelayGroup {
    id: string;
    data: TrainDelayWithStationDto[];
}

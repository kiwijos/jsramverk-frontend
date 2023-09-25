import type { TrainLocation } from "./TrainLocation.model";
export interface TrainDelay {
    ActivityId: string;
    ActivityType: string;
    AdvertisedTimeAtLocation: Date;
    Canceled: boolean;
    EstimatedTimeAtLocation: string;
    LocationSignature: string;
    OperationalTrainNumber: string;
    TimeAtLocation: string;
    TrainOwner: string;
    FromLocation: TrainLocation[];
    ToLocation: TrainLocation[];
}

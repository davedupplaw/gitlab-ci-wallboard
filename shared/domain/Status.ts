export enum StatusType {
    FAIL = 0,
    WARNING,
    PENDING,
    SUCCESS
}

export class Status {
    constructor(public success: StatusType,
                public message: string) {
    }
}

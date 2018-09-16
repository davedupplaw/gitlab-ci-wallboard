export enum Status {
    FAIL,
    PASS,
    BUILDING,
    UNKNOWN
}

export default class Build {
    public id: string;
    public timeStarted: string;
    public timeStartedFromNow: string;
    public branch: string;
    public status: Status = Status.UNKNOWN;
}

import Commit from './Commit';

export enum Status {
    FAIL = 0,
    BUILDING = 1,
    PASS = 2,
    UNKNOWN = 1000
}

export default class Build {
    public id: string;
    public timeStarted: string;
    public timeStartedFromNow: string;
    public branch: string;
    public status: Status = Status.UNKNOWN;
    public commit: Commit;
}

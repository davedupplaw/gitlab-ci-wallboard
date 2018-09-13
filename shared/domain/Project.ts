import CommitSummary from "./CommitSummary";

export enum Status {
    FAIL,
    PASS,
    BUILDING,
    UNKNOWN
}

export default class Project {
    public id: string;
    public name: string;
    public url: string;
    public description: string;
    public lastUpdate: string;
    public lastCommitBy: string;
    public build: string;
    public branch: string;
    public status: Status = Status.UNKNOWN;
    public commitSummary: CommitSummary;
}
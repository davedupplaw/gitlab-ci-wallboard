import CommitSummary from './CommitSummary';
import Build from './Build';

export default class Project {
    public id: string;
    public name: string;
    public url: string;
    public description: string;
    public lastCommitBy: string;
    public lastBuild: Build;
    public commitSummary: CommitSummary;
}
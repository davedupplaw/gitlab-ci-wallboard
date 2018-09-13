import Project from "../../../shared/domain/Project";
import CommitSummary from "../../../shared/domain/CommitSummary";

export interface SCMClient {
    getProjects() : Promise<Project[]>;
    compileCommitSummaryForProject(id: string) : Promise<CommitSummary>;
}
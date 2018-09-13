import Project from '../../../shared/domain/Project';
import CommitSummary from '../../../shared/domain/CommitSummary';
import Build from '../../../shared/domain/Build';

export interface SCMClient {
    getProjects(): Promise<Project[]>;
    compileCommitSummaryForProject(id: string): Promise<CommitSummary>;

    getLatestBuild(id: string): Promise<Build>;
}

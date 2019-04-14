import Project from '../../../shared/domain/Project';
import CommitSummary from '../../../shared/domain/CommitSummary';
import Build from '../../../shared/domain/Build';

export interface SCMClient {
    getProjects(): Promise<void | Project[]>;
    getLatestBuild(id: string): Promise<void | Build>;
    compileCommitSummaryForProject(id: string): Promise<void | CommitSummary>;
}

import * as express from 'express';
import * as SocketIO from 'socket.io';
import Project from '../../../shared/domain/Project';
import CommitSummary from '../../../shared/domain/CommitSummary';
import Build from '../../../shared/domain/Build';

export interface SCMClient {
    getProjects(): Promise<void | Project[]>;
    getLatestBuild(id: string): Promise<void | Build>;
    compileCommitSummaryForProject(id: string): Promise<void | CommitSummary>;
    augmentApi(app: express.Application, io: SocketIO.Server): void;
    hasProjectHook(id: string): Promise<boolean | number>;
    addProjectHook(id: string): Promise<number>;
    removeProjectHook(projectId: string, hookId: number): void;
    cleanup(): void;

}

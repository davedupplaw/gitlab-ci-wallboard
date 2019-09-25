import * as express from 'express';
import '../util/ArrayUtils';
import ProjectCacheFactory from '../util/ProjectCacheFactory';
import Project from '../../../shared/domain/Project';
import * as SocketIO from 'socket.io';
import {Socket} from 'socket.io';
import {SCMClient} from '../util/SCMClient';
import {GitLabClient} from '../util/GitLabClient';
import Build from '../../../shared/domain/Build';
import {ConfigurationManager} from '../util/ConfigurationManager';
import {Status, StatusType} from '../../../shared/domain/Status';
import CommitSummary from '../../../shared/domain/CommitSummary';

export class SCMController {
    constructor(private io: SocketIO.Server,
                private configurationManager: ConfigurationManager,
                private scmClient: SCMClient = new GitLabClient(configurationManager)) {
    }

    public async register(app: express.Application) {
        this.io.on('connection', async (socket: Socket) => {
            console.log('User connected: ', socket.id);

            const projectTimer = setInterval(() => this.updateProjects(socket),
                this.configurationManager.getConfiguration().scm.pollingConfiguration.projectUpdatePeriod);
            await this.updateProjects(socket);

            const pipelineTimer = setInterval(() => this.updatePipelines(socket),
                this.configurationManager.getConfiguration().scm.pollingConfiguration.buildUpdatePeriod);

            const commitTimer = setInterval(() => this.updateCommits(socket),
                this.configurationManager.getConfiguration().scm.pollingConfiguration.commitSummaryUpdatePeriod);
            await this.updateCommits(socket);

            socket.on('disconnect', () => {
                console.log('User disconnected: ', socket.id);
                clearInterval(projectTimer);
                clearInterval(pipelineTimer);
                clearInterval(commitTimer);
            });
        });
    }

    private async updateProjects(socket: Socket): Promise<void | Project[]>  {
        socket.emit('status', new Status(StatusType.PENDING, 'Updating projects...'));
        const projects: void | Project[] = await this.scmClient.getProjects();
        if (projects) {
            projects.forEach(project => ProjectCacheFactory.getCache().update(project));
            this.updatePipelines(socket);
        }
    }

    private async updatePipelines(socket: Socket): Promise<void> {
        socket.emit('status', new Status(StatusType.PENDING, 'Getting latest build status...'));
        const update = async () => Promise.all(ProjectCacheFactory.getCache().getProjects().map( async project => {
            const latestBuild: void | Build = await this.scmClient.getLatestBuild(project.id);
            if ( latestBuild ) {
                project.lastBuild = latestBuild;
            }
        }));
        await update();

        socket.emit('projects', ProjectCacheFactory.getCache().getProjects());
        socket.emit('status', new Status(StatusType.PENDING, 'Builds up to date'));
    }

    private async updateCommits(socket: Socket): Promise<void> {
        socket.emit('status', new Status(StatusType.PENDING, 'Retrieving commit summary...'));

        const updateCommits = async () => Promise.all(ProjectCacheFactory.getCache().getProjects().map( async project => {
            const commitSummary: void | CommitSummary = await this.scmClient.compileCommitSummaryForProject(project.id);
            if (commitSummary) {
                project.commitSummary = commitSummary;
            }
        }));
        await updateCommits();
        socket.emit('projects', ProjectCacheFactory.getCache().getProjects());
        socket.emit('status', new Status(StatusType.SUCCESS, 'Commits up to date.'));
    }
}

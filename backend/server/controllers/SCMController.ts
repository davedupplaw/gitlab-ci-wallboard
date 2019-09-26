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
import {Logger} from '../util/Logger';

export class SCMController {
    private connectedSockets: Map<string, Socket> = new Map<string, Socket>();

    constructor(private io: SocketIO.Server,
                private configurationManager: ConfigurationManager,
                private scmClient: SCMClient = new GitLabClient(configurationManager),
                private logger: Logger = new Logger()) {
    }

    public async register(app: express.Application) {
        this.io.on('connection', async (socket: Socket) => {
            this.logger.log('User connected: ', socket.id);

            this.connectedSockets.set(socket.id, socket);

            socket.on('disconnect', () => {
                this.logger.log('User disconnected: ', socket.id);
                clearInterval(projectTimer);
                clearInterval(pipelineTimer);
                clearInterval(commitTimer);
                this.connectedSockets.delete(socket.id);
            });
        });

        const projectTimer = setInterval(() => this.updateProjects(),
            this.configurationManager.getConfiguration().scm.pollingConfiguration.projectUpdatePeriod);
        await this.updateProjects();

        const pipelineTimer = setInterval(() => this.updatePipelines(),
            this.configurationManager.getConfiguration().scm.pollingConfiguration.buildUpdatePeriod);
        await this.updatePipelines();

        const commitTimer = setInterval(() => this.updateCommits(),
            this.configurationManager.getConfiguration().scm.pollingConfiguration.commitSummaryUpdatePeriod);
        await this.updateCommits();

        this.scmClient.augmentApi(app, this.io);
    }

    private emit(event, message) {
        this.connectedSockets.forEach((socket) => socket.emit(event, message));
    }

    private async updateProjects(): Promise<void | Project[]> {
        this.logger.log('Updating projects');
        this.emit('status', new Status(StatusType.PENDING, 'Updating projects...'));

        const projects: void | Project[] = await this.scmClient.getProjects();
        if (projects) {
            projects.forEach(project => ProjectCacheFactory.getCache().update(project));
        }
    }

    private delay(timeout, v) {
        return new Promise(function (resolve) {
            setTimeout(resolve.bind(null, v), timeout);
        });
    }

    private async updatePipelines(): Promise<void> {
        this.logger.log('Updating Pipelines');
        this.emit('status', new Status(StatusType.PENDING, 'Getting latest build status...'));
        const update = async () => Promise.all(ProjectCacheFactory.getCache().getProjects().map(async project => {
            const random = this.configurationManager.getConfiguration().scm.pollingConfiguration.randomiseTime;
            const period = this.configurationManager.getConfiguration().scm.pollingConfiguration.buildUpdatePeriod;
            const randomTime = Math.random() * period;
            await this.delay(random ? randomTime : 0, null).then(async () => {
                const latestBuild: void | Build = await this.scmClient.getLatestBuild(project.id);
                if (latestBuild) {
                    project.lastBuild = latestBuild;
                    this.emit('projects', ProjectCacheFactory.getCache().getProjects());
                }
            });
        }));
        await update();

        this.emit('status', new Status(StatusType.PENDING, 'Builds up to date'));
    }

    private async updateCommits(): Promise<void> {
        this.logger.log('Updating Commits');
        this.emit('status', new Status(StatusType.PENDING, 'Retrieving commit summary...'));

        const updateCommits = async () => Promise.all(ProjectCacheFactory.getCache().getProjects().map(async project => {
            const random = this.configurationManager.getConfiguration().scm.pollingConfiguration.randomiseTime;
            const period = this.configurationManager.getConfiguration().scm.pollingConfiguration.commitSummaryUpdatePeriod;
            const randomTime = Math.random() * period;
            await this.delay(random ? randomTime : 0, null).then(async () => {
                if (project.id) {
                    const commitSummary: void | CommitSummary = await this.scmClient.compileCommitSummaryForProject(project.id);
                    if (commitSummary) {
                        project.commitSummary = commitSummary;
                        this.emit('projects', ProjectCacheFactory.getCache().getProjects());
                    }
                }
            });
        }));
        await updateCommits();
        this.emit('status', new Status(StatusType.SUCCESS, 'Commits up to date.'));
    }
}

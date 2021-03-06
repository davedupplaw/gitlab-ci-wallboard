import * as express from 'express';
import * as SocketIO from 'socket.io';
import Axios, {AxiosInstance, AxiosResponse} from 'axios';
import {SCMClient} from './SCMClient';
import Project from '../../../shared/domain/Project';
import CommitSummary from '../../../shared/domain/CommitSummary';
import Build, {Status} from '../../../shared/domain/Build';
import Commit from '../../../shared/domain/Commit';
import {ConfigurationManager} from './ConfigurationManager';
import {Logger} from './Logger';
import Hook from "../../../shared/domain/Hook";

export class GitLabClient implements SCMClient {
    private axios: AxiosInstance;

    constructor(private configuration: ConfigurationManager,
                private logger: Logger = new Logger()) {
        this.checkConfiguration();
        this.createAxiosClient();
    }

    private static throwIfBadResponse(responses: AxiosResponse<any>[] | AxiosResponse<any>) {
        let max: AxiosResponse<any>;
        if (Array.isArray(responses)) {
            max = responses.max(r => r.status);
        } else {
            max = responses;
        }

        if (max.status >= 300) {
            const message = 'Got response ' + max.status + ' from project ' + max.data.name;
            new Logger().log('Max status: ', message);
            throw new Error(message);
        }
    }

    private static gitLabStatusToStatus(status: string): Status {
        switch (status) {
            case 'running':
            case 'pending':
                return Status.BUILDING;
            case 'success':
                return Status.PASS;
            case 'failed':
                return Status.FAIL;
            default:
                return Status.UNKNOWN;
        }
    }

    private createAxiosClient() {
        this.axios = Axios.create({
            baseURL: 'https://' + this.configuration.getConfiguration().scm.gitlab.host + '/api/v4',
            headers: {
                common: {
                    'Private-Token': this.configuration.getConfiguration().scm.gitlab.token
                }
            },
            validateStatus: status => status < 500
        });
    }

    private checkConfiguration() {
        if (this.configuration.getConfiguration().scm.gitlab.whitelist.groups &&
            this.configuration.getConfiguration().scm.gitlab.whitelist.users) {
            throw new Error('group and user filters cannot be set at the same time. ' +
                'Unset either GCIWB_GROUPS or GCIWB_USERS.');
        }
    }

    public async getProjects(): Promise<void | Project[]> {
        const projects = this.configuration.getConfiguration().scm.gitlab.whitelist.projects;
        const groups = this.configuration.getConfiguration().scm.gitlab.whitelist.groups;
        const users = this.configuration.getConfiguration().scm.gitlab.whitelist.users;

        this.logger.log('Getting URLS for:');
        this.logger.log(`  - projects: ${projects}`);
        this.logger.log(`  - groups  : ${groups}`);
        this.logger.log(`  - users   : ${users}`);

        const urls = this.getUrls(users, groups, projects);
        this.logger.log(urls);

        const projectInfosList = await Promise.all(urls.map(projectListUrl => this.getProjectList(projectListUrl)));
        return projectInfosList.flatMap(v => v);
    }

    public async compileCommitSummaryForProject(projectId: string): Promise<CommitSummary> {
        const commits = await this.getCommits(projectId);

        const semanticCounts: CommitSummary = new CommitSummary();
        const allowedValues = ['chore', 'fix', 'docs', 'refactor', 'style', 'localize', 'test', 'feat'];
        const regex = new RegExp('^([^:\s]+)', 'gm');

        allowedValues.forEach(v => semanticCounts[v] = 0);

        for (const commit of commits.data) {
            const message = commit.message;
            const matches = regex.exec(message);

            if (matches && allowedValues.includes(matches[1].trim())) {
                semanticCounts[matches[1].trim()]++;
            }
        }

        return semanticCounts;
    }

    public async getLatestBuild(projectId: string): Promise<void | Build> {
        const url = `/projects/${projectId}/pipelines?order_by=id&sort=desc`;
        const response = await this.axios.get(url);

        if (response.data.length > 0) {
            return this.getPipelineStatus(projectId, response.data[0].id);
        }
    }

    private async getPipelineStatus(projectId: string, pipelineId: string): Promise<void | Build> {
        const url = `/projects/${projectId}/pipelines/${pipelineId}`;
        const response = await this.axios.get(url);

        const build = new Build();
        build.status = GitLabClient.gitLabStatusToStatus(response.data.status);
        build.id = response.data.id;
        build.branch = response.data.ref;
        build.timeStarted = response.data.created_at;
        build.commit = new Commit();
        build.commit.by = response.data.user.name;

        const commitURL = `/projects/${projectId}/repository/commits/master`;
        return this.axios.get(commitURL).then(commitsResponse => {
            build.commit.by = commitsResponse.data.committer_name;
            build.commit.message = commitsResponse.data.message;
            build.commit.hash = commitsResponse.data.short_id;
            return build;
        });
    }

    private async getProjectList(projectListUrl): Promise<Project[]> {
        const result = await this.axios.get(projectListUrl);
        GitLabClient.throwIfBadResponse(result);

        return result.data.map(projectFromGitLab => {
            const project = new Project();
            project.id = projectFromGitLab.id;
            project.name = projectFromGitLab.name;
            project.description = projectFromGitLab.description;
            project.url = projectFromGitLab.web_url;
            return project;
        });
    }

    private getUrls(users: string[], groups: string[], projects: string[]): string[] {
        const params = '?simple=true&per_page=100';
        if (users && users.length > 0) {
            return users.map(user => `/users/${user}/projects${params}`);
        } else if (groups && groups.length > 0) {
            return groups.map(group => `/groups/${group}/projects${params}`);
        } else if (projects && projects.length > 0) {
            return projects.map(project => `/projects/${project}${params}`);
        } else {
            return [`/projects${params}`];
        }
    }

    private getCommits(projectId: string) {
        const url = `/projects/${projectId}/repository/commits?all=yes`;
        return this.axios.get(url);
    }

    public async addProjectHook(projectId: string):  Promise<number> {
        const wallboardUrl = this.configuration.getConfiguration().wallboardUrl;
        const randomToken = `${Math.random()}`;
        const url = `/projects/${projectId}/hooks`;
        const payload = {
            id: projectId,
            url: `${wallboardUrl}/gitlab/hooks/${projectId}`,
            push_events: true,
            pipeline_events: true,
            token: randomToken
        };
        return (await this.axios.post<Hook>(url, payload)).data.id;
    }

    public async hasProjectHook(projectId: string): Promise<boolean | number> {
        const wallboardUrl = this.configuration.getConfiguration().wallboardUrl;
        const url = `/projects/${projectId}/hooks`;
        const hooks = await this.axios.get<any[]>(url);
        const hookUrl = `${wallboardUrl}/gitlab/hooks/${projectId}`;
        return hooks.data.filter(hook => hook.url === hookUrl).map(hook => hook.id as number)[0];
    }

    public async removeProjectHook(projectId: string, hookId: number) {
        const url = `/projects/${projectId}/hooks/${hookId}`;
        await this.axios.delete(url);
    }

    public augmentApi(app: express.Application, io: SocketIO.Server): void {
        if (this.configuration.getConfiguration().scm.useWebHooks) {
            app.use('/gitlab/hooks/{id}', (req, res) => {
                this.logger.log('Received push for ', req.params.id);
            });
        }
    }

    cleanup(): void {
    }
}

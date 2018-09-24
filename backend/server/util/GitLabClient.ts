import StringUtils from './StringUtils';
import Axios, {AxiosInstance, AxiosResponse} from 'axios';
import {SCMClient} from './SCMClient';
import Project from '../../../shared/domain/Project';
import CommitSummary from '../../../shared/domain/CommitSummary';
import Build, {Status} from '../../../shared/domain/Build';
import Commit from '../../../shared/domain/Commit';

export default class GitLabClient implements SCMClient {
    private axios: AxiosInstance;

    private gitlab: string;
    private token: string;
    private projectWhitelistCSV: string;
    private groupWhitelistCSV: string;
    private userWhitelistCSV: string;

    constructor() {
        this.consumeEnvironmentVariables();
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
            console.log('Max status: ', message);
            throw new Error(message);
        }
    }

    private static gitLabStatusToStatus(status: string ): Status {
        switch ( status ) {
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
            baseURL: 'https://' + this.gitlab + '/api/v4',
            headers: {
                common: {
                    'Private-Token': this.token
                }
            },
            validateStatus: status => status < 500
        });
    }

    private checkConfiguration() {
        if ((this.groupWhitelistCSV !== '' && this.userWhitelistCSV !== '')) {
            throw new Error('group and user filters cannot be set at the same time. ' +
                'Unset either GCIWB_GROUPS or GCIWB_USERS.');
        }
    }

    private consumeEnvironmentVariables() {
        this.gitlab = process.env.GITLAB_HOST || 'gitlab.com';
        this.token = process.env.GITLAB_TOKEN;

        this.projectWhitelistCSV = process.env.GCIWB_PROJECTS || '';
        this.groupWhitelistCSV = process.env.GCIWB_GROUPS || '';
        this.userWhitelistCSV = process.env.GCIWB_USERS || '';
    }

    public getProjects(): Promise<Project[]> {
        const projects = StringUtils.parseCSV(this.projectWhitelistCSV);
        const groups = StringUtils.parseCSV(this.groupWhitelistCSV);
        const users = StringUtils.parseCSV(this.userWhitelistCSV);

        console.log('Getting URLS for:');
        console.log(`  - projects: ${projects}`);
        console.log(`  - groups  : ${groups}`);
        console.log(`  - users   : ${users}`);

        const urls = this.getUrls(users, groups, projects);
        console.log(urls);

        return Promise.all( urls.map(projectListUrl => this.getProjectList(projectListUrl)) )
            .then(projectInfosList => {
                return projectInfosList.flatMap(v => v);
            })
            .catch(error => {
                console.error(error);
            });
    }

    public compileCommitSummaryForProject(projectId: string): Promise<CommitSummary> {
        return this.getCommits(projectId).then((commits) => {

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
        });
    }

    public getLatestBuild(projectId: string): Promise<Build> {
        const url = `/projects/${projectId}/pipelines?order_by=id&sort=desc`;
        return this.axios.get(url)
            .then(response => {
                if ( response.data.length > 0 ) {
                    return this.getPipelineStatus(projectId, response.data[0].id);
                }
            })
            .catch((error) => console.log(error) );
    }

    private getPipelineStatus(projectId: string, pipelineId: string): Promise<Build> {
        const url = `/projects/${projectId}/pipelines/${pipelineId}`;
        return this.axios.get(url)
            .then(response => {
                const build = new Build();
                build.status = GitLabClient.gitLabStatusToStatus( response.data.status );
                build.id = response.data.id;
                build.branch = response.data.ref;
                build.timeStarted = response.data.created_at;
                build.commit = new Commit();
                build.commit.by = response.data.user.name;
                return build;
            }).then( build => {
                const commitURL = `/projects/${projectId}/repository/commits/master`;
                return this.axios.get( commitURL ).then( response => {
                    build.commit.by = response.data.committer_name;
                    build.commit.message = response.data.message;
                    build.commit.hash = response.data.short_id;
                    return build;
                });
            })
            .catch(() => console.error(`Are you sure ${projectId} and ${pipelineId} exist? I could not find it. That is a 404.`));
    }

    private getProjectList(projectListUrl): Promise<Project[]> {
        return this.axios.get(projectListUrl).then(result => {
            GitLabClient.throwIfBadResponse(result);

            return result.data.map(projectFromGitLab => {
                const project = new Project();
                project.id = projectFromGitLab.id;
                project.name = projectFromGitLab.name;
                project.description = projectFromGitLab.description;
                project.url = projectFromGitLab.web_url;
                return project;
            });

        }).catch(err => {
            console.log(err);
            console.log(`Error retrieving ${projectListUrl}`);
        });
    }

    private getUrls(users: string[], groups: string[], projects: string[]) {
        const params = '?simple=true&per_page=100';
        if (users.length > 0) {
            return users.map(user => `/users/${user}/projects${params}`);
        } else if (groups.length > 0) {
            return groups.map(group => `/groups/${group}/projects${params}`);
        } else if (projects.length > 0) {
            return projects.map(project => `/projects/${project}${params}`);
        } else {
            return [`/projects${params}`];
        }
    }

    private getCommits(projectId: string) {
        const url = `/projects/${projectId}/repository/commits?all=yes`;
        console.log(url);
        return this.axios.get(url);
    }
}

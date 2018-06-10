import * as express from 'express';
import Axios, {AxiosInstance, AxiosResponse} from 'axios';
import StringUtils from '../util/StringUtils';
import '../util/ArrayUtils';

export default class GitLabController {
    private axios: AxiosInstance;
    private gitlab: string;
    private token: string;
    private projectWhitelistCSV: string;
    private groupWhitelistCSV: string;
    private userWhitelistCSV: string;

    public static register(app: express.Application) {
        const gitLabController = new GitLabController();
        const router = express.Router();
        router.get('/projects', (req, res) => gitLabController.projects(req, res));
        router.get('/projects/:projectId/pipelines', (req, res) => gitLabController.projectPipelines(req, res));
        router.get('/projects/:projectId/pipelines/:pipelineId', (req, res) => gitLabController.pipeline(req, res));
        router.get('/projects/:projectId/commits', (req, res) => gitLabController.commits(req, res));
        router.get('/projects/:projectId/commitSummary', (req, res) => gitLabController.commitSummary(req, res));
        router.get('/commitSummary', (res, req) => gitLabController.commitSummary(res, req));
        app.use('/gitlab', router);
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

    constructor() {
        this.gitlab = process.env.GITLAB_HOST || 'gitlab.com';
        this.token = process.env.GITLAB_TOKEN;

        this.projectWhitelistCSV = process.env.GCIWB_PROJECTS || '';
        this.groupWhitelistCSV = process.env.GCIWB_GROUPS || '';
        this.userWhitelistCSV = process.env.GCIWB_USERS || '';

        if ((this.groupWhitelistCSV !== '' && this.userWhitelistCSV !== '')) {
            throw new Error('group and user filters cannot be set at the same time. ' +
                'Unset either GCIWB_GROUPS or GCIWB_USERS.');
        }

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

    public projects(req: express.Request, res: express.Response) {
        const projects = StringUtils.parseCSV(this.projectWhitelistCSV);
        const groups = StringUtils.parseCSV(this.groupWhitelistCSV);
        const users = StringUtils.parseCSV(this.userWhitelistCSV);

        const urls = this.getUrls(users, groups, projects);

        return Promise.all(urls.map(projectListUrl => this.getProjectList(projectListUrl)))
            .then(projectInfosList => {
                const projectInfos: any[] = projectInfosList.flatMap(v => v);
                console.log(`Retrieved ${projectInfos.length} projects`);

                Promise.all(projectInfos.map(projectInfo =>
                    this.commitSummaryForProject(projectInfo.id).then(summary => {
                        projectInfo.commitSummary = summary;
                        return projectInfo;
                    })))
                    .then(infos => {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(infos));
                    });
            })
            .catch(error => {
                res.status(500);
                res.send(error.toString());
            });
    }

    private getProjectList(projectListUrl): Promise<any> {
        return this.axios.get(projectListUrl).then(result => {
            GitLabController.throwIfBadResponse(result);
            return result.data;
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

    private projectPipelines(req: express.Request, res: express.Response): Promise<any> {
        const projectId = req.params.projectId;
        const url = `/projects/${projectId}/pipelines`;
        return this.axios.get(url)
            .then(response => {
                res.send(response.data);
            })
            .catch(() => res.send(`Are you sure ${projectId} exists? I could not find it. That is a 404.`));
    }

    private pipeline(req: express.Request, res: express.Response): Promise<any> {
        const projectId = req.params.projectId;
        const pipelineId = req.params.pipelineId;
        const url = `/projects/${projectId}/pipelines/${pipelineId}`;
        return this.axios.get(url)
            .then(response => {
                res.send(response.data);
            })
            .catch(() => res.send(`Are you sure ${projectId} and ${pipelineId} exist? I could not find it. That is a 404.`));
    }

    private commits(req: express.Request, res: express.Response): Promise<any> {
        const projectId = req.params.projectId;
        return this.getCommits(projectId).then((commits) => res.send(commits.data))
            .catch((err) => res.send(`Are you sure ${projectId} exists? I could not find it. That is a 404.`));
    }

    private getCommits(projectId: string) {
        const url = `/projects/${projectId}/repository/commits?all=yes`;
        return this.axios.get(url);
    }

    private commitSummary(req: express.Request, res: express.Response) {
        const projectId = req.params.projectId;
        return this.commitSummaryForProject(projectId).then(summary => res.send(summary))
            .catch(() => res.send(`Are you sure ${projectId} exists? I could not find it. That is a 404.`));
    }

    private commitSummaryForProject(projectId: string) {
        const semanticCounts = {};
        return this.getCommits(projectId).then((commits) => {
            const allowedValues = ['chore', 'fix', 'docs', 'refactor', 'style', 'localize', 'test', 'feat'];
            const regex = new RegExp('^(.*):');

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
}

import * as express from 'express';
import Axios, {AxiosInstance} from 'axios';
import StringUtils from '../util/StringUtils';
import '../util/flatMap.fn';

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
        app.use('/gitlab', router);
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

        return Promise.all(urls.map(projectUrl => this.axios.get(projectUrl)))
            .then(responses => {
                const projectInfos = responses.flatMap(v => v.data);

                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(projectInfos));
            });
    }

    private getUrls(users: string[], groups: string[], projects: string[]) {
        const params = '?simple=true';
        if (users.length > 0) {
            return users.map(user => `/users/${user}/projects${params}`);
        } else if (groups.length > 0) {
            return groups.map(group => `/groups/${group}/projects${params}`);
        } else if (projects.length > 0) {
            return projects.map(project => `/projects/${project}`);
        } else {
            return ['/projects'];
        }
    }

    private projectPipelines(req: express.Request, res: express.Response) {
        const projectId = req.params.projectId;
        const url = `/projects/${projectId}/pipelines`;
        return this.axios.get(url)
            .then(response => {
                res.send(response.data);
            })
            .catch(_ => res.send(`Are you sure ${projectId} exists? I could not find it. That is a 404.`));
    }

    private pipeline(req: express.Request, res: express.Response) {
        const projectId = req.params.projectId;
        const pipelineId = req.params.pipelineId;
        const url = `/projects/${projectId}/pipelines/${pipelineId}`;
        return this.axios.get(url)
            .then(response => {
                res.send(response.data);
            })
            .catch(_ => res.send(`Are you sure ${projectId} and ${pipelineId} exist? I could not find it. That is a 404.`));
    }
}

import {Router, Request, Response} from 'express';
import Axios, {AxiosInstance} from 'axios';

export default class GitLabController {
    private axios: AxiosInstance;
    private gitlab: string;
    private token: string;

    public static register(router: Router) {
        const gitLabController = new GitLabController();
        router.get('/gitlab/projects', (req, res) => gitLabController.projects(req, res));
        router.get('/gitlab/projects/:projectId/pipelines', (req, res) => gitLabController.projectPipelines(req, res));
        router.get('/gitlab/projects/:projectId/pipelines/:pipelineId', (req, res) => gitLabController.pipeline(req, res));
    }

    constructor() {
        this.gitlab = process.env.GITLAB_HOST || 'gitlab.com';
        this.token  = process.env.GITLAB_TOKEN;
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

    public projects(req: Request, res: Response) {
        const url = '/users/davedupplaw/projects';
        return this.axios.get(url).then(response => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response.data));
        });
    }

    private projectPipelines(req: Request, res: Response) {
        const projectId = req.params.projectId;
        const url = `/projects/${projectId}/pipelines`;
        return this.axios.get(url)
            .then(response => {
                res.send(response.data);
            })
            .catch(_ => res.send(`Are you sure ${projectId} exists? I could not find it. That is a 404.`));
    }

    private pipeline(req: Request, res: Response) {
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

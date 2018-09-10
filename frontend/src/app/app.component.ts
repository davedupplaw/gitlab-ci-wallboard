import {Component, OnInit} from '@angular/core';
import * as moment from 'moment';
import Axios, {AxiosResponse} from 'axios';
import CommitSummary from './CommitSummary';
import {FrontendConfig} from '../../../shared/FrontendConfig';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public builds: any[];

  public loading = false;
  public invalidConfig = false;
  public errorMessage: string;
  public feConfig: FrontendConfig = {};

  private gitlab: string;
  private token: string;

  private param_ref: string;
  private param_projects: string;

  private projects: any[] = [];
  private failedProjects: any[] = [];
  private buildMap: Map<number, any> = new Map();
  private commitSummary: CommitSummary = new CommitSummary();

  private okTitle = 'GitLab Builds';
  private failTitle = 'FAILED BUILD';

  private axios: any;
  private favicon: HTMLLinkElement;
  private titleTimer: number;

  constructor() {
  }

  static getParam(name: string): string {
    const results = new RegExp('[\\?&]' as string + name + '=([^&#]*)').exec(window.location.href);

    if (!results) {
      return null;
    }

    return results[1] || null;
  }

  static configValid() {
    return true; // this.gitlab && this.token && this.param_projects;
  }

  getBuilds() {
    return this.builds;
  }

  ngOnInit(): void {
    this.gitlab = AppComponent.getParam('gitlab');
    this.token = AppComponent.getParam('token');
    this.param_projects = 'davedupplaw/group-bells'; // this.getParam('projects');
    this.param_ref = AppComponent.getParam('ref');
    this.favicon = document.querySelector('#favicon');

    this.update();

    if (!AppComponent.configValid()) {
      this.invalidConfig = true;
      return;
    }

    this.setupDefaults();
    this.fetchProjects();

    const self = this;
    setInterval(function () {
      self.updateBuilds();
    }, 60000);
  }

  updateConfig() {
    this.axios.get('/config/frontend').then( (config: AxiosResponse<FrontendConfig>) => {
      this.feConfig = config.data;
    });
  }

  update() {
    if (!this.param_projects) {
      this.errorMessage = 'No projects supplied.';
      return;
    }

    const projectNames = this.param_projects.split(',');
    for (const projectName of projectNames) {
      try {
        const projectParts = projectName.split('/');
        const namespace = projectParts[0].trim();
        const project = projectParts[1].trim();
        const nameWithNamespace = namespace + '/' + project;
        let branch = 'master';

        if (projectParts.length > 2) {
          branch = projectParts[2].trim();
        }

        const projectInfo = {
          nameWithNamespace: nameWithNamespace,
          projectName: project,
          branch: branch
        };
        this.projects.push(projectInfo);
      } catch (err) {
        this.errorMessage = err;
      }
    }
  }

  setupDefaults() {
    this.axios = Axios.create({
      baseURL: `${window.location.protocol}//${window.location.host}`,
      validateStatus: status => status < 500
    });

    this.updateConfig();  // async
  }

  fetchProjects() {
    this.loading = true;

    const url = '/gitlab/projects';
    this.axios.get(url)
      .then(projectsResponse => {
        projectsResponse.data.forEach(project => this.commitSummary = this.commitSummary.add(project.commitSummary));
        return Promise.all(projectsResponse.data.map(project => this.fetchPipelines(project)))
          .then((responses) => {
            this.loading = false;

            const filteredResponses = responses.filter(r => typeof r === 'object');

            const hasFailedBuild = filteredResponses.some((r: any) => r.status === 'failed');

            if (hasFailedBuild) {
              this.titleTimer = window.setInterval(() => {
                const showingFailure = document.title.startsWith(this.failTitle);
                document.title = showingFailure ? this.okTitle : this.failTitle;
                this.favicon.href = showingFailure ? '/favicon-alert.ico' : '/favicon.ico';
              }, 1000);
            } else if (this.titleTimer) {
              clearInterval(this.titleTimer);
              document.title = this.okTitle;
              this.favicon.href = '/favicon.ico';
            }
          });
      }).catch(error => {
        console.error(error);
        this.loading = false;
        this.errorMessage = 'Error retrieving projects. Check your token and your GitLab host configuration.';
    });
  }

  updateBuilds() {
    this.projects.forEach(project => this.fetchPipelines(project));
  }

  fetchPipelines(project) {
    if (project && project.id) {
      return this.axios.get(`/gitlab/projects/${project.id}/pipelines`)
        .then(pipelineResponse => this.getLastPipelineInformation(pipelineResponse, project))
        .catch(() => this.failedProjects.push(project));
    }
  }

  private getLastPipelineInformation(allPipelinesResponse, project) {
    if (allPipelinesResponse.data && project.id) {
      const lastPipelineId = allPipelinesResponse.data[0].id;
      const url = `/gitlab/projects/${project.id}/pipelines/${lastPipelineId}`;
      console.log(url);
      return this.axios.get(url)
        .then(pipelineResponse => this.storeBuildInformation(pipelineResponse.data, project))
        .catch(() => console.log(`Project ${project.name} does not have any build informamtion`));
    }
  }

  private storeBuildInformation(pipelineResponse, project) {
    if (pipelineResponse) {
      const startedFromNow = moment(pipelineResponse.started_at).fromNow();

      this.buildMap.set(project.id, {
        project: project.name,
        id: pipelineResponse.id,
        status: pipelineResponse.status,
        started_at: startedFromNow,
        started: pipelineResponse.started_at,
        author: pipelineResponse.user.name,
        project_path: project.path_with_namespace,
        branch: pipelineResponse.ref
      });

      this.builds = Array.from(this.buildMap.values()).sort((a, b) => {
        if (a.status === 'success' && b.status === 'failed') {
          return 1;
        } else if (a.status === 'failed' && b.status === 'success') {
          return -1;
        } else {
          return a.project.localeCompare(b.project);
        }
      });

      return pipelineResponse;
    }
  }
}

import {Component, OnInit} from '@angular/core';
import * as moment from 'moment';
import Axios from 'axios';

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

  private gitlab: string;
  private token: string;

  private param_ref: string;
  private param_projects: string;

  private projects: any[] = [];
  private failedProjects: any[] = [];
  private buildMap: Map<number, any> = new Map();

  private axios: any;

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
      baseURL: 'http://localhost:3000/gitlab',
      validateStatus: status => status < 500
    });
  }

  fetchProjects() {
    this.loading = true;

    const url = '/projects';
    this.axios.get(url).then(projectResponse =>
      Promise.all(projectResponse.data.map(project => this.fetchPipelines(project) ))
        .then(() => this.loading = false)
    ).catch( error => {
      this.loading = false;
      this.errorMessage = 'Error retrieving projects. Check your token and your GitLab host configuration.';
    });
  }

  updateBuilds() {
    this.projects.forEach(project => this.fetchPipelines(project));
  }

  fetchPipelines(project) {
    if (project && project.id) {
      return this.axios.get(`/projects/${project.id}/pipelines`)
        .then(pipelineResponse => this.getLastPipelineInformation(pipelineResponse, project))
        .catch(() => this.failedProjects.push(project));
    }
  }

  private getLastPipelineInformation(allPipelinesResponse, project) {
    if (allPipelinesResponse.data && project.id) {
      const lastPipelineId = allPipelinesResponse.data[0].id;
      const url = `/projects/${project.id}/pipelines/${lastPipelineId}`;
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
    }
  }
}

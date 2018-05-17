import {Component, OnInit} from '@angular/core';
import * as moment from 'moment';
import Axios from 'axios';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public builds: Map<number, any> = new Map();

  public loading = false;
  public invalidConfig = false;
  public errorMessage: string;

  private gitlab: string;
  private token: string;

  private param_ref: string;
  private param_projects: string;

  private projects: any[] = [];
  private failedProjects: any[] = [];

  private axios: any;

  constructor() {
  }

  getBuilds() {
    return Array.from(this.builds.values());
  }

  ngOnInit(): void {
    this.gitlab = this.getParam('gitlab');
    this.token = this.getParam('token');
    this.param_projects = this.getParam('projects');
    this.param_ref = this.getParam('ref');

    this.update();

    if (!this.configValid()) {
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

  getParam(name: string): string {
    const results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);

    if (!results) {
      return null;
    }

    return results[1] || null;
  }

  update() {
    if (!this.param_projects) {
      this.errorMessage = 'No projects supplied.';
      return;
    }

    const projectNames = this.param_projects.split(',');
    console.log(projectNames);

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

        console.log(projectInfo);
      } catch (err) {
        this.errorMessage = err;
      }
    }
  }

  configValid() {
    return this.gitlab && this.token && this.param_projects;
  }

  setupDefaults() {
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

  fetchProjects() {
    this.loading = true;
    Promise.all(
      this.projects.map(project => {
        const url = '/projects/' + project.nameWithNamespace.replace('/', '%2F');
        console.log( url );
        return this.axios.get(url)
          .then(response => {
              project.data = response.data;
              return this.fetchPipelines(project);
            }
          ).catch( _ => console.log( `Are you sure ${project.name} exists? I could not find it. That is a 404.`));
        })
    ).then(_ => this.loading = false);
  }

  updateBuilds() {
    this.projects.forEach(project => this.fetchPipelines(project));
  }

  fetchPipelines(project) {
    if (project && project.data && project.data.id && project.branch) {
      return this.axios.get(`/projects/${project.data.id}/pipelines`)
        .then(pipelineResponse => this.getLastPipelineInformation(pipelineResponse, project))
        .catch(err => this.failedProjects.push(project));
    }
  }

  private getLastPipelineInformation(allPipelinesResponse, project) {
    if (allPipelinesResponse.data && project.data && project.data.id) {
      const lastPipelineId = allPipelinesResponse.data[0].id;
      const url = `/projects/${project.data.id}/pipelines/${lastPipelineId}`;
      console.log( url );
      return this.axios.get(url)
        .then(pipelineResponse => this.storeBuildInformation(pipelineResponse, project))
        .catch(err => console.log(`Project ${project.data.name} does not have any build informamtion`));
    }
  }

  private storeBuildInformation(pipelineResponse, project) {
    if (pipelineResponse) {
      const startedFromNow = moment(pipelineResponse.data.started_at).fromNow();

      this.builds.set(project.data.id, {
        project: project.projectName,
        id: pipelineResponse.data.id,
        status: pipelineResponse.data.status,
        started_at: startedFromNow,
        author: pipelineResponse.data.user.name,
        project_path: project.data.path_with_namespace,
        branch: project.branch
      });
    }
  }
}

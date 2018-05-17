import {Component, OnInit} from '@angular/core';
import * as moment from 'moment';
import Axios from 'axios';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public builds: any[];

  public loading: boolean = false;
  public invalidConfig: boolean = false;
  public errorMessage: string;

  private gitlab: string;
  private token: string;

  private param_ref: string;
  private param_projects: string;

  private projects: any[] = [];

  private axios: any;

  constructor() {
  }

  ngOnInit(): void {
    this.gitlab         = this.getParam('gitlab');
    this.token          = this.getParam('token');
    this.param_projects = this.getParam('projects');
    this.param_ref      = this.getParam('ref');

    this.update();

    if (!this.configValid()) {
      this.invalidConfig = true;
      return;
    }

    this.setupDefaults();
    this.fetchProjects();

    const self = this;
    setInterval(function(){
      self.fetchBuilds()
    }, 60000)
  }

  getParam( name: string ): string {
    const results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);

    if(!results){
      return null;
    }

    return results[1] || null;
  }

  update() {
    const projectNames = this.param_projects.split(",");
    console.log( projectNames );

    for (let project in projectNames) {
      try {
        const projectParts = projectNames[project].split('/');
        const namespace = projectParts[0].trim();
        const projectName = projectParts[1].trim();
        const nameWithNamespace = namespace + "/" + projectName;
        let branch = "master";

        if (projectParts.length > 2) {
          branch = projectParts[2].trim()
        }

        let projectInfo = {
          nameWithNamespace: nameWithNamespace,
          projectName: projectName,
          branch: branch
        };
        this.projects.push(projectInfo);

        console.log( projectInfo );
      }
      catch(err) {
        this.errorMessage = err; //"Wrong format";
      }
    }
  }

  configValid() {
    return this.gitlab && this.token && this.param_projects;
  }

  setupDefaults() {
    this.axios = Axios.create({
      baseURL: "https://" + this.gitlab + "/api/v4",
      headers: {
        common: {
          'PRIVATE-TOKEN': this.token
        }
      }
    });
  }

  fetchProjects() {
    const self = this;

    self.loading = true;
    Promise.all( this.projects.map(project =>
      self.axios.get('/projects/' + project.nameWithNamespace.replace('/', '%2F'))
                .then( response => project.data = response.data )
    )).then( _ => this.fetchBuilds() )
      .catch( err => this.errorMessage = err );
  }

  fetchBuilds() {
    const self = this;
    this.projects.forEach(project => {
      self.axios.get('/projects/' + project.data.id + '/repository/branches/' + project.branch )
        .then(function (response) {
          let lastCommit = response.data.commit.id;
          self.axios.get('/projects/' + project.data.id + '/repository/commits/' + lastCommit + '/builds')
            .then( response => {
              let updated = false;

              const build = self.filterLastBuild(response.data);
              if (!build) {
                return
              }

              let startedFromNow = moment(build.started_at).fromNow();

              self.builds.forEach(b => {
                if (b.project == project.project.projectName && b.branch == project.project.branch) {
                  updated = true;

                  b.id = build.id;
                  b.status = build.status;
                  b.started_at = startedFromNow;
                  b.author = build.commit.author_name;
                  b.project_path = project.data.path_with_namespace;
                  b.branch = project.project.branch;
                }
              });

              if (!updated) {
                self.builds.push({
                  project: project.project.projectName,
                  id: build.id,
                  status: build.status,
                  started_at: startedFromNow,
                  author: build.commit.author_name,
                  project_path: project.data.path_with_namespace,
                  branch: project.project.branch
                })
              }
            })
            .catch(/*onError.bind(self)*/);
        })
        .catch(/*onError.bind(self)*/);
    })
  }

  filterLastBuild(builds) {
    if (!Array.isArray(builds) || builds.length === 0) {
      return
    }
    return builds[0]
  }
}

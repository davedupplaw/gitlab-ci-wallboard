import {Component, OnInit} from '@angular/core';
import Axios, {AxiosResponse} from 'axios';
import {FrontendConfig} from '../../../shared/FrontendConfig';
import Project from '../../../shared/domain/Project';
import {Status} from '../../../shared/domain/Build';
import CommitSummary from '../../../shared/domain/CommitSummary';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public loading = false;
  public invalidConfig = false;
  public errorMessage: string;
  public feConfig: FrontendConfig = {};
  public UNKNOWN = Status.UNKNOWN;

  public projects: Project[] = [];
  public commitSummary: CommitSummary = new CommitSummary();

  private okTitle = 'GitLab Builds';
  private failTitle = 'FAILED BUILD';

  private axios: any;
  private favicon: HTMLLinkElement;
  private titleTimer: number;

  constructor() {
  }

  static configValid() {
    return true; // this.gitlab && this.token && this.param_projects;
  }

  ngOnInit(): void {
    this.favicon = document.querySelector('#favicon');

    if (!AppComponent.configValid()) {
      this.invalidConfig = true;
      return;
    }

    this.setupDefaults();
    this.fetchProjects();

    // Update statuses every 10 seconds
    setInterval( () => this.fetchProjects(), 10 * 1000 );
  }

  updateConfig() {
    this.axios.get('/config/frontend').then((config: AxiosResponse<FrontendConfig>) => {
      this.feConfig = config.data;
    });
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
      .then((projectsResponse: AxiosResponse<Project[]>) => {
        this.updateCommitSummary(projectsResponse);
        this.projects = this.getSortedProjects(projectsResponse);
        this.changePageTitleAndFavIcon(projectsResponse);

        this.loading = false;
      }).catch(error => {
        console.error(error);
        this.loading = false;
        this.errorMessage = `Error retrieving projects. Check your token and your GitLab host configuration. ${error}`;
      });
  }

  private updateCommitSummary(projectsResponse: AxiosResponse<Project[]>) {
    this.commitSummary = new CommitSummary();
    projectsResponse.data.forEach(project =>
      this.commitSummary = this.commitSummary.add(project.commitSummary)
    );
  }

  private getSortedProjects(projectsResponse: AxiosResponse<Project[]>): Project[] {
    return projectsResponse.data.sort((a, b) => {
      if (!a.lastBuild && !b.lastBuild) {
        return a.name.localeCompare(b.name);
      }
      if (!a.lastBuild) {
        return 1;
      }
      if (!b.lastBuild) {
        return -1;
      }

      if (a.lastBuild.status === Status.PASS && b.lastBuild.status === Status.FAIL) {
        return 1;
      } else if (a.lastBuild.status === Status.FAIL && b.lastBuild.status === Status.PASS) {
        return -1;
      } else {
        return a.name.localeCompare(b.name);
      }
    });
  }

  getProjects() {
    return this.projects;
  }

  private changePageTitleAndFavIcon(projectsResponse: AxiosResponse<Project[]>) {
    const hasFailedBuild = projectsResponse.data.some(project => project.lastBuild && project.lastBuild.status === Status.FAIL);

    if (hasFailedBuild) {
      if ( !this.titleTimer ) {
        // Start the page title and favicon flashing between
        // normal and alert state, to help alert the dev that
        // something is borked
        this.titleTimer = window.setInterval(() => {
          const showingFailure = document.title.startsWith(this.failTitle);
          document.title = showingFailure ? this.okTitle : this.failTitle;
          this.favicon.href = showingFailure ? '/favicon.ico' : '/favicon-alert.ico';
        }, 1000);
      }
    } else if (this.titleTimer) {

      // No broken builds?  Set the title and favicon to normal
      clearInterval(this.titleTimer);
      this.titleTimer = undefined;

      document.title = this.okTitle;
      this.favicon.href = '/favicon.ico';
    }
  }
}

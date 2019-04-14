import {Component, OnInit} from '@angular/core';
import {FrontendConfig} from '../../../shared/FrontendConfig';
import Project from '../../../shared/domain/Project';
import {Status} from '../../../shared/domain/Build';
import CommitSummary from '../../../shared/domain/CommitSummary';
import {Socket} from 'ngx-socket-io';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public status = undefined;
  public loading = false;
  public invalidConfig = false;
  public errorMessage: string;
  public feConfig: FrontendConfig = {};
  public UNKNOWN = Status.UNKNOWN;

  public projects: Project[] = [];
  public commitSummary: CommitSummary = new CommitSummary();

  private okTitle = 'GitLab Builds';
  private failTitle = 'FAILED BUILD';

  private favicon: HTMLLinkElement;
  private titleTimer: number;

  constructor(private socket: Socket) {
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

    this.socket.fromEvent<Project[]>('projects').subscribe((projects) => {
      this.augmentProjectObjects(projects);
      this.projects = this.getSortedProjects(projects);
      this.changePageTitleAndFavIcon(projects);
      this.updateCommitSummary(projects);
    });

    this.socket.fromEvent<any>('status').subscribe((status) => {
      this.status = status;
    });

    this.socket.fromEvent<FrontendConfig>('config').subscribe((config) => {
      this.feConfig = config;
    });

    this.socket.emit('ready', {});
  }

  private updateCommitSummary(projectsResponse: Project[]) {
    this.commitSummary = new CommitSummary();
    projectsResponse.forEach(project => {
      if (project.commitSummary) {
        this.commitSummary = this.commitSummary.add(project.commitSummary);
      }
    });
  }

  private getSortedProjects(projectsResponse: Project[]): Project[] {
    return projectsResponse.sort((a, b) => {
      if (!a.lastBuild && !b.lastBuild) {
        return a.name.localeCompare(b.name);
      }
      if (!a.lastBuild) {
        return 1;
      }
      if (!b.lastBuild) {
        return -1;
      }

      if (a.lastBuild.status !== b.lastBuild.status) {
        return a.lastBuild.status - b.lastBuild.status;
      } else {
        return a.name.localeCompare(b.name);
      }
    });
  }

  getProjects() {
    return this.projects;
  }

  private changePageTitleAndFavIcon(projectsResponse: Project[]) {
    const hasFailedBuild = projectsResponse.some(project => project.lastBuild && project.lastBuild.status === Status.FAIL);

    if (hasFailedBuild) {
      if (!this.titleTimer) {
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

  projectTracker(index, project) {
    return project.id;
  }

  private augmentProjectObjects(projects: Project[]) {
    projects.forEach(project => {
      if (project.lastBuild) {
        project.lastBuild.timeStartedFromNow = moment(project.lastBuild.timeStarted).fromNow();
        project.lastCommitBy = project.lastBuild.commit.by;
      }
    });
  }
}

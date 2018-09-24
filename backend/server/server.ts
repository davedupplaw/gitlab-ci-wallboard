import * as express from 'express';
import {Application} from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as root from 'app-root-path';
import * as cookieParser from 'cookie-parser';
import * as http from 'http';
import * as cors from 'cors';

import IndexController from './controllers/IndexController';
import SCMController from './controllers/SCMController';
import ConfigurationController from './controllers/ConfigurationController';
import GitLabClient from './util/GitLabClient';
import {SCMClient} from './util/SCMClient';
import ProjectCacheFactory from './util/ProjectCacheFactory';
import Project from '../../shared/domain/Project';
import {Status} from '../../shared/domain/Build';
import CommitSummary from '../../shared/domain/CommitSummary';
import moment = require('moment');

export default class Server {
    private readonly _app: Application;
    private readonly _scmClients: SCMClient[] = [];
    private _timerHandles: Map<string, NodeJS.Timer> = new Map();
    private _server: http.Server;

    constructor(app: Application) {
        this._app = app;
        this._app.use(cors());

        this._scmClients.push(new GitLabClient());

        this.viewEngineSetup();
        this.loggerSetup();
        this.parserSetup();
        this.routerSetup();

        this.registerErrorHandler();
        this.registerNotFoundHandler();

        this.updateProjectList();

        // Update the project list every 10 minutes
        setInterval(() => this.updateProjectList(), 60 * 10 * 1000);
    }

    get app() {
        return this._app;
    }

    private static errorHandler(error, port) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        const bind = `Port ${port}`;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    public listen(port: number) {
        this._app.set('port', port);
        this._server = http.createServer(this._app);
        this._server.listen(port);

        this._server.on('error', (error) => Server.errorHandler(error, port));
        this._server.on('listening', () => this.listeningHandler);
    }

    private listeningHandler() {
        const bind = `port ${this._server.address().port}`;
        log(`Listening on ${bind}`);
    }

    private viewEngineSetup() {
        this._app.set('views', `${root}/server/views/`);
        this._app.set('view engine', 'ejs');
    }

    private loggerSetup() {
        this._app.use(logger('dev'));
    }

    private parserSetup() {
        this._app.use(bodyParser.json());
        this._app.use(bodyParser.urlencoded({extended: false}));
        this._app.use(cookieParser());
    }

    private routerSetup() {
        const router = express.Router();

        IndexController.register(this._app);
        SCMController.register(this._app);
        ConfigurationController.register(this._app);

        this._app.use('/', router);
    }

    private registerNotFoundHandler() {
        this._app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            const err: any = new Error(`Not Found: ${req.originalUrl}`);
            err.status = 404;
            next(err);
        });
    }

    private registerErrorHandler() {
        if (this._app.get('env') === 'development') {
            // development error handler
            // will print stacktrace
            this._app.use((err: any, req: express.Request, res: express.Response, _: express.NextFunction) => {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
        }

        this._app.use((err: any, req: express.Request, res: express.Response, _: express.NextFunction) => {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            });
        });
    }

    private updateProjectList() {
        console.log('Updating projects...');
        this._scmClients.forEach(client => {
            client.getProjects().then(projects => {
                projects.forEach(project => {
                    this.setupProject(client, project);
                    ProjectCacheFactory.getCache().update(project);
                });
            });
        });
    }

    private setupProject(client: SCMClient, project: Project) {
        project.commitSummary = new CommitSummary();
        client.compileCommitSummaryForProject(project.id)
            .then(summary => {
                project.commitSummary = summary;
                return project;
            });

        this.getProjectLatestBuild(client, project);

        // If we already have a timer running for a specific project, we do
        // not want to create a new one.
        if (!this._timerHandles.get(project.id)) {
            // This polling is in lieu of project hooks, which we'll add later
            const timerHandle = setInterval(() => this.getProjectLatestBuild(client, project), 10 * 1000);
            this._timerHandles.set(project.id, timerHandle);
        }
    }

    private getProjectLatestBuild(client: SCMClient, project: Project) {
        client.getLatestBuild(project.id).then(build => {
            console.log(`Retrieved latest build for ${project.name} -> ${
                build ? Status[build.status] : 'no build'}`);
            project.lastBuild = build;

            if (project.lastBuild) {
                project.lastCommitBy = project.lastBuild.commit.by;
                project.lastBuild.timeStartedFromNow = moment(project.lastBuild.timeStarted).fromNow();
            }
        });
    }
}

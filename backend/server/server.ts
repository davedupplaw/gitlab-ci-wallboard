import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as root from 'app-root-path';
import * as cookieParser from 'cookie-parser';
import * as http from 'http';
import {Application} from 'express';
import * as cors from 'cors';

import IndexController from './controllers/IndexController';
import GitLabController from './controllers/GitLabController';

export default class Server {
    private readonly _app: Application;
    private _server: http.Server;

    constructor(app: Application) {
        this._app = app;
        this._app.use(cors());

        this.viewEngineSetup();
        this.loggerSetup();
        this.parserSetup();
        this.routerSetup();

        this.registerErrorHandler();
        this.registerNotFoundHandler();
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

        this._server.on('error', (error) => Server.errorHandler(error, port) );
        this._server.on('listening', () => this.listeningHandler );
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

        IndexController.register(router);
        GitLabController.register(router);

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
}

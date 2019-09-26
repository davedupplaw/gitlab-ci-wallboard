import * as http from 'http';
import * as express from 'express';
import * as SocketIO from 'socket.io';
import IndexController from './controllers/IndexController';
import ConfigurationController from './controllers/ConfigurationController';
import {SCMController} from './controllers/SCMController';
import {ConfigurationManager} from './util/ConfigurationManager';
import {Logger} from './util/Logger';

export class Server {

    constructor(private appFactory: express.Express,
                private configurationManager: ConfigurationManager,
                private logger: Logger = new Logger()) {
        this.createApp();
        this.createServer();
        this.sockets();
        this.routerSetup();
    }
    private app: express.Application;
    private server: http.Server;
    private io: SocketIO.Server;
    private scmController: SCMController;

    private createApp(): void {
        this.app = this.appFactory();
    }

    private createServer(): void {
        this.server = http.createServer(this.app);
    }

    private sockets(): void {
        this.io = SocketIO(this.server);
    }

    public listen(): void {
        const port = this.configurationManager.getConfiguration().port;
        this.server.listen(port, () => {
            this.logger.log('Running server on port %s', port);
        });

        this.io.on('connect', (socket: any) => {
            this.logger.log('Connected client on port %s.', socket.id);
            socket.on('disconnect', () => {
                this.logger.log('Client disconnected from ', socket.id);
            });
        });

    }

    private async routerSetup() {
        const router = express.Router();

        new ConfigurationController(this.io, this.configurationManager).register();
        IndexController.register(this.app);

        this.scmController = new SCMController(this.io, this.configurationManager);
        await this.scmController.register(this.app);

        this.app.use('/', router);
    }

    public exit() {
        this.scmController.cleanup();
    }
}

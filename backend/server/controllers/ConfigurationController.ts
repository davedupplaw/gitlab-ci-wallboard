import * as SocketIO from 'socket.io';
import {Socket} from 'socket.io';
import {ConfigurationManager} from '../util/ConfigurationManager';
import {Logger} from '../util/Logger';

export default class ConfigurationController {
    constructor(private io: SocketIO.Server,
                private configurationManager: ConfigurationManager,
                private logger: Logger = new Logger()) {
    }

    public register() {
        this.io.on('connection', (socket: Socket) => {
            const config = this.configurationManager.getConfiguration().frontend;
            this.logger.log('Emitting config:', config);
            socket.emit('config', config);
        });
    }
}

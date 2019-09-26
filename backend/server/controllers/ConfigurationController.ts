import * as SocketIO from 'socket.io';
import {Socket} from 'socket.io';
import {ConfigurationManager} from '../util/ConfigurationManager';

export default class ConfigurationController {
    constructor(private io: SocketIO.Server, private configurationManager: ConfigurationManager) {
    }

    public register() {
        this.io.on('connection', (socket: Socket) => {
            const config = this.configurationManager.getConfiguration().frontend;
            console.log('Emitting config:', config);
            socket.emit('config', config);
        });
    }
}

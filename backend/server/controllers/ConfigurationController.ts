import * as SocketIO from 'socket.io';
import {Socket} from 'socket.io';
import {ConfigurationManager} from '../util/ConfigurationManager';
import {FrontEndConfiguration} from '../../../shared/domain/Configuration';

export default class ConfigurationController {
    constructor(private io: SocketIO.Server, private configurationManager: ConfigurationManager) {
    }

    public register() {
        this.io.on('connection', (socket: Socket) => {
            const config = this.configuration();
            console.log('Emitting config:', config);
            socket.emit('config', config);
        });
    }

    public configuration(): FrontEndConfiguration {
        const config = this.configurationManager.getConfiguration().frontend;

        config.showProjectsWithoutBuilds = this.tf(process.env.GCIWB_INCLUDE_NO_BUILDS, config.showProjectsWithoutBuilds);
        config.showSemanticsCard = this.tf(process.env.GCIWB_SHOW_SEMANTICS, config.showSemanticsCard);

        return config;
    }

    private tf(string: string, defaultValue: boolean) {
        return string ? string === 'true' : defaultValue;
    }
}

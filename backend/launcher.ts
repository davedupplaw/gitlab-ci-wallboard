import * as debug from 'debug';
import * as express from 'express';
import {Server} from './server/server';
import {ConfigurationManager} from './server/util/ConfigurationManager';

const log = debug('modern-express:server');
log.log = console.log.bind(console);

new Server(() => express(), new ConfigurationManager())
    .listen();

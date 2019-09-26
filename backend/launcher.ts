import * as debug from 'debug';
import * as express from 'express';
import {Server} from './server/server';
import {ConfigurationManager} from './server/util/ConfigurationManager';
import exitHook = require('async-exit-hook');

const log = debug('modern-express:server');
log.log = console.log.bind(console);

const server = new Server(() => express(), new ConfigurationManager());
server.listen();

exitHook(async (callback) => {
    await server.exit();
    setTimeout( () => {
        callback();
    }, 10000);
});

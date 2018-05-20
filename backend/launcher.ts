import * as debug from 'debug';
import * as nconf from 'nconf';
import Server from './server/server';
import * as express from 'express';

nconf.env().argv();
nconf.file('./config/config.json');
nconf.defaults({
    'port': 3000
});

// binding to console
const log = debug('modern-express:server');
log.log = console.log.bind(console);

new Server(express()).listen(nconf.get('port'));

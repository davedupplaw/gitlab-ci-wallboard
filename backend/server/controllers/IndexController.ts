import * as express from 'express';

export default class IndexController {
    public static register(app: express.Application) {
        app.use('/', express.static('public'));
    }
}

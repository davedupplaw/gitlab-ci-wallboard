import * as express from 'express';

import {FrontendConfig} from '../../../shared/FrontendConfig';

export default class ConfigurationController {
    public static register(app: express.Application) {
        const configurationController = new ConfigurationController();
        const router = express.Router();
        router.get('/frontend', (req, res) => configurationController.configuration(req, res));
        app.use('/config', router);
    }

    public configuration(req: express.Request, res: express.Response) {
        res.send({
            showSemanticsCard: process.env.GCIWB_SHOW_SEMANTICS || true
        } as FrontendConfig);
    }
}

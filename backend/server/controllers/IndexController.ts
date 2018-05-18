import {Router, Request, Response} from "express";

export default class IndexController {
    public static register(router: Router) {
        router.get('/', IndexController.route);
    }

    public static route(req: Request, res: Response) {
        res.render('index', {
            locationOfAppBundle: 'TODO',
            title: 'schlurp'
        });
    }
}

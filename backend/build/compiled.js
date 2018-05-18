(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var express = __webpack_require__(0);
var logger = __webpack_require__(12);
var bodyParser = __webpack_require__(9);
var root = __webpack_require__(7);
var cookieParser = __webpack_require__(10);
var http = __webpack_require__(11);
var cors = __webpack_require__(13);
var IndexController_1 = __webpack_require__(6);
var GitLabController_1 = __webpack_require__(5);
var Server = /** @class */ (function () {
    function Server(app) {
        this._app = app;
        this._app.use(cors());
        this.viewEngineSetup();
        this.loggerSetup();
        this.parserSetup();
        this.routerSetup();
        this.registerErrorHandler();
        this.registerNotFoundHandler();
    }
    Object.defineProperty(Server.prototype, "app", {
        get: function () {
            return this._app;
        },
        enumerable: true,
        configurable: true
    });
    Server.errorHandler = function (error, port) {
        if (error.syscall !== 'listen') {
            throw error;
        }
        var bind = "Port " + port;
        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    };
    Server.prototype.listen = function (port) {
        var _this = this;
        this._app.set('port', port);
        this._server = http.createServer(this._app);
        this._server.listen(port);
        this._server.on('error', function (error) { return Server.errorHandler(error, port); });
        this._server.on('listening', function () { return _this.listeningHandler; });
    };
    Server.prototype.listeningHandler = function () {
        var bind = "port " + this._server.address().port;
        log("Listening on " + bind);
    };
    Server.prototype.viewEngineSetup = function () {
        this._app.set('views', root + "/server/views/");
        this._app.set('view engine', 'ejs');
    };
    Server.prototype.loggerSetup = function () {
        this._app.use(logger('dev'));
    };
    Server.prototype.parserSetup = function () {
        this._app.use(bodyParser.json());
        this._app.use(bodyParser.urlencoded({ extended: false }));
        this._app.use(cookieParser());
    };
    Server.prototype.routerSetup = function () {
        var router = express.Router();
        IndexController_1.default.register(router);
        GitLabController_1.default.register(router);
        this._app.use('/', router);
    };
    Server.prototype.registerNotFoundHandler = function () {
        this._app.use(function (req, res, next) {
            var err = new Error("Not Found: " + req.originalUrl);
            err.status = 404;
            next(err);
        });
    };
    Server.prototype.registerErrorHandler = function () {
        if (this._app.get('env') === 'development') {
            // development error handler
            // will print stacktrace
            this._app.use(function (err, req, res, _) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
        }
        this._app.use(function (err, req, res, _) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            });
        });
    };
    return Server;
}());
exports.default = Server;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("debug");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("nconf");

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var debug = __webpack_require__(2);
var nconf = __webpack_require__(3);
var server_1 = __webpack_require__(1);
var express = __webpack_require__(0);
nconf.env().argv();
nconf.file('./config/config.json');
nconf.defaults({
    'port': 3000
});
// binding to console
var log = debug('modern-express:server');
log.log = console.log.bind(console);
new server_1.default(express()).listen(nconf.get('port'));


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __webpack_require__(8);
var GitLabController = /** @class */ (function () {
    function GitLabController() {
        this.gitlab = 'gitlab.com';
        this.token = 'blarg';
        this.axios = axios_1.default.create({
            baseURL: 'https://' + this.gitlab + '/api/v4',
            headers: {
                common: {
                    'Private-Token': this.token
                }
            },
            validateStatus: function (status) { return status < 500; }
        });
    }
    GitLabController.register = function (router) {
        var gitLabController = new GitLabController();
        router.get('/gitlab/projects', function (req, res) { return gitLabController.projects(req, res); });
        router.get('/gitlab/projects/:projectId/pipelines', function (req, res) { return gitLabController.projectPipelines(req, res); });
        router.get('/gitlab/projects/:projectId/pipelines/:pipelineId', function (req, res) { return gitLabController.pipeline(req, res); });
    };
    GitLabController.prototype.projects = function (req, res) {
        var url = '/users/davedupplaw/projects';
        return this.axios.get(url).then(function (response) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response.data));
        });
    };
    GitLabController.prototype.projectPipelines = function (req, res) {
        var projectId = req.params.projectId;
        var url = "/projects/" + projectId + "/pipelines";
        return this.axios.get(url)
            .then(function (response) {
            res.send(response.data);
        })
            .catch(function (_) { return res.send("Are you sure " + projectId + " exists? I could not find it. That is a 404."); });
    };
    GitLabController.prototype.pipeline = function (req, res) {
        var projectId = req.params.projectId;
        var pipelineId = req.params.pipelineId;
        var url = "/projects/" + projectId + "/pipelines/" + pipelineId;
        return this.axios.get(url)
            .then(function (response) {
            res.send(response.data);
        })
            .catch(function (_) { return res.send("Are you sure " + projectId + " and " + pipelineId + " exist? I could not find it. That is a 404."); });
    };
    return GitLabController;
}());
exports.default = GitLabController;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var IndexController = /** @class */ (function () {
    function IndexController() {
    }
    IndexController.register = function (router) {
        router.get('/', IndexController.route);
    };
    IndexController.route = function (req, res) {
        res.render('index', {
            locationOfAppBundle: 'TODO',
            title: 'schlurp'
        });
    };
    return IndexController;
}());
exports.default = IndexController;


/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("app-root-path");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("axios");

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("cookie-parser");

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = require("morgan");

/***/ }),
/* 13 */
/***/ (function(module, exports) {

module.exports = require("cors");

/***/ })
/******/ ])));
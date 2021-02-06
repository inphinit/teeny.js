"use strict";

const http = require('http');
const fs = require('fs');

const SimpleMime = require('./SimpleMime.js');

const paramPatterns = {
    alnum: '[\\da-zA-Z]+',
    alpha: '[a-zA-Z]+',
    decimal: '\\d+\\.\\d+',
    num: '\\d+',
    noslash: '[^\\/]+',
    nospace: '\\S+',
    uuid: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
    version: '\\d+\\.\\d+(\\.\\d+(-[\\da-zA-Z]+(\\.[\\da-zA-Z]+)*(\\+[\\da-zA-Z]+(\\.[\\da-zA-Z]+)*)?)?)?'
};

/**
 * Inspired by Inphinit\Routing\Route and Inphinit\Teeny
 *
 * @author   Guilherme Nascimento <brcontainer@yahoo.com.br>
 * @version  0.1.8
 * @see      {@link https://github.com/inphinit/teeny|GitHub}
 */
class Teeny
{
    /**
     * Configure server
     *
     * @param {string}           routePath  Define public path for static files
     * @param {(number|object)}  config     Define port or config server (see: https://nodejs.org/api/net.html#net_server_listen_options_callback)
     */
    constructor(routesPath, config)
    {
        this.routesPath = routesPath;
        this.config = Number.isInteger(config) ? { port: config } : config;

        this.server = null;
        this.refreshTimeout = 0;

        this.states = { UNSENT: 0, STARTING: 1, STARTED: 2, STOPPING: 4, STOPPED: 8 };
        this.state = this.states.UNSENT;
        this.maintenance = false;

        this.teenyResetSettings();

        this.defaultType = {
            'Content-Type': 'text/html; charset=utf-8'
        };

        this.updateRoutes = 0;
    }

    /**
     * Register or remove a callback or script for a route
     *
     * @param {(string|array)}  method    Define http method(s)
     * @param {string}          path      Define path
     * @param {*}               callback  Define function or module
     */
    action(methods, path, callback)
    {
        let routes;

        path = '/' + path.replace(/^\/+?/, '');

        if (path.indexOf('<') !== -1) {
            routes = this.paramRoutes;

            if (callback) {
                this.hasParams = true;
            }
        } else {
            routes = this.routes;
        }

        if (!this.routes[path]) {
            routes[path] = [];
        }

        if (Array.isArray(methods)) {
            for (const method of methods) {
                routes[path][method.toUpperCase()] = callback;
            }
        } else {
            routes[path][methods.toUpperCase()] = callback;
        }
    }

    /**
     * Handler HTTP status code from ISAPI (from apache2handler or fast-cgi)
     *
     * @param {array}  codes     Define code errors
     * @param {*}      callback  Define function or module
     */
    handlerCodes(codes, callback)
    {
        for (const code of codes) {
            this.codes[code] = callback;
        }
    }

    /**
     * Enable or disable debug mode
     *
     * @param {boolean}  debug  Enable or disable debug mode
     */
    setDebug(debug)
    {
        this.debug = debug;
    }

    /**
     * Create or remove a pattern for URL slugs
     *
     * @param {string}  path  Set public path
     */
    setPublic(path)
    {
        this.publicPath = path;
    }

    /**
     * Create or remove a pattern for URL slugs
     *
     * @param {(string)}       pattern  Set pattern for URL slug params like this /foo/<var:pattern>
     * @param {(string|null)}  regex    Set regex for specif pattern
     */
    setPattern(pattern, regex)
    {
        if (regex === null) {
            delete this.paramPatterns[pattern];
        } else {
            this.paramPatterns[pattern] = regex;
        }
    }

    /**
     * Set require module
     *
     * @param {function}  require  Set a custom require function
     */
    setRequire(require)
    {
        this.require = require;
    }

    /**
     * Execute application
     *
     * @returns {Promise<Object>}  Response from promise returns details about server
     */
    async exec()
    {
        return new Promise((resolve, reject) => {
            if (this.state === this.states.STOPPED || this.state === this.states.UNSENT) {
                this.state = this.states.STARTING;

                this.teenyRefresh(true);

                if (!this.server) {
                    this.server = http.createServer((request, response) => {
                        this.teenyListen(request, response);
                    });
                }

                this.server.listen(this.config, () => {
                    this.state = this.states.STARTED;
                    
                    const details = this.server.address();

                    if (this.debug) {
                        console.info(`[${new Date()}]`, `Teeny server started on ${details.address}:${details.port}`);
                    }

                    resolve(details);
                });
            } else {
                reject('server is already started');
            }
        });
    }

    /**
     * Stops server
     *
     * @returns {Promise<Object>}  Response from promise returns details about server
     */
    async stop()
    {
        return new Promise((resolve, reject) => {
            if (this.state === this.states.STARTED) {
                this.state = this.states.STOPPING;

                clearTimeout(this.refreshTimeout);

                const details = this.server.address();

                this.server.close(() => {
                    this.state = this.states.STOPPED;

                    if (this.debug) {
                        console.info(`[${new Date()}]`, `Stopped server ${details.address}:${details.port}`);
                    }

                    resolve(details);
                });
            } else {
                reject('server is not started');
            }
        });
    }

    teenyParams(request, response, method, pathinfo)
    {
        const patterns = this.paramPatterns;
        const getParams = new RegExp('[<](.*?)(\\:(' + Object.keys(patterns).join('|') + ')|)[>]', 'g');

        let callback;
        let code = 200;

        for (let path in this.paramRoutes) {
            if (this.paramRoutes.hasOwnProperty(path) === false) continue;

            const routes = this.paramRoutes[path];

            path = path.replace(getParams, '(?<$1><$3>)').replace(/\<\>\)/g, '.*?)');

            for (const pattern in patterns) {
                if (patterns.hasOwnProperty(pattern)) {
                    path = path.replace('<' + pattern + '>)', patterns[pattern] + ')');
                }
            }

            const params = pathinfo.match(new RegExp('^' + path + '$'));

            if (params !== null) {
                callback = routes[method] || routes.ANY;

                if (!callback) {
                    code = 405;
                }

                setTimeout(() => {
                    this.teenyDispatch(request, response, method, pathinfo, callback, code, code === 200 ? params.groups : null);
                }, 0);

                return;
            }
        }

        setTimeout(() => this.teenyDispatch(request, response, method, pathinfo, null, 404, null), 0);
    }

    async teenyDispatch(request, response, method, path, callback, code, params)
    {
        if (code !== 200 && this.codes[code]) {
            callback = this.codes[code];
        }

        response.writeHead(code, this.defaultType);

        if (callback) {
            try {
                if (typeof callback === 'string') {
                    const cache = this.require.resolve(callback);

                    if (require.cache[cache]) {
                        delete require.cache[cache];
                    }

                    this.require(callback)(request, response, 200);
                } else if (code !== 200) {
                    response.write(await callback(code));
                } else if (params !== null) {
                    response.write(await callback(request, response, params));
                } else {
                    response.write(await callback());
                }

                this.teenyInfo(method, path, code || 200);
            } catch (ee) {
                if (this.debug) {
                    this.teenyInfo(method, path, 500, ee);
                }
                
                const callback = this.codes[500];

                if (callback) {
                    this.teenyDispatch(request, response, method, path, callback, 500, null);
                    return;
                } else {
                    response.writeHead(500, this.defaultType);
                }
            }
        } else {
            this.teenyInfo(method, path, code);
        }

        response.end();
    }

    teenyInfo(method, path, code, error)
    {
        if (this.debug) {
            if (error) {
                console.error(`[${new Date()}]`, code, method, path);
                console.error(error);
            } else {
                console.info(`[${new Date()}]`, code, method, path);
            }
        }
    }

    teenyPublic(path, method, response)
    {
        const file = this.publicPath + path;

        try {
            const lstat = fs.lstatSync(file);

            if (lstat.isFile()) {
                setTimeout(() => this.teenyStatic(file, lstat, response), 0);

                return false;
            }
        } catch (ee) {
            const code = ee.code;

            if (code === 'EACCES' || code === 'EPERM') {
                return 403;
            } else if (code !== 'ENOENT') {
                if (this.debug) {
                    this.teenyInfo(method, path, 500, ee);
                }

                return 500;
            }
        }

        return 200;
    }

    teenyStatic(path, lstat, response)
    {
        const readStream = fs.createReadStream(path);

        readStream.on('open', () => {
            response.writeHead(200, {
                'Content-Type': SimpleMime(path),
                'Last-Modified': lstat.mtime,
                'Content-Length': lstat.size
            });

            readStream.pipe(response);
        });

        readStream.on('error', (err) => {
            response.writeHead(500, this.defaultType);
            response.end(err);
        });
    }

    teenyListen(request, response)
    {
        if (this.maintenance) {
            response.writeHead(503, this.defaultType);
            response.end('Service Unavailable');
            return;
        }

        const method = request.method;
        const path = request.url.slice(0, (request.url.indexOf('?') - 1 >>> 0) + 1);

        let code;

        if (this.publicPath) {
            code = this.teenyPublic(path, method, response);
            
            if (code === false) return;
        } else {
            code = 200;
        }

        let callback;

        if (code === 200) {
            if (this.routes[path]) {
                const routes = this.routes[path];

                if (routes[method]) {
                    callback = routes[method];
                } else if (routes.ANY) {
                    callback = routes.ANY;
                } else {
                    code = 405;
                }
            } else if (this.hasParams) {
                try {
                    return this.teenyParams(request, response, method, path);
                } catch (ee) {
                    if (this.debug) {
                        console.error(ee);
                    }

                    code = 500;
                }
            } else {
                code = 404;
            }
        }

        this.teenyDispatch(request, response, method, path, callback, code, null);
    }

    teenyRefresh(raise)
    {
        try {
            const routesPath = this.require.resolve(this.routesPath);

            const lstat = fs.lstatSync(routesPath);

            if (lstat.mtimeMs > this.updateRoutes) {
                this.maintenance = true;

                this.updateRoutes = lstat.mtimeMs;

                if (this.debug) {
                    console.info(`[${new Date()}]`, 'update routes');
                }

                this.teenyResetSettings();

                if (require.cache[routesPath]) {
                    delete require.cache[routesPath];
                }

                this.require(routesPath)(this);

                this.maintenance = false;
            }
        } catch (ee) {
            if (this.debug) {
                console.error(ee);
            }

            if (raise) {
                throw ee;
            }
        }

        this.refreshTimeout = setTimeout(() => this.teenyRefresh(false), 1000);
    }

    teenyResetSettings()
    {
        this.debug = false;
        this.publicPath = null;
        this.codes = [];
        this.routes = [];
        this.paramRoutes = [];
        this.require = require;
        this.hasParams = false;
        this.paramPatterns = Object.assign({}, paramPatterns);
    }
}

exports.Teeny = Teeny;

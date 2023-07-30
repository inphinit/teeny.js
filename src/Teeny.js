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
 * @author  Guilherme Nascimento <brcontainer@yahoo.com.br>
 * @see     {@link https://github.com/inphinit/teeny|GitHub}
 */
class Teeny
{
    /**
     * Configure server
     *
     * @param {string}           routePath  Set the routes file
     * @param {(number|Object)}  config     Set port or server configuration (see: https://nodejs.org/api/net.html#net_server_listen_options_callback)
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

        this.defaultCharset = 'UTF-8';

        this.defaultType = {
            'Content-Type': 'text/html; charset=' + this.defaultCharset
        };

        this.updateRoutes = 0;
    }

    /**
     * Register or remove a callback or script for a route
     *
     * @param {(string|string[])}  method    Set the http method(s)
     * @param {string}             path      Set the path
     * @param {function|null}      callback  Set the function or module
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

            path = path.replace(/([\^$|[\]():<>!?/\\])/g, '\\$1');
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
     * @param {string[]}       codes     Set code errors
     * @param {function|null}  callback  Set function or module
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
     * Set a folder with static files that can be accessed by url
     *
     * @param {string}  path  Set public path
     */
    setPublic(path)
    {
        this.publicPath = path;
    }

    /**
     * Set the default charset for use with text/html (route pages, errors) or text/plain (static files)
     *
     * @param {string}  charset  Set default charset
     */
    setDefaultCharset(charset)
    {
        this.defaultCharset = charset;

        this.defaultType = {
            'Content-Type': 'text/html; charset=' + charset
        };
    }

    /**
     * Create or remove a pattern for URL slugs
     *
     * @param {(string)}              pattern  Set a pattern for URL slug params like this /foo/<var:pattern>
     * @param {(RegExp|string|null)}  regex    Set a regex to a specific pattern
     */
    setPattern(pattern, regex)
    {
        if (regex === null) {
            delete this.paramPatterns[pattern];
        } else {
            if (regex instanceof RegExp) {
                regex = String(regex);
                regex = regex.substr(1, regex.lastIndexOf('/') - 1);
            }

            this.paramPatterns[pattern] = regex;
        }
    }

    /**
     * Set a custom "require" function for load modules or route file (see: https://nodejs.org/api/module.html#modulecreaterequirefilename)
     *
     * @param {function}  require  Set a custom "require" function
     */
    setRequire(require)
    {
        if (typeof require === 'function' && 'resolve' in require) {
            this.require = require;
        } else if (this.debug) {
            console.error(new Error('Invalid require function, try uses `module.createRequire(filename)`'));
        }
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
                        setTimeout(() => this.teenyListen(request, response), 0);
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
        const getParams = new RegExp('\\\\[<]([A-Za-z]\\w+)(\\\\:(' + Object.keys(patterns).join('|') + ')|)\\\\[>]', 'g');

        let callback;
        let params = null;
        let code = null;

        for (let path in this.paramRoutes) {
            if (this.paramRoutes.hasOwnProperty(path) === false) continue;

            const routes = this.paramRoutes[path];

            path = path.replace(getParams, '(?<$1><$3>)').replace(/\<\>\)/g, '.*?)');

            for (const pattern in patterns) {
                if (patterns.hasOwnProperty(pattern)) {
                    path = path.replace('<' + pattern + '>)', patterns[pattern] + ')');
                }
            }

            const found = pathinfo.match(new RegExp('^' + path + '$'));

            if (found !== null) {
                callback = routes[method] || routes.ANY;

                if (callback) {
                    params = found.groups;
                    code = 200;
                } else {
                    code = 405;
                }

                break;
            }
        }

        if (code === null) return false;

        this.teenyDispatch(request, response, method, pathinfo, callback, code, params);

        return true;
    }

    async teenyDispatch(request, response, method, path, callback, code, params)
    {
        if (code !== 200 && this.codes[code]) {
            callback = this.codes[code];
        }

        response.writeHead(code, this.defaultType);

        if (callback) {
            try {
                let result = null;

                if (typeof callback === 'string') {
                    const cache = this.require.resolve(callback);

                    if (require.cache[cache]) {
                        delete require.cache[cache];
                    }

                    this.require(callback)(request, response);
                } else if (code !== 200) {
                    result = await callback(request, response, code);
                } else if (params !== null) {
                    result = await callback(request, response, params);
                } else {
                    result = await callback(request, response);
                }

                this.teenyInfo(method, path, code || 200);

                if (typeof result === 'undefined') return;

                response.write(result);
            } catch (ee) {
                this.teenyInfo(method, path, 500, ee);

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

    teenyPublic(method, path, response)
    {
        const file = this.publicPath + path;

        try {
            const lstat = fs.lstatSync(file);

            if (lstat.isFile()) {
                const charset = this.defaultCharset;

                let mime = SimpleMime(path);

                if (charset === 'text/html' || charset === 'text/plain') {
                    mime += '; charset=' + charset;
                }

                this.teenyStreamFile(method, path, response, file, mime, lstat);

                return null;
            }
        } catch (ee) {
            const code = ee.code;

            if (code === 'EACCES' || code === 'EPERM') {
                return 403;
            } else if (code !== 'ENOENT') {
                this.teenyInfo(method, path, 500, ee);
                return 500;
            }
        }

        return 404;
    }

    teenyStreamFile(method, path, response, file, mime, stat)
    {
        const stream = fs.createReadStream(file);

        let sent = false;

        stream.on('open', () => {
            if (sent) return;

            sent = true;

            response.writeHead(200, {
                'Last-Modified': stat.mtime,
                'Content-Length': stat.size,
                'Content-Type': mime
            });

            stream.pipe(response);
        });

        stream.on('error', (ee) => {
            if (sent) return;

            sent = true;

            const code = ee.code;

            let status;

            if (code === 'EACCES' || code === 'EPERM') {
                status = 403;
            } else if (code === 'ENOENT') {
                status = 404;
            } else {
                status = 500;
            }

            response.writeHead(status, this.defaultType);
            response.end();

            this.teenyInfo(method, path, status, ee);
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
        const path = decodeURIComponent(request.url.slice(0, (request.url.indexOf('?') - 1 >>> 0) + 1));

        let code = 200;
        let callback;

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
                if (this.teenyParams(request, response, method, path)) return;

                code = null;
            } catch (ee) {
                if (this.debug) {
                    console.error(ee);
                }

                code = 500;
            }
        }

        if (code === null && this.publicPath) {
            code = this.teenyPublic(method, path, response);

            if (code === null) return;
        } else {
            code = 404;
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

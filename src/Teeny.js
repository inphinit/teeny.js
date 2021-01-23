/*
 * teeny.js 0.1.2
 *
 * Copyright (c) 2021 Guilherme Nascimento (brcontainer@yahoo.com.br)
 *
 * Released under the MIT license
 *
 * Inspired by https://github.com/inphinit/teeny
 */

"use strict";

const http = require('http');
const fs = require('fs');

const SimpleMime = require('./SimpleMime.js');

class Teeny
{
    /**
     * Configure server
     *
     * @param {string}           routePath  Define public path for static files
     * @param {(number|object)}  config     Define port or config server (see: https://nodejs.org/api/net.html#net_server_listen_options_callback)
     */
    constructor(routesPath, config) {
        this.routesPath = routesPath;
        this.config = Number.isInteger(config) ? { port: config } : config;
        this.debug = false;
        this.codes = [];
        this.routes = [];
        this.modules = new Set;
        this.server = null;

        this.states = { UNSENT: 0, STARTING: 1, STARTED: 2, STOPPING: 4, STOPPED: 8 };
        this.state = this.states.UNSENT;
        this.maintenance = false;

        this.hasParams = false;
        this.paramPatterns = {
            alnum: '[\\da-zA-Z]+',
            alpha: '[a-zA-Z]+',
            decimal: '\\d+\\.\\d+',
            num: '\\d+',
            noslash: '[^\\/]+',
            nospace: '\\S+',
            uuid: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
            version: '\\d+\\.\\d+(\\.\\d+(-[\\da-zA-Z]+(\\.[\\da-zA-Z]+)*(\\+[\\da-zA-Z]+(\\.[\\da-zA-Z]+)*)?)?)?'
        };

        this.defaultType = {
            'Content-Type': 'text/html; charset=utf-8'
        };

        this.updateRoutes = 0;
    }

    /**
     * Register or remove a callback or script for a route
     *
     * @param {(string|array)}  method
     * @param {string}          path
     * @param {*}               callback
     */
    action(methods, path, callback) {
        if (Array.isArray(methods)) {
            for (const method of methods) {
                this.action(method, path, callback);
            }
        } else {
            this.teenyAddModule(callback);

            path = '/' + path.replace(/^\/+?/, '');

            if (!this.routes[path]) {
                this.routes[path] = [];
            }

            if (path.indexOf('<') !== false && callback) {
                this.hasParams = true;
            }

            this.routes[path][methods.toUpperCase()] = callback;
        }
    }

    /**
     * Handler HTTP status code from ISAPI (from apache2handler or fast-cgi)
     *
     * @param {array}  codes
     * @param {*}      callback
     */
    handlerCodes(codes, callback) {
        this.teenyAddModule(callback);

        for (const code of codes) {
            this.codes[String(code)] = callback;
        }
    }

    /**
     * Enable or disable debug mode
     *
     * @param {boolean}  debug
     */
    setDebug(debug) {
        this.debug = debug;
    }

    /**
     * Create or remove a pattern for URL slugs
     *
     * @param {string}  path  Set public path
     */
    setPublic(path) {
        this.publicPath = path;
    }

    /**
     * Create or remove a pattern for URL slugs
     *
     * @param {(string)}       pattern  Set pattern for URL slug params like this /foo/<var:pattern>
     * @param {(string|null)}  regex    Set regex for specif pattern
     */
    setPattern(pattern, regex) {
        if (regex === null) {
            delete this.paramPatterns[pattern];
        } else {
            this.paramPatterns[pattern] = regex;
        }
    }

    /**
     * Execute application
     *
     * @returns {Promise<Object>}  Response from promise returns details about server
     */
    async exec() {
        if (this.state === this.states.UNSENT) {
            this.teenyRefresh();
        }

        return new Promise((resolve, reject) => {
            if (this.state === this.states.STOPPED || this.state === this.states.UNSENT) {
                this.state = this.states.STARTING;

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

    teenyParams(request, response, method, pathinfo) {
        const patterns = this.paramPatterns;
        const getParams = new RegExp('[<](.*?)(\\:(' + Object.keys(patterns).join('|') + ')|)[>]');

        for (let path in this.routes) {
            if (this.routes.hasOwnProperty(path) === false) continue;

            const value = this.routes[path];

            if (path.indexOf('<') !== -1 && value[method]) {
                path = path.replace(getParams, '(?<$1><$3>)').replace(/\<\>\)/, '.*?)');

                for (const pattern in patterns) {
                    if (patterns.hasOwnProperty(pattern)) {
                        path = path.replace('<' + pattern + '>)', patterns[pattern] + ')');
                    }
                }

                const params = pathinfo.match(new RegExp('^' + path + '$'));

                if (params !== null) {
                    const callback = value[method];
                    
                    setTimeout(() => this.teenyDispatch(request, response, method, pathinfo, callback, 0, params.groups), 0);

                    return true;
                }
            }
        }

        return false;
    }

    async teenyDispatch(request, response, method, path, callback, code, params) {
        response.writeHead(code || 200, this.defaultType);

        if (callback) {
            try {
                if (typeof callback === 'string') {
                    const cache = require.resolve(callback);

                    if (require.cache[cache]) {
                        delete require.cache[cache];
                    }

                    require(callback)(request, response, code || 200);
                } else if (code) {
                    response.write(await callback(code));
                } else if (params !== null) {
                    response.write(await callback(request, response, params));
                } else {
                    response.write(await callback());
                }

                this.teenyInfo(method, path, code || 200);
            } catch (ee) {
                response.writeHead(500, this.defaultType);

                if (this.debug) {
                    response.write('Fatal error in ' + ee.fileName + ' on line ' + ee.lineNumber);

                    this.teenyInfo(method, path, 500, ee);
                }
            }
        } else {
            this.teenyInfo(method, path, code);
        }

        response.end();
    }

    teenyInfo(method, path, code, error) {
        if (this.debug) {
            if (error) {
                console.error(`[${new Date()}]`, code, method, path);
                console.error(error);
            } else {
                console.info(`[${new Date()}]`, code, method, path);
            }
        }
    }

    teenyPublic(path, response) {
        if (this.publicPath) {
            const file = this.publicPath + path;

            try {
                const lstat = fs.lstatSync(file);

                if (lstat.isFile()) {
                    setTimeout(() => this.teenyStatic(file, lstat, response), 0);

                    return true;
                }
            } catch (ee) {
            }
        }

        return false;
    }

    teenyStatic(file, lstat, response) {
        const readStream = fs.createReadStream(file);

        readStream.on('open', () => {
            response.writeHead(200, {
                'Content-Type': SimpleMime(file),
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

    teenyListen(request, response) {
        if (this.maintenance) {
            response.writeHead(503, this.defaultType);
            response.end('Service Unavailable');
            return;
        }

        const path = request.url.slice(0, (request.url.indexOf('?') - 1 >>> 0) + 1);

        if (this.teenyPublic(path, response)) return;

        const method = request.method;

        let newCode = 0;
        let callback;

        if (this.routes[path]) {
            const routes = this.routes[path];

            if (routes[method]) {
                callback = routes[method];
            } else if (routes.ANY) {
                callback = routes.ANY;
            } else {
                newCode = 405;
            }
        } else if (this.hasParams && this.teenyParams(request, response, method, path)) {
            return true;
        } else {
            newCode = 404;
        }

        if (newCode !== 0 && this.codes[newCode]) {
            callback = this.codes[newCode];
        }

        this.teenyDispatch(request, response, method, path, callback, newCode, null);
    }

    teenyAddModule(mod) {
        if (typeof mod === 'string') {
            this.modules.add(mod);
        }
    }

    teenyClearModules() {
        if (this.updateRoutes !== 0) {
            for (let mod of this.modules) {
                mod = require.resolve(mod);

                if (require.cache[mod]) {
                    delete require.cache[mod];
                }
            }

            this.modules.clear();
        }
    }

    teenyRefresh() {
        const routesPath = require.resolve(this.routesPath);
        const lstat = fs.lstatSync(routesPath);

        if (lstat.mtimeMs > this.updateRoutes) {
            this.maintenance = true;

            this.codes = [];
            this.routes = [];

            this.teenyClearModules();

            if (this.debug) {
                console.info(`[${new Date()}]`, 'update routes');
            }

            try {
                require(routesPath)(this);

                this.teenyAddModule(routesPath);

                this.maintenance = false;
            } catch (ee) {
                if (this.debug) {
                    console.error(ee);
                }
            }

            this.updateRoutes = lstat.mtimeMs;
        }

        setTimeout(() => this.teenyRefresh(), 1000);
    }
}

exports.Teeny = Teeny;

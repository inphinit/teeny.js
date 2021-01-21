/*
 * teeny.js 0.0.3
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
     * @param {string} routePath  Define public path for static files
     * @param {number} port       Define port for server
     */
    constructor(routesPath, port) {

        this.routesPath = routesPath;
        this.port = port;
        this.debug = false;
        this.codes = [];
        this.routes = [];
        this.server = null;

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
     * @param {(string)}  pattern  Set pattern for URL slug params like this /foo/<var:pattern>
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
     */
    exec() {
        this.server = http.createServer((request, response) => {
            this.teenyListen(request, response);
        });

        this.server.listen(this.port);

        console.info(`[${new Date()}]`, `Teeny server started on ${this.port} port`);

        this.teenyRefresh();
    }

    /**
     * Stops server and destroy all connections
     *
     * @param {(function)}  callback  Execute callback when server is stoped
     */
    stop(callback)
    {
        this.server.close(() => {
            console.info(`[${new Date()}]`, `Server from ${this.port} port has stoped`);
        });
    }

    teenyParams(request, response, method, pathinfo) {
        const patterns = this.paramPatterns;
        const getParams = new RegExp('[<](.*?)(\\:(' + Object.keys(patterns).join('|') + ')|)[>]');

        for (let path in this.routes) {
            const value = this.routes[path];

            if (path.indexOf('<') !== -1 && value[method]) {
                path = path.replace(getParams, '(?<$1><$3>)', path);
                path = path.replace(/\<\>\)/, '.*?)', path);

                for (const pattern in patterns) {
                    path = path.replace('<' + pattern + '>)', patterns[pattern] + ')');
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
        
        response.end('');
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

    teenyRefresh() {
        const routesPath = require.resolve(this.routesPath);
        const lstat = fs.lstatSync(routesPath);

        if (lstat.mtimeMs > this.updateRoutes) {
            if (require.cache[routesPath]) {
                delete require.cache[routesPath];

                if (this.debug) {
                    console.info(`[${new Date()}]`, 'update routes');
                }
            }

            require(routesPath)(this);

            this.updateRoutes = lstat.mtimeMs;
        }

        setTimeout(() => this.teenyRefresh(), 1000);
    }
}

exports.Teeny = Teeny;

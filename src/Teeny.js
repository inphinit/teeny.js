const simpleMime = require('./simpleMime.js');
const core = require('./nodeCore.js');
const error = require('./error.js');

const { createServer } = core('http');

const {
    open,
    close,
    createReadStream,
    fstat,
    lstatSync
} = core('fs');

const paramPatterns = require('./patterns.js');

const states = { UNSENT: 0, STARTING: 1, STARTED: 2, STOPPING: 4, STOPPED: 8 };

/**
 * Inspired by Inphinit\Routing\Route and Inphinit\Teeny
 *
 * @author  Guilherme Nascimento <brcontainer@yahoo.com.br>
 * @see     {@link https://github.com/inphinit/inphinit|GitHub}
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

        this.state = states.UNSENT;
        this.maintenance = false;

        this.teenyResetSettings();

        this.setDefaultCharset('UTF-8');

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

        if (!routes[path]) {
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
     * @param {number[]}       codes     Set code errors
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
        this.defaultType = 'text/html; charset=' + charset;
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

        this.teenyRefreshPatterns();
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
            console.error('[ERROR]', new Error('Invalid require function, try uses `module.createRequire(filename)`'));
        }
    }

    /**
     * Stream a file
     *
     * @param {string}                path      Set public path
     * @param {http.IncomingMessage}  response  Set response
     * @param {Object}                headers   Set custom headers
     *
     */
    streamFile(path, response, headers)
    {
        return new Promise((resolve, reject) => {
            open(path, 'r', (err, fd) => {
                if (err) {
                    reject(error(err));
                } else {
                    fstat(fd, (err, stat) => {
                      if (err) {
                        reject(error(err));
                      } else if (stat.isFile()) {
                        const charset = this.defaultCharset;

                        let contentType = simpleMime(path);

                        if (contentType === 'text/html' || contentType === 'text/plain') {
                            contentType += '; charset=' + charset;
                        }

                        response.setHeader('Last-Modified', stat.mtime);
                        response.setHeader('Content-Length', stat.size);
                        response.setHeader('Content-Type', contentType);

                        if (headers) {
                            for (const [header, value] of Object.entries(headers)) {
                                response.setHeader(header, value);
                            }
                        }

                        response.statusCode = 200;

                        createReadStream(null, { fd, autoClose: true }).pipe(response);

                        resolve();
                      } else {
                        close(fd, () => {});
                        reject(error('No such file', 404));
                      }
                    });
                }
            });
        });
    }

    /**
     * Execute application
     *
     * @returns {Promise<Object>}  Response from promise returns details about server
     */
    async exec()
    {
        return new Promise((resolve, reject) => {
            if (this.state === states.STOPPED || this.state === states.UNSENT) {
                this.state = states.STARTING;

                this.teenyRefresh(true);

                if (!this.server) {
                    this.server = createServer((request, response) => {
                        this.teenyListen(request, response);
                    });
                }

                this.server.listen(this.config, () => {
                    this.state = states.STARTED;

                    const details = this.server.address();

                    this.teenyRefresh(true);

                    if (this.debug) {
                        console.info('[INFO]', `Teeny server started on ${details.address}:${details.port}`, new Date());
                    }

                    resolve(details);
                }).on('error', (error) => {
                    this.state = states.STOPPED;
                    reject(error);
                });
            } else {
                reject(new Error('server is already started'));
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
            if (this.state === states.STARTED) {
                this.state = states.STOPPING;

                clearTimeout(this.refreshTimeout);

                const details = this.server.address();

                this.server.close(() => {
                    this.state = states.STOPPED;

                    if (this.debug) {
                        console.info('[INFO]', `Stopped server ${details.address}:${details.port}`, new Date());
                    }

                    resolve(details);
                });
            } else {
                reject(new Error('server is not started'));
            }
        });
    }

    teenyRefreshPatterns()
    {
        this.paramPatternsRE = new RegExp('\\\\[<]([A-Za-z]\\w+)(\\\\:(' + Object.keys(this.paramPatterns).join('|') + ')|)\\\\[>]', 'g');
    }

    teenyParams(request, response, method, pathinfo)
    {
        const patterns = this.paramPatterns;
        const getParams = this.paramPatternsRE;
        const paths = this.paramRoutes;

        let callback;
        let params = null;
        let code = null;

        for (let path in paths) {
            if (paths.hasOwnProperty(path) === false) continue;

            let pathRE = path.replace(getParams, '(?<$1><$3>)').replace(/\<\>\)/g, '.*?)');

            for (const pattern in patterns) {
                if (patterns.hasOwnProperty(pattern)) {
                    pathRE = pathRE.replace('<' + pattern + '>)', patterns[pattern] + ')');
                }
            }

            const found = pathinfo.match(new RegExp('^' + pathRE + '$'));

            if (found !== null) {
                const routes = paths[path];

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

        this.teenyDispatch(request, response, method, pathinfo, params, callback, code);

        return true;
    }

    async teenyDispatch(request, response, method, path, params, callback, code, error)
    {
        if (code !== 200 && this.codes[code]) {
            callback = this.codes[code];
        }

        let result;

        response.setHeader('Content-Type', this.defaultType);

        if (callback) {
            try {
                if (typeof callback === 'string') {
                    callback = this.require(callback);
                }

                if (code !== 200) {
                    response.statusCode = code;
                    result = await callback(request, response, code, error);
                } else if (params !== null) {
                    result = await callback(request, response, params);
                } else {
                    result = await callback(request, response);
                }
            } catch (ee) {
                return this.teenyDispatch(request, response, method, path, null, null, 500, ee);
            }
        } else {
            response.statusCode = code;
            result = '';
        }

        if (typeof result !== 'undefined') {
            response.end(result);
        }

        this.teenyInfo(method, path, code, error);
    }

    teenyInfo(method, path, code, error)
    {
        if (this.debug) {
            const date = new Date();

            if (error) {
                console.error('[ERROR]', code, method, path, date);
                console.error(error, '\n');
            } else {
                console.info('[INFO]', code, method, path, date);
            }
        }
    }

    teenyPublic(method, path, request, response)
    {
        this.streamFile(this.publicPath + path, response).then(() => {
            this.teenyInfo(method, path, 200);
        }).catch((error) => {
            this.teenyDispatch(request, response, method, path, null, null, error.code, error);
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

        let code = null;
        let callback;

        const routes = this.routes[path];

        if (routes) {
            code = 200;

            if (routes[method]) {
                callback = routes[method];
            } else if (routes.ANY) {
                callback = routes.ANY;
            } else {
                code = 405;
            }
        } else if (this.hasParams && this.teenyParams(request, response, method, path)) {
            return;
        }

        if (code === null) {
            if (this.publicPath) {
                this.teenyPublic(method, path, request, response);
            } else {
                code = 404;
            }
        }

        if (code !== null) this.teenyDispatch(request, response, method, path, null, callback, code, null);
    }

    teenyClearCache(key)
    {
        if (require.cache[key]) {
            delete require.cache[key];
        }
    }

    teenyClearCacheRoutes()
    {
        Object.keys(this.routes).concat(Object.keys(this.paramRoutes)).forEach((route) => {
            const methods = this.routes[route] || this.paramRoutes[route];

            Object.keys(methods).forEach((method) => {
                const callback = methods[method];

                if (typeof callback === 'string') {
                    try {
                        this.teenyClearCache(this.require.resolve(callback));
                    } catch (ee) {}
                }
            });
        });
    }

    teenyRefresh(raise)
    {
        try {
            const routesPath = this.require.resolve(this.routesPath);

            const stat = lstatSync(routesPath);

            if (stat.mtimeMs > this.updateRoutes) {
                this.maintenance = true;

                this.updateRoutes = stat.mtimeMs;

                this.teenyClearCacheRoutes();

                this.teenyResetSettings();

                this.teenyClearCache(routesPath);

                this.require(routesPath)(this);

                this.maintenance = false;

                if (this.debug) {
                    this.teenyDisplayRoutes();

                    if (!raise) console.info('[INFO]', 'update routes', new Date());
                }
            }
        } catch (ee) {
            if (this.debug) {
                console.error('[ERROR]', ee);
            }

            if (raise) {
                throw ee;
            }
        }

        this.refreshTimeout = setTimeout(() => this.teenyRefresh(false), 1000);
    }

    teenyDisplayRoutes()
    {
        let withParams = {};

        const paramRoutes = this.paramRoutes;

        Object.keys(paramRoutes).forEach((route) => {
            const original = route.replace(/\\([\^$|[\]():<>!?/\\])/g, '$1');
            withParams[original] = paramRoutes[route];
        });

        withParams = Object.assign({}, this.routes, withParams);

        const routes = Object.keys(withParams);

        if (routes.length) {
            routes.sort((a, b) => b.length - a.length);

            const pad = routes[0].length;

            Object.keys(withParams).forEach((route) => {
                const methods = withParams[route];

                delete withParams[route];

                withParams[route.padEnd(pad, ' ')] = methods;
            });

            console.log();
            console.table(withParams);
        }
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

        this.teenyRefreshPatterns();
    }
}

exports.Teeny = Teeny;

<div align="center">
    <a href="https://github.com/inphinit/teeny/">
        <img src="https://raw.githubusercontent.com/inphinit/teeny/master/badges/php.png" width="160" alt="Teeny route system for PHP">
    </a>
    <a href="https://github.com/inphinit/teeny.js/">
    <img src="https://raw.githubusercontent.com/inphinit/teeny/master/badges/javascript.png" width="160" alt="Teeny route system for JavaScript (Node.js)">
    </a>
    <a href="https://github.com/inphinit/teeny.go/">
    <img src="https://raw.githubusercontent.com/inphinit/teeny/master/badges/golang.png" width="160" alt="Teeny route system for Golang">
    </a>
    <a href="https://github.com/inphinit/teeny.py/">
    <img src="https://raw.githubusercontent.com/inphinit/teeny/master/badges/python.png" width="160" alt="Teeny route system for Python">
    </a>
</div>

# Teeny.js route system for Node.js

The main objective of this project is to be light, simple, easy to learn, to serve other projects that need a route system to use together with other libraries and mainly to explore the native resources from language and engine (Node).

## Advantages of using Teeny.js

It is possible to use modules in the routes and method `app.handlerCodes()` and these modules are loaded only when necessary.

When you edit the file containing the routes, **Teeny.js** detects and updates everything on its own without having to restart the server, something that is often necessary in other similar libs. This makes it easy to quickly maintain or reconfigure anything called within `routes.js`.

It is possible to create your own patterns to use in route parameters.

## Configure your project

Before start, Node10+ is required.

If not created a project you can create using `npm init`, first create a folder named `blog`:

```
mkdir blog && cd blog && npm init && npm i teeny.js
```

Or to install into an existing project, run:

```
cd project-folder
npm i teeny.js
```

After install you can use `index.js` or other and put routes in a script named `routes.js` (or other name), example:

```javascript
// index.js

const { Teeny } = require('teeny.js');

const app = new Teeny(`${__dirname}/routes.js`, 7000);

app.exec();
```

The `${__dirname}/routes.js` is your module with routes and configs and `7000` is the HTTP port.

The `request` contains [`http.ClientRequest`](https://nodejs.org/api/http.html#http_class_http_clientrequest) object and `response` contains [`http.ServerResponse`](https://nodejs.org/api/http.html#http_class_http_serverresponse)

```javascript
// routes.js

module.exports = (app) => {
    app.action('GET', '/', (request, response) => {
        return 'Hello World!';
    });

    app.action('GET', '/about', (request, response) => {
        return 'About example!';
    });
};
```

**Note:** When editing anything in the `routes.js` file (or any file you have configured in the `routesPath` parameter in `new Teeny(String routesPath, ...)`), the application itself will detect the update and apply it, **eliminating the need to restart the application**. In the meantime, the server will send HTTP status *503 Service Unavailable* to the client.

For start application use command:

```
node index.js
```

## Methods for config Teeny.js

Method | Description
--- | ---
`new Teeny(String routesPath, Number port)` | configure routes (or others methods from class) and port
`new Teeny(String routesPath, Object config)` | configure routes and server config on second param (see: https://nodejs.org/api/net.html#net_server_listen_options_callback)
`app.action(String\|Array methods, String path, Function callback)` | Define a route (from HTTP path in URL) for execute a function, arrow function or anonymous function
`app.action(String\|Array methods, String path, String module)` | Define a route for load and execute other "local" module (it is recommended to set the absolute path)
`app.handlerCodes(Array codes, Function callback)` | Catch http errors (like `ErrorDocument` or `error_page`) from ISPAI or if try access a route not defined (emits `404 Not Found`) or if try access a defined route with not defined http method (emits `405 Method Not Allowed`)
`app.handlerCodes(Array codes, String module)` | Catch http errors or errors from routes, if catchs a error execute a "local" module defined in second argument
`app.setDebug(Boolean enable)` | Define if debug is on (`true`) or off (`false`), by default is `false`
`app.setDefaultCharset(String charset)` | Define the default charset for use with text/html (route pages, errors) or text/plain (static files)
`app.setPublic(String path)` | Define path for use static files
`app.setPattern(String name, String regex)` | Create a pattern for use in route params
`app.setPattern(String name, RegExp regex)` | Create a pattern using a RegExp object
`app.setRequire(Function require)` | Set require path for load modules using `createRequire()` or `createRequireFromPath()`. **Note:** this function affects the `routes.js` location and modules loaded by the `app.action(methods, module)` method
`app.streamFile(path, http.ServerResponse response, Object customHeaders): Promise<(stream.Writable\|Error)>` | Serve a file. This method automatically sends the `Last-Modified`, `Content-Length`, and `Content-Type` headers. **Note:** You can customize the headers by sending an object in the third parameter.
`app.exec(): Promise<Object\|Error>` | Starts server, promise returns server info like `{address: "127.0.0.1", port: 7000}` (see https://nodejs.org/api/net.html#net_server_address)
`app.stop(): Promise<Object\|Error>` | Stops server, promise returns server info

## Patterns supported by param routes

You can create your own patterns to use with the routes in "Teeny.js", but there are also ready-to-use patterns:

Pattern | Regex used | Description
--- | --- | ---
`alnum` | `[\da-zA-Z]+` | Matches routes with param using alpha-numeric in route
`alpha` | `[a-zA-Z]+` | Matches routes with param using A to Z letters in route
`decimal` | `\d+\.\d+` | Matches routes with param using decimal format (like `1.2`, `3.5`, `100.50`) in route
`num` | `\d+` | Matches routes with param using numeric format in route
`noslash` | `[^/]+` | Matches routes with param using any character except slashs (`\/` or `/`) in route
`nospace` | `[^/\s]+` | Matches routes with param using any character except spaces, tabs or NUL or slashs in route
`uuid` | `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}` | Matches routes with param using uuid format in route
`version` | `\d+\.\d+(\.\d+(-[\da-zA-Z]+(\.[\da-zA-Z]+)*(\+[\da-zA-Z]+(\.[\da-zA-Z]+)*)?)?)?` | Matches routes with param using [`semver.org`](https://semver.org/) format in route

For use a pattern in routes, set like this:

```javascript
module.exports = (app) => {
    app.action('GET', '/user/<name:alnum>', (request, response, params) => {
        return `Hello ${params.alnum}`;
    });

    app.action('GET', '/api/<foobar:version>', (request, response, params) => {
        return `Version: ${params.foobar}`;
    });

    app.action('GET', '/product/<id:num>', (request, response, params) => {
        return `Product ID: ${params.id}`;
    });
...
```

## Debug mode

Uses `app.setDebug(...);` method for enable or disable debug mode (`false` by default), example:

```javascript
module.exports = (app) => {
    // Enable debug
    app.setDebug(true);

    app.action('GET', '/', (request, response) => {
        return 'Hello World!';
    });

    ...
```

## Delivering responses

In the third parameter (callback) you can send the response to the client in two ways, using `return` passing a value that can be converted into a string (Promises that return values are also supported):

```javascript
module.exports = (app) => {
    app.action('GET', '/', (request, response) => {
        return 'Hello!'
    });

    ...
```

Or you can use the second parameter (`response`) received in the callback, this way you can work with other functions that use callback (eg.: `setTimeout`), for example:

```javascript
module.exports = (app) => {
    app.action('GET', '/', (request, response) => {
        setTimeout(() => response.end('Hello!'), 1000);
    });

    ...
```

In the case of `return`, if you are using arrowfunction and it does not execute anything other than the return, you can pass the value directly, for example:

```javascript
module.exports = (app) => {
    app.action('GET', '/', (request, response) => 'Hello!');

    ...
```

## Handler errors

To get errors occurring in the application, detect undefined routes and detect method HTTP method not allowed for a route:

```javascript
module.exports = (app) => {
    app.handlerCodes([404, 500], (request, response, status, error) => {
        // Create a custom page for 404 and 500 status
        return `Error page: ${status}`;
    });
    ...
```

To save errors to a log (an example for send to Slack):

```javascript
const { WebClient } = require('@slack/web-api');

const token = ...;
const conversationId = ...;

// Initialize
const web = new WebClient(token);

...

module.exports = (app) => {
    app.handlerCodes([404, 500], (request, response, status, error) => {
        if (status === 500) {
            web.chat.postMessage({
                text: `${request.method} ${request.url}\n${error.toString()}`,
                channel: conversationId,
            });
        }

        return `Error page: ${status}`;
    });
    ...
```

> **Note:** See [example](./example)

## Send big files for HTTP response

If you are on a server like Apache or NGINX you may prefer to use modules to deliver a protected file. Examples of popular modules:

Module | Server | Documentation
--- | --- | ---
`X-Sendfile` | Apache | https://tn123.org/mod_xsendfile/
`X-Accel-Redirect` | NGINX | https://www.nginx.com/resources/wiki/start/topics/examples/x-accel/
`X-LIGHTTPD-send-file` and `X-Sendfile2` | Lighttpd | https://redmine.lighttpd.net/projects/1/wiki/X-LIGHTTPD-send-file

An NGINX example:

```javascript
app.action('GET', '/foo/bar/download', (request, response) => {
    // Relative to location {}
    const file = '/protected/big.file';

    if (isAuthenticated(request)) {
        response.setHeader('X-LIGHTTPD-send-file', file);
        response.end();
    } else {
        response.writeHead(403, app.defaultType);
        response.end('Not authorized');
    }
});
```

If running stand-alone, you can serve the file using the `Teeny.streamFile()` method. This method works with a pipe, and will already generate the necessary headers, based on the file type. Simple example:

```javascript
app.action('GET', '/foo/bar/download', (request, response) => {
    // Absolute path
    const file = '/home/user/foo/bar/protected/big.file';

    app.streamFile(file, response).then(() => {
        console.log('Streamed');
    }).catch((ee) => {
        console.error(ee);
    });
});
```

Example with custom headers:

```javascript
app.action('GET', '/foo/bar/download', (request, response) => {
    const file = '/home/user/foo/bar/storage/big.file';

    app.streamFile(file, response, {
        'Content-Type': 'application/octet-stream',
        'X-Foo': 'bar'
    }).then(() => {
        console.log('Streamed');
    }).catch((ee) => {
        console.error(ee);
    });
});
```

## Return response

Callback supports `string`, `Buffer` and `Uint8Array`

```javascript
app.action('GET', '/string', () => {
    return 'My string';
});

app.action('GET', '/buffer', () => {
    return Buffer.alloc(25, 'aGVsbG8gd29ybGQgKGZyb20gYnVmZmVyKQ==', 'base64');
});

app.action('GET', '/uint8array', () => {
    return new Uint8Array([
      102, 114, 111, 109, 32,
      85,  105, 110, 116, 56,
      65,  114, 114, 97, 121
    ]);
});
```

## Require module with routes

You can set up a require function in the context of routes to load modules via routes

If you want to configure from the script called do:

```javascript
const app = new Teeny('./routes.js', 7000);

app.setRequire(require);
```

You can also configure it in the routes file, that way if you need to edit the file and change the require it will not be necessary to restart the application:

```javascript
module.exports = (app) => {
    // (Optional) Define require function for load modules in router context for load
    app.setRequire(require);

    app.action('GET', '/', './module.js');

...
```

If you want to customize the path you can use `module.createRequire` (v12.2.0+).

### Set require function in Node.js v12.2.0+

Defines a custom path from which to locate your modules using `module.createRequire`:

```javascript
const { createRequire } = require('module');

module.exports = (app) => {
    app.setRequire(createRequire('/foo/bar/baz/.'));

    app.action('GET', '/', './module.js');

...
```

### Set require function in old Node.js versions

Defines a custom path from which to locate your modules using `module.createRequireFromPath` (deprecated):

```javascript
const { createRequireFromPath } = require('module');

module.exports = (app) => {
    app.setRequire(createRequireFromPath('/foo/bar/baz/.'));

    app.action('GET', '/', './module.js');

...
```

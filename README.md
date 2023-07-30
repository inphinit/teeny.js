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
mkdir blog
cd blog
npm init
```

Or can copy [`./example`](./example) folder

For install use:

```
npm i teeny.js
```

In example create you can use `index.js` or other and put routes in a script named `routes.js` (or other name), example:

``` javascript
const { Teeny } = require('teeny.js');

const app = new Teeny(`${__dirname}/routes.js`, 7000);

app.exec();
```

The `${__dirname}/routes.js` is your module with routes and configs and `7000` is the HTTP port.

The `request` contains [`http.ClientRequest`](https://nodejs.org/api/http.html#http_class_http_clientrequest) object and `response` contains [`http.ServerResponse`](https://nodejs.org/api/http.html#http_class_http_serverresponse)

``` javascript
module.exports = (app) => {
    app.action('GET', '/', (request, response) => {
        return 'Hello World!';
    });

    app.action('GET', '/about', (request, response) => {
        return 'About example!';
    });
};
```

For config routes or others edits the `routes.js`, when saving to the file teeny himself will update the routes without having to restart the server. Uses `app.setDebug(...);` method for enable or disable debug mode (`false` by default), example:

``` javascript
module.exports = (app) => {
    // Enable debug
    app.setDebug(true);

    app.action('GET', '/', (request, response) => {
        return 'Hello World!';
    });

...
```

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
`app.exec(): Promise<Object>` | Starts server, promise returns server info like `{address: "127.0.0.1", port: 7000}` (see https://nodejs.org/api/net.html#net_server_address)
`app.stop(): Promise<Object>` | Stops server, promise returns server info

## Patterns supported by param routes

You can create your own patterns to use with the routes in "Teeny.js", but there are also ready-to-use patterns:

Pattern | Regex used | Description
--- | --- | ---
`alnum` | `[\da-zA-Z]+` | Matches routes with param using alpha-numeric in route
`alpha` | `[a-zA-Z]+` | Matches routes with param using A to Z letters in route
`decimal` | `\d+\.\d+` | Matches routes with param using decimal format (like `1.2`, `3.5`, `100.50`) in route
`num` | `\d+` | Matches routes with param using numeric format in route
`noslash` | `[^\/]+` | Matches routes with param using any character except slashs (`\/` or `/`) in route
`nospace` | `\S+` | Matches routes with param using any character except spaces, tabs or NUL in route
`uuid` | `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}` | Matches routes with param using uuid format in route
`version` | `\d+\.\d+(\.\d+(-[\da-zA-Z]+(\.[\da-zA-Z]+)*(\+[\da-zA-Z]+(\.[\da-zA-Z]+)*)?)?)?` | Matches routes with param using [`semver.org`](https://semver.org/) format in route

For use a pattern in routes, set like this:

``` javascript
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

## Send big files for HTTP response

When loading in a variable directly all the contents of a file to send with "return" in the response of a route may crash the application or even the server, instead of reading the entire file you must make use of what already exists in Node , the "pipe" of streams. An example to send files of different sizes to download in the HTTP response:

``` javascript
app.action('GET', '/foo/bar/download', (request, response) => {
    const file = '/home/user/foo/bar/storage/big.file';
    const lstat = fs.lstatSync(file);

    // Create a stream for big.file
    const stream = fs.createReadStream(file);

    // Check is exists and if is file
    if (lstat.isFile()) {
        // Create a stream for big.file
        const stream = fs.createReadStream(file);

        // Sent file size with Content-Length in header
        response.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': lstat.size
        });

        // Uses .pipe() for sent data for response
        stream.pipe(response);
    } else {
        response.writeHead(404);
        response.end('Invalid file');
    }
});
```

## Return response

Callback supports `string`, `Buffer` and `Uint8Array`

``` javascript
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

``` javascript
const app = new Teeny('./routes.js', 7000);

app.setRequire(require);
```

You can also configure it in the routes file, that way if you need to edit the file and change the require it will not be necessary to restart the application:

``` javascript
module.exports = (app) => {
    // (Optional) Define require function for load modules in router context for load
    app.setRequire(require);

    app.action('GET', '/', './module.js');

...
```

If you want to customize the path you can use `module.createRequire` (v12.2.0+).

### Set require function in Node.js v12.2.0+

Defines a custom path from which to locate your modules using `module.createRequire`:

``` javascript
const { createRequire } = require('module');

module.exports = (app) => {
    app.setRequire(createRequire('/foo/bar/baz/.'));

    app.action('GET', '/', './module.js');

...
```

### Set require function in old Node.js versions

Defines a custom path from which to locate your modules using `module.createRequireFromPath` (deprecated):

``` javascript
const { createRequireFromPath } = require('module');

module.exports = (app) => {
    app.setRequire(createRequireFromPath('/foo/bar/baz/.'));

    app.action('GET', '/', './module.js');

...
```

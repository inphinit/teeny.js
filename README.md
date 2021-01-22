## About Teeny.js

The main objective of this project is to be light, simple, easy to learn, to serve other projects that need a route system to use together with other libraries and mainly to explore the native resources from language and engine (Node).

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
--- | ------
`new Teeny(String routesPath, Number port)` | configure routes (or others methods from class) and port
`new Teeny(String routesPath, Object config)` | configure routes and server config on second param (see: https://nodejs.org/api/net.html#net_server_listen_options_callback)
`app.action(String|Array methods, String path, Function callback)` | Define a route (from HTTP path in URL) for execute a function, arrow function or anonymous function
`app.action(String|Array methods, String path, String module)` | Define a route for load and execute other "local" module (it is recommended to set the absolute path)
`app.handlerCodes(Array codes, Function callback)` | Catch http errors (like `ErrorDocument` or `error_page`) from ISPAI or if try access a route not defined (emits `404 Not Found`) or if try access a defined route with not defined http method (emits `405 Method Not Allowed`)
`app.handlerCodes(Array codes, String modules)` | Catch http errors or errors from routes, if catchs a error execute a "local" module defined in second argument
`app.setDebug(Boolean enable)` | Define if debug is on (`true`) or off (`false`), by default is `false`
`app.setPublic(String path)` | Define path for use static files
`app.setPattern(String name, String regex)` | Create a pattern for use in route params
`app.exec(): Promise<Object>` | Starts server, promise returns server info like `{address: "127.0.0.1", port: 7000}` (see https://nodejs.org/api/net.html#net_server_address)
`app.stop(): Promise<Object>` | Stops server, promise returns server info

## Patterns supported by param routes

You can create your own patterns to use with the routes in "Teeny.js", but there are also ready-to-use patterns:

Pattern | Regex used | Description
--- | --- | ---
`alnum` | `[\\da-zA-Z]+` | Matches routes with param using alpha-numeric in route
`alpha` | `[a-zA-Z]+` | Matches routes with param using A to Z letters in route
`decimal` | `\\d+\\.\\d+` | Matches routes with param using decimal format (like `1.2`, `3.5`, `100.50`) in route
`num` | `\\d+` | Matches routes with param using numeric format in route
`noslash` | `[^\\/]+` | Matches routes with param using any character except slashs (`\/` or `/`) in route
`nospace` | `\\S+` | Matches routes with param using any character except spaces, tabs or NUL in route
`uuid` | `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}` | Matches routes with param using uuid format in route
`version` | `\\d+\\.\\d+(\\.\\d+(-[\\da-zA-Z]+(\\.[\\da-zA-Z]+)*(\\+[\\da-zA-Z]+(\\.[\\da-zA-Z]+)*)?)?)?` | Matches routes with param using [`semver.org`](https://semver.org/) format in route

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
    if (/* condition for allow access file */) {
        const file = '/home/user/foo/bar/storage/big.file';
        const lstat = fs.lstatSync(file);

        // Check is exists and if is file
        if (lstat.isFile()) {

            // Create a stream for big.file
            const streamFileExample = fs.createReadStream(file);

            // Trigger when open the stream
            streamFileExample.on('open', () => {

                // Sent file size with Content-Length in header
                response.writeHead(200, {
                    'Content-Length': lstat.size
                });

                // Uses .pipe() for sent data for response
                streamFileExample.pipe(response);
            });

            // If failed sent 500 HTTP status
            streamFileExample.on('error', (err) => {
                response.writeHead(500);
                response.end(err);
            });
        }
    } else {
        response.writeHead(404);
        response.end('Invalid file');
    }
});

```

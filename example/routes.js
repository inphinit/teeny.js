const fs = require('fs');

module.exports = (app) => {
    // Enable (or disable) debug mode
    app.setDebug(true);

    // Define require function for load from current path
    app.setRequire(require);

    // Define default charset
    // app.setDefaultCharset('ISO-8859-1');

    app.handlerCodes([403, 404, 405, 500], (request, response, status) => {
        return `Error page: ${status}`;
    });

    // Access static files from ./public folder
    app.setPublic(`${__dirname}/public`);

    // Access http://localhost:7000/ for see all paths
    app.action('GET', '/', (request, response) => {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Teeny.js</title>
</head>
<body>
<ul>
    <li><a href="/helloworld">/helloworld</a></li>
    <li><a href="/helloworld2">/helloworld2</a></li>
    <li><a href="/helloworld3">/helloworld3</a></li>
    <li><a href="/helloworld4">/helloworld4</a></li>
    <li><a href="/favicon.ico">favicon.ico (static file)</a></li>
    <li><a href="/timeout">/timeout (5s)</a></li>
    <li><a href="/async">/async</a></li>
    <li><a href="/user/foobar1">/user/&lt;username:alnum></a></li>
    <li><a href="/module/100/john">/module/&lt;id:num>/&lt;name></a></li>
    <li><a href="/error/foobar">/error/<message></a></li>
    <li><a href="/api/3.0">/api/&lt;foobar:version></a></li>
    <li><a href="/product/2000">/product/&lt;id:num></a></li>
    <li>
        <form method="POST" action="/blog/foobar-90">
            <button>
                /blog/&lt;title>-&lt;id:num>
            </button>
        </form>
    </li>
    <li><a href="/custom/A1200">/custom/&lt;myexample:example></a></li>
    <li><a href="/status/201">/status/&lt;code:num></a></li>
    <li><a href="/buffer">/buffer</a></li>
    <li><a href="/uint8array">/uint8array</a></li>
    <li><a href="/404">/404</a></li>
</ul>
</body>
</html>`;
    });

    // Access http://localhost:7000/helloworld for see "Hello world"
    app.action('GET', '/helloworld', (request, response) => {
        return 'Hello World!';
    });

    // Access http://localhost:7000/helloworld2 for see "Hello world"
    app.action('GET', '/helloworld2', (request, response) => 'Hello World 2!');

    // Access http://localhost:7000/helloworld3 for see "Hello world"
    app.action('GET', '/helloworld3', (request, response) => {
        response.write('Hello World 3!\n');
        response.end();
    });

    // Access http://localhost:7000/helloworld4 for see "Hello world"
    app.action('GET', '/helloworld4', (request, response) => {
        response.writeHead(201, { 'Content-Type': 'text/plain' });
        response.end('Hello World 4!');
    });

    // Access http://localhost:7000/timeout for see "Hello world"
    app.action('GET', '/timeout', (request, response) => {
        setTimeout(() => {
            response.write('Thank You!\n');
            response.end('But Our "Response" is in Another Castle!');
        }, 5000);
    });

    // Access http://localhost:7000/async for see response from a async function
    app.action('GET', '/async', async (request, response) => {
        const result = new Promise((resolve) => setTimeout(resolve, 1000, `Async working ${new Date()}!`));
        return result;
    });

    // Access http://localhost:7000/user/mary (or another nickname)
    app.action('GET', '/user/<username:alnum>', (request, response, params) => {
        return `Hello ${params.username}`;
    });

    // Access http://localhost:7000/module for load and executes include.js module
    app.action('GET', '/module/<id:num>/<name>', './include.js');

    // Access http://localhost:7000/error for load and executes error.js module with error
    // app.action('GET', '/error', './error.js');
    app.action('GET', '/error/<message>', async (req, res, params) => {
        throw new Error(params.message);
    });

    // Access http://localhost:7000/api/2.0
    app.action('GET', '/api/<foobar:version>', (request, response, params) => {
        return `Version: ${params.foobar}`;
    });

    // Access http://localhost:7000/product/1000 (or another number)
    app.action('GET', '/product/<id:num>', (request, response, params) => {
        return `Product ID: ${params.id}`;
    });

    // Access http://localhost:7000/blog/title-1000 (or another number)
    app.action('POST', '/blog/<title>-<id:num>', (request, response, params) => {
        return `Post ID: ${params.id}<br>Post title: ${params.title}`;
    });

    // Set custom pattern basead in Regex (write using string)
    app.setPattern('example', '[A-Z]\\d+');

    // Using custom pattern for get param in route (access http://localhost:7000/custom/A1000)
    app.action('GET', '/custom/<myexample:example>', (request, response, params) => {
        return `<h1>custom pattern</h1>
        <pre>${JSON.stringify(params, null, 4)}</pre>`;
    });

    // Access http://localhost:7000/status/400 (or another number valid in HTTP status)
    app.action('GET', '/status/<code:num>', (request, response, params) => {
        response.writeHead(params.code, { 'Content-Type': 'text/html' });
        return `You request a ${params.code} response`;
    });

    // Supports Buffer
    app.action('GET', '/buffer', (request, response) => {
        return Buffer.alloc(25, 'aGVsbG8gd29ybGQgKGZyb20gYnVmZmVyKQ==', 'base64');
    });

    // Supports Uint8Array
    app.action('GET', '/uint8array', (request, response) => {
        return new Uint8Array([
          102, 114, 111, 109, 32,
          85,  105, 110, 116, 56,
          65,  114, 114, 97, 121
        ]);
    });
};

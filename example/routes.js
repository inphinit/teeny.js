module.exports = (app) => {
    // Enable (or disable) debug mode
    app.setDebug(true);

    app.handlerCodes([ 404, 405 ], (status) => {
        return `Error page: ${status}`;
    });

    // Access static files from ./public folder
    app.setPublic(`${__dirname}/public`);

    // Access http://localhost:7000/ for see "Hello world"
    app.action('GET', '/', (request, response) => {
        return 'Hello World!';
    });

    // Access http://localhost:7000/async for see response from a async function
    app.action('GET', '/async', async (request, response) => {
        const result = await new Promise((resolve) => setTimeout(resolve, 1000, `Async working ${new Date()}!`));

        return result;
    });

    // Access http://localhost:7000/user/mary (or another nickname)
    app.action('GET', '/user/<username:alnum>', (request, response, params) => {
        return `Hello ${params.username}`;
    });

    // Access http://localhost:7000/file for load and executes include.js module
    app.action('GET', '/file', `${__dirname}/include.js`);

    // Access http://localhost:7000/api/2.0
    app.action('GET', '/api/<foobar:version>', (request, response, params) => {
        return `Version: ${params.foobar}`;
    });

    // Access http://localhost:7000/product/1000 (or another number)
    app.action('GET', '/product/<id:num>', (request, response, params) => {
        return `Product ID: ${params.id}`;
    });

    // Set custom pattern basead in Regex (write using string)
    app.setPattern('example', '[A-Z]\\d+');

    // Using custom pattern for get param in route (access http://localhost:7000/custom/A1000)
    app.action('GET', '/custom/<myexample:example>', (request, response, params) => {
        return `<h1>custom pattern</h1>
        <pre>${JSON.stringify(params, null, 4)}</pre>`;
    });
};

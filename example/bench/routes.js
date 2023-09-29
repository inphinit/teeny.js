module.exports = (app) => {
    // Access http://localhost:7000/helloworld for see "Hello world"
    app.action('GET', '/helloworld', (request, response) => {
        return 'Hello World!';
    });
};

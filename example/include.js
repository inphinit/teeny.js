module.exports = function (request, response, params) {
    response.write(`Hello ${params.name}<br>`);
    response.end(`ID: ${params.id}`);
};

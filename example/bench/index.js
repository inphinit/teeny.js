const { Teeny } = require('../../src/Teeny.js');

const app = new Teeny(`${__dirname}/routes.js`, 7000);

app.exec();

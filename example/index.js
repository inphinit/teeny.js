const { Teeny } = require('teeny.js');

const app = new Teeny(`${__dirname}/routes.js`, 7000);

app.exec();

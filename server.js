const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');
// const morgan = require('morgan');
const express = require('express');

const apiRouter = require('./api/api');

const app = express();
const PORT = process.env.PORT || 8081;

app.use(bodyParser.json());
app.use(cors());
// app.use(morgan('dev'));

app.use('/api', apiRouter);

app.use(errorhandler());

app.listen(PORT, () => {
	console.log(`Server is listening on port: ${PORT}`);
});

module.exports = app;
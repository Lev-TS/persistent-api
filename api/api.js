const express = require('express');
const artistsRouter = require('./artists');

const apiRouter = express.Router();
apiRouter.use('/artists', artistsRouter)

module.exports = apiRouter;
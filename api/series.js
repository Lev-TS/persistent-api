const express = require('express');
const sqlite3 = require('sqlite3');
const issuesRouter = require('./issues');

const seriesRouter = express.Router();
seriesRouter.use('/:seriesId/issues', issuesRouter);

const db = new sqlite3.Database(
	process.env.TEST_DATABASE || './database.sqlite'
);

seriesRouter.param('seriesId', (req, res, next, id) => {
	const query = `
        SELECT * 
        FROM Series 
        WHERE id = $seriesId
    `;
	const ph = { $seriesId: id };
	const cb = (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			req.series = row;
			next();
		} else {
			res.sendStatus(404);
		}
	};
	db.get(query, ph, cb);
});

// Read all entries
seriesRouter.get('/', (req, res, next) => {
	const query = `SELECT * FROM Series`;
	const cb = (err, row) => {
		err ? next(err) : res.status(200).json({ series: row });
	};

	db.all(query, cb);
});

// Read a single entry
seriesRouter.get('/:seriesId', (req, res, next) => {
	res.status(200).json({ series: req.series });
});

// Create an entry
seriesRouter.post('/', (req, res, next) => {
	const name = req.body.series.name;
	const description = req.body.series.description;

	if (!name || !description) {
		res.sendStatus(400);
	}

	const query = `
        INSERT INTO Series (
            name, 
            description
        ) 
        VALUES (
            $name, 
            $description
        )
    `;

	const ph = {
		$name: name,
		$description: description,
	};

	function cb(err) {
		if (err) {
			next(err);
		} else {
			db.get(
				`SELECT * FROM Series WHERE id = $id`,
				{ $id: this.lastID },
				(err, row) => {
					res.status(201).json({ series: row });
				}
			);
		}
	}

	db.run(query, ph, cb);
});

// Update an entry
seriesRouter.put('/:seriesId', (req, res, next) => {
	const name = req.body.series.name;
	const description = req.body.series.description;

	if (!name || !description) {
		res.sendStatus(400);
	}

	const query = `
        UPDATE Series 
        SET name = $name, 
            description = $description
        WHERE id = $id
    `;

	const ph = {
		$name: name,
		$description: description,
		$id: req.params.seriesId,
	};

	const cb = (err) => {
		if (err) {
			next(err);
		} else {
			db.get(
				`SELECT * FROM Series WHERE id = $id`,
				{ $id: req.params.seriesId },
				(err, row) => {
					res.status(200).json({ series: row });
				}
			);
		}
	};

	db.run(query, ph, cb);
});

// delete an entry
seriesRouter.delete('/:seriesId', (req, res, next) => {
	const issueQuery = `SELECT * FROM Issue WHERE series_id = $seriesId`;
	const phForIssueQuery = { $seriesId: req.params.seriesId };
	const cbForIssueQuery = (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			res.sendStatus(400);
		} else {
			const query = 'DELETE FROM Series WHERE id = $seriesId';
			const ph = { $seriesId: req.params.seriesId };
			const cb = (err) => {
				err ? next(err) : res.sendStatus(204);
			};
			db.run(query, ph, cb);
		}
	};

	db.get(issueQuery, phForIssueQuery, cbForIssueQuery);
});

module.exports = seriesRouter;
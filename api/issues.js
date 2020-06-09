const express = require('express');
const sqlite3 = require('sqlite3');

const issuesRouter = express.Router({ mergeParams: true });
const db = new sqlite3.Database(
	process.env.TEST_DATABASE || './database.sqlite'
);

issuesRouter.param('issueId', (req, res, next, id) => {
	const query = `SELECT * FROM Issue WHERE id = $issueId`;
	const ph = { $issueId: id };
	const cb = (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			next();
		} else {
			res.sendStatus(404);
		}
	};
	db.get(query, ph, cb);
});

// Read all entries
issuesRouter.get('/', (req, res, next) => {
	const query = `SELECT * FROM Issue WHERE series_id = $seriesId`;
	const ph = { $seriesId: req.params.seriesId };
	const cb = (err, row) => {
		err ? next(err) : res.status(200).json({ issues: row });
	};

	db.all(query, ph, cb);
});

// Create an entry
issuesRouter.post('/', (req, res, next) => {
	const name = req.body.issue.name;
	const issueNumber = req.body.issue.issueNumber;
	const publicationDate = req.body.issue.publicationDate;
	const artistId = req.body.issue.artistId;

	const artistQuery = `SELECT * FROM Artist WHERE id = $artistId`;
	const phForArtistQuery = { $artistId: artistId };

	function cbForArtistQuery(err, row) {
		if (err) {
			next(err);
		} else {
			if (!name || !issueNumber || !publicationDate || !row) {
				res.sendStatus(400);
			}

			const query = `
				INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) 
				VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)
			`;

			const ph = {
				$name: name,
				$issueNumber: issueNumber,
				$publicationDate: publicationDate,
				$artistId: artistId,
				$seriesId: req.params.seriesId,
			};

			function cb(err) {
				if (err) {
					next(err);
				} else {
					db.get(
						`SELECT * FROM Issue WHERE id = $id`,
						{ $id: this.lastID },
						(err, row) => {
							res.status(201).json({ issue: row });
						}
					);
				}
			}

			db.run(query, ph, cb);
		}
	}

	db.get(artistQuery, phForArtistQuery, cbForArtistQuery);
});

// update an entry
issuesRouter.put('/:issueId', (req, res, next) => {
	const name = req.body.issue.name;
	const issueNumber = req.body.issue.issueNumber;
	const publicationDate = req.body.issue.publicationDate;
	const artistId = req.body.issue.artistId;

	const artistQuery = `SELECT * FROM Artist WHERE id = $artistId`;
	const phForArtistQuery = { $artistId: artistId };

	function cbForArtistQuery(err, row) {
		if (err) {
			next(err);
		} else {
			if (!name || !issueNumber || !publicationDate || !row) {
				return res.sendStatus(400);
			}

			const query = `
				UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId
				WHERE id = $issueId
			`;

			const ph = {
				$name: name,
				$issueNumber: issueNumber,
				$publicationDate: publicationDate,
				$artistId: artistId,
				$issueId: req.params.issueId,
			};

			function cb(err) {
				if (err) {
					next(err);
				} else {
					db.get(
						`SELECT * FROM Issue WHERE Issue.id = ${req.params.issueId}`,
						(err, row) => {
							res.status(200).json({ issue: row });
						}
					);
				}
			}

			db.run(query, ph, cb);
		}
	}

	db.get(artistQuery, phForArtistQuery, cbForArtistQuery);
});

// delete an entry
issuesRouter.delete('/:issueId', (req, res, next) => {
	const query = `DELETE FROM Issue WHERE id = $issueId`;
	const ph = { $issueId: req.params.issueId };
	const cb = (err) => {
		err ? next(err) : res.sendStatus(204);
	};
	db.run(query, ph, cb);
});

module.exports = issuesRouter;
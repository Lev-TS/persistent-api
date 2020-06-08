const express = require('express');
const sqlite3 = require('sqlite3');

const artistsRouter = express.Router();

const db = new sqlite3.Database(
	process.env.TEST_DATABASE || './database.sqlite'
);

artistsRouter.param('artistId', (req, res, next, id) => {
	const query = `
        SELECT * 
        FROM Artist 
        WHERE id = $artistId
    `;

	const ph = { $artistId: id };
	const cb = (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			req.artist = row;
			next();
		} else {
			res.sendStatus(404);
		}
	};
	db.get(query, ph, cb);
});

// Read all entries
artistsRouter.get('/', (req, res, next) => {
	const query = `
        SELECT * 
        FROM Artist 
        WHERE is_currently_employed = 1
    `;

	const cb = (err, row) => {
		if (err) {
			next(err);
		} else {
			res.status(200).json({ artists: row });
		}
	};

	db.all(query, cb);
});

// Read a single entry
artistsRouter.get('/:artistId', (req, res, next) => {
	res.status(200).json({ artist: req.artist });
});

// Create an entry
artistsRouter.post('/', (req, res, next) => {
	const name = req.body.artist.name;
	const birthDate = req.body.artist.dateOfBirth;
	const bio = req.body.artist.biography;
	const emplStatus = req.body.artist.is_currently_employed === 0 ? 0 : 1;

	if (!name || !birthDate || !bio) {
		res.sendStatus(400);
	}

	const query = `
        INSERT INTO Artist (
            name, 
            date_of_birth, 
            biography, 
            is_currently_employed
        ) 
        VALUES (
            $name, 
            $birthDate, 
            $bio, 
            $emplStatus
        )
    `;

	const ph = {
		$name: name,
		$birthDate: birthDate,
		$bio: bio,
		$emplStatus: emplStatus,
	};

	function cb(err) {
		if (err) {
			next(err);
		} else {
			db.get(
				`SELECT * FROM Artist WHERE id = $id`,
				{ $id: this.lastID },
				(err, row) => {
					res.status(201).json({ artist: row });
				}
			);
		}
	}

	db.run(query, ph, cb);
});

// Update an entry
artistsRouter.put('/:artistId', (req, res, next) => {
	const name = req.body.artist.name;
	const birthDate = req.body.artist.dateOfBirth;
	const bio = req.body.artist.biography;
	const emplStatus = req.body.artist.is_currently_employed === 0 ? 0 : 1;

	if (!name || !birthDate || !bio) {
		res.sendStatus(400);
	}

	const query = `
        UPDATE Artist 
        SET name = $name, 
            date_of_birth = $birthDate, 
            biography = $bio, 
            is_currently_employed = $emplStatus
        WHERE id = $id
    `;

	const ph = {
		$name: name,
		$birthDate: birthDate,
		$bio: bio,
		$emplStatus: emplStatus,
		$id: req.params.artistId,
	};

	const cb = (err) => {
		if (err) {
			next(err);
		} else {
			db.get(
				`SELECT * FROM Artist WHERE id = $id`,
				{ $id: req.params.artistId },
				(err, row) => {
					res.status(200).json({ artist: row });
				}
			);
		}
	};

	db.run(query, ph, cb);
});

// Change emplStatus to unemployed
artistsRouter.delete('/:artistId', (req, res, next) => {
	const query = `
        UPDATE Artist
        SET is_currently_employed = 0
        WHERE id = $id
    `;

	const ph = { $id: req.params.artistId };

	const cb = (err) => {
		if (err) {
			next(err);
		} else {
			db.get(
				`SELECT * FROM Artist WHERE id = $id`,
				{ $id: req.params.artistId },
				(err, row) => {
					res.status(200).json({ artist: row });
				}
			);
		}
	};

	db.run(query, ph, cb);
});

module.exports = artistsRouter;

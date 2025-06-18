const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Both username and password are required.');
    }

    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;

    db.get(query, [username, password], (err, row) => {
        if (err) {
            return res.status(500).send('Error during login: ' + err.message);
        }

        if (row) {
            res.status(200).send(`Welcome, ${row.fullname}!`);
        } else {
            res.status(401).send('Invalid username or password.');
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Login server running on http://localhost:${PORT}`);
});

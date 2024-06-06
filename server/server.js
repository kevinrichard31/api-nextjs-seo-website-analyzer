const axios = require('axios');
const cheerio = require('cheerio');
const urlModule = require('url');
const express = require('express');
const async = require('async'); // Add async library
const app = express();
const PORT = 3001;
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'jwt_signature_1823641*9238476*';
const connection = require('../config');


const { findMissingH1Tags, findMissingAltTags } = require('../data')
const { addHttpsPrefix } = require('../utils')
const concurrency = 5; // Set the concurrency limit

const cors = require('cors');
app.use(cors());
app.use(express.json());

// Route pour envoyer un JSON
app.post('/addUrl', (req, res) => {
  if (req.body.url && isValidURL(req.body.url)) {
    const formattedUrl = addHttpsPrefix(req.body.url);

    // Obtenir la date actuelle
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    const insertionQuery = 'INSERT IGNORE INTO sites (baseUrl, date) VALUES (?, ?)';
    connection.query(insertionQuery, [formattedUrl, fifteenMinutesAgo], (err, results) => {
      if (err) {
        console.error('Erreur lors de l\'insertion : ', err);
        res.json(false);
      } else {
        console.log('Nouvelle ligne insérée avec succès!');
        console.log('ID de la nouvelle ligne : ', results.insertId);
        let siteId = results.insertId;
        // INSERT ALSO IN URLS TABLE
        const insertionQuery = 'INSERT IGNORE INTO urls (url, date, sites_id) VALUES (?, ?, ?)';
        connection.query(insertionQuery, [formattedUrl, fifteenMinutesAgo, siteId], (err, results) => {
          if (err) {
            console.error('Erreur lors de l\'insertion : ', err);
            res.json("ADDED");
          } else {
            console.log('Nouvelle ligne insérée avec succès!');
            console.log('ID de la nouvelle ligne : ', results.insertId);
            const updateQuery = 'UPDATE sites SET countAdded = 1 WHERE id = ?';
            connection.query(updateQuery, [siteId], (err, results) => {
                if (err) {
                    console.error('Erreur lors de la mise à jour : ', err);
                } else {
                    console.log('Mise à jour réussie. Nombre de lignes modifiées :', results.affectedRows);
                }
            });
            res.json("ADDED");
          }
        });
      }
    });
  } else {
    // Retourner une erreur si l'URL n'est pas valide
    res.json(false);
  }
});


app.get('/getIssuesHomepage/:siteId', (req, res) => {
  const siteId = req.params.siteId;
  const query = 'SELECT * FROM issues WHERE sites_id = ? LIMIT 10';

  connection.query(query, [siteId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des données : ', err);
      res.status(500).json({ error: 'Erreur lors de la récupération des données' });
    } else {
      res.json(results);
    }
  });
});

app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName|| !email|| !password) {
    return res.status(400).json({ msg: 'Please provide a username and password' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("🌱 - app.post - hashedPassword:", hashedPassword)
  connection.query(
    'INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)',
    [firstName, lastName, email, hashedPassword],
    (err, results) => {
      if (err) {
        return res.status(500).json({ msg: 'Error registering user' });
      }
      res.status(201).json({ msg: 'User registered successfully' });
    }
  );
});

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(403).json({ msg: 'No token provided' });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(500).json({ msg: 'Failed to authenticate token' });
    }
    req.userId = decoded.id;
    next();
  });
};


// Route pour connecter un utilisateur et générer un token JWT
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
  }

  connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, results) => {
          if (err || results.length === 0) {
              return res.status(400).json({ msg: 'User not found' });
          }

          const user = results[0];
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
              return res.status(401).json({ msg: 'Invalid password' });
          }

          const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
          res.json({ msg: 'Login successful', token });
      }
  );
});

// Route protégée pour obtenir des informations de l'utilisateur
app.get('/userInfo', verifyToken, (req, res) => {
  connection.query(
      'SELECT firstName, lastName, email FROM users WHERE id = ?',
      [req.userId],
      (err, results) => {
          if (err) {
              return res.status(500).json({ msg: 'Error fetching user info' });
          }
          res.json(results[0]);
      }
  );
});

// Example protected route
app.get('/protected', verifyToken, (req, res) => {
  res.json({ msg: 'This is a protected route' });
});
function startServer(){
    app.listen(PORT, () => {
        console.log(`Serveur Express en cours d'exécution sur le port ${PORT}`);
      });
}

function isValidURL(url) {
  // Vérifier la longueur totale de l'URL
  if (url.length > 30) {
    return false;
  }

  // Trouver le dernier point dans l'URL
  const dernierPointIndex = url.lastIndexOf('.');

  // Vérifier s'il y a moins de 5 caractères après le dernier point
  if (dernierPointIndex !== -1 && url.length - dernierPointIndex - 1 > 5) {
    return false;
  }

  // Vérifier s'il y a au moins un caractère avant et après le dernier point
  if (dernierPointIndex === -1 || dernierPointIndex === 0 || dernierPointIndex === url.length - 1) {
    return false;
  }

  // Si toutes les conditions sont remplies, retourner true
  return true;
}


module.exports = {
    startServer
}
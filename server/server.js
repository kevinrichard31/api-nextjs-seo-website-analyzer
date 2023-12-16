const axios = require('axios');
const cheerio = require('cheerio');
const urlModule = require('url');
const express = require('express');
const async = require('async'); // Add async library
const app = express();
const PORT = 3001;
const mysql = require('mysql2');

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
        // INSERT ALSO IN URLS TABLE
        const insertionQuery = 'INSERT IGNORE INTO urls (url, date, sites_id) VALUES (?, ?, ?)';
        connection.query(insertionQuery, [formattedUrl, fifteenMinutesAgo, results.insertId], (err, results) => {
          if (err) {
            console.error('Erreur lors de l\'insertion : ', err);
            res.json("ADDED");
          } else {
            console.log('Nouvelle ligne insérée avec succès!');
            console.log('ID de la nouvelle ligne : ', results.insertId);

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
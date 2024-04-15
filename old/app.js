const axios = require('axios');
const cheerio = require('cheerio');
const urlModule = require('url');
const express = require('express');
const async = require('async'); // Add async library
const app = express();
const PORT = 3001;
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '163.172.174.96',
  user: 'testeed',
  password: 'passpass31',
  database: 'seob',
  port: '3306'
});


const { findMissingH1Tags, findMissingAltTags } = require('../data')
const { addHttpsPrefix } = require('../utils')
const concurrency = 5; // Set the concurrency limit

// Create an async queue with concurrency control
const queue = async.queue(async (task, callback) => {
  const { url, id } = task;
  await crawl(url, id);
  callback(); // No need for setTimeout
}, concurrency);


// Fonction pour faire la requête HTTP et extraire les données
async function crawl(url, id) {
console.log("🌱 - file: app.js:25 - crawl - crawl:")
  try {
    const updateQuery = 'UPDATE urls SET date = NOW() WHERE id = ?';
    
    connection.query(updateQuery, [id], (err, updateResults) => {
      if (err) {
        console.error('Erreur lors de la mise à jour : ', err);
      } else {
        console.log("🌱 - file: app.js:32 - connection.query - updateResults:", updateResults.affectedRows, "row(s) updated");
      }
    });    

    // Faire une requête HTTP pour obtenir le contenu de la page
    const response = await axios.get(url);

    // Charger le contenu dans cheerio
    const $ = cheerio.load(response.data);

    // Exemple : extraire le titre de la page
    const pageTitle = $('head title').text();
    console.log('Titre de la page:', pageTitle);

    // Stocker les liens internes et externes
    const internalLinks = [];
    const externalLinks = [];

    // Exemple : extraire et trier les liens de la page
    $('a').each((index, element) => {
      const link = $(element).attr('href');

      if (link) {
        // Vérifier si le lien est interne ou externe
        const resolvedUrl = new urlModule.URL(link, url).toString();
        if (new urlModule.URL(resolvedUrl).hostname === new urlModule.URL(url).hostname) {
          // Ajouter uniquement les liens internes non vides et sans doublons
          if (link !== '#' && !internalLinks.includes(resolvedUrl)) {
            internalLinks.push(resolvedUrl);
          }
        } else {
          externalLinks.push(link);
        }
      }
    });

    // console.log("🌱 - file: app.js:38 - crawl - internalLinks:", internalLinks)
    // console.log("🌱 - file: app.js:40 - crawl - externalLinks:", externalLinks)

    // Appeler la fonction pour trouver si les balises h1 sont manquantes
    const h1TagsMissing = findMissingH1Tags(response.data);

    if (h1TagsMissing) {
      // console.log('Aucune balise h1 trouvée sur la page.');
    } else {
      // console.log('Au moins une balise h1 présente sur la page.');
    }

    const missingAltTags = findMissingAltTags(response.data);

    if (missingAltTags.length === 0) {
      // console.log('Toutes les balises img ont un attribut alt.');
    } else {
      // console.log('Balises img sans attribut alt :', missingAltTags);
    }

    return internalLinks
  } catch (error) {
    console.error('Erreur lors du crawl :', error.message);
  }
}

// Exemple d'utilisation
const urlToCrawl = 'https://lesnoeudsdupaps.fr/';
crawl(urlToCrawl);
const cors = require('cors');
app.use(cors());
// Middleware pour le corps de la requête au format JSON
app.use(express.json());

// Route pour envoyer un JSON
app.post('/addUrl', (req, res) => {
  if (req.body.url && isValidURL(req.body.url)) {
    const formattedUrl = addHttpsPrefix(req.body.url);

    // Obtenir la date actuelle
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    const insertionQuery = 'INSERT IGNORE INTO urls (url, date) VALUES (?, ?)';
    connection.query(insertionQuery, [formattedUrl, fifteenMinutesAgo], (err, results) => {
      if (err) {
        console.error('Erreur lors de l\'insertion : ', err);
        res.json(false);
      } else {
        console.log('Nouvelle ligne insérée avec succès!');
        console.log('ID de la nouvelle ligne : ', results.insertId);
        res.json("ADDED");
      }
    });
  } else {
    // Retourner une erreur si l'URL n'est pas valide
    res.json(false);
  }
});


// Démarrer le serveur
// app.listen(PORT, () => {
//   console.log(`Serveur Express en cours d'exécution sur le port ${PORT}`);
// });

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

function intervalCheck() {
  // Calculer la date limite en soustrayant 15 minutes de la date actuelle
  const fifteenMinutesAgo = new Date();
  fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);


  const selectQuery = 'SELECT * FROM urls WHERE date < ? LIMIT 1';
  connection.query(selectQuery, [fifteenMinutesAgo], (err, results) => {
    if (err) {
      console.error('Erreur lors de la sélection : ', err);
    } else {
      results.forEach(async (element) => {
        try {
          const urlsCrawl = await crawl(element.url, element.id);

          // Prepare the data for bulk insert
          const bulkInsertData = urlsCrawl.map(internalUrl => [internalUrl, fifteenMinutesAgo]);
          
          // Use a single bulk insert query
          const bulkInsertQuery = 'INSERT IGNORE INTO urls (url, date) VALUES ?';
          connection.query(bulkInsertQuery, [bulkInsertData], (err, results) => {
            console.log(results)
            if (err) {
              console.error('Erreur lors de l\'insertion : ', err);
            } else {
              console.log('Lignes insérées avec succès:', results.affectedRows);
              // Push a new element into the queue after bulk insert is done
              queue.push({ url: element.url, id: element.id });
            }
          });
        } catch (error) {
          console.log(error);
        }
      });
    }
  });
}


setInterval(() => {
  intervalCheck()
}, 2000);
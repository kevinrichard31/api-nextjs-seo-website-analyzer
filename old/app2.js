const axios = require('axios');
const cheerio = require('cheerio');
const urlModule = require('url');
const express = require('express');
const app = express();
const PORT = 3001;

const mysql = require('mysql2/promise');

// Remplacez les valeurs suivantes par les informations de votre base de données
const pool = mysql.createPool({
  host: '163.172.174.96',
  user: 'testeed',
  password: 'passpass31',
  database: 'seob',
  port: '3306'
});

const { findMissingH1Tags, findMissingAltTags } = require('../data')
const { addHttpsPrefix } = require('../utils')
const cors = require('cors');
app.use(cors());
app.use(express.json());
app.listen(PORT, () => {
  console.log(`Serveur Express en cours d'exécution sur le port ${PORT}`);
});

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




// Fonction pour récupérer les URLs depuis la base de données
async function getUrlsToCrawl() {
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    const [rows] = await pool.execute('SELECT url FROM urls WHERE date < ? LIMIT 2', [fifteenMinutesAgo]);
    return rows;
}

// Fonction pour mettre à jour le statut d'une URL dans la base de données
async function updateUrlStatus(url, status) {
    const date = new Date();
  await pool.execute('UPDATE urls SET date = ? WHERE url = ?', [date, url]);
}

// Fonction pour crawler une URL avec un timeout de 10 secondes
async function crawlUrl(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    console.log(`Crawled ${url}, status: ${response.status}`);
    await updateUrlStatus(url, 'crawled');
  } catch (error) {
    console.error(`Error crawling ${url}: ${error.message}`);
    await updateUrlStatus(url, 'failed');
  }
}

// Fonction principale pour gérer le processus de crawling
async function crawlPages() {
  try {
    setInterval(async () => {
      const urlsToCrawl = await getUrlsToCrawl();

      if (urlsToCrawl.length === 0) {
        console.log('No pending URLs.');
      } else {
        const crawlPromises = urlsToCrawl.map(urlData => crawlUrl(urlData.url));
        await Promise.all(crawlPromises);
      }
    }, 10 * 1000); // Vérifier toutes les 10 secondes
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    // Fermer la connexion à la base de données une fois le processus terminé

  }
}

// Appeler la fonction principale pour commencer le processus de crawling
crawlPages();


// Route pour envoyer un JSON
app.post('/addUrl', (req, res) => {
    if (req.body.url && isValidURL(req.body.url)) {
      const formattedUrl = addHttpsPrefix(req.body.url);
  
    // Obtenir la date actuelle
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    const insertionQuery = 'INSERT IGNORE INTO urls (url, date) VALUES (?, ?)';
      pool.execute(insertionQuery, [formattedUrl, fifteenMinutesAgo])
        .then(results => {
          console.log('Nouvelle ligne insérée avec succès!');
          console.log('ID de la nouvelle ligne : ', results[0].insertId);
          res.json("ADDED");
        })
        .catch(err => {
          console.error('Erreur lors de l\'insertion : ', err);
          res.json(false);
        });
    } else {
      // Retourner une erreur si l'URL n'est pas valide
      res.json(false);
    }
  });
  
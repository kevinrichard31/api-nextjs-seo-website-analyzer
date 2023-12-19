const axios = require('axios');
const cheerio = require('cheerio');
const urlModule = require('url');
const mysql = require('mysql2');
const connection = require('../config');


// Fonction de crawl pour récupérer le contenu d'une URL
const crawl = async (url, id) => {
  try {
    const updateQuery = 'UPDATE urls SET date = NOW() WHERE id = ?';

    connection.query(updateQuery, [id], (err, updateResults) => {
      if (err) {
        console.error('Erreur lors de la mise à jour : ', err);
      } else {
        console.log(
          '🌱 - file: app.js:32 - connection.query - updateResults:',
          updateResults.affectedRows,
          'row(s) updated'
        );
      }
    });

    // Faire une requête HTTP pour obtenir le contenu de la page avec un timeout de 10 secondes
    const response = await axios.get(url, { timeout: 10000 }); // 10 secondes

    // Charger le contenu dans cheerio
    const $ = cheerio.load(response.data);
    // console.log(response.data)
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
    console.log("🌱 - file: crawl.js:54 - crawl - internalLinks:", internalLinks);
    return internalLinks;
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      // Handle timeout error
      console.error(`Timeout error crawling ${url}: ${error.message}`);
    } else {
      // Handle other errors
      console.error(`Error crawling ${url}: ${error.message}`);
    }
    // Throw the error again to indicate failure
    throw error;
  }
};


module.exports = {
    crawl
}
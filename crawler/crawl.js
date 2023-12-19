const axios = require('axios');
const cheerio = require('cheerio');
const urlModule = require('url');
const mysql = require('mysql2');
const connection = require('../config');
const puppeteer = require('puppeteer');



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


    const browser = await puppeteer.launch({ headless: true });
    let page = await browser.newPage();
  

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(resolve, 8000, 'Timeout reached')
    );

    const pagePromise = page.goto(url).then(() => page.content());

    const result = await Promise.race([timeoutPromise, pagePromise]);

    if (result === 'Timeout reached') {
      console.log('Timeout reached for:', url);
      // Vous pouvez ajouter un code pour passer à la page suivante ici
    } else {
      const $ = cheerio.load(result);
      const internalLinks = [];
      const externalLinks = [];

      $('a').each((index, element) => {
        const link = $(element).attr('href');

        if (link) {
          const resolvedUrl = new urlModule.URL(link, url).toString();
          if (new urlModule.URL(resolvedUrl).hostname === new urlModule.URL(url).hostname) {
            if (link !== '#' && !internalLinks.includes(resolvedUrl)) {
              internalLinks.push(resolvedUrl);
            }
          } else {
            externalLinks.push(link);
          }
        }
      });

      console.log("🌱 - file: pup.js:29 - parse - internalLinks:", internalLinks);
      console.log("🌱 - file: pup.js:30 - parse - externalLinks:", externalLinks);

      return internalLinks;
    }

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
};


module.exports = {
    crawl
}
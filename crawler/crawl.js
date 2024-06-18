// PUPPETEER VERSION
const axios = require('axios');
const cheerio = require('cheerio');
const urlModule = require('url');
const mysql = require('mysql2');
const connection = require('../config');
const puppeteer = require('puppeteer');
const dataParser = require('../dataParser/dataParser');

let page
async function startpup() {
  const browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
}

startpup();
const crawl = async (url, urlId, siteId) => {
  try {
    const updateQuery = 'UPDATE urls SET date = NOW() WHERE id = ?';

    connection.query(updateQuery, [urlId], (err, updateResults) => {
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



  

    const timeoutPromise = new Promise((resolve) =>
      {console.log('timeout');
      setTimeout(resolve, 8000, 'Timeout reached')}
    );

    const start = Date.now()
    const pagePromise = page.goto(url).then(() => page.content());
    const result = await Promise.race([timeoutPromise, pagePromise]);
    const loadtime = Date.now() - start

    if (result === 'Timeout reached') {
      console.log('Timeout reached for:', url);
    } else {
      const $ = cheerio.load(result);
      const internalLinks = [];
      const externalLinks = [];
      const images = [];

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
      const imageElements = $('img');
      for (let i = 0; i < imageElements.length; i++) {
        const element = imageElements[i];
        const src = $(element).attr('src');
        const extension = src.split('.').pop().toLowerCase();
        // Vérifier si l'extension est jpg, jpeg, png ou webp
        if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
          const dimensions = await page.evaluate(imgSrc => {
            const img = document.querySelector(`img[src="${imgSrc}"]`);
            return { width: img.width, height: img.height };
          }, src);
          images.push({ src, ...dimensions });
        }
      }
      
      let allErrors = dataParser.parseData(result, images);
      console.log("🌱 - crawl - allErrors:", allErrors)
      console.log(allErrors)

      allErrors.push({ error: `Load Time ${loadtime} ms` });
      allErrors.forEach(error => {
        const insertionQuery = 'INSERT IGNORE INTO issues (type, urls_id, sites_id) VALUES (?, ?, ?)';
        connection.query(insertionQuery, [error.error, urlId, siteId], (err, results) => {
          if (err) {
            console.error('Erreur lors de l\'insertion : ', err);
          } else {
            console.log('Erreur ajoutée');
          }
        });
      });


    
      // console.log("🌱 - file: pup.js:29 - parse - internalLinks:", internalLinks);
      // console.log("🌱 - file: pup.js:30 - parse - externalLinks:", externalLinks);

      return internalLinks;
    }
      console.log("🌱 - crawl - allErrors:", allErrors)

    // await browser.close();
  } catch (error) {
    console.error('Error:', error);
    // await browser.close();
  }
};


module.exports = {
    crawl
}
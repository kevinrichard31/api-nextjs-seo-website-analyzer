const puppeteer = require('puppeteer');
const mysql = require('mysql2');
const connection = require('./config');


const selectwebsite = 'SELECT * FROM sites';
// connection.query(selectwebsite, (err, results) => {
//     if (err) {
//         console.error('Erreur lors de la sélection : ', err);
//     } else {
//         console.log(results)
//     }
// });

let sites = [
  { link: 'https://epiceriedusud.fr/', id: 10000 },
  { link: 'https://www.darty.com/', id: 10000 },
  { link: 'https://huilearomds.com/', id: 10000 }
];

async function parse(sites) {
  console.log('parsed');

  const browser = await puppeteer.launch({ headless: true });
  let page = await browser.newPage();

  for (site of sites) {
    try {
      console.log('test');
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(resolve, 8000, 'Timeout reached')
      );

      const pagePromise = page.goto(site.link).then(() => page.content());

      const result = await Promise.race([timeoutPromise, pagePromise]);

      if (result === 'Timeout reached') {
        console.log('Timeout reached for:', site.link);
        // Vous pouvez ajouter un code pour passer à la page suivante ici
        continue;
      }

      const data = result;
      const pageTitle = await page.title();
      console.log("🌱 - file: pup.js:29 - parse - pageTitle:", pageTitle);
    } catch (e) {
      console.error('Error:', e);
    }
  }

  await browser.close();
}

parse(sites);

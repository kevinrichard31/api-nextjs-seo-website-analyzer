const puppeteer = require('puppeteer');

(async () => {
  try {
    // Lancer le navigateur Puppeteer en mode non headless
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
    });

    // Ouvrir une nouvelle page
    const page = await browser.newPage();

    // Emuler un user-agent aléatoire pour simuler un navigateur humain
    await page.setUserAgent(await browser.userAgent());

    // URL à crawler
    const url = 'https://montpellier-vo.espacevo.fr';

    // Accéder à l'URL
    await page.goto(url);

    // Attendre un court instant pour simuler un comportement humain
    await page.waitForTimeout(2000);

    // Récupérer le HTML de la page
    const html = await page.content();

    // Afficher le HTML dans la console
    console.log(html);

    // Fermer le navigateur Puppeteer
    await browser.close();
  } catch (error) {
    console.error('Une erreur s\'est produite : ', error);
  }
})();

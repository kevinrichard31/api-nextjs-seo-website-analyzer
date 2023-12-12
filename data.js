// myFunctions.js

const cheerio = require('cheerio');

// Fonction pour analyser le HTML et trouver les balises h1 manquantes
function findMissingH1Tags(html) {
  const $ = cheerio.load(html);

  const allH1Tags = $('h1');
  const allH1Texts = allH1Tags.map((index, element) => $(element).text()).get();

  return allH1Texts.length === 0;
}
function findMissingAltTags(html) {
  const $ = cheerio.load(html);

  const allImgTags = $('img');
  const missingAltTags = [];

  allImgTags.each((index, element) => {
    const altAttribute = $(element).attr('alt');
    const srcAttribute = $(element).attr('src');
    const titleAttribute = $(element).attr('title');

    if (!altAttribute || altAttribute.trim() === '') {
      missingAltTags.push({
        title: titleAttribute, 
        src: srcAttribute,
        alt: altAttribute
      }); // Stocker l'URL au lieu de l'élément
    }
  });

  return missingAltTags;
}


// Exporter la fonction pour la rendre accessible à d'autres fichiers
module.exports = {
  findMissingH1Tags,
  findMissingAltTags
};

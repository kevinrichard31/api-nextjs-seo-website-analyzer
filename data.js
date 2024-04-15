// myFunctions.js

const cheerio = require('cheerio');

// Fonction pour analyser le HTML et trouver les balises h1 manquantes
function findMissingH1Tags(html) {
  const $ = cheerio.load(html);

  const allH1Tags = $('h1');
  const allH1Texts = allH1Tags.map((index, element) => $(element).text()).get();

  if (allH1Texts.length === 0){
    return {error: 'H1 missing'}
  }
}
function findMissingH2Tags(html) {
  const $ = cheerio.load(html);

  const allH1Tags = $('h2');
  const allH1Texts = allH1Tags.map((index, element) => $(element).text()).get();

  if (allH1Texts.length === 0){
    return {error: 'H2 missing'}
  }
}
function findMissingH3Tags(html) {
  const $ = cheerio.load(html);

  const allH1Tags = $('h3');
  const allH1Texts = allH1Tags.map((index, element) => $(element).text()).get();

  if (allH1Texts.length === 0){
    return {error: 'H3 missing'}
  }
}
function findMissingAltTags(image) {
  if(image.width > 100){
    return {error: 'Missing alt image', image: image.src, width: image.width, height: image.height}
  }
}


// Exporter la fonction pour la rendre accessible à d'autres fichiers
module.exports = {
  findMissingH1Tags,
  findMissingH2Tags,
  findMissingH3Tags,
  findMissingAltTags
};

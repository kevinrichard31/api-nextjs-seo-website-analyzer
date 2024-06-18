// myFunctions.js

const cheerio = require('cheerio');
const data = require('../data')

// Fonction pour analyser le HTML et trouver les balises h1 manquantes
function parseData(html, images) {
  let allErrors = []
  var missingH1Tags = data.findMissingH1Tags(html);
  if (missingH1Tags !== null && missingH1Tags !== undefined) {
      allErrors.push(missingH1Tags);
  }
  var missingH2Tags = data.findMissingH2Tags(html);
  if (missingH2Tags !== null && missingH2Tags !== undefined) {
      allErrors.push(missingH2Tags);
  }
  var missingH3Tags = data.findMissingH3Tags(html);
  if (missingH3Tags !== null && missingH3Tags !== undefined) {
      allErrors.push(missingH3Tags);
  }
  images.forEach(image => {
    var imageParsed = data.findMissingAltTags(image);
    if (imageParsed !== null && imageParsed !== undefined) {
        allErrors.push(imageParsed);
    }
  });
  var missingTitleTag = data.findMissingTitleTag(html);
  if (missingTitleTag !== null && missingTitleTag !== undefined) {
      allErrors.push(missingTitleTag);
  }
  var missingMetaDescription = data.findMissingMetaDescription(html);
  if (missingMetaDescription !== null && missingMetaDescription !== undefined) {
      allErrors.push(missingMetaDescription);
  }
  var missingCanonicalTag = data.findCanonicalTag(html);
  if (missingCanonicalTag !== null && missingCanonicalTag !== undefined) {
      allErrors.push(missingCanonicalTag);
  }
//   var checkHeading = data.checkHeadingOrder(html);
//   if (checkHeading !== null && checkHeading !== undefined) {
//       allErrors.push(checkHeading);
//   }


  return allErrors
}

// Exporter la fonction pour la rendre accessible à d'autres fichiers
module.exports = {
    parseData
};

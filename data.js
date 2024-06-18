// myFunctions.js

const cheerio = require('cheerio');

// Fonction pour analyser le HTML et trouver les balises h1 manquantes
function findMissingH1Tags(html) {
  const $ = cheerio.load(html);

  const allH1Tags = $('h1');
  const allH1Texts = allH1Tags.map((index, element) => $(element).text()).get();

  if (allH1Texts.length === 0) {
    return { error: 'H1 missing' }
  }
}
function findMissingH2Tags(html) {
  const $ = cheerio.load(html);

  const allH1Tags = $('h2');
  const allH1Texts = allH1Tags.map((index, element) => $(element).text()).get();

  if (allH1Texts.length === 0) {
    return { error: 'H2 missing' }
  }
}
function findMissingH3Tags(html) {
  const $ = cheerio.load(html);

  const allH1Tags = $('h3');
  const allH1Texts = allH1Tags.map((index, element) => $(element).text()).get();

  if (allH1Texts.length === 0) {
    return { error: 'H3 missing' }
  }
}
function findMissingAltTags(image) {
  if (image.width > 100) {
    return { error: 'Missing alt image', image: image.src, width: image.width, height: image.height }
  }
}

function findMissingTitleTag(html) {
  const $ = cheerio.load(html);
  const title = $('title').text();

  if (!title) {
    return { error: 'Title tag missing' };
  }
}

function findMissingMetaDescription(html) {
  const $ = cheerio.load(html);
  const metaDescription = $('meta[name="description"]').attr('content');

  if (!metaDescription) {
    return { error: 'Meta description missing' };
  }
}

function findCanonicalTag(html) {
  const $ = cheerio.load(html);
  const canonical = $('link[rel="canonical"]').attr('href');

  if (!canonical) {
    return { error: 'Canonical tag missing' };
  }
}

function checkHeadingOrder(html) {
  const $ = cheerio.load(html);
  const headings = $('h1, h2, h3');
  let levelsFound = { h1: false, h2: false, h3: false };
  let errors = [];

  headings.each((index, element) => {
    const tagName = $(element).get(0).tagName;

    if (tagName === 'h1') {
      levelsFound.h1 = true;
    } else if (tagName === 'h2') {
      if (!levelsFound.h1) {
        errors.push({
          error: '<h2> found without a preceding <h1>',
          heading: $(element).text()
        });
      } else {
        levelsFound.h2 = true;
      }
    } else if (tagName === 'h3') {
      if (!levelsFound.h2) {
        errors.push({
          error: '<h3> found without a preceding <h2>',
          heading: $(element).text()
        });
      } else {
        levelsFound.h3 = true;
      }
    }
  });

  if (errors.length > 0) {
    return { error: JSON.stringify(errors) };
  }
  return { message: 'Headings are in correct order' };
}



// Exporter la fonction pour la rendre accessible à d'autres fichiers
module.exports = {
  findMissingH1Tags,
  findMissingH2Tags,
  findMissingH3Tags,
  findMissingAltTags,
  findMissingTitleTag,
  findMissingMetaDescription,
  findCanonicalTag,
  checkHeadingOrder
};

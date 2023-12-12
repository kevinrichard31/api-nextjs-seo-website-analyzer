function addHttpsPrefix(url) {
    // Vérifie si l'URL commence déjà par "http://" ou "https://"
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Ajoute "https://" à l'URL si le préfixe n'est pas présent
      url = 'https://' + url;
    }
    return url;
  }

  module.exports ={
    addHttpsPrefix
  }
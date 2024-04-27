const axios = require('axios');
const cheerio = require('cheerio');
const urlModule = require('url');
const express = require('express');
const async = require('async'); // Add async library
const app = express();
const PORT = 3001;


const connection = require('./config');

const { findMissingH1Tags, findMissingAltTags } = require('./data')
const { addHttpsPrefix } = require('./utils')
const crawler = require('./crawler/crawl')
const server = require('./server/server')
server.startServer();


const uuid = require('uuid'); // Assurez-vous d'installer le module uuid avec npm install uuid

// Créer une file d'attente asynchrone
let taskQueue = async.queue(async ({url,id, siteId}, callback) => {
  const fifteenMinutesAgo = new Date();
  fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
  const internalLinks = await crawler.crawl(url, id, siteId);
  if(internalLinks.length <= 0 || internalLinks == undefined){
    incrementCountSite(siteId)
      connection.query("ALTER TABLE `urls` AUTO_INCREMENT = 1;", (err, results) => {
    });
    return;
  }

  

  connection.query("ALTER TABLE `urls` AUTO_INCREMENT = 1;", (err, results) => {
  });
  // Prepare the data for bulk insert
  const bulkInsertData = internalLinks.map(internalUrl => [internalUrl, fifteenMinutesAgo, siteId, url]);

  // Use a single bulk insert query
  const bulkInsertQuery = 'INSERT IGNORE INTO urls (url, date, sites_id, fromUrl) VALUES ?';
  connection.query(bulkInsertQuery, [bulkInsertData], (err, results) => {
    console.log(results)
    if (err) {
      console.error('Erreur lors de l\'insertion : ', err);
      incrementCountSite(siteId)
        connection.query("ALTER TABLE `urls` AUTO_INCREMENT = 1;", (err, results) => {
      });
    } else {
      console.log('Lignes insérées avec succès:', results.affectedRows);
      const updateQuery = 'UPDATE sites SET countAdded = countAdded + ? WHERE id = ?';
      connection.query(updateQuery, [results.affectedRows, siteId], (err, results) => {
          if (err) {
              console.error('Erreur lors de la mise à jour : ', err);
          } else {
              console.log('Mise à jour réussie. Nombre de lignes modifiées :', results.affectedRows);
          }
      });
      incrementCountSite(siteId)
        connection.query("ALTER TABLE `urls` AUTO_INCREMENT = 1;", (err, results) => {
      });
    }
  });

  callback();
}, 1);

function intervalCheck() {
  // Calculer la date limite en soustrayant 15 minutes de la date actuelle
  const fifteenMinutesAgo = new Date();
  fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

  //1 SELECT WEBSITES
  const selectwebsite = 'SELECT * FROM sites WHERE sites.countCrawled < sites.limit AND sites.countAdded > sites.countCrawled ORDER BY RAND() LIMIT 1';
  connection.query(selectwebsite, (err, results) => {
    if (err) {
      console.error('Erreur lors de la sélection : ', err);
    } else {
      try {
        let siteId = results[0].id;
        const selectQuery = 'SELECT * FROM urls WHERE DATE < ? AND urls.sites_id = ? LIMIT 1';
        connection.query(selectQuery, [fifteenMinutesAgo, siteId], (err, results) => {
          if (err) {
            console.error('Erreur lors de la sélection : ', err);
          } else {
            if(results.length == 0){
              const updateQuery = 'UPDATE sites SET countCrawled = countCrawled + 1 WHERE id = ?';
              connection.query(updateQuery, [siteId], (err, results) => {
                  if (err) {
                      console.error('Erreur lors de la mise à jour : ', err);
                  } else {
                      console.log('Mise à jour réussie. Nombre de lignes modifiées :', results.affectedRows);
                  }
              });
            }
            results.forEach(async (element) => {
              try {
                  if(isIdInQueue(element.id) == false){
                    taskQueue.push({ url: element.url, id: element.id, siteId: siteId });
                    console.log("on ajoute dans la queue")
                  }
              } catch (error) {
                console.log(error);
              }
            });
          }
        });
      } catch (error) {
        // console.log(error)
      }
    }
  }); 


}

setInterval(() => {
  intervalCheck()
}, 500);


// Événement déclenché à la fin de chaque tâche
taskQueue.drain(() => {
  console.log('All tasks have been processed');
});




function isIdInQueue(id) {
  let result = false;
  const isIdExist = function(task, callback) {
    if(task.id == id){
      callback(true)
    }
  };
  async.each(taskQueue, isIdExist, function(err) {
    if( err ) {
        result = true;
    } else {
        console.log('nonp présent');
    }
  });
  return result;
}





function incrementCountSite(siteId){
  const updateQuery = 'UPDATE sites SET countCrawled = countCrawled + 1 WHERE id = ?';
  connection.query(updateQuery, [siteId], (err, results) => {
      if (err) {
          console.error('Erreur lors de la mise à jour : ', err);
      } else {
          console.log('Mise à jour réussie. Nombre de lignes modifiées :', results.affectedRows);
          return results
      }
  });
}
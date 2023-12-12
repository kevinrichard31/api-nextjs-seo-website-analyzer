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
let taskQueue = async.queue(async ({url,id}, callback) => {
  const fifteenMinutesAgo = new Date();
  fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
  const internalLinks = await crawler.crawl(url, id);

  

  connection.query("ALTER TABLE `urls` AUTO_INCREMENT = 1;", (err, results) => {
  });
  // Prepare the data for bulk insert
  const bulkInsertData = internalLinks.map(internalUrl => [internalUrl, fifteenMinutesAgo]);

  // Use a single bulk insert query
  const bulkInsertQuery = 'INSERT IGNORE INTO urls (url, date) VALUES ?';
  connection.query(bulkInsertQuery, [bulkInsertData], (err, results) => {
    console.log(results)
    if (err) {
      console.error('Erreur lors de l\'insertion : ', err);
        connection.query("ALTER TABLE `urls` AUTO_INCREMENT = 1;", (err, results) => {
        });
    } else {
      console.log('Lignes insérées avec succès:', results.affectedRows);
        connection.query("ALTER TABLE `urls` AUTO_INCREMENT = 1;", (err, results) => {
        });
    }
  });

  callback();
}, 2);

function intervalCheck() {
  // Calculer la date limite en soustrayant 15 minutes de la date actuelle
  const fifteenMinutesAgo = new Date();
  fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);


  const selectQuery = 'SELECT * FROM urls WHERE date < ? LIMIT 2';
  connection.query(selectQuery, [fifteenMinutesAgo], (err, results) => {
    if (err) {
      console.error('Erreur lors de la sélection : ', err);
    } else {
      results.forEach(async (element) => {
        try {
            if(isIdInQueue(element.id) == false){
              taskQueue.push({ url: element.url, id: element.id });
              console.log("on ajoute dans la queue")
            }
        } catch (error) {
          console.log(error);
        }
      });
    }
  });
}

setInterval(() => {
  intervalCheck()
}, 2000);


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






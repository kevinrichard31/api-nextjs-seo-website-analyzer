const mysql = require('mysql2/promise');

// Cette fonction va se connecter aux informations de connexion
async function connectToDatabase(connectionInfo) {
    const { host, port, user, password, database } = connectionInfo;

    try {
        // Essaye de te connecter à la base de données
        const connection = await mysql.createConnection({
            host: host,
            port: port,
            user: user,
            password: password,
            database: database
        });

        console.log('Connexion réussie ! 🎉');
        
        // Effectue des opérations sur la base de données ici
        // Exemple : const [rows, fields] = await connection.execute('SELECT * FROM maTable');
        // console.log(rows);

        await connection.end();
    } catch (error) {
        console.error('Erreur de connexion : ', error);
    }
}

// Exemple d'appel de la fonction avec des informations fictives
const connectionInfo = {
    host: '109.234.166.37',
    port: 3306,
    user: 'hami6145_symfony',
    password: 'CnUamVCeysA',
    database: 'hami6145_ouivisible'
};

connectToDatabase(connectionInfo);

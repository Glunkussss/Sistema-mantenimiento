const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    port: '3000',
    user: 'root',
    password: '', 
    database: 'mantenimiento_iub'


});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

module.exports = db;

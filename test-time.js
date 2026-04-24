import mysql from 'mysql2/promise';
const MYSQL_CONFIG = { host: "rs.gvctelecom.com.br", port: 3339, user: "kaua", password: "zgB4$WywCLfi", database: "asteriskcdrdb" };
async function run() {
  console.time('query');
  const connection = await mysql.createConnection(MYSQL_CONFIG);
  console.timeEnd('query'); // log connection time
  
  console.time('select');
  const [rows] = await connection.execute(`
    SELECT idhistory_permanent, uniqueid, data, nome, transcription, idusuario, callurl
      FROM history_permanent
      WHERE transcription IS NOT NULL AND idusuario IN (3429, 3481)
      AND data >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY data DESC LIMIT 6
  `);
  console.timeEnd('select'); // log select time
  console.log('rows:', rows.length);
  await connection.end();
}
run();

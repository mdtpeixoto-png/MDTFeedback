import mysql from 'mysql2/promise';

const MYSQL_CONFIG = {
  host: "rs.gvctelecom.com.br",
  port: 3339,
  user: "kaua",
  password: "zgB4$WywCLfi",
  database: "asteriskcdrdb",
};

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection(MYSQL_CONFIG);
    const [rows] = await connection.execute(`
      SELECT idhistory_permanent, uniqueid, idusuario, callurl
      FROM history_permanent
      ORDER BY data DESC
      LIMIT 10
    `);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.end();
  }
}
run();

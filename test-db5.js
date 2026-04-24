import mysql from 'mysql2/promise';
const MYSQL_CONFIG = { host: "rs.gvctelecom.com.br", port: 3339, user: "kaua", password: "zgB4$WywCLfi", database: "asteriskcdrdb" };
async function run() {
  const connection = await mysql.createConnection(MYSQL_CONFIG);
  const [rows] = await connection.execute(`SELECT idlead, uniqueid, idhistory_permanent, data FROM history_permanent ORDER BY data DESC LIMIT 5`);
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}
run();

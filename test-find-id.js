import mysql from 'mysql2/promise';
const MYSQL_CONFIG = { host: "rs.gvctelecom.com.br", port: 3339, user: "kaua", password: "zgB4$WywCLfi", database: "asteriskcdrdb" };
async function run() {
  const connection = await mysql.createConnection(MYSQL_CONFIG);
  const [rows] = await connection.execute(`
    SELECT * FROM history_permanent 
    WHERE idhistory_permanent = '1773057627'
    OR uniqueid LIKE '%1773057627%'
    OR idlead = '1773057627'
    OR callurl LIKE '%1773057627%'
  `);
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}
run();

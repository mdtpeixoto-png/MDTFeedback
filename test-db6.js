import mysql from 'mysql2/promise';
const MYSQL_CONFIG = { host: "rs.gvctelecom.com.br", port: 3339, user: "kaua", password: "zgB4$WywCLfi", database: "asteriskcdrdb" };
async function run() {
  const connection = await mysql.createConnection(MYSQL_CONFIG);
  const [rows] = await connection.execute(`SELECT * FROM history_permanent WHERE data >= '2026-03-09 08:00:00' AND data <= '2026-03-09 10:00:00' AND idusuario=3481 LIMIT 5`);
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}
run();

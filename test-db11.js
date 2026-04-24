import mysql from 'mysql2/promise';
const MYSQL_CONFIG = { host: "rs.gvctelecom.com.br", port: 3339, user: "kaua", password: "zgB4$WywCLfi", database: "asteriskcdrdb" };
async function run() {
  const connection = await mysql.createConnection(MYSQL_CONFIG);
  const [rows] = await connection.execute(`SHOW DATABASES`);
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}
run();

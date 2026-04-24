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
      SELECT idhistory_permanent, uniqueid, data, nome, phone, idusuario
      FROM history_permanent
      WHERE uniqueid LIKE '171%' OR uniqueid REGEXP '^[0-9]{10}'
      ORDER BY data DESC
      LIMIT 5
    `);
    console.log("Found timestamp uniqueid:", JSON.stringify(rows, null, 2));

    const [rows2] = await connection.execute(`
      SELECT uniqueid
      FROM history_permanent
      ORDER BY idhistory_permanent DESC
      LIMIT 10
    `);
    console.log("Recent uniqueids:", JSON.stringify(rows2, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.end();
  }
}
run();

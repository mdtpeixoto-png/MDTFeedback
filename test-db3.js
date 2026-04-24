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
    const [columns] = await connection.execute(`DESCRIBE history_permanent`);
    console.log("Columns in history_permanent:", columns.map(c => c.Field).join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.end();
  }
}
run();

import { Client } from "https://deno.land/x/mysql/mod.ts"

const MYSQL_CONFIG = {
  hostname: "rs.gvctelecom.com.br",
  port: 3339,
  username: "kaua",
  password: "zgB4$WywCLfi",
  db: "asteriskcdrdb",
};

async function run() {
  const mysqlClient = await new Client().connect(MYSQL_CONFIG);
  const result = await mysqlClient.query(`
      SELECT idhistory_permanent, uniqueid, data, nome, phone, transcription, idusuario, sale, callurl
      FROM history_permanent
      WHERE transcription IS NOT NULL
      ORDER BY data DESC
      LIMIT 10
  `);
  console.log(JSON.stringify(result, null, 2));
  mysqlClient.close();
}
run();

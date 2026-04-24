import { format, subDays } from 'date-fns';
import mysql from 'mysql2/promise';

const MYSQL_CONFIG = { host: "rs.gvctelecom.com.br", port: 3339, user: "kaua", password: "zgB4$WywCLfi", database: "asteriskcdrdb" };
const sonaxUser = 'suporte@gvctelecom.com.br';
const sonaxToken = '662b217a151b7eb7eb84fcdcf5522e86';

async function run() {
  try {
    const formattedDate = format(new Date(), 'yyyy-MM-dd');
    const sonaxResponse = await fetch('https://api.sonax.net.br/api/painel/extratos_chamadas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ start: '0', limit: '5', data_inicio: formattedDate, data_fim: formattedDate, user: sonaxUser, token: sonaxToken }).toString()
    });
    const sonaxText = await sonaxResponse.text();
    let apiData;
    try { apiData = JSON.parse(sonaxText); } catch(e) { console.error('Failed to parse Sonax API', sonaxText); return; }
    
    if (!apiData || !apiData.data) { console.log('No data from Sonax'); return; }
    
    for (const call of apiData.data.slice(0,3)) {
        const uniqueidBase = String(call.uniqueid).split('.')[0];
        console.log(`\nOriginal call.uniqueid: ${call.uniqueid}`);
        console.log(`Generated fallback uniqueidBase: ${uniqueidBase}`);
        console.log(`Generated fallback identificador: WEBXXXXu${uniqueidBase}`);
    }
  } catch(e) { console.error(e.message); }
}
run();

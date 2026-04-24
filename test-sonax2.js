async function run() {
  try {
    const response = await fetch('https://api.sonax.net.br/api/painel/extratos_chamadas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        start: 0,
        limit: 5,
        data_inicio: '2026-04-24',
        data_fim: '2026-04-24',
        user: 'suporte@gvctelecom.com.br',
        token: '662b217a151b7eb7eb84fcdcf5522e86'
      })
    });
    const data = await response.json();
    console.log(JSON.stringify(data.data.slice(0, 3), null, 2));
  } catch(e) { console.error(e.message); }
}
run();

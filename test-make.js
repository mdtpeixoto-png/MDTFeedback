const MAKESYSTEM_KEY = "5B89EC45-B32C-4A2F-BFC9-A027FCAEF771";

async function listMakeSalesForSeller(sellerId) {
  try {
    const query = JSON.stringify({
      query: `query { listar_vendas(usuario_id: ${sellerId}) { identificador valor dataRegistro statusVenda { nome } } }`
    });
    const res = await fetch('https://legacyapi.makesystem.com.br/sale/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'key': MAKESYSTEM_KEY },
      body: query
    });
    const data = await res.json();
    console.log("Seller:", sellerId);
    if (data && data.data && data.data.listar_vendas) {
      console.log(JSON.stringify(data.data.listar_vendas.slice(0, 3), null, 2));
    } else {
      console.log(data);
    }
  } catch (e) {
    console.error(e);
  }
}

async function run() {
  await listMakeSalesForSeller(3588);
  await listMakeSalesForSeller(3462);
  await listMakeSalesForSeller(3576);
}
run();

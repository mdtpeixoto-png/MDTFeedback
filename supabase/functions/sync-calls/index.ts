
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Client } from "https://deno.land/x/mysql/mod.ts"

const MYSQL_CONFIG = {
  hostname: "rs.gvctelecom.com.br",
  port: 3339,
  username: "kaua",
  password: "zgB4$WywCLfi",
  db: "asteriskcdrdb",
};

const GEMINI_API_KEY = "AIzaSyAaPiH8E2Gy3GuvGwDEvyJGk8iK-MCFEHc";
const MAKESYSTEM_KEY = "5B89EC45-B32C-4A2F-BFC9-A027FCAEF771";
const FAFALABS_TOKEN = "pp3lP4jqgzA8QLP6hw";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CRITERIA_LIST = [
  "Gatilhos de Abertura", "Sondagem Eficaz", "Comparativo Tecnológico", 
  "Escolha Guiada", "Postura na Ligação", "Escuta Ativa", 
  "Ordem do Script", "Velocidade da Fala", "Ética Profissional", 
  "Gatilhos de Fechamento", "Conhecimento do Produto", "Controle da Chamada"
];

const VALID_PRODUCTS = ["Nio", "Claro", "Vero", "Vivo"];

serve(async (req) => {
  let mysqlClient;
  try {
    console.info("--- Início do Processamento de Sincronização ---");
    
    mysqlClient = await new Client().connect(MYSQL_CONFIG);
    
    // 1. Buscar funcionários ativos
    const { data: employees } = await supabase.from('funcionarios').select('*');
    if (!employees || employees.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum funcionário encontrado." }), { status: 200 });
    }

    const employeeIds = employees.map(e => e.id);
    const idList = employeeIds.join(',');

    // --- FLUXO 1: BANCO DE DADOS (MYSQL) ---
    console.info("Iniciando Fluxo 1: MySQL -> Make");
    const mysqlCalls = await mysqlClient.query(`
      SELECT idhistory_permanent, uniqueid, data, nome, phone, transcription, idusuario, sale, callurl
      FROM history_permanent
      WHERE transcription IS NOT NULL
      AND idusuario IN (${idList})
      AND data >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      ORDER BY data DESC
      LIMIT 10
    `);

    if (mysqlCalls) {
      for (const call of mysqlCalls) {
        const uniqueidBase = String(call.uniqueid).split('.')[0];
        const makeId = `WEB${call.idusuario}u${uniqueidBase}`;
        
        const { data: existing } = await supabase.from('ligacoes').select('id').eq('lead_id', makeId).maybeSingle();
        if (existing) continue;

        console.info(`Processando nova ligação MySQL: ${makeId}`);
        const saleData = await fetchMakeSale(makeId);
        const analysis = await analyzeWithGemini(call.transcription);
        
        await supabase.from('ligacoes').insert({
          external_id: call.idhistory_permanent,
          vendedor_id: call.idusuario,
          vendedor_nome: call.nome,
          lead_id: makeId,
          pontos_bons: analysis.pontos_bons,
          pontos_ruins: analysis.pontos_ruins,
          resumo: analysis.resumo,
          technical_quality: analysis.qualidade_tecnica,
          score: calculateScore(analysis, !!saleData),
          status: !!saleData,
          receita: saleData?.valor || 0,
          operadora: sanitizeProduct(saleData?.operadora),
          url_audio: formatAudioUrl(call.data, call.callurl),
          created_at: new Date(call.data).toISOString()
        });
      }
    }

    // --- FLUXO 2: BUSCA PELO MAKE ---
    console.info("Iniciando Fluxo 2: Make -> MySQL");
    for (const seller of employees) {
      const sales = await listMakeSalesForSeller(seller.id);
      for (const sale of sales) {
        const makeId = sale.identificador;
        const { data: existing } = await supabase.from('ligacoes').select('id').eq('lead_id', makeId).maybeSingle();
        if (existing) continue;

        console.info(`Encontrada venda no Make não registrada: ${makeId}`);
        
        const uniqueidPart = makeId.includes('u') ? makeId.split('u')[1] : null;
        let mysqlRec = [];
        if (uniqueidPart) {
           mysqlRec = await mysqlClient.query(`
            SELECT * FROM history_permanent 
            WHERE idusuario = ${seller.id} 
            AND uniqueid LIKE '${uniqueidPart}%'
            LIMIT 1
          `);
        }

        if (mysqlRec && mysqlRec.length > 0) {
          const rec = mysqlRec[0];
          const analysis = await analyzeWithGemini(rec.transcription || "");
          await supabase.from('ligacoes').insert({
            external_id: rec.idhistory_permanent,
            vendedor_id: seller.id,
            vendedor_nome: seller.nome_completo,
            lead_id: makeId,
            pontos_bons: analysis.pontos_bons,
            pontos_ruins: analysis.pontos_ruins,
            resumo: analysis.resumo,
            technical_quality: analysis.qualidade_tecnica,
            score: calculateScore(analysis, true),
            status: true,
            receita: sale.valor || 0,
            operadora: sanitizeProduct(sale.operadora),
            url_audio: formatAudioUrl(rec.data, rec.callurl),
            created_at: new Date(rec.data).toISOString()
          });
        } else if (sale.valor > 0) {
          await supabase.from('ligacoes').insert({
            vendedor_id: seller.id,
            vendedor_nome: seller.nome_completo,
            lead_id: makeId,
            status: true,
            receita: sale.valor || 0,
            operadora: sanitizeProduct(sale.operadora),
            created_at: sale.dataRegistro ? new Date(sale.dataRegistro).toISOString() : new Date().toISOString()
          });
        }
      }
    }

    return new Response(JSON.stringify({ message: "Sincronização concluída com sucesso." }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error(`ERRO: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  } finally {
    if (mysqlClient) {
      try { await mysqlClient.close(); } catch (e) { console.error("Erro ao fechar MySQL:", e.message); }
    }
  }
});

async function analyzeWithGemini(transcription: string) {
  if (!transcription || transcription.trim().length < 10) {
    return { pontos_bons: "", pontos_ruins: "", qualidade_tecnica: 5, resumo: "Transcrição curta ou vazia." };
  }

  const model = "gemini-1.5-flash"; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `Analise a seguinte transcrição de uma ligação de vendas:
"${transcription}"

LISTA ÚNICA DE CRITÉRIOS PARA OUTPUT
Use apenas estes termos para preencher os campos pontos_bons e pontos_ruins:
${CRITERIA_LIST.join(' | ')}

DIRETRIZES DE ANÁLISE:
- Justificativa Interna: Avalie a postura, ética e técnica do vendedor baseando-se no script e boas práticas.
- Proibição de Texto Extra: Nos campos de pontos, é terminantemente proibido adicionar qualquer texto que não seja um dos termos da lista acima.
- Quantidade: Liste apenas o que foi evidenciado na chamada. Se não houver pontos bons ou ruins, retorne string vazia "".

Retorne APENAS um JSON no formato:
{ 
  "pontos_bons": "Termo1\\nTermo2", 
  "pontos_ruins": "Termo3", 
  "qualidade_tecnica": nota_0_a_10, 
  "resumo": "breve resumo da ligação" 
}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Erro no Gemini:", e.message);
    return { pontos_bons: "", pontos_ruins: "", qualidade_tecnica: 5, resumo: "Falha na análise da IA." };
  }
}

async function fetchMakeSale(id: string) {
  try {
    const fafaUrl = `https://fafalabs.com.br/api/v1/make_sales.php?token=${FAFALABS_TOKEN}&id=${id}`;
    const res = await fetch(fafaUrl);
    const data = await res.json();
    if (data && data.identificador) {
      return { 
        valor: parseFloat(data.valor || "0"), 
        operadora: data.operadora || data.statusVenda?.nome || data.produto,
        dataRegistro: data.dataRegistro
      };
    }

    const query = JSON.stringify({
      query: `query { listar_vendas(identificador: "${id}") { valor statusVenda { nome } } }`
    });
    const gqlRes = await fetch('https://legacyapi.makesystem.com.br/sale/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'key': MAKESYSTEM_KEY },
      body: query
    });
    const gqlData = await gqlRes.json();
    const sale = gqlData.data?.listar_vendas?.[0];
    if (sale) return { valor: parseFloat(sale.valor || "0"), operadora: sale.statusVenda?.nome };
  } catch (e) {
    console.error(`Erro ao buscar venda ${id}:`, e.message);
  }
  return null;
}

async function listMakeSalesForSeller(sellerId: number) {
  try {
    // Busca vendas do vendedor nas últimas 24h via GraphQL
    const query = JSON.stringify({
      query: `query { listar_vendas(usuario_id: ${sellerId}) { identificador valor dataRegistro statusVenda { nome } } }`
    });
    const res = await fetch('https://legacyapi.makesystem.com.br/sale/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'key': MAKESYSTEM_KEY },
      body: query
    });
    const data = await res.json();
    return data.data?.listar_vendas || [];
  } catch (e) {
    return [];
  }
}

function calculateScore(analysis: any, isSale: boolean) {
  let score = (analysis.qualidade_tecnica || 5) * 10;
  if (isSale) score += 20;
  return Math.min(100, score);
}

function sanitizeProduct(productName: string | undefined) {
  if (!productName) return null;
  const found = VALID_PRODUCTS.find(p => productName.toLowerCase().includes(p.toLowerCase()));
  return found || productName;
}

function formatAudioUrl(dateStr: string, callUrl: string) {
  const date = new Date(dateStr);
  return `http://rs.gvctelecom.com.br:1079/gravacoes/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}/${callUrl}`;
}

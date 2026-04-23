
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Client } from "https://deno.land/x/mysql/mod.ts"

// Configurações do MySQL (Devem ser passadas via Env Vars no Supabase)
const MYSQL_CONFIG = {
  hostname: "rs.gvctelecom.com.br",
  port: 3339,
  username: "kaua",
  password: "zgB4$WywCLfi",
  db: "asteriskcdrdb",
};

const GEMINI_API_KEY = "AIzaSyAuvfUXuVBI6peAMdZ26_MzLbrz1jAm49U";
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    // 1. Conectar ao MySQL
    const mysqlClient = await new Client().connect(MYSQL_CONFIG);
    
    // 2. Buscar ligações não processadas no MySQL
    // Selecionamos as últimas ligações que tenham transcrição
    const mysqlCalls = await mysqlClient.query(`
      SELECT idhistory_permanent, uniqueid, data, nome, phone, transcription, idusuario, sale, callurl
      FROM history_permanent
      WHERE transcription IS NOT NULL
      ORDER BY data DESC
      LIMIT 10
    `);

    const results = [];

    for (const call of mysqlCalls) {
      // 3. Verificar se já existe no Supabase para não duplicar
      const { data: existing } = await supabase
        .from('ligacoes')
        .select('id')
        .eq('external_id', call.idhistory_permanent)
        .maybeSingle();

      if (existing) continue;

      // 4. Analisar com Gemini
      const analysis = await analyzeWithGemini(call.transcription);
      
      // 5. Verificar Venda no MakeSystem (Placeholder do fluxo)
      const saleData = await checkMakeSystemSale(call.sale);

      // 6. Salvar no Supabase
      const { error: insertError } = await supabase
        .from('ligacoes')
        .insert({
          external_id: call.idhistory_permanent,
          vendedor_id: call.idusuario,
          vendedor_nome: call.nome,
          lead_id: call.uniqueid,
          pontos_bons: analysis.pontos_bons,
          pontos_ruins: analysis.pontos_ruins,
          resumo: analysis.resumo,
          technical_quality: analysis.qualidade_tecnica,
          score: calculateScore(analysis, !!saleData),
          status: !!saleData,
          receita: saleData?.value || 0,
          sale_code: call.sale,
          url_audio: formatAudioUrl(call.data, call.callurl),
          created_at: new Date(call.data).toISOString()
        });

      if (!insertError) {
        results.push({ id: call.idhistory_permanent, status: 'processed' });
      }
    }

    // 7. Re-checar ligações dos últimos 30 min que ainda não são venda
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentCalls } = await supabase
      .from('ligacoes')
      .select('id, external_id, sale_code') // Assumindo que guardamos o código da venda
      .eq('status', false)
      .gte('created_at', thirtyMinAgo);

    if (recentCalls) {
      for (const rc of recentCalls) {
        const saleUpdate = await checkMakeSystemSale(rc.sale_code);
        if (saleUpdate) {
          await supabase
            .from('ligacoes')
            .update({ 
              status: true, 
              receita: saleUpdate.value,
              score: 100 // Ou outro critério de atualização de score
            })
            .eq('id', rc.id);
        }
      }
    }

    await mysqlClient.close();

    return new Response(JSON.stringify({ message: "Sync completed", results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function analyzeWithGemini(transcription: string) {
  const prompt = `
    Analise a seguinte transcrição de venda de internet Fibra:
    "${transcription}"
    
    Siga as regras:
    1. Identifique Pontos Bons e Pontos Ruins baseados em: Gatilhos de Abertura, Sondagem, Comparativo Tecnológico e Fechamento.
    2. Dê uma nota de Qualidade Técnica de 0 a 10.
    3. Resuma a ligação.
    
    Retorne APENAS um JSON no formato:
    {
      "pontos_bons": "item1\\nitem2",
      "pontos_ruins": "item1\\nitem2",
      "qualidade_tecnica": 8.5,
      "resumo": "texto"
    }
  `;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text.replace(/```json|```/g, ""));
}

async function checkMakeSystemSale(saleCode: string) {
  if (!saleCode) return null;
  
  // Exemplo de chamada para a API do MakeSystem via GraphQL
  const query = `
    query {
      historic(code: "${saleCode}") {
        status
        value
      }
    }
  `;

  try {
    const response = await fetch('https://legacyapi.makesystem.com.br/historic/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const result = await response.json();
    const sale = result.data?.historic;
    
    if (sale && sale.status === 'Vendido') {
      return { value: sale.value || 0 };
    }
  } catch (e) {
    console.error("MakeSystem API Error", e);
  }
  return null;
}

function calculateScore(analysis: any, isSale: boolean) {
  let score = analysis.qualidade_tecnica * 10;
  if (isSale) score += 20;
  return Math.min(100, score);
}

function formatAudioUrl(dateStr: string, callUrl: string) {
  const date = new Date(dateStr);
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const D = String(date.getDate()).padStart(2, '0');
  return `http://rs.gvctelecom.com.br:1079/gravacoes/${Y}/${M}/${D}/${Y}/${callUrl}`;
}

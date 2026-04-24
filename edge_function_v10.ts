import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Client } from "https://deno.land/x/mysql/mod.ts"

const MYSQL_CONFIG = { hostname: "rs.gvcatelecom.com.br", port: 3339, username: "kaua", password: "zgB4$WywCLfi", db: "asteriskcdrdb" };
const GEMINI_API_KEY = "AIzaSyCQ-h57vkue0fSb2Q-INW2wzjK0E-WG040";
const MAKESYSTEM_KEY = "5B89EC45-B32C-4A2F-BFC9-A027FCAEF771";
const FAFAFA_TOKEN = "pp3lP4jqgzA8QLP6hw";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || "";
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const CRITERIA_LIST = ["Gatilhos de Abertura", "Sondagem Eficaz", "Comparativo Tecnológico", "Escolha Guiada", "Postura na Ligação", "Escuta Ativa", "Ordem do Script", "Velocidade da Fala", "Ética Profissional", "Gatilhos de Fechamento", "Conhecimento do Produto", "Controle da Chamada"];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

serve(async (req) => {
  let mysqlClient;
  try {
    console.info("--- Início Sincronização (v10 - Correções + Tabela Vendas) ---");
    mysqlClient = await new Client().connect(MYSQL_CONFIG);
    
    const { data: employees, error: empError } = await supabase.from('funcionarios').select('*');
    if (empError) throw new Error(`Erro ao buscar funcionários: ${empError.message}`);
    if (!employees || employees.length === 0) return new Response("Sem funcionários válidos");

    for (const seller of employees) {
      if (!seller.id) continue;
      console.info(`\n>> Processando Vendedor: ${seller.nome_completo || seller.id}`);

      // ==========================================
      // FLUXO A: Buscar a última venda no Make
      // ==========================================
      try {
        const queryMake = JSON.stringify({
          query: `query { listar_vendas(ids_de_usuarios: [${seller.id}], limite: 1, pagina: 1) { identificador valor dataRegistro statusVenda { nome } } }`
        });
        
        const gqlRes = await fetch('https://legacyapi.makesystem.com.br/sale/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'key': MAKESYSTEM_KEY },
          body: queryMake
        });
        
        const gqlData = await gqlRes.json();
        const makeSale = gqlData?.data?.listar_vendas?.[0];

        if (makeSale && makeSale.identificador) {
          const makeId = makeSale.identificador;
          
          // Verifica duplicata em AMBAS as tabelas (ligacoes E vendas) pelo lead_id
          const { data: existingLigacoes } = await supabase.from('ligacoes').select('id').eq('lead_id', makeId).maybeSingle();
          const { data: existingVendas } = await supabase.from('vendas').select('id').eq('lead_id', makeId).maybeSingle();
          
          if (!existingLigacoes && !existingVendas) {
            console.info(`[Fluxo A] Nova venda encontrada no Make: ${makeId}. Buscando áudio...`);
            
            const dbMatch = await mysqlClient.query(`
              SELECT * FROM history_permanent 
              WHERE (sale = '${makeId}' OR uniqueid LIKE '%${makeId.replace(`WEB${seller.id}u`, '')}%')
              AND transcription IS NOT NULL
              ORDER BY data DESC LIMIT 1
            `);

            if (dbMatch && dbMatch.length > 0) {
              const call = dbMatch[0];
              const rawText = extractTextFromTranscription(call.transcription);
              const analysis = await analyzeWithGemini(rawText);
              
              const insertObj = {
                external_id: call.idhistory_permanent,
                vendedor_id: seller.id,
                vendedor_nome: seller.nome_completo,
                lead_id: makeId,
                pontos_bons: analysis.pontos_bons,
                pontos_ruins: analysis.pontos_ruins,
                resumo: analysis.resumo,
                technical_quality: analysis.qualidade_tecnica,
                score: Math.min((analysis.qualidade_tecnica * 10) + 20, 2147483647),
                status: true,
                receita: parseFloat(makeSale.valor || "0"),
                operadora: makeSale.statusVenda?.nome || null,
                url_audio: formatAudioUrl(call.data, call.callurl),
                created_at: new Date(call.data).toISOString()
              };
              
              const insertRes = await supabase.from('ligacoes').insert(insertObj);
              if (insertRes && insertRes.error) console.error(`[Fluxo A] Erro ao salvar em ligacoes: ${insertRes.error.message}`);
              else console.info(`[Fluxo A] ✅ Venda completa salva em ligacoes!`);
              
              await delay(4000);
            } else {
              console.info(`[Fluxo A] Áudio não encontrado. Buscando operadora na fafalabs...`);
              
              const operadoraFafa = await fetchOperadoraFaFa(makeId);
              
              const insertRes = await supabase.from('vendas').insert({
                vendedor_id: seller.id,
                vendedor_nome: seller.nome_completo,
                lead_id: makeId,
                status: true,
                receita: parseFloat(makeSale.valor || "0"),
                operadora: makeSale.statusVenda?.nome || operadoraFaFa || null,
                created_at: makeSale.dataRegistro ? new Date(makeSale.dataRegistro).toISOString() : new Date().toISOString()
              });
              if (insertRes && insertRes.error) console.error(`[Fluxo A] Erro ao salvar em vendas: ${insertRes.error.message}`);
              else console.info(`[Fluxo A] ✅ Venda salva em vendas (sem análise)!`);
            }
          }
        }
      } catch (e: any) {
        console.error(`[Fluxo A] Falha ao processar venda para ${seller.id}: ${e.message}`);
      }

      // ==========================================
      // FLUXO B: Buscar a última ligação no Banco
      // ==========================================
      try {
        const mysqlCall = await mysqlClient.query(`
          SELECT idhistory_permanent, uniqueid, data, nome, transcription, idusuario, callurl, sale
          FROM history_permanent
          WHERE idusuario = ${seller.id} AND transcription IS NOT NULL
          AND data >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
          ORDER BY data DESC LIMIT 1
        `);

        if (mysqlCall && mysqlCall.length > 0) {
          const call = mysqlCall[0];
          const callIdNum = extractTimestampFromUniqueid(String(call.uniqueid), call.data);
          const makeId = call.sale && String(call.sale).trim() !== "" ? call.sale : `WEB${call.idusuario}u${callIdNum}`;
          const extId = call.idhistory_permanent;

          // Verifica duplicata por lead_id E external_id em AMBAS as tabelas
          const { data: existingLigacoes } = await supabase.from('ligacoes').select('id').eq('lead_id', makeId).eq('external_id', extId).maybeSingle();
          const { data: existingVendas } = await supabase.from('vendas').select('id').eq('lead_id', makeId).eq('external_id', extId).maybeSingle();
          
          if (!existingLigacoes && !existingVendas) {
            console.info(`[Fluxo B] Nova ligação encontrada no MySQL: ${makeId}. Iniciando análise...`);
            
            const saleData = await fetchMakeSaleGraphQL(makeId);
            
            const rawText = extractTextFromTranscription(call.transcription);
            const analysis = await analyzeWithGemini(rawText);
            
            const insertObj = {
              external_id: call.idhistory_permanent,
              vendedor_id: call.idusuario,
              vendedor_nome: seller.nome_completo || call.nome,
              lead_id: makeId,
              pontos_bons: analysis.pontos_bons,
              pontos_ruins: analysis.pontos_ruins,
              resumo: analysis.resumo,
              technical_quality: analysis.qualidade_tecnica,
              score: Math.min((analysis.qualidade_tecnica * 10) + (saleData ? 20 : 0), 2147483647),
              status: !!saleData,
              receita: saleData?.valor || 0,
              operadora: saleData?.operadora || null,
              url_audio: formatAudioUrl(call.data, call.callurl),
              created_at: new Date(call.data).toISOString()
            };

            const insertRes = await supabase.from('ligacoes').insert(insertObj);
            if (insertRes && insertRes.error) console.error(`[Fluxo B] Erro ao salvar: ${insertRes.error.message}`);
            else console.info(`[Fluxo B] ✅ Ligação salva com sucesso!`);
            
            await delay(4000);
          }
        }
      } catch (e: any) {
        console.error(`[Fluxo B] Falha ao processar ligação para ${seller.id}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({ message: "Sincronização OK" }), { headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error(`ERRO CRÍTICO GERAL: ${error?.message || error}`);
    return new Response(error?.message || "Erro Interno", { status: 500 });
  } finally {
    if (mysqlClient) {
      try {
        await mysqlClient.close();
      } catch (closeErr: any) {
        console.error(`Erro ao fechar conexão MySQL: ${closeErr?.message || closeErr}`);
      }
    }
  }
});

function extractTextFromTranscription(raw: string): string {
  try {
    const json = JSON.parse(raw);
    let text = json.text || json.transcript || (json.results && json.results[0]?.transcript) || "";
    if (!text && json.segments) text = json.segments.map((s: any) => s.text).join(" ");
    return text.trim();
  } catch (e) { return raw?.trim() || ""; }
}

async function analyzeWithGemini(text: string) {
  if (!text || text.length < 10) return { pontos_bons: "", pontos_ruins: "", qualidade_tecnica: 0, resumo: "Sem conteúdo." };
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = `Analise a transcrição: "${text.substring(0, 4500)}". Use APENAS termos desta lista: ${CRITERIA_LIST.join(', ')}. Retorne JSON: { "pontos_bons": "Termo\\nTermo", "pontos_ruins": "Termo", "qualidade_tecnica": 0-10, "resumo": "..." }`;
  
  try {
    const res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const data = await res.json();
    
    if (!data || data.error) {
      console.error("Gemini Error:", data?.error?.message || "Unknown");
      return { pontos_bons: "", pontos_ruins: "", qualidade_tecnica: 0, resumo: "Erro Gemini." };
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return { pontos_bons: "", pontos_ruins: "", qualidade_tecnica: 0, resumo: "IA bloqueada." };
    
    const result = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    const filter = (str: string) => (str || "").split('\n').map(t => t.trim()).filter(t => CRITERIA_LIST.includes(t)).join('\n');
    
    return {
      pontos_bons: filter(result.pontos_bons),
      pontos_ruins: filter(result.pontos_ruins),
      qualidade_tecnica: result.qualidade_tecnica || 0,
      resumo: result.resumo || ""
    };
  } catch (e: any) { 
    console.error("Catch Gemini:", e?.message || e);
    return { pontos_bons: "", pontos_ruins: "", qualidade_tecnica: 0, resumo: "Erro técnico." }; 
  }
}

async function fetchMakeSaleGraphQL(identificador: string) {
  try {
    const query = JSON.stringify({
      query: `query { listar_vendas(identificador: "${identificador}", limite: 1) { valor statusVenda { nome } } }`
    });
    const res = await fetch('https://legacyapi.makesystem.com.br/sale/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'key': MAKESYSTEM_KEY },
      body: query
    });
    const data = await res.json();
    const sale = data?.data?.listar_vendas?.[0];
    if (sale) {
      return { valor: parseFloat(sale.valor || "0"), operadora: sale.statusVenda?.nome };
    }
  } catch (e) {}
  return null;
}

async function fetchOperadoraFaFa(identificador: string) {
  try {
    const url = `https://fafalabs.com.br/api/v1/make_sales.php?token=${FAFAFA_TOKEN}&id=${identificador}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data && data.length > 0) {
      const item = data.find((i: any) => i.tipo_item);
      return item?.tipo_item || null;
    }
  } catch (e) {
    console.error("Erro fafalabs:", e);
  }
  return null;
}

function formatAudioUrl(dateStr: string, callUrl: string) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `http://rs.gvcatelecom.com.br:1079/gravacoes/${year}/${month}/${day}/${year}/${callUrl}`;
}

function extractTimestampFromUniqueid(uniqueid: string, callData: string | Date): string {
  if (!uniqueid) return Math.floor(new Date(callData).getTime() / 1000).toString();
  
  if (/^\d{10}(\.\d+)?$/.test(uniqueid)) {
    return uniqueid.split('.')[0];
  }
  
  if (uniqueid.includes('-')) {
    const parts = uniqueid.split('-');
    if (parts.length === 5) {
      try {
        const timeLow = parts[0];
        const timeMid = parts[1];
        const timeHiAndVersion = parts[2];
        const timeHi = timeHiAndVersion.substring(1); 
        
        const timestampHex = timeHi + timeMid + timeLow;
        const timestamp = BigInt('0x' + timestampHex);
        const unixTimestampMs = Number((timestamp - 122192928000000000n) / 10000n);
        
        return Math.floor(unixTimestampMs / 1000).toString();
      } catch (e) {}
    }
  }
  
  return Math.floor(new Date(callData).getTime() / 1000).toString();
}
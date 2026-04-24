import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Client } from "https://deno.land/x/mysql/mod.ts"

const MYSQL_CONFIG = { hostname: "rs.gvctelecom.com.br", port: 3339, username: "kaua", password: "zgB4$WywCLfi", db: "asteriskcdrdb" };
const GEMINI_API_KEY = "AIzaSyCQ-h57vkue0fSb2Q-INW2wzjK0E-WG040";
const MAKESYSTEM_KEY = "5B89EC45-B32C-4A2F-BFC9-A027FCAEF771";
const FAFALABS_TOKEN = "pp3lP4jqgzA8QLP6hw"; // Nova key para fafalabs

// Cliente Supabase instanciado globalmente
const supabaseUrl = Deno.env.get('SUPABASE_URL') || "";
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const CRITERIA_LIST = ["Gatilhos de Abertura", "Sondagem Eficaz", "Comparativo Tecnológico", "Escolha Guiada", "Postura na Ligação", "Escuta Ativa", "Ordem do Script", "Velocidade da Fala", "Ética Profissional", "Gatilhos de Fechamento", "Conhecimento do Produto", "Controle da Chamada"];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

serve(async (req) => {
  let mysqlClient;
  try {
    console.info("--- Início Sincronização (v10 - FafaLabs Operadora & Uniqueness) ---");
    mysqlClient = await new Client().connect(MYSQL_CONFIG);
    
    const { data: employees, error: empError } = await supabase.from('funcionarios').select('*');
    if (empError) throw new Error(`Erro ao buscar funcionários: ${empError.message}`);
    if (!employees || employees.length === 0) return new Response("Sem funcionários válidos");

    for (const seller of employees) {
      if (!seller.id) continue;
      console.info(`\n>> Processando Vendedor: ${seller.nome_completo || seller.id}`);

      // ==========================================
      // FLUXO A: Buscar a última venda no Make (GraphQL para buscar a venda, Fafa para os detalhes)
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
          const { data: existing } = await supabase.from('ligacoes').select('id').eq('lead_id', makeId).maybeSingle();
          
          if (!existing) {
            console.info(`[Fluxo A] Nova venda encontrada no Make: ${makeId}. Buscando áudio...`);
            
            // Busca o áudio no MySQL
            const dbMatch = await mysqlClient.query(`
              SELECT * FROM history_permanent 
              WHERE (sale = '${makeId}' OR uniqueid LIKE '%${makeId.replace(`WEB${seller.id}u`, '')}%')
              AND transcription IS NOT NULL
              ORDER BY data DESC LIMIT 1
            `);

            // Busca detalhes precisos da FafaLabs (Operadora real: Claro, Vivo, etc)
            const fafaDetails = await fetchMakeSaleFafa(makeId);
            const operadoraFinal = fafaDetails?.operadora || makeSale.statusVenda?.nome || null;

            if (dbMatch && dbMatch.length > 0) {
              const call = dbMatch[0];
              
              // Verificação de segurança dupla (impede crash do ligacoes_external_id_key)
              const { data: existingExt } = await supabase.from('ligacoes').select('id').eq('external_id', call.idhistory_permanent).maybeSingle();
              if (existingExt) {
                console.info(`[Fluxo A] O áudio desta venda já estava salvo em outra entrada no banco.`);
              } else {
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
                  technical_quality: Math.min(analysis.qualidade_tecnica, 9.99), // Prevenção de numeric overflow se a nota for > 9.99
                  score: (Math.min(analysis.qualidade_tecnica, 9.99) * 10) + 20,
                  status: true,
                  receita: parseFloat(makeSale.valor || "0"),
                  operadora: operadoraFinal,
                  url_audio: formatAudioUrl(call.data, call.callurl),
                  created_at: new Date(call.data).toISOString()
                };
                
                const insertRes = await supabase.from('ligacoes').insert(insertObj);
                if (insertRes && insertRes.error) console.error(`[Fluxo A] Erro ao salvar: ${insertRes.error.message}`);
                else console.info(`[Fluxo A] ✅ Venda Completa salva com sucesso!`);
                
                await delay(4000); // Pausa segurança Gemini
              }
            } else {
              console.info(`[Fluxo A] Áudio não encontrado. Salvando apenas os dados da venda.`);
              const insertRes = await supabase.from('ligacoes').insert({
                vendedor_id: seller.id,
                vendedor_nome: seller.nome_completo,
                lead_id: makeId,
                status: true,
                receita: parseFloat(makeSale.valor || "0"),
                operadora: operadoraFinal,
                created_at: makeSale.dataRegistro ? new Date(makeSale.dataRegistro).toISOString() : new Date().toISOString()
              });
              if (insertRes && insertRes.error) console.error(`[Fluxo A] Erro ao salvar venda parcial: ${insertRes.error.message}`);
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

          // Verificação DUPLA (lead_id E external_id)
          const { data: existingLead } = await supabase.from('ligacoes').select('id').eq('lead_id', makeId).maybeSingle();
          const { data: existingExt } = await supabase.from('ligacoes').select('id').eq('external_id', call.idhistory_permanent).maybeSingle();
          
          if (!existingLead && !existingExt) {
            console.info(`[Fluxo B] Nova ligação encontrada no MySQL: ${makeId}. Iniciando análise...`);
            
            const saleData = await fetchMakeSaleFafa(makeId);
            
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
              technical_quality: Math.min(analysis.qualidade_tecnica, 9.99), // Prevenção de overflow
              score: (Math.min(analysis.qualidade_tecnica, 9.99) * 10) + (saleData ? 20 : 0),
              status: !!saleData,
              receita: saleData?.valor || 0,
              operadora: saleData?.operadora || null,
              url_audio: formatAudioUrl(call.data, call.callurl),
              created_at: new Date(call.data).toISOString()
            };

            const insertRes = await supabase.from('ligacoes').insert(insertObj);
            if (insertRes && insertRes.error) console.error(`[Fluxo B] Erro ao salvar: ${insertRes.error.message}`);
            else console.info(`[Fluxo B] ✅ Ligação salva com sucesso!`);
            
            await delay(4000); // Pausa segurança Gemini
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

// NOVA FUNÇÃO: Busca diretamente da FafaLabs para extrair o tipo_item (Operadora)
async function fetchMakeSaleFafa(identificador: string) {
  try {
    const res = await fetch(`https://fafalabs.com.br/api/v1/make_sales.php?token=${FAFALABS_TOKEN}&id=${identificador}`);
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data && data.identificador) {
      // Usa tipo_item (CLARO, VIVO, etc), ou cai no fallback para "produto"
      const operadora = data.tipo_item || data.produto || data.operadora;
      return { valor: parseFloat(data.valor || "0"), operadora: operadora };
    }
  } catch (e) {
    // Falha silenciosa
  }
  return null;
}

function formatAudioUrl(dateStr: string, callUrl: string) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `http://rs.gvctelecom.com.br:1079/gravacoes/${year}/${month}/${day}/${year}/${callUrl}`;
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

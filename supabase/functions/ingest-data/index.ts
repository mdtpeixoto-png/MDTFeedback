import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (token !== serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return new Response(JSON.stringify({ error: "Missing 'type' and 'data' fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;

    switch (type) {
      case "funcionario": {
        // data: { id?, nome_completo }
        if (!data.nome_completo) {
          return new Response(JSON.stringify({ error: "Campo 'nome_completo' é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const insertData: Record<string, unknown> = {
          nome_completo: data.nome_completo,
        };
        if (data.id) insertData.id = data.id;

        const { error, data: inserted } = await supabase
          .from("funcionarios")
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        result = inserted;
        break;
      }

      case "ligacao": {
        // data: { id?, vendedor_id, pontos_bons, pontos_ruins, resumo, url_audio }
        if (!data.vendedor_id) {
          return new Response(JSON.stringify({ error: "Campo 'vendedor_id' é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const insertData: Record<string, unknown> = {
          vendedor_id: data.vendedor_id,
          pontos_bons: data.pontos_bons ?? null,
          pontos_ruins: data.pontos_ruins ?? null,
          resumo: data.resumo ?? null,
          url_audio: data.url_audio ?? null,
        };
        if (data.id) insertData.id = data.id;

        const { error, data: inserted } = await supabase
          .from("ligacoes")
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        result = inserted;
        break;
      }

      case "batch": {
        const results = [];
        for (const item of data.items) {
          const subResponse = await fetch(req.url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ type: item.type, data: item.data }),
          });
          results.push(await subResponse.json());
        }
        result = results;
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Tipo desconhecido: ${type}. Válidos: funcionario, ligacao, batch` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_ROLES = ["developer", "admin", "seller"] as const;

function isAppRole(value: unknown): value is (typeof APP_ROLES)[number] {
  return typeof value === "string" && APP_ROLES.includes(value as (typeof APP_ROLES)[number]);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const customToken = Deno.env.get("API_INGEST_TOKEN");

    const isAuthorized = (serviceRoleKey && token === serviceRoleKey) || (customToken && token === customToken);
    if (!isAuthorized) {
      return jsonResponse({ error: "Unauthorized" }, 403);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    if (!serviceRoleKey) {
      return jsonResponse({ error: "Server configuration error: missing service role key" }, 500);
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return jsonResponse({ error: "Missing 'type' and 'data' fields" }, 400);
    }

    let result;
    console.log("Processing request - type:", type);

    switch (type) {
      case "delete_auth_user": {
        if (!data.user_id) {
          return jsonResponse({ error: "Campo 'user_id' é obrigatório" }, 400);
        }
        const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user_id);
        if (deleteError) throw deleteError;
        result = { deleted: data.user_id };
        break;
      }

      case "usuario": {
        if (!data.email || !data.password || !data.nome_completo) {
          return jsonResponse({ error: "Campos 'email', 'password' e 'nome_completo' são obrigatórios" }, 400);
        }

        const role = data.role ?? "seller";
        const emailConfirmado = data.email_confirmado === true;

        if (!isAppRole(role)) {
          return jsonResponse({ error: `Campo 'role' inválido. Válidos: ${APP_ROLES.join(", ")}` }, 400);
        }

        const { data: createdUserData, error: createUserError } = await supabase.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: emailConfirmado,
          user_metadata: { name: data.nome_completo },
        });

        if (createUserError) throw createUserError;
        const authUser = createdUserData.user;
        if (!authUser) throw new Error("Falha ao criar usuário no backend");

        try {
          const { error: profileError } = await supabase.from("profiles").upsert(
            { user_id: authUser.id, name: data.nome_completo, email: data.email, avatar_url: null, is_active: true },
            { onConflict: "user_id" }
          );
          if (profileError) throw profileError;

          const { error: roleError } = await supabase.from("user_roles").insert({ user_id: authUser.id, role });
          if (roleError) throw roleError;

          if (role === "seller") {
            const { error: funcionarioError } = await supabase.from("funcionarios").upsert(
              { id: authUser.id, nome_completo: data.nome_completo },
              { onConflict: "id" }
            );
            if (funcionarioError) throw funcionarioError;
          }
        } catch (error) {
          await supabase.auth.admin.deleteUser(authUser.id);
          throw error;
        }

        result = {
          id: authUser.id,
          email: authUser.email,
          nome_completo: data.nome_completo,
          role,
          email_confirmado: Boolean(authUser.email_confirmed_at),
          funcionario_id: role === "seller" ? authUser.id : null,
        };
        break;
      }

      case "funcionario": {
        if (!data.nome_completo) {
          return jsonResponse({ error: "Campo 'nome_completo' é obrigatório" }, 400);
        }
        const insertData: Record<string, unknown> = { nome_completo: data.nome_completo };
        if (data.id !== undefined) insertData.id = Number(data.id);

        const { error, data: inserted } = await supabase.from("funcionarios").insert(insertData).select().single();
        if (error) throw error;
        result = inserted;
        break;
      }

      case "feedback": {
        if (!data.vendedor_id && data.vendedor_id !== 0) {
          return jsonResponse({ error: "Campo 'vendedor_id' é obrigatório (numérico)" }, 400);
        }

        const vendedorIdNum = Number(data.vendedor_id);
        const { data: existingFunc } = await supabase
          .from("funcionarios")
          .select("id, nome_completo")
          .eq("id", vendedorIdNum)
          .maybeSingle();

        let vendedorNome = data.vendedor_nome ?? "Vendedor";

        if (!existingFunc) {
          if (!data.vendedor_nome) {
            return jsonResponse({ error: "Campo 'vendedor_nome' é obrigatório quando o vendedor_id não existe no banco" }, 400);
          }
          const { error: funcErr } = await supabase.from("funcionarios").insert({
            id: vendedorIdNum,
            nome_completo: data.vendedor_nome,
          });
          if (funcErr) throw funcErr;
          vendedorNome = data.vendedor_nome;
        } else {
          vendedorNome = existingFunc.nome_completo;
        }

        const status = data.status === true;
        const receita = status ? (Number(data.receita) || 0) : 0;
        const operadora = status ? (data.operadora ?? null) : null;

        const insertData: Record<string, unknown> = {
          vendedor_id: vendedorIdNum,
          vendedor_nome: vendedorNome,
          lead_id: data.lead_id ?? null,
          resumo: data.resumo_ligacao ?? data.resumo ?? null,
          pontos_bons: data.pontos_fortes ?? data.pontos_bons ?? null,
          pontos_ruins: data.pontos_fracos ?? data.pontos_ruins ?? null,
          url_audio: data.audio_url ?? data.url_audio ?? null,
          status,
          receita,
          operadora,
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

      case "ligacao": {
        if (!data.vendedor_id && data.vendedor_id !== 0) {
          return jsonResponse({ error: "Campo 'vendedor_id' é obrigatório (numérico)" }, 400);
        }

        const insertData: Record<string, unknown> = {
          vendedor_id: Number(data.vendedor_id),
          pontos_bons: data.pontos_bons ?? null,
          pontos_ruins: data.pontos_ruins ?? null,
          resumo: data.resumo ?? null,
          url_audio: data.url_audio ?? null,
          status: data.status === true,
          receita: data.status === true ? (Number(data.receita) || 0) : 0,
          operadora: data.status === true ? (data.operadora ?? null) : null,
          lead_id: data.lead_id ?? null,
          vendedor_nome: data.vendedor_nome ?? null,
        };
        if (data.id) insertData.id = data.id;

        const { error, data: inserted } = await supabase.from("ligacoes").insert(insertData).select().single();
        if (error) throw error;
        result = inserted;
        break;
      }

      case "batch": {
        if (!Array.isArray(data.items)) {
          return jsonResponse({ error: "Campo 'items' deve ser uma lista" }, 400);
        }
        const results = [];
        for (const item of data.items) {
          const subResponse = await fetch(req.url, {
            method: "POST",
            headers: { Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ type: item.type, data: item.data }),
          });
          results.push(await subResponse.json());
        }
        result = results;
        break;
      }

      default:
        return jsonResponse({ error: `Tipo desconhecido: ${type}. Válidos: usuario, funcionario, feedback, ligacao, batch` }, 400);
    }

    return jsonResponse({ success: true, data: result });
  } catch (err) {
    console.error("Edge function error:", err.message, err.stack || err);
    return jsonResponse({ error: err.message }, 500);
  }
});

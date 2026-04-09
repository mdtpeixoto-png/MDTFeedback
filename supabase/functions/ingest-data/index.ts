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

function isEmailAlreadyRegisteredError(error: unknown) {
  return error instanceof Error && /already been registered/i.test(error.message);
}

async function findAuthUserByEmail(supabase: ReturnType<typeof createClient>, email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const existingUser = data.users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail);
    if (existingUser) return existingUser;

    if (data.users.length < 1000) break;
  }

  return null;
}

async function getOrCreateAuthUser(
  supabase: ReturnType<typeof createClient>,
  options: { email: string; password: string; name: string; emailConfirm: boolean }
) {
  const payload = {
    email: options.email,
    password: options.password,
    email_confirm: options.emailConfirm,
    user_metadata: { name: options.name },
  };

  const { data, error } = await supabase.auth.admin.createUser(payload);

  if (!error) {
    if (!data.user) throw new Error("Falha ao criar usuário no backend");
    return { user: data.user, created: true };
  }

  if (!isEmailAlreadyRegisteredError(error)) throw error;

  const existingUser = await findAuthUserByEmail(supabase, options.email);
  if (!existingUser) throw error;

  const { data: updatedUserData, error: updateUserError } = await supabase.auth.admin.updateUserById(existingUser.id, payload);
  if (updateUserError) throw updateUserError;

  return { user: updatedUserData.user ?? existingUser, created: false };
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

        let funcionarioId = null;
        const { user: authUser, created: createdAuthUser } = await getOrCreateAuthUser(supabase, {
          email: data.email,
          password: data.password,
          emailConfirm: emailConfirmado,
          name: data.nome_completo,
        });

        try {
          const { error: profileError } = await supabase.from("profiles").upsert(
            { user_id: authUser.id, name: data.nome_completo, email: data.email, avatar_url: null, is_active: true },
            { onConflict: "user_id" }
          );
          if (profileError) throw profileError;

          const { error: roleError } = await supabase.from("user_roles").upsert(
            { user_id: authUser.id, role },
            { onConflict: "user_id,role" }
          );
          if (roleError) throw roleError;

          if (role === "seller") {
            if (!data.id && data.id !== 0) {
              throw new Error("Campo 'id' é obrigatório para criar funcionário (role 'seller')");
            }
            const funcId = Number(data.id);
            if (!Number.isInteger(funcId) || funcId <= 0) {
              throw new Error("Campo 'id' deve ser um número inteiro positivo");
            }

            // Check for duplicate
            const { data: existingFunc } = await supabase
              .from("funcionarios")
              .select("id")
              .eq("id", funcId)
              .maybeSingle();
            if (existingFunc) {
              throw new Error(`Funcionário com id ${funcId} já está cadastrado.`);
            }

            const { data: newFunc, error: funcionarioError } = await supabase.from("funcionarios").insert(
              { id: funcId, nome_completo: data.nome_completo }
            ).select("id").single();
            if (funcionarioError) throw funcionarioError;
            funcionarioId = newFunc?.id ?? null;
          }
        } catch (error) {
          if (createdAuthUser) {
            await supabase.auth.admin.deleteUser(authUser.id);
          }
          throw error;
        }

        result = {
          id: authUser.id,
          email: authUser.email,
          nome_completo: data.nome_completo,
          role,
          email_confirmado: Boolean(authUser.email_confirmed_at),
          funcionario_id: funcionarioId,
        };
        break;
      }

      case "funcionario": {
        if (!data.nome_completo || !data.email || !data.password || data.id === undefined || data.id === null) {
          return jsonResponse({ error: "Campos 'id', 'nome_completo', 'email' e 'password' são obrigatórios" }, 400);
        }

        const funcId = Number(data.id);
        if (!Number.isInteger(funcId) || funcId <= 0) {
          return jsonResponse({ error: "Campo 'id' deve ser um número inteiro positivo" }, 400);
        }

        // Check if funcionario ID already exists — return 409 Conflict
        const { data: existingFunc } = await supabase
          .from("funcionarios")
          .select("id")
          .eq("id", funcId)
          .maybeSingle();

        if (existingFunc) {
          return jsonResponse({ error: `Funcionário com id ${funcId} já está cadastrado. Use outro ID ou atualize o registro existente.` }, 409);
        }

        const { user: funcAuthUser, created: createdAuthUser } = await getOrCreateAuthUser(supabase, {
          email: data.email,
          password: data.password,
          emailConfirm: true,
          name: data.nome_completo,
        });

        try {
          const { error: profileErr } = await supabase.from("profiles").upsert(
            { user_id: funcAuthUser.id, name: data.nome_completo, email: data.email, avatar_url: null, is_active: true },
            { onConflict: "user_id" }
          );
          if (profileErr) throw profileErr;

          const { error: roleErr } = await supabase.from("user_roles").upsert(
            { user_id: funcAuthUser.id, role: "seller" },
            { onConflict: "user_id,role" }
          );
          if (roleErr) throw roleErr;

          const { data: newFunc, error: funcErr } = await supabase
            .from("funcionarios")
            .insert({ id: funcId, nome_completo: data.nome_completo })
            .select()
            .single();
          if (funcErr) throw funcErr;

          result = {
            funcionario_id: newFunc.id,
            user_id: funcAuthUser.id,
            nome_completo: data.nome_completo,
            email: data.email,
            role: "seller",
          };
        } catch (err) {
          if (createdAuthUser) {
            await supabase.auth.admin.deleteUser(funcAuthUser.id);
          }
          throw err;
        }
        break;
      }

      case "feedback": {
        let vendedorIdNum: number;
        let vendedorNome: string;

        if (data.vendedor_id !== undefined && data.vendedor_id !== null) {
          // Existing seller by ID
          vendedorIdNum = Number(data.vendedor_id);
          const { data: existingFunc } = await supabase
            .from("funcionarios")
            .select("id, nome_completo")
            .eq("id", vendedorIdNum)
            .maybeSingle();

          if (!existingFunc) {
            return jsonResponse({ error: `Vendedor com id ${vendedorIdNum} não encontrado. Crie primeiro com type 'funcionario'.` }, 400);
          }
          vendedorNome = existingFunc.nome_completo;
        } else if (data.vendedor_nome) {
          // Auto-create seller by name
          const { data: newFunc, error: funcErr } = await supabase
            .from("funcionarios")
            .insert({ nome_completo: data.vendedor_nome })
            .select()
            .single();
          if (funcErr) throw funcErr;
          vendedorIdNum = newFunc.id;
          vendedorNome = newFunc.nome_completo;
        } else {
          return jsonResponse({ error: "Informe 'vendedor_id' (existente) ou 'vendedor_nome' (para criar novo)" }, 400);
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

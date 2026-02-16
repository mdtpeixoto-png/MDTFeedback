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
    // Authenticate via service_role key in Authorization header
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
      case "call": {
        // data: { user_id, duration_seconds, had_sale, call_datetime }
        const { error, data: inserted } = await supabase
          .from("calls")
          .insert({
            user_id: data.user_id,
            duration_seconds: data.duration_seconds ?? null,
            had_sale: data.had_sale ?? false,
            call_datetime: data.call_datetime ?? new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        result = inserted;
        break;
      }

      case "feedback": {
        // data: { call_id, summary, strengths, weaknesses, tone, score }
        const { error, data: inserted } = await supabase
          .from("ai_feedbacks")
          .insert({
            call_id: data.call_id,
            summary: data.summary ?? null,
            strengths: data.strengths ?? null,
            weaknesses: data.weaknesses ?? null,
            tone: data.tone ?? null,
            score: data.score ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        result = inserted;
        break;
      }

      case "sale": {
        // data: { user_id, product, plan, period, value, week, sale_date }
        const { error, data: inserted } = await supabase
          .from("sales")
          .insert({
            user_id: data.user_id,
            product: data.product,
            plan: data.plan ?? null,
            period: data.period ?? null,
            value: data.value ?? 0,
            week: data.week ?? null,
            sale_date: data.sale_date ?? new Date().toISOString().split("T")[0],
          })
          .select()
          .single();
        if (error) throw error;
        result = inserted;
        break;
      }

      case "tags": {
        // data: { call_id, tags: string[] }
        // First ensure tags exist, then link to call
        const tagNames: string[] = data.tags;
        const callId: string = data.call_id;

        for (const tagName of tagNames) {
          // Upsert tag
          let { data: existingTag } = await supabase
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .single();

          if (!existingTag) {
            const { data: newTag, error: tagErr } = await supabase
              .from("tags")
              .insert({ name: tagName })
              .select()
              .single();
            if (tagErr) throw tagErr;
            existingTag = newTag;
          }

          // Link tag to call
          await supabase
            .from("call_tags")
            .insert({ call_id: callId, tag_id: existingTag!.id });
        }

        result = { call_id: callId, tags_linked: tagNames.length };
        break;
      }

      case "idle_log": {
        // data: { user_id, start_time, end_time, duration_seconds, days_since_last_sale }
        const { error, data: inserted } = await supabase
          .from("idle_time_logs")
          .insert({
            user_id: data.user_id,
            start_time: data.start_time,
            end_time: data.end_time ?? null,
            duration_seconds: data.duration_seconds ?? null,
            days_since_last_sale: data.days_since_last_sale ?? 0,
          })
          .select()
          .single();
        if (error) throw error;
        result = inserted;
        break;
      }

      case "ai_error": {
        // data: { call_id, error_message }
        const { error, data: inserted } = await supabase
          .from("ai_error_logs")
          .insert({
            call_id: data.call_id ?? null,
            error_message: data.error_message ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        result = inserted;
        break;
      }

      case "batch": {
        // data: { items: Array<{ type, data }> }
        const results = [];
        for (const item of data.items) {
          // Recursive-like processing for each item
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
          JSON.stringify({ error: `Unknown type: ${type}. Valid: call, feedback, sale, tags, idle_log, ai_error, batch` }),
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

// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { analysis, status = "RESOLVED", notes = "", image_url } = await req.json();
    const apiKey = Deno.env.get("STREAM_API_KEY");
    if (!apiKey) throw new Error("STREAM_API_KEY not configured");

    const prompt = `Create an enterprise incident ticket from this analysis:\n${JSON.stringify(analysis)}\nNotes: ${notes}`;

    const gatewayUrl = Deno.env.get("AI_GATEWAY_URL") || "https://openrouter.ai/api/v1/chat/completions";
    const resp = await fetch(gatewayUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You generate concise, professional NOC incident tickets." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_ticket",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                root_cause: { type: "string" },
                resolution_steps: { type: "array", items: { type: "string" } },
                affected_devices: { type: "array", items: { type: "string" } },
                verification: { type: "string" },
                summary: { type: "string" },
              },
              required: ["title", "root_cause", "resolution_steps", "affected_devices", "verification", "summary"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_ticket" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: t }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const ticket = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: incident, error } = await supabase.from("incidents").insert({
      title: ticket.title,
      status,
      summary: ticket.summary,
      root_cause: ticket.root_cause,
      affected_devices: ticket.affected_devices,
      resolution_steps: ticket.resolution_steps,
      verification: ticket.verification,
      notes,
      image_url,
      analysis,
    }).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ ...ticket, id: incident.id, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

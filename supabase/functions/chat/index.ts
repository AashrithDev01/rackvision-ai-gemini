// deno-lint-ignore-file
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are RackGuide AI — a senior data center / network engineering copilot. Answer technician questions about switches, routers, firewalls, VLANs, fiber optics, BGP/OSPF, port LEDs, patch panels, GPU racks, server cooling, and incident triage. Be concise, technical, and use markdown with command blocks where helpful.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages } = await req.json();
    const apiKey = Deno.env.get("STREAM_API_KEY");
    if (!apiKey) throw new Error("STREAM_API_KEY not configured");

    const gatewayUrl = Deno.env.get("AI_GATEWAY_URL") || "https://openrouter.ai/api/v1/chat/completions";
    const resp = await fetch(gatewayUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: SYSTEM }, ...messages],
      }),
    });

    if (!resp.ok) {
      const status = resp.status === 429 || resp.status === 402 ? resp.status : 500;
      const msg = resp.status === 429 ? "Rate limit exceeded, retry shortly." :
                  resp.status === 402 ? "AI credits exhausted." : "AI gateway error.";
      return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

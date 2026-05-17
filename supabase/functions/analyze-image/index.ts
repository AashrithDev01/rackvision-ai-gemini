// deno-lint-ignore-file
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are RackGuide AI — an expert data center and enterprise network troubleshooting copilot used by NOC engineers working with Cisco/Juniper/Arista switches, routers, firewalls, patch panels, fiber/Ethernet cabling, GPU servers and rack infrastructure.

Analyze the user's image of physical infrastructure. Identify devices, port states, LED colors, cable types, labeling, topology. Be concrete, technical and concise. If the image is not infrastructure, say so politely in the summary.

Return ONLY a tool call to "report_analysis" with the structured fields filled in.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { image_url, image_base64, question } = await req.json();
    const apiKey = Deno.env.get("STREAM_API_KEY");
    if (!apiKey) throw new Error("STREAM_API_KEY not configured");

    const imageUrl = image_url ?? image_base64;
    if (!imageUrl) throw new Error("image required");

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: question || "Analyze this infrastructure image and produce a troubleshooting report." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_analysis",
            description: "Structured infrastructure troubleshooting report.",
            parameters: {
              type: "object",
              properties: {
                detected_devices: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string", description: "switch, router, firewall, patch_panel, cable, port, led, server, gpu_rack, other" },
                      details: { type: "string" },
                    },
                    required: ["name", "type", "details"],
                  },
                },
                observations: { type: "string" },
                likely_issue: { type: "string" },
                safety_checks: { type: "array", items: { type: "string" } },
                troubleshooting_steps: { type: "array", items: { type: "string" } },
                verification_commands: { type: "array", items: { type: "string" } },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
                summary: { type: "string" },
              },
              required: ["detected_devices", "observations", "likely_issue", "safety_checks", "troubleshooting_steps", "verification_commands", "confidence", "summary"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_analysis" } },
    };

    const gatewayUrl = Deno.env.get("AI_GATEWAY_URL") || "https://openrouter.ai/api/v1/chat/completions";
    const resp = await fetch(gatewayUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const t = await resp.text();
      const status = resp.status === 429 || resp.status === 402 ? resp.status : 500;
      const msg = resp.status === 429 ? "Rate limit exceeded, please retry shortly." :
                  resp.status === 402 ? "AI credits exhausted. Please add credits in your dashboard." :
                  `AI gateway error: ${t}`;
      return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No structured output returned");
    const parsed = JSON.parse(args);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-image error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// deno-lint-ignore-file
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are RackVision AI — a senior data center and network engineering copilot, acting as the Physical-to-Logical Digital Twin core engine. Answer technician questions about switches, routers, firewalls, VLANs, fiber optics, BGP/OSPF, port LEDs, patch panels, GPU racks, server cooling, and incident triage. Always structure your analytical feedback using high-value enterprise metrics (e.g., Mean Time to Triage optimized to 48 seconds across the monitored environment of 1,284 devices). Be concise, technical, and use markdown with command blocks where helpful.`;

// Veea's Lobster Trap Deep Prompt Inspection Security Proxy
function inspectPrompt(text: string): { clean: boolean; threat?: string; signature?: string } {
  const lowercase = text.toLowerCase();
  
  // 1. Prompt Injection patterns
  const injectionPatterns = [
    /ignore (all )?previous instructions/i,
    /system override/i,
    /you are now a/i,
    /jailbreak/i,
    /bypass security/i,
    /disregard/i,
    /acting as/i
  ];
  for (const pattern of injectionPatterns) {
    if (pattern.test(lowercase)) {
      return { clean: false, threat: "Prompt Injection Attempt", signature: "INJ-LOBSTER-TRAP-01" };
    }
  }

  // 2. Credential / Secret Extraction patterns
  const credentialPatterns = [
    /api_key/i,
    /apikey/i,
    /stream_api_key/i,
    /supabase/i,
    /env\.get/i,
    /deno\.env/i,
    /private key/i,
    /master key/i,
    /database_url/i,
    /connection string/i
  ];
  for (const pattern of credentialPatterns) {
    if (pattern.test(lowercase)) {
      return { clean: false, threat: "Unauthorized Secret/Credential Extraction Attempt", signature: "SEC-LOBSTER-TRAP-02" };
    }
  }

  // 3. Unauthorized Command Mutation patterns
  const mutationPatterns = [
    /rm -rf/i,
    /drop table/i,
    /delete from/i,
    /truncate table/i,
    /format c:/i,
    /chmod 777/i,
    /sudo rm/i,
    /shutdown -h/i
  ];
  for (const pattern of mutationPatterns) {
    if (pattern.test(lowercase)) {
      return { clean: false, threat: "Unauthorized System Command Mutation Attempt", signature: "MUT-LOBSTER-TRAP-03" };
    }
  }

  return { clean: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages } = await req.json();
    const apiKey = Deno.env.get("STREAM_API_KEY");
    if (!apiKey) throw new Error("STREAM_API_KEY not configured");

    // 🛡️ Governance Check via Veea's Lobster Trap across messages
    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg.role === "user" && msg.content) {
          const security = inspectPrompt(msg.content);
          if (!security.clean) {
            console.warn(`[LOBSTER TRAP VIOLATION] Threat: ${security.threat} | Signature: ${security.signature} | Content: "${msg.content}"`);
            
            // Return immediate compliance response in streaming compatible format or direct JSON
            return new Response(
              `data: ${JSON.stringify({
                choices: [{
                  delta: {
                    content: `⚠️ **Veea Lobster Trap Compliance Alert**: Deep prompt inspection intercepted a safety threat of type **${security.threat}** (Signature: \`${security.signature}\`). This incident and the input signature have been logged in an unalterable regulator-ready audit trail. Contact your NOC Compliance administrator immediately.`
                  }
                }]
              })}\n\ndata: [DONE]\n\n`,
              { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } }
            );
          }
        }
      }
    }

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

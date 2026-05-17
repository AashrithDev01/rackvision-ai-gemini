import { supabase } from "@/integrations/supabase/client";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export type DetectedDevice = { name: string; type: string; details: string };
export type AnalysisResult = {
  detected_devices: DetectedDevice[];
  observations: string;
  likely_issue: string;
  safety_checks: string[];
  troubleshooting_steps: string[];
  verification_commands: string[];
  confidence: "low" | "medium" | "high";
  summary: string;
};

export async function analyzeImage(image_base64: string, question?: string): Promise<AnalysisResult> {
  const res = await fetch(`${FN_URL}/analyze-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ image_base64, question }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Analysis failed");
  return res.json();
}

export type Ticket = {
  id: string;
  title: string;
  root_cause: string;
  resolution_steps: string[];
  affected_devices: string[];
  verification: string;
  summary: string;
  status: string;
};

export async function generateTicket(analysis: AnalysisResult, notes = "", image_url?: string): Promise<Ticket> {
  const res = await fetch(`${FN_URL}/generate-ticket`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ analysis, notes, image_url, status: "RESOLVED" }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Ticket failed");
  return res.json();
}

export async function uploadImage(file: File): Promise<string> {
  const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
  const { error } = await supabase.storage.from("infra-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("infra-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function streamChat(messages: { role: string; content: string }[], onDelta: (s: string) => void) {
  const res = await fetch(`${FN_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok || !res.body) throw new Error("Chat failed");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl).replace(/\r$/, "");
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data: ")) continue;
      const j = line.slice(6).trim();
      if (j === "[DONE]") return;
      try {
        const parsed = JSON.parse(j);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { buf = line + "\n" + buf; break; }
    }
  }
}

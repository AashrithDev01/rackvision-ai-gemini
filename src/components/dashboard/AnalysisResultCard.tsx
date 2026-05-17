import { useState } from "react";
import { motion } from "framer-motion";
import {
  Server, ShieldAlert, ListChecks, Terminal, CheckCircle2, Loader2, FileCheck2, Sparkles,
} from "lucide-react";
import { generateTicket, type AnalysisResult, type Ticket } from "@/lib/api";

const confidenceColor = (c: string) =>
  c === "high" ? "text-cyber-3" : c === "medium" ? "text-cyber" : "text-cyber-2";

export function AnalysisResultCard({ result, imageUrl }: { result: AnalysisResult; imageUrl?: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function resolve() {
    setCreating(true); setErr(null);
    try { setTicket(await generateTicket(result, notes, imageUrl)); }
    catch (e: any) { setErr(e.message); }
    finally { setCreating(false); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Summary */}
      <div className="glass-strong relative overflow-hidden rounded-xl p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber to-transparent" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3 text-cyber" /> AI Analysis
            </div>
            <h3 className="mt-1 text-xl font-semibold">{result.likely_issue || "Analysis complete"}</h3>
          </div>
          <span className={`rounded-full border border-border bg-background/40 px-2 py-1 font-mono text-[11px] ${confidenceColor(result.confidence)}`}>
            confidence: {result.confidence}
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{result.summary}</p>
        {result.observations && (
          <p className="mt-2 text-xs text-muted-foreground/80"><span className="text-foreground">Observations:</span> {result.observations}</p>
        )}
      </div>

      {/* Devices */}
      {result.detected_devices?.length > 0 && (
        <div className="glass-strong rounded-xl p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Server className="h-4 w-4 text-cyber" /> Detected devices
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.detected_devices.map((d, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-border/60 bg-background/40 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{d.name}</span>
                  <span className="rounded bg-cyber/20 px-1.5 py-0.5 font-mono text-[10px] uppercase text-cyber">{d.type}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{d.details}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Safety checks */}
      {result.safety_checks?.length > 0 && (
        <div className="glass-strong rounded-xl p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4 text-cyber-2" /> Safety checks
          </div>
          <ul className="space-y-1.5 text-sm">
            {result.safety_checks.map((s, i) => (
              <li key={i} className="flex gap-2"><span className="text-cyber-2">!</span> {s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Troubleshooting timeline */}
      {result.troubleshooting_steps?.length > 0 && (
        <div className="glass-strong rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="h-4 w-4 text-cyber" /> Troubleshooting timeline
          </div>
          <ol className="relative space-y-3 border-l border-border/50 pl-5">
            {result.troubleshooting_steps.map((s, i) => (
              <motion.li
                key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="relative"
              >
                <span className="absolute -left-[26px] top-1 grid h-4 w-4 place-items-center rounded-full bg-cyber text-[10px] font-bold text-background">
                  {i + 1}
                </span>
                <p className="text-sm">{s}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      )}

      {/* Verification commands */}
      {result.verification_commands?.length > 0 && (
        <div className="terminal rounded-xl p-4">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <Terminal className="h-3.5 w-3.5" /> verification.sh
          </div>
          <pre className="text-[12px] leading-relaxed whitespace-pre-wrap">
{result.verification_commands.map((c, i) => `$ ${c}`).join("\n")}
          </pre>
        </div>
      )}

      {/* Resolve / ticket */}
      {!ticket ? (
        <div className="glass-strong rounded-xl p-5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Resolution notes (optional)</label>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you do? Any deviations from the plan…"
            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyber"
            rows={2}
          />
          <button
            onClick={resolve} disabled={creating}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-cyber-3 px-4 py-2 text-sm font-semibold text-background disabled:opacity-40 hover:shadow-[0_0_24px_oklch(0.85_0.18_175/0.5)]"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Mark issue resolved & create ticket
          </button>
          {err && <div className="mt-2 text-xs text-destructive">{err}</div>}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong relative overflow-hidden rounded-xl p-5">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyber-3/30 blur-3xl" />
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-cyber-3">
            <FileCheck2 className="h-4 w-4" /> Incident #{ticket.id.slice(0, 8)}
            <span className="ml-auto rounded-full bg-cyber-3/20 px-2 py-0.5 font-mono text-[10px] text-cyber-3 ring-1 ring-cyber-3/40">
              {ticket.status}
            </span>
          </div>
          <h3 className="mt-2 text-xl font-semibold">{ticket.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{ticket.summary}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Root cause</div>
              <p className="text-sm">{ticket.root_cause}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Verification</div>
              <p className="text-sm">{ticket.verification}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Resolution</div>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm">
              {ticket.resolution_steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {ticket.affected_devices.map((d) => (
              <span key={d} className="rounded-full border border-border bg-background/40 px-2 py-0.5 text-xs">{d}</span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

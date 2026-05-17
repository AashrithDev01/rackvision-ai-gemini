import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, FileCheck2, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Incident = {
  id: string; title: string; status: string; summary: string | null; created_at: string;
  root_cause: string | null; image_url: string | null;
};

const statusTone = (s: string) =>
  s.toUpperCase() === "RESOLVED" ? "text-cyber-3 bg-cyber-3/15 ring-cyber-3/40"
  : s.toUpperCase() === "OPEN" ? "text-cyber-2 bg-cyber-2/15 ring-cyber-2/40"
  : "text-cyber bg-cyber/15 ring-cyber/40";

export function IncidentsView() {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Incident | null>(null);

  useEffect(() => {
    supabase.from("incidents").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setItems((data ?? []) as Incident[]); setLoading(false); });
  }, []);

  const filtered = items.filter(i => {
    if (filter !== "all" && i.status.toUpperCase() !== filter.toUpperCase()) return false;
    if (q && !`${i.title} ${i.summary ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-strong flex items-center gap-3 rounded-xl p-3">
          <Search className="ml-2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search incidents…"
            className="flex-1 bg-transparent text-sm outline-none" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-border bg-background/50 px-2 py-1 text-xs">
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading incidents…</div>
        ) : filtered.length === 0 ? (
          <div className="glass-strong rounded-xl p-10 text-center text-sm text-muted-foreground">
            No incidents yet. Run an analysis and resolve it to populate this history.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((i, idx) => (
              <motion.button
                key={i.id} onClick={() => setSelected(i)}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                className="glass-strong group flex w-full items-center gap-4 rounded-xl p-4 text-left transition hover:glow-cyan"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/40 ring-1 ring-border">
                  {i.status.toUpperCase() === "RESOLVED"
                    ? <CheckCircle2 className="h-5 w-5 text-cyber-3" />
                    : <AlertTriangle className="h-5 w-5 text-cyber-2" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">#{i.id.slice(0, 8)}</span>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ring-1 ${statusTone(i.status)}`}>{i.status}</span>
                  </div>
                  <div className="mt-0.5 truncate font-medium">{i.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{i.summary}</div>
                </div>
                <div className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
                  <Clock className="h-3 w-3" /> {new Date(i.created_at).toLocaleString()}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <div className="glass-strong rounded-xl p-5">
        {!selected ? (
          <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
            <div>
              <FileCheck2 className="mx-auto h-8 w-8 opacity-50" />
              <div className="mt-2">Select an incident to view its full ticket</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-cyber">Incident #{selected.id.slice(0, 8)}</div>
            <h3 className="text-lg font-semibold">{selected.title}</h3>
            <span className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] ring-1 ${statusTone(selected.status)}`}>{selected.status}</span>
            {selected.image_url && <img src={selected.image_url} className="rounded-lg" alt="" />}
            <p className="text-sm text-muted-foreground">{selected.summary}</p>
            {selected.root_cause && <div className="text-xs"><span className="font-semibold">Root cause:</span> {selected.root_cause}</div>}
            <div className="text-[11px] text-muted-foreground">Created {new Date(selected.created_at).toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}

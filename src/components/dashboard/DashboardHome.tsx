import { motion } from "framer-motion";
import { Camera, Upload, Activity, ShieldCheck, Server, Cable, Network, Cpu, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { RackVisualization } from "@/components/RackVisualization";

const KPIS = [
  { label: "Devices Monitored", value: "1,284", delta: "+12 today", icon: Server, tone: "text-cyber" },
  { label: "Open Incidents", value: "4", delta: "2 high", icon: AlertTriangle, tone: "text-cyber-2" },
  { label: "Resolved (24h)", value: "37", delta: "AI-assisted", icon: CheckCircle2, tone: "text-cyber-3" },
  { label: "Mean Time to Triage", value: "48s", delta: "-12%", icon: Activity, tone: "text-cyber" },
];

const ALERTS = [
  { sev: "high", text: "Switch CORE-A1 Gi1/0/24 link flapping", t: "2m" },
  { sev: "med", text: "Fiber tray B-3 — bend radius warning", t: "11m" },
  { sev: "low", text: "Patch panel R12 — unlabeled cable detected", t: "1h" },
];

export function DashboardHome({ onNavigate }: { onNavigate: (v: any) => void }) {
  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Live Camera Analysis", desc: "Scan racks in real time", icon: Camera, view: "camera", color: "from-cyber/40 to-cyber/0" },
          { label: "Vision Agent", desc: "AI-guided live detection + voice", icon: Eye, view: "vision", color: "from-cyber-2/40 to-cyber-2/0" },
          { label: "Upload & Analyze", desc: "Drop a switch or topology photo", icon: Upload, view: "upload", color: "from-accent/40 to-accent/0" },
          { label: "AI Assistant", desc: "Ask about VLANs, BGP, fiber...", icon: ShieldCheck, view: "chat", color: "from-cyber-3/40 to-cyber-3/0" },
        ].map((a, i) => (
          <motion.button
            key={a.label}
            onClick={() => onNavigate(a.view)}
            whileHover={{ y: -3 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-strong group relative overflow-hidden rounded-xl p-5 text-left"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-40`} />
            <div className="relative flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/40 ring-1 ring-border">
                <a.icon className="h-5 w-5 text-cyber" />
              </div>
              <div>
                <div className="font-semibold">{a.label}</div>
                <div className="text-xs text-muted-foreground">{a.desc}</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {KPIS.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="glass-strong relative overflow-hidden rounded-xl p-4"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber/60 to-transparent" />
            <k.icon className={`h-4 w-4 ${k.tone}`} />
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
            <div className="mt-0.5 flex justify-between text-[11px]">
              <span className="text-muted-foreground">{k.label}</span>
              <span className="text-cyber-3">{k.delta}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-strong relative overflow-hidden rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Topology Visualization</h3>
              <p className="text-xs text-muted-foreground">Live links · simulated</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-cyber-3">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyber-3" /> streaming
            </span>
          </div>
          <div className="mt-4 h-72 scanline rounded-lg border border-border/50 bg-background/30">
            <RackVisualization />
          </div>
        </div>

        <div className="glass-strong rounded-xl p-5">
          <h3 className="font-semibold">Active Alerts</h3>
          <div className="mt-4 space-y-3">
            {ALERTS.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/30 p-3"
              >
                <span className={`mt-1 h-2 w-2 rounded-full ${
                  a.sev === "high" ? "bg-destructive" : a.sev === "med" ? "bg-cyber-2" : "bg-cyber-3"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{a.text}</div>
                  <div className="text-[11px] text-muted-foreground">{a.t} ago</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Core switches", n: 28, icon: Network },
          { label: "Edge devices", n: 412, icon: Cable },
          { label: "GPU racks", n: 16, icon: Cpu },
          { label: "Firewalls", n: 8, icon: ShieldCheck },
        ].map((c) => (
          <div key={c.label} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <c.icon className="h-4 w-4 text-cyber" />
              <span className="text-2xl font-bold">{c.n}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

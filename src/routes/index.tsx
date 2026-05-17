import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Camera, Upload, Activity, ShieldCheck, Zap, Network } from "lucide-react";
import { ParticleField } from "@/components/ParticleField";
import { RackVisualization } from "@/components/RackVisualization";

export const Route = createFileRoute("/")({ component: Landing });

const metrics = [
  { label: "Active Infrastructure", value: "1,284", trend: "+12", icon: Network, color: "text-cyber" },
  { label: "AI Incidents Resolved", value: "8,742", trend: "+128", icon: ShieldCheck, color: "text-cyber-3" },
  { label: "Infrastructure Health", value: "99.94%", trend: "stable", icon: Activity, color: "text-cyber-2" },
  { label: "Network Stability", value: "A+", trend: "+0.3%", icon: Zap, color: "text-cyber" },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <ParticleField />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cyber to-accent">
            <Network className="h-5 w-5 text-background" />
          </div>
          <span className="font-mono text-lg font-semibold tracking-tight">
            RackGuide<span className="text-cyber">.AI</span>
          </span>
        </div>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#metrics" className="hover:text-foreground">Live Ops</a>
          <a href="#how" className="hover:text-foreground">Workflow</a>
        </nav>
        <Link to="/app" className="rounded-md border border-border bg-card/40 px-4 py-2 text-sm backdrop-blur transition hover:glow-cyan">
          Open Console
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-12 md:grid-cols-2 md:px-12 md:py-20">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyber-3" />
            Live vision agents online
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
          >
            <span className="text-gradient">RackGuide AI</span>
            <br />
            <span className="text-foreground">Copilot for Data Center</span>
            <br />
            <span className="text-muted-foreground">& Network Troubleshooting</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg"
          >
            Point your camera at a rack, switch, patch panel or fiber tray. RackGuide identifies devices,
            diagnoses faults, and generates verified resolution playbooks — in seconds.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/app" className="group inline-flex items-center gap-2 rounded-md bg-cyber px-5 py-3 text-sm font-semibold text-background transition hover:glow-cyan">
              Start Analysis <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link to="/app" search={{ view: "camera" } as never} className="inline-flex items-center gap-2 rounded-md border border-border bg-card/40 px-5 py-3 text-sm backdrop-blur hover:glow-purple">
              <Camera className="h-4 w-4" /> Open Live Camera
            </Link>
            <Link to="/app" search={{ view: "upload" } as never} className="inline-flex items-center gap-2 rounded-md border border-border bg-card/40 px-5 py-3 text-sm backdrop-blur hover:glow-purple">
              <Upload className="h-4 w-4" /> Upload Image
            </Link>
          </motion.div>
        </div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="glass-strong relative h-[460px] overflow-hidden rounded-2xl"
        >
          <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-border/50 bg-background/30 px-4 py-2 text-xs font-mono text-muted-foreground">
            <span>rack-vision-agent · live</span>
            <span className="text-cyber-3">● streaming</span>
          </div>
          <div className="mt-9 h-[calc(100%-2.25rem)] scanline">
            <RackVisualization />
          </div>
        </motion.div>
      </section>

      {/* Metrics */}
      <section id="metrics" className="relative z-10 mx-auto max-w-7xl px-6 py-12 md:px-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="glass-strong relative overflow-hidden rounded-xl p-5"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber to-transparent" />
              <m.icon className={`h-5 w-5 ${m.color}`} />
              <div className="mt-3 text-3xl font-bold tracking-tight">{m.value}</div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="text-cyber-3">{m.trend}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:px-12">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-3xl font-bold md:text-4xl">
          Built for the <span className="text-gradient">enterprise NOC</span>
        </motion.h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { t: "Vision-first triage", d: "Detect switches, patch panels, LEDs, cables and ports from camera or upload." },
            { t: "Verified playbooks", d: "Step-by-step remediation with vendor-correct CLI commands and safety checks." },
            { t: "Auto-ticketing", d: "One click turns a resolved issue into a clean enterprise incident record." },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-strong rounded-xl p-6"
            >
              <div className="mb-4 h-10 w-10 rounded-md bg-gradient-to-br from-cyber/30 to-accent/30 ring-1 ring-cyber/30" />
              <h3 className="text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/40 px-6 py-8 text-center text-xs text-muted-foreground md:px-12">
        RackGuide AI · enterprise infrastructure copilot · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

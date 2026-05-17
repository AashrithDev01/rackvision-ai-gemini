import { motion } from "framer-motion";
import { KeyRound, Bot, Camera, Palette } from "lucide-react";

export function SettingsView() {
  const sections = [
    { icon: KeyRound, title: "API Keys", desc: "Stream API key configured for real-time video and AI services.", value: "STREAM_API_KEY · configured" },
    { icon: Bot, title: "AI Provider", desc: "Vision + reasoning model used by RackGuide AI.", value: "google/gemini-2.5-flash (default)" },
    { icon: Camera, title: "Camera", desc: "Default to rear-facing camera on mobile.", value: "facingMode: environment" },
    { icon: Palette, title: "Theme", desc: "Cyber-dark theme · glass + cyan/violet.", value: "dark · cyber" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((s, i) => (
        <motion.div key={s.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="glass-strong rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/40 ring-1 ring-border">
              <s.icon className="h-4 w-4 text-cyber" />
            </div>
            <div>
              <div className="font-semibold">{s.title}</div>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
              <div className="mt-3 inline-block rounded-md border border-border bg-background/40 px-2 py-1 font-mono text-[11px] text-cyber-3">{s.value}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

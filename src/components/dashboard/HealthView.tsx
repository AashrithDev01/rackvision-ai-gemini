import { motion } from "framer-motion";
import { Activity, Cpu, HardDrive, Wifi } from "lucide-react";

const bars = Array.from({ length: 24 }, (_, i) => 30 + Math.sin(i / 2) * 25 + Math.random() * 25);

export function HealthView() {
  const cards = [
    { label: "CPU Utilization", value: "42%", icon: Cpu },
    { label: "Network Throughput", value: "8.2 Gbps", icon: Wifi },
    { label: "Storage", value: "62%", icon: HardDrive },
    { label: "Uptime", value: "184d", icon: Activity },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-strong rounded-xl p-4">
            <c.icon className="h-4 w-4 text-cyber" />
            <div className="mt-2 text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </motion.div>
        ))}
      </div>
      <div className="glass-strong rounded-xl p-5">
        <h3 className="font-semibold">Traffic (last 24h)</h3>
        <div className="mt-4 flex h-48 items-end gap-2">
          {bars.map((b, i) => (
            <motion.div key={i} className="flex-1 rounded-t bg-gradient-to-t from-cyber/60 to-accent/60"
              initial={{ height: 0 }} animate={{ height: `${b}%` }} transition={{ delay: i * 0.02 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

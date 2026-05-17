import { motion } from "framer-motion";
import { Server, Cable, Cpu, Radio } from "lucide-react";

export function RackVisualization() {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full opacity-60">
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={i}
            x1="0" y1={40 + i * 30} x2="400" y2={40 + i * 30}
            stroke="oklch(0.78 0.18 220 / 0.3)" strokeWidth="1" strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: i * 0.15, repeat: Infinity, repeatDelay: 6 }}
          />
        ))}
        {[...Array(5)].map((_, i) => (
          <motion.circle
            key={`n${i}`} cx={50 + i * 80} cy={150} r="6"
            fill="oklch(0.82 0.20 200)"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          />
        ))}
        {[...Array(4)].map((_, i) => (
          <motion.line
            key={`c${i}`} x1={50 + i * 80} y1={150} x2={130 + i * 80} y2={150}
            stroke="oklch(0.68 0.22 285)" strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1, 0] }}
            transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </svg>
      <div className="relative grid h-full grid-cols-3 gap-3 p-6">
        {[Server, Server, Cpu, Cable, Server, Radio].map((Icon, i) => (
          <motion.div
            key={i}
            className="glass-strong relative flex items-center justify-between rounded-md px-3 py-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <Icon className="h-4 w-4 text-cyber" />
            <div className="flex gap-1">
              {[...Array(3)].map((_, j) => (
                <motion.span
                  key={j}
                  className="h-2 w-2 rounded-full bg-cyber-3"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, delay: j * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

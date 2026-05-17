import { motion } from "framer-motion";

export function ParticleField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-cyber"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            opacity: 0,
          }}
          animate={{
            y: ["0%", "-120%"],
            opacity: [0, 0.9, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 6,
            ease: "linear",
          }}
          style={{ left: `${Math.random() * 100}%`, top: `${100 + Math.random() * 20}%` }}
        />
      ))}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyber/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
    </div>
  );
}

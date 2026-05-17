import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Square, Aperture, ScanLine, Loader2, AlertTriangle } from "lucide-react";
import { analyzeImage, type AnalysisResult } from "@/lib/api";
import { AnalysisResultCard } from "./AnalysisResultCard";

export function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  useEffect(() => () => stream?.getTracks().forEach(t => t.stop()), [stream]);

  async function start() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
    } catch (e: any) { setError(e.message || "Camera blocked"); }
  }
  function stop() { stream?.getTracks().forEach(t => t.stop()); setStream(null); }

  function capture(): string | null {
    if (!videoRef.current) return null;
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth || 1280;
    c.height = videoRef.current.videoHeight || 720;
    c.getContext("2d")!.drawImage(videoRef.current, 0, 0, c.width, c.height);
    const data = c.toDataURL("image/jpeg", 0.85);
    setCaptured(data);
    return data;
  }

  async function analyze() {
    const img = capture();
    if (!img) return;
    setAnalyzing(true); setError(null); setResult(null);
    try {
      const r = await analyzeImage(img, "Live camera frame from data center technician");
      setResult(r);
    } catch (e: any) { setError(e.message); }
    finally { setAnalyzing(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-strong relative overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-2 text-xs font-mono">
            <span className="text-muted-foreground">/dev/video0 · vision-agent</span>
            <span className={`flex items-center gap-1 ${stream ? "text-cyber-3" : "text-muted-foreground"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${stream ? "animate-pulse bg-cyber-3" : "bg-muted"}`} />
              {stream ? "live" : "idle"}
            </span>
          </div>
          <div className="relative aspect-video bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            {!stream && !captured && (
              <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                <div className="text-center">
                  <Camera className="mx-auto h-10 w-10 opacity-50" />
                  <div className="mt-2 text-sm">Start camera to begin live analysis</div>
                </div>
              </div>
            )}
            {analyzing && (
              <div className="absolute inset-0 scanline">
                <div className="absolute inset-0 grid place-items-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <ScanLine className="h-12 w-12 text-cyber" />
                  </motion.div>
                </div>
                {/* Bounding boxes */}
                {[
                  { x: "15%", y: "20%", w: "30%", h: "25%" },
                  { x: "55%", y: "40%", w: "25%", h: "35%" },
                  { x: "20%", y: "65%", w: "40%", h: "20%" },
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.3 }}
                    className="absolute border border-cyber"
                    style={{ left: b.x, top: b.y, width: b.w, height: b.h, boxShadow: "0 0 14px oklch(0.82 0.20 200 / 0.6)" }}
                  >
                    <span className="absolute -top-5 left-0 bg-cyber px-1.5 text-[10px] font-mono text-background">DETECT</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border/50 p-3">
            {!stream ? (
              <button onClick={start} className="inline-flex items-center gap-2 rounded-md bg-cyber px-4 py-2 text-sm font-medium text-background hover:glow-cyan">
                <Camera className="h-4 w-4" /> Start Camera
              </button>
            ) : (
              <button onClick={stop} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-card">
                <Square className="h-4 w-4" /> Stop
              </button>
            )}
            <button onClick={capture} disabled={!stream} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-card">
              <Aperture className="h-4 w-4" /> Capture
            </button>
            <button onClick={analyze} disabled={!stream || analyzing} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40 hover:glow-purple">
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
              Analyze Infrastructure
            </button>
          </div>
        </div>

        {error && (
          <div className="glass flex items-center gap-2 rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}
        {result && <AnalysisResultCard result={result} imageUrl={captured ?? undefined} />}
      </div>

      <div className="space-y-4">
        <div className="glass-strong rounded-xl p-4">
          <h3 className="text-sm font-semibold">Detection targets</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {["Switches", "Routers", "Patch Panels", "Firewalls", "GPU Racks", "Cables", "Ports", "LED States"].map((t) => (
              <div key={t} className="flex items-center gap-2 rounded-md border border-border/50 bg-background/30 px-2 py-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyber" /> {t}
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-xl p-4 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground">Privacy</div>
          Frames are processed by RackGuide AI and discarded after analysis. Captured frames stored locally only when you press <em>Capture</em>.
        </div>
      </div>
    </div>
  );
}

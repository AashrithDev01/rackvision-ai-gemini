import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Square, ScanLine, Loader2, AlertTriangle, Eye, Volume2, VolumeX,
  Mic, MicOff, CheckCircle2, Circle, Play, ChevronDown, Zap, Radio, Brain,
} from "lucide-react";
import { useLiveDetection, AVAILABLE_PROCEDURES, type GuidanceStep } from "@/hooks/useLiveDetection";
import { useVoice } from "@/hooks/useVoice";
import { streamChat } from "@/lib/api";

export function VisionAgentView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProcMenu, setShowProcMenu] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [chatLog, setChatLog] = useState<{ role: string; text: string; ts: number }[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const voice = useVoice();
  const detection = useLiveDetection({
    intervalMs: 5000,
    onDetection: (d) => {
      const msg = d.result.summary || d.result.observations || "";
      setChatLog((p) => [...p, { role: "ai", text: msg, ts: Date.now() }].slice(-30));
      if (voiceEnabled && msg) voice.speak(msg);
    },
  });

  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [chatLog]);
  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  /* ── Camera start/stop ── */
  async function startCamera() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } } });
      setStream(s);
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
    } catch (e: any) { setError(e.message || "Camera access denied"); }
  }
  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    detection.stop();
  }

  /* ── Toggle live detection ── */
  function toggleDetection() {
    if (detection.isRunning) { detection.stop(); }
    else if (videoRef.current && stream) { detection.start(videoRef.current); }
  }

  /* ── Voice command handling ── */
  useEffect(() => {
    if (!voice.transcript) return;
    const cmd = voice.transcript.toLowerCase().trim();
    setChatLog((p) => [...p, { role: "user", text: voice.transcript, ts: Date.now() }]);

    // Process voice command via chat AI
    let acc = "";
    streamChat(
      [{ role: "user", content: `Technician voice command from live camera feed: "${voice.transcript}". Answer concisely in 1-2 sentences.` }],
      (delta) => {
        acc += delta;
        setChatLog((p) => {
          const last = p[p.length - 1];
          if (last?.role === "ai-stream") return [...p.slice(0, -1), { ...last, text: acc }];
          return [...p, { role: "ai-stream", text: acc, ts: Date.now() }];
        });
      }
    ).then(() => {
      setChatLog((p) => p.map((m) => m.role === "ai-stream" ? { ...m, role: "ai" } : m));
      if (voiceEnabled && acc) voice.speak(acc);
    }).catch((e) => {
      setChatLog((p) => [...p, { role: "ai", text: "⚠️ " + e.message, ts: Date.now() }]);
    });
  }, [voice.transcript]);

  const statusColor = detection.isRunning ? "text-cyber-3" : stream ? "text-cyber" : "text-muted-foreground";
  const statusText = detection.isRunning ? "analyzing" : stream ? "camera ready" : "offline";

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* ── Left: Video + controls ── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-strong relative overflow-hidden rounded-xl">
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-2 text-xs font-mono">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Brain className="h-3.5 w-3.5 text-cyber" /> vision-agent · live
            </span>
            <div className="flex items-center gap-3">
              {detection.isRunning && (
                <span className="text-cyber font-mono">frames: {detection.frameCount}</span>
              )}
              <span className={`flex items-center gap-1 ${statusColor}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${detection.isRunning ? "animate-pulse bg-cyber-3" : stream ? "bg-cyber" : "bg-muted"}`} />
                {statusText}
              </span>
            </div>
          </div>

          {/* Video area */}
          <div className="relative aspect-video bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            {!stream && (
              <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                <div className="text-center">
                  <Eye className="mx-auto h-12 w-12 opacity-40" />
                  <div className="mt-3 text-sm">Start camera to enable Vision Agent</div>
                  <div className="mt-1 text-xs text-muted-foreground/60">
                    AI will continuously analyze your live feed
                  </div>
                </div>
              </div>
            )}

            {/* Scanning overlay */}
            {detection.isRunning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="scanline absolute inset-0" />
                {/* Corner brackets */}
                {[["top-2 left-2", "border-t-2 border-l-2"], ["top-2 right-2", "border-t-2 border-r-2"], ["bottom-2 left-2", "border-b-2 border-l-2"], ["bottom-2 right-2", "border-b-2 border-r-2"]].map(([pos, border], i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                    className={`absolute ${pos} h-8 w-8 ${border} border-cyber/60`} />
                ))}
                {/* Status badge */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2">
                  <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-mono text-cyber backdrop-blur">
                    <Radio className="h-3 w-3 animate-pulse" /> LIVE DETECTION
                  </motion.div>
                </div>
              </div>
            )}

            {/* Last detection overlay */}
            {detection.lastAnalysis && detection.isRunning && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-3 left-3 right-3">
                <div className="rounded-lg bg-background/85 p-3 backdrop-blur-xl border border-border/50">
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="h-3 w-3 text-cyber" />
                    <span className="font-semibold text-cyber">AI Insight</span>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-mono ${
                      detection.lastAnalysis.confidence === "high" ? "bg-cyber-3/20 text-cyber-3" :
                      detection.lastAnalysis.confidence === "medium" ? "bg-cyber/20 text-cyber" : "bg-cyber-2/20 text-cyber-2"
                    }`}>{detection.lastAnalysis.confidence}</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/90 line-clamp-2">{detection.lastAnalysis.summary}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Controls bar */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border/50 p-3">
            {!stream ? (
              <button onClick={startCamera} className="inline-flex items-center gap-2 rounded-md bg-cyber px-4 py-2 text-sm font-medium text-background hover:glow-cyan">
                <Camera className="h-4 w-4" /> Start Camera
              </button>
            ) : (
              <button onClick={stopCamera} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-card">
                <Square className="h-4 w-4" /> Stop
              </button>
            )}
            <button onClick={toggleDetection} disabled={!stream}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40 ${
                detection.isRunning ? "bg-destructive/80 text-destructive-foreground hover:bg-destructive" : "bg-accent text-accent-foreground hover:glow-purple"
              }`}>
              {detection.isRunning ? <><Square className="h-4 w-4" /> Stop Detection</> : <><ScanLine className="h-4 w-4" /> Start Live Detection</>}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => { voice.state === "listening" ? voice.stopListening() : voice.startListening(); }}
                disabled={!voice.isSupported}
                className={`rounded-md p-2 transition ${voice.state === "listening" ? "bg-cyber text-background pulse-glow" : "border border-border text-muted-foreground hover:bg-card"}`}
                title="Voice command">
                {voice.state === "listening" ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
              </button>
              <button onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) voice.cancelSpeech(); }}
                className="rounded-md border border-border p-2 text-muted-foreground hover:bg-card" title="Toggle voice output">
                {voiceEnabled ? <Volume2 className="h-4 w-4 text-cyber" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="glass flex items-center gap-2 rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Voice status */}
        <AnimatePresence>
          {(voice.state === "listening" || voice.interimTranscript) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="glass-strong rounded-xl p-4">
              <div className="flex items-center gap-3">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  className="grid h-8 w-8 place-items-center rounded-full bg-cyber/20">
                  <Mic className="h-4 w-4 text-cyber" />
                </motion.div>
                <div>
                  <div className="text-xs font-semibold text-cyber">Listening…</div>
                  <div className="text-sm text-muted-foreground">{voice.interimTranscript || "Speak your command"}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right sidebar ── */}
      <div className="space-y-4">
        {/* Procedure selector */}
        <div className="glass-strong rounded-xl p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Play className="h-3.5 w-3.5 text-cyber" /> Guided Procedure
          </h3>
          <div className="relative mt-3">
            <button onClick={() => setShowProcMenu(!showProcMenu)}
              className="flex w-full items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-xs hover:bg-card">
              <span>{detection.procedure?.name || "Select a procedure…"}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <AnimatePresence>
              {showProcMenu && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-xl">
                  {AVAILABLE_PROCEDURES.map((p) => (
                    <button key={p} onClick={() => { detection.startProcedure(p); setShowProcMenu(false); }}
                      className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-sidebar-accent">
                      {p}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Procedure steps */}
        {detection.procedure && (
          <div className="glass-strong rounded-xl p-4 max-h-80 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-3">{detection.procedure.name}</h3>
            <ol className="space-y-2">
              {detection.procedure.steps.map((step, i) => (
                <motion.li key={step.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                    step.status === "active" ? "bg-cyber/10 border border-cyber/30" :
                    step.status === "done" ? "opacity-60" :
                    step.status === "warning" ? "bg-destructive/10 border border-destructive/30" : ""
                  }`}>
                  {step.status === "done" ? <CheckCircle2 className="h-3.5 w-3.5 text-cyber-3 shrink-0 mt-0.5" /> :
                   step.status === "active" ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><Circle className="h-3.5 w-3.5 text-cyber shrink-0 mt-0.5" /></motion.div> :
                   step.status === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" /> :
                   <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />}
                  <span>{step.text}</span>
                </motion.li>
              ))}
            </ol>
          </div>
        )}

        {/* Live guidance alerts */}
        {detection.currentGuidance.filter((g) => g.status === "warning").length > 0 && (
          <div className="glass-strong rounded-xl p-4">
            <h3 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5" /> Safety Alerts
            </h3>
            {detection.currentGuidance.filter((g) => g.status === "warning").map((g) => (
              <div key={g.id} className="text-xs text-destructive/90 mb-1">{g.text}</div>
            ))}
          </div>
        )}

        {/* Chat log */}
        <div className="glass-strong rounded-xl p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Brain className="h-3.5 w-3.5 text-cyber" /> Agent Log
          </h3>
          <div ref={chatRef} className="max-h-52 overflow-y-auto space-y-2">
            {chatLog.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">
                Start live detection or use voice to interact
              </div>
            )}
            {chatLog.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg px-3 py-2 text-xs ${
                  m.role === "user" ? "bg-cyber/10 text-foreground" : "bg-card/60 border border-border/30 text-muted-foreground"
                }`}>
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  {m.role === "user" ? "🎤 you" : "🤖 ai"} · {new Date(m.ts).toLocaleTimeString()}
                </span>
                <p className="mt-0.5">{m.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick voice commands */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Voice commands</h3>
          <div className="space-y-1 text-[11px] text-muted-foreground/80">
            <div>🎤 "What am I looking at?"</div>
            <div>🎤 "Is this cable correct?"</div>
            <div>🎤 "What should I do next?"</div>
            <div>🎤 "Check this port status"</div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Mic, MicOff, Loader2, Sparkles, Volume2, VolumeX } from "lucide-react";
import { streamChat } from "@/lib/api";
import { useVoice } from "@/hooks/useVoice";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Why is this switch blinking amber?",
  "Analyze VLAN mismatch issue",
  "Check fiber uplink problem",
  "Why is this port down?",
];

export function ChatView() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi, I'm **RackGuide AI**. Ask me anything about your switches, fiber, VLANs, BGP, or paste a diagnostic snippet. You can also use voice — press the mic button and speak." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voice = useVoice();

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, loading]);

  // Handle voice transcript
  useEffect(() => {
    if (voice.transcript && !loading) {
      send(voice.transcript);
    }
  }, [voice.transcript]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setLoading(true);
    let acc = "";
    try {
      await streamChat(next, (d) => {
        acc += d;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && (last as any)._streaming) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m);
          }
          return [...prev, { role: "assistant", content: acc, _streaming: true } as any];
        });
      });
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, _streaming: false } as any : m));
      // Speak the response
      if (voiceOutput && acc) voice.speak(acc);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ " + e.message }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="lg:col-span-3">
        <div className="glass-strong flex h-[calc(100vh-12rem)] flex-col rounded-xl">
          <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 text-sm">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-cyber to-accent">
              <Sparkles className="h-3.5 w-3.5 text-background" />
            </div>
            <div>
              <div className="font-semibold">RackGuide AI Assistant</div>
              <div className="text-[11px] text-muted-foreground">
                {voice.state === "listening" ? "🎤 Listening…" :
                 voice.state === "speaking" ? "🔊 Speaking…" :
                 "Streaming · vision + reasoning · voice enabled"}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => { setVoiceOutput(!voiceOutput); if (voiceOutput) voice.cancelSpeech(); }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-card" title="Toggle voice responses">
                {voiceOutput ? <Volume2 className="h-3.5 w-3.5 text-cyber" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
              <span className="flex items-center gap-1 text-[11px] text-cyber-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyber-3" /> connected
              </span>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-cyber text-background"
                    : "bg-card/60 border border-border/50"
                }`}>
                  {m.content}
                </div>
              </motion.div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border/50 bg-card/60 px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-cyber"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Voice listening indicator */}
          {voice.state === "listening" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 border-t border-cyber/20 bg-cyber/5 px-4 py-2">
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                className="h-3 w-3 rounded-full bg-cyber" />
              <span className="text-xs text-cyber font-medium">
                {voice.interimTranscript || "Listening… speak your question"}
              </span>
            </motion.div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-border/50 p-3">
            <button type="button"
              onClick={() => { voice.state === "listening" ? voice.stopListening() : voice.startListening(); }}
              disabled={!voice.isSupported}
              className={`rounded-md p-2 transition ${
                voice.state === "listening"
                  ? "bg-cyber text-background pulse-glow"
                  : "border border-border text-muted-foreground hover:bg-card"
              }`}
              title={voice.state === "listening" ? "Stop listening" : "Start voice input"}>
              {voice.state === "listening" ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
            </button>
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about infrastructure or press mic to speak…"
              className="flex-1 rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyber"
            />
            <button disabled={loading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-cyber px-3 py-2 text-sm font-medium text-background disabled:opacity-40 hover:glow-cyan">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
      <div className="space-y-3">
        <div className="glass-strong rounded-xl p-4">
          <h3 className="text-sm font-semibold">Try asking</h3>
          <div className="mt-3 space-y-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full rounded-md border border-border/50 bg-background/30 px-3 py-2 text-left text-xs hover:glow-cyan">
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Voice tips</h3>
          <div className="space-y-1 text-[11px] text-muted-foreground/80">
            <div>🎤 Press mic → speak → auto-sends</div>
            <div>🔊 AI reads responses aloud</div>
            <div>🔇 Toggle speaker to mute voice</div>
          </div>
        </div>
      </div>
    </div>
  );
}

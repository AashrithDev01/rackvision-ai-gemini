import { useCallback, useEffect, useRef, useState } from "react";

/* ───────────── Types ───────────── */
type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface UseVoiceReturn {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  cancelSpeech: () => void;
  isSupported: boolean;
}

/* ───── browser compat shims ───── */
const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

/* ────────────────────────────────── */
export function useVoice(): UseVoiceReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported =
    typeof window !== "undefined" && !!SpeechRecognition && "speechSynthesis" in window;

  /* ── create recognition instance once ── */
  useEffect(() => {
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) setTranscript(final);
      setInterimTranscript(interim);
    };

    rec.onend = () => {
      setState((s) => (s === "listening" ? "idle" : s));
      setInterimTranscript("");
    };
    rec.onerror = () => {
      setState("idle");
      setInterimTranscript("");
    };

    recognitionRef.current = rec;
    return () => {
      rec.abort();
    };
  }, []);

  /* ── start / stop ── */
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setInterimTranscript("");
    setState("listening");
    try { recognitionRef.current.start(); } catch { /* already started */ }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setState("idle");
  }, []);

  /* ── TTS ── */
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    // Strip markdown for cleaner speech
    const clean = text
      .replace(/```[\s\S]*?```/g, "code block omitted")
      .replace(/[*_#`>~\[\]()]/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, ", ")
      .trim();

    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1.05;
    utter.pitch = 1;
    utter.volume = 1;

    // Pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.name.includes("Google") && v.lang.startsWith("en")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utter.voice = preferred;

    utter.onstart = () => setState("speaking");
    utter.onend = () => setState("idle");
    utter.onerror = () => setState("idle");

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, []);

  const cancelSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setState("idle");
  }, []);

  return {
    state,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    isSupported,
  };
}

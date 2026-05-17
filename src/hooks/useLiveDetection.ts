import { useCallback, useRef, useState } from "react";
import { analyzeImage, type AnalysisResult } from "@/lib/api";

/* ───────────── Types ───────────── */
export interface LiveDetection {
  timestamp: number;
  result: AnalysisResult;
  frameDataUrl: string;
}

export interface GuidanceStep {
  id: number;
  text: string;
  status: "pending" | "active" | "done" | "warning";
}

export interface ProcedureState {
  name: string;
  steps: GuidanceStep[];
  currentStep: number;
}

interface UseLiveDetectionOptions {
  intervalMs?: number;
  onDetection?: (d: LiveDetection) => void;
  onGuidanceUpdate?: (steps: GuidanceStep[]) => void;
}

interface UseLiveDetectionReturn {
  isRunning: boolean;
  detections: LiveDetection[];
  currentGuidance: GuidanceStep[];
  lastAnalysis: AnalysisResult | null;
  frameCount: number;
  start: (video: HTMLVideoElement) => void;
  stop: () => void;
  procedure: ProcedureState | null;
  startProcedure: (name: string) => void;
  clearDetections: () => void;
}

/* ── Default procedures for common tasks ── */
const PROCEDURES: Record<string, string[]> = {
  "Switch Replacement": [
    "Power down the faulty switch and disconnect all cables",
    "Label each cable with port number before removal",
    "Ground yourself – touch the rack frame before handling",
    "Slide old switch out of the rack mount ears",
    "Inspect the new switch for physical damage",
    "Mount the new switch into the rack (secure both ears)",
    "Reconnect cables in the same port order (check labels)",
    "Power on and wait for POST (LEDs cycle green)",
    "Verify uplink ports are green/active",
    "Run 'show interfaces status' to confirm all ports",
  ],
  "Patch Panel Re-cabling": [
    "Document current patch panel connections (photo + spreadsheet)",
    "Label all cables at both ends before disconnecting",
    "Disconnect cables one at a time from the patch panel",
    "Inspect each cable for damage, kinks, or frayed connectors",
    "Clean fiber connectors with lint-free wipes if fiber",
    "Reconnect cables to the correct ports on the new/same panel",
    "Verify each connection — check link LEDs on connected switch",
    "Run cable tester on any suspect connections",
    "Update documentation with new panel layout",
    "Perform end-to-end connectivity test",
  ],
  "Fiber Tray Maintenance": [
    "Open fiber tray cover carefully — avoid disturbing existing fibers",
    "Identify the fiber strands requiring maintenance",
    "Check bend radius — minimum 30mm for single-mode fiber",
    "Clean fiber connectors with IPA and lint-free cloth",
    "Inspect fiber ends with a scope for scratches or contamination",
    "Re-route any fibers violating bend radius requirements",
    "Secure fibers with velcro ties (never zip ties on fiber)",
    "Close tray cover and verify no pinch points",
    "Check light levels with power meter — acceptable range -3 to -20 dBm",
    "Document all changes in fiber management log",
  ],
  "GPU Rack Setup": [
    "Verify power capacity — GPU racks need 20-30kW per rack",
    "Confirm cooling airflow direction (front-to-back standard)",
    "Install rail kits and verify alignment with rack holes",
    "Slide GPU server into rack and secure with screws",
    "Connect both power supplies to separate PDU circuits (A+B)",
    "Connect management port (IPMI/BMC) to management VLAN",
    "Connect high-speed data ports (25G/100G/400G) to ToR switch",
    "Power on and enter BIOS — verify GPU detection",
    "Check GPU temperatures via BMC — should be under 40°C at idle",
    "Run GPU burn-in test and monitor for thermal throttling",
  ],
};

/* ────────────────────────────────── */
export function useLiveDetection(opts: UseLiveDetectionOptions = {}): UseLiveDetectionReturn {
  const { intervalMs = 4000, onDetection, onGuidanceUpdate } = opts;

  const [isRunning, setIsRunning] = useState(false);
  const [detections, setDetections] = useState<LiveDetection[]>([]);
  const [currentGuidance, setCurrentGuidance] = useState<GuidanceStep[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [procedure, setProcedure] = useState<ProcedureState | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const runningRef = useRef(false);
  const analyzingRef = useRef(false);

  /* ── Capture a frame from the video element ── */
  const captureFrame = useCallback((): string | null => {
    const v = videoRef.current;
    if (!v || v.videoWidth === 0) return null;
    const c = document.createElement("canvas");
    // Reduce resolution for faster upload/analysis
    const scale = Math.min(1, 800 / v.videoWidth);
    c.width = v.videoWidth * scale;
    c.height = v.videoHeight * scale;
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.7);
  }, []);

  /* ── Build a contextual prompt for live guidance ── */
  const buildPrompt = useCallback((proc: ProcedureState | null) => {
    let prompt =
      "You are a live vision assistant helping a data center technician. " +
      "Analyze this camera frame and provide real-time guidance. " +
      "Be very concise — max 2 sentences. Focus on safety hazards and what the technician should do next.";

    if (proc) {
      const currentStep = proc.steps.find((s) => s.status === "active");
      const pending = proc.steps.filter((s) => s.status === "pending");
      prompt +=
        `\n\nThe technician is performing: "${proc.name}".` +
        (currentStep ? `\nCurrent step: "${currentStep.text}".` : "") +
        `\n${pending.length} steps remaining.` +
        "\nDoes the frame show the current step being done correctly? If wrong, warn them.";
    }
    return prompt;
  }, []);

  /* ── Parse AI response into guidance steps ── */
  const updateGuidance = useCallback(
    (result: AnalysisResult, proc: ProcedureState | null) => {
      const steps: GuidanceStep[] = [];

      // Add safety warnings first
      if (result.safety_checks?.length) {
        result.safety_checks.forEach((check, i) => {
          steps.push({ id: 1000 + i, text: `⚠️ ${check}`, status: "warning" });
        });
      }

      // Add troubleshooting steps as active guidance
      if (result.troubleshooting_steps?.length) {
        result.troubleshooting_steps.forEach((step, i) => {
          steps.push({ id: 2000 + i, text: step, status: i === 0 ? "active" : "pending" });
        });
      }

      setCurrentGuidance(steps);
      onGuidanceUpdate?.(steps);
    },
    [onGuidanceUpdate]
  );

  /* ── Analyze one frame ── */
  const analyzeFrame = useCallback(async () => {
    if (analyzingRef.current || !runningRef.current) return;
    analyzingRef.current = true;

    try {
      const frame = captureFrame();
      if (!frame) return;

      setFrameCount((c) => c + 1);
      const prompt = buildPrompt(procedure);
      const result = await analyzeImage(frame, prompt);

      const detection: LiveDetection = {
        timestamp: Date.now(),
        result,
        frameDataUrl: frame,
      };

      setLastAnalysis(result);
      setDetections((prev) => [detection, ...prev].slice(0, 20));
      updateGuidance(result, procedure);
      onDetection?.(detection);

      // Auto-advance procedure steps based on AI confidence
      if (procedure && result.confidence === "high") {
        setProcedure((prev) => {
          if (!prev) return prev;
          const next = { ...prev, steps: [...prev.steps] };
          const activeIdx = next.steps.findIndex((s) => s.status === "active");
          if (activeIdx >= 0 && activeIdx < next.steps.length - 1) {
            next.steps[activeIdx] = { ...next.steps[activeIdx], status: "done" };
            next.steps[activeIdx + 1] = { ...next.steps[activeIdx + 1], status: "active" };
            next.currentStep = activeIdx + 1;
          }
          return next;
        });
      }
    } catch (e) {
      console.error("Live detection error:", e);
    } finally {
      analyzingRef.current = false;
    }
  }, [captureFrame, buildPrompt, procedure, updateGuidance, onDetection]);

  /* ── Start / stop ── */
  const start = useCallback(
    (video: HTMLVideoElement) => {
      videoRef.current = video;
      runningRef.current = true;
      setIsRunning(true);
      setFrameCount(0);
      setDetections([]);

      // Analyze first frame immediately
      setTimeout(analyzeFrame, 500);

      intervalRef.current = setInterval(analyzeFrame, intervalMs);
    },
    [analyzeFrame, intervalMs]
  );

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /* ── Procedure management ── */
  const startProcedure = useCallback((name: string) => {
    const stepsText = PROCEDURES[name] || [];
    const steps: GuidanceStep[] = stepsText.map((text, i) => ({
      id: i,
      text,
      status: i === 0 ? "active" : "pending",
    }));
    setProcedure({ name, steps, currentStep: 0 });
    setCurrentGuidance(steps);
  }, []);

  const clearDetections = useCallback(() => {
    setDetections([]);
    setLastAnalysis(null);
    setCurrentGuidance([]);
    setProcedure(null);
    setFrameCount(0);
  }, []);

  return {
    isRunning,
    detections,
    currentGuidance,
    lastAnalysis,
    frameCount,
    start,
    stop,
    procedure,
    startProcedure,
    clearDetections,
  };
}

/* ── Export procedure names for UI ── */
export const AVAILABLE_PROCEDURES = Object.keys(PROCEDURES);

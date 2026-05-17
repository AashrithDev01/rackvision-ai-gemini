import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, Loader2, ScanLine, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { analyzeImage, uploadImage, type AnalysisResult } from "@/lib/api";
import { AnalysisResultCard } from "./AnalysisResultCard";

export function UploadView() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const onFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setError("Image files only"); return; }
    setFile(f); setError(null); setResult(null);
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  }, []);

  async function analyze() {
    if (!preview || !file) return;
    setAnalyzing(true); setError(null);
    try {
      const [r, url] = await Promise.all([
        analyzeImage(preview, question || undefined),
        uploadImage(file).catch(() => null),
      ]);
      setResult(r);
      if (url) setImageUrl(url);
    } catch (e: any) { setError(e.message); }
    finally { setAnalyzing(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault(); setDrag(false);
            const f = e.dataTransfer.files?.[0]; if (f) onFile(f);
          }}
          className={`glass-strong relative overflow-hidden rounded-xl transition ${drag ? "glow-cyan" : ""}`}
        >
          {!preview ? (
            <label className="flex aspect-[16/9] cursor-pointer flex-col items-center justify-center gap-3 text-center">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Upload className="h-10 w-10 text-cyber" />
              </motion.div>
              <div>
                <div className="font-semibold">Drop a rack, switch or topology image</div>
                <div className="text-xs text-muted-foreground">PNG, JPG · max 20MB · racks, patch panels, fiber, LEDs, diagrams</div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              <div className="rounded-md bg-cyber px-4 py-2 text-sm font-medium text-background">Browse files</div>
            </label>
          ) : (
            <div className="relative">
              <img src={preview} alt="upload preview" className="aspect-[16/9] w-full object-contain bg-black" />
              {analyzing && (
                <div className="absolute inset-0 scanline grid place-items-center bg-background/30">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <ScanLine className="h-12 w-12 text-cyber" />
                  </motion.div>
                </div>
              )}
              <button
                onClick={() => { setFile(null); setPreview(null); setResult(null); setImageUrl(null); }}
                className="absolute right-3 top-3 rounded-md bg-background/70 p-1.5 backdrop-blur hover:bg-background"
              ><X className="h-4 w-4" /></button>
            </div>
          )}
        </div>

        <div className="glass-strong rounded-xl p-4">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Optional question</label>
          <input
            value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Why is this port amber? What VLAN is misconfigured?"
            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyber"
          />
          <button
            onClick={analyze} disabled={!preview || analyzing}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40 hover:glow-purple"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            {analyzing ? "AI scanning infrastructure…" : "Analyze with RackGuide AI"}
          </button>
        </div>

        {error && (
          <div className="glass flex items-center gap-2 rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}
        {result && <AnalysisResultCard result={result} imageUrl={imageUrl ?? preview ?? undefined} />}
      </div>

      <div className="space-y-4">
        <div className="glass-strong rounded-xl p-4">
          <h3 className="text-sm font-semibold">Examples</h3>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2"><ImageIcon className="h-3 w-3 text-cyber"/> Rack with cabling chaos</li>
            <li className="flex items-center gap-2"><ImageIcon className="h-3 w-3 text-cyber"/> Cisco switch LED close-up</li>
            <li className="flex items-center gap-2"><ImageIcon className="h-3 w-3 text-cyber"/> Patch panel labeling</li>
            <li className="flex items-center gap-2"><ImageIcon className="h-3 w-3 text-cyber"/> Network topology diagram</li>
            <li className="flex items-center gap-2"><ImageIcon className="h-3 w-3 text-cyber"/> Fiber tray bend issues</li>
          </ul>
        </div>
        <div className="glass rounded-xl p-4 text-xs text-muted-foreground">
          Powered by RackGuide AI vision · structured output via tool calling.
        </div>
      </div>
    </div>
  );
}

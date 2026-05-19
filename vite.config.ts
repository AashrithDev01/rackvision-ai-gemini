// This preset includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins.
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "./config/vite-preset";

// Configured for standard Node/Vercel deployment target.
export default defineConfig({
  cloudflare: false,
});

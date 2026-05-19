/**
 * Vite configuration preset for TanStack Start + Cloudflare Workers.
 * Combines all required plugins into a single defineConfig wrapper.
 */
import { mergeConfig, loadEnv } from "vite";
import type { UserConfig } from "vite";

interface PresetOptions {
  vite?: UserConfig;
  tanstackStart?: Record<string, any>;
  react?: Record<string, any>;
  cloudflare?: false | Record<string, any>;
  envDefine?: false;
  plugins?: any[];
}

/**
 * SSR error logger — captures server-side rendering errors and sends
 * them to the client via Vite's WebSocket for a better DX.
 */
function devSsrErrorLogger() {
  const SSR_CAPTURE_KEY = "__RACKVISION_CAPTURE_SSR_ERROR__";
  let lastCapture: { error: unknown; at: number } | undefined;
  const CAPTURE_TTL_MS = 5_000;
  const capture = (error: unknown) => { lastCapture = { error, at: Date.now() }; };
  const consumeCapture = () => {
    if (!lastCapture) return undefined;
    if (Date.now() - lastCapture.at > CAPTURE_TTL_MS) { lastCapture = undefined; return undefined; }
    const { error } = lastCapture;
    lastCapture = undefined;
    return error;
  };

  return {
    name: "dev-ssr-error-logger",
    apply: "serve" as const,
    configureServer(server: any) {
      (globalThis as any)[SSR_CAPTURE_KEY] = capture;
      process.on("unhandledRejection", (reason: unknown) => capture(reason));

      server.middlewares.use((_req: any, res: any, next: any) => {
        const origEnd = res.end.bind(res);
        res.end = (...args: any[]) => {
          if (res.statusCode >= 500) {
            const captured = consumeCapture();
            let err: Error | null = null;
            if (captured instanceof Error) err = captured;
            else if (typeof captured === "string" && captured.length > 0) err = new Error(captured);
            try {
              server.ws.send({
                type: "custom",
                event: "server-ssr-error",
                data: err
                  ? { name: err.name, message: err.message, stack: err.stack }
                  : { name: "Error", message: "SSR rendering failed" },
              });
            } catch {}
          }
          return origEnd(...args);
        };
        next();
      });
    },
    transform(code: string, id: string) {
      const normalizedId = id.replace(/\\/g, "/");
      const isTarget =
        normalizedId.includes("/@tanstack/start-server-core/src/request-response.ts") ||
        normalizedId.includes("/@tanstack/start-server-core/dist/esm/request-response.js");
      if (!isTarget) return null;
      const needle = "handler(request, requestOpts)";
      if (!code.includes(needle)) return null;
      return code.replace(
        needle,
        `Promise.resolve(${needle}).catch((err) => { globalThis.${SSR_CAPTURE_KEY}?.(err); throw err; })`
      );
    },
  };
}

/**
 * Main defineConfig wrapper — assembles all plugins and returns a
 * Vite config factory compatible with `export default defineConfig(...)`.
 */
export function defineConfig(configOrOptions: PresetOptions | UserConfig = {}) {
  return async (env: { command: string; mode: string }) => {
    const { command, mode } = env;

    // Determine if this is our options format or raw Vite config
    let options: PresetOptions;
    const optObj = configOrOptions && typeof configOrOptions === "object" ? configOrOptions : {};
    const hasPresetKey = "vite" in optObj || "cloudflare" in optObj || "tanstackStart" in optObj || "react" in optObj || "envDefine" in optObj;
    options = hasPresetKey ? (optObj as PresetOptions) : { vite: optObj as UserConfig };

    const internalPlugins: any[] = [];

    // Tailwind CSS
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    internalPlugins.push(tailwindcss());

    // TSConfig paths
    const tsConfigPaths = (await import("vite-tsconfig-paths")).default;
    internalPlugins.push(tsConfigPaths({ projects: ["./tsconfig.json"] }));

    // SSR error logger (dev only)
    internalPlugins.push(devSsrErrorLogger());

    // Cloudflare (build only)
    if (options.cloudflare !== false && command === "build") {
      try {
        const { cloudflare } = await import("@cloudflare/vite-plugin");
        const cfOptions = (typeof options.cloudflare === "object" && options.cloudflare) || {
          viteEnvironment: { name: "ssr" },
        };
        internalPlugins.push(cloudflare(cfOptions));
      } catch {}
    }

    // TanStack Start
    const { tanstackStart } = await import("@tanstack/react-start/plugin/vite");
    const tanstackStartDefaults = {
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    };
    const tanstackStartOptions = mergeConfig(tanstackStartDefaults, options.tanstackStart ?? {});
    internalPlugins.push(tanstackStart(tanstackStartOptions));

    // React
    const viteReact = (await import("@vitejs/plugin-react")).default;
    internalPlugins.push(viteReact(options.react));

    // Env variable injection (VITE_* → import.meta.env)
    let envDefine: Record<string, string> = {};
    if (options.envDefine !== false) {
      const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
      for (const [key, value] of Object.entries(loadedEnv)) {
        envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
      }
    }

    // Assemble config
    let config: UserConfig = {
      define: envDefine,
      resolve: {
        alias: { "@": `${process.cwd()}/src` },
        dedupe: [
          "react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime",
          "@tanstack/react-query", "@tanstack/query-core",
        ],
      },
      plugins: [...internalPlugins, ...(options.plugins ?? [])],
    };

    if (options.vite) {
      config = mergeConfig(config, options.vite);
    }

    // Default server settings
    config = mergeConfig({ server: { host: "::", port: 8080 } }, config);

    // Watch debounce for better stability
    config = mergeConfig(config, {
      server: {
        watch: {
          awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 },
        },
      },
    });

    return config;
  };
}

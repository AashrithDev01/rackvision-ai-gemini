import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Camera, Upload, MessageSquare, History, Activity, Settings, Network, Bell, ChevronRight, Eye,
} from "lucide-react";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { CameraView } from "@/components/dashboard/CameraView";
import { VisionAgentView } from "@/components/dashboard/VisionAgentView";
import { UploadView } from "@/components/dashboard/UploadView";
import { ChatView } from "@/components/dashboard/ChatView";
import { IncidentsView } from "@/components/dashboard/IncidentsView";
import { HealthView } from "@/components/dashboard/HealthView";
import { SettingsView } from "@/components/dashboard/SettingsView";

type ViewKey = "home" | "camera" | "vision" | "upload" | "chat" | "incidents" | "health" | "settings";

export const Route = createFileRoute("/app")({
  validateSearch: (s: Record<string, unknown>) => ({ view: (s.view as ViewKey) || "home" }),
  component: AppShell,
});

const NAV: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "home", label: "Dashboard", icon: LayoutDashboard },
  { key: "camera", label: "Live Camera", icon: Camera },
  { key: "vision", label: "Vision Agent", icon: Eye },
  { key: "upload", label: "Upload & Analyze", icon: Upload },
  { key: "chat", label: "AI Assistant", icon: MessageSquare },
  { key: "incidents", label: "Incident History", icon: History },
  { key: "health", label: "System Health", icon: Activity },
  { key: "settings", label: "Settings", icon: Settings },
];

function AppShell() {
  const { view } = Route.useSearch();
  const navigate = Route.useNavigate();
  const setView = (v: ViewKey) => navigate({ search: { view: v } });
  const [notif] = useState(3);

  return (
    <div className="flex min-h-screen text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl md:flex">
        <Link to="/" className="flex items-center gap-2 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cyber to-accent">
            <Network className="h-5 w-5 text-background" />
          </div>
          <span className="font-mono font-semibold tracking-tight">
            RackGuide<span className="text-cyber">.AI</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = item.key === view;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-cyber"
                  />
                )}
                <item.icon className="h-4 w-4" />
                {item.label}
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-cyber" />}
              </button>
            );
          })}
        </nav>
        <div className="glass m-3 rounded-lg p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Vision agent</span>
            <span className="flex items-center gap-1 text-cyber-3">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyber-3" /> online
            </span>
          </div>
          <div className="mt-2 font-mono text-[11px] text-muted-foreground">latency 142ms</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/40 bg-background/70 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">RackGuide</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium capitalize">{view.replace("home", "Dashboard")}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile nav */}
            <select
              value={view}
              onChange={(e) => setView(e.target.value as ViewKey)}
              className="md:hidden rounded-md border border-border bg-card px-2 py-1 text-xs"
            >
              {NAV.map(n => <option key={n.key} value={n.key}>{n.label}</option>)}
            </select>
            <button className="relative rounded-md p-2 text-muted-foreground hover:bg-card hover:text-foreground">
              <Bell className="h-4 w-4" />
              {notif > 0 && (
                <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-cyber text-[10px] font-bold text-background">
                  {notif}
                </span>
              )}
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyber to-accent ring-2 ring-background" />
          </div>
        </header>

        <main className="relative flex-1 px-4 py-6 md:px-8 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-7xl"
            >
              {view === "home" && <DashboardHome onNavigate={setView} />}
              {view === "camera" && <CameraView />}
              {view === "vision" && <VisionAgentView />}
              {view === "upload" && <UploadView />}
              {view === "chat" && <ChatView />}
              {view === "incidents" && <IncidentsView />}
              {view === "health" && <HealthView />}
              {view === "settings" && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

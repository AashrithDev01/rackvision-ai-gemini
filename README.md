<div align="center">

# 🔧 RackVision AI

### AI-Powered Data Center & Network Troubleshooting Copilot

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TanStack](https://img.shields.io/badge/TanStack_Start-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/start)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-886FBF?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Stream](https://img.shields.io/badge/Stream-005FFF?style=for-the-badge&logo=stream&logoColor=white)](https://getstream.io/)

**Point your camera at a rack, switch, or patch panel — RackVision AI identifies devices, diagnoses faults, and generates verified resolution playbooks in seconds.**

[Live Demo](#) · [Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started)

</div>

---

## 🎯 Problem Statement

Data center technicians spend **40% of their time** diagnosing infrastructure issues manually — visually inspecting LEDs, tracing cables, and cross-referencing documentation. RackVision AI eliminates this bottleneck with real-time AI vision analysis.

## ✨ Features

### 🎥 Live Vision Agent
- **Continuous camera analysis** — frames captured every 5 seconds and analyzed by Gemini 2.5 Flash
- **Real-time detection overlays** — bounding boxes and status indicators on live video
- **Step-by-step guided procedures** — AI tracks technician progress through switch replacements, fiber maintenance, patch panel re-cabling, and GPU rack setup
- **Safety alerts** — instant warnings for grounding issues, bend radius violations, and incorrect port connections

### 🎤 Voice Agent (Hands-Free)
- **Speech-to-text** — technicians speak commands while hands are busy with hardware
- **Text-to-speech** — AI reads back diagnoses and instructions aloud
- **Natural language queries** — "What am I looking at?", "Is this cable correct?", "What should I do next?"

### 📸 Upload & Analyze
- Drag-and-drop rack, switch, or topology images
- Structured AI analysis with detected devices, observations, and troubleshooting timelines
- Verification CLI commands for Cisco/Juniper/Arista equipment

### 🤖 AI Chat Assistant
- Streaming chat with infrastructure knowledge (VLANs, BGP, OSPF, fiber optics)
- Voice input/output integrated directly into chat
- Context-aware responses for data center operations

### 🎫 Auto-Ticketing
- One-click incident ticket generation from any analysis
- Structured fields: root cause, resolution steps, affected devices, verification
- Stored in Supabase for incident history tracking

### 📊 Operations Dashboard
- Real-time KPIs: devices monitored, open incidents, mean time to triage
- Network topology visualization
- Active alert feed with severity levels

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React 19)                │
│  TanStack Start · Tailwind v4 · Framer Motion       │
│  Web Speech API (STT/TTS) · Canvas frame capture    │
├─────────────────────────────────────────────────────┤
│              Supabase Edge Functions                 │
│  analyze-image · chat · generate-ticket              │
├─────────────────────────────────────────────────────┤
│              AI Provider (Gemini 2.5 Flash)          │
│  Vision analysis · Tool calling · Streaming chat     │
├─────────────────────────────────────────────────────┤
│                Stream · Supabase DB                  │
│  Real-time video · Image storage · Incident records  │
└─────────────────────────────────────────────────────┘
```

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | TanStack Start (React 19 + SSR) |
| **Styling** | Tailwind CSS v4 + custom cyber-dark theme |
| **Animations** | Framer Motion |
| **AI Model** | Google Gemini 2.5 Flash (vision + tool calling) |
| **Voice** | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| **Backend** | Supabase Edge Functions (Deno) |
| **Database** | Supabase PostgreSQL |
| **Storage** | Supabase Storage (infrastructure images) |
| **Video** | Stream API (real-time video services) |
| **Deploy** | Cloudflare Workers (SSR) |
| **UI Components** | shadcn/ui + Radix Primitives |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun
- A Supabase project
- A Stream account

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/rackvision-ai.git
cd rackvision-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and Stream credentials

# Start dev server
npm run dev
```

The app will be available at `http://localhost:8080`

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_STREAM_API_KEY` | Stream API key for video services |
| `STREAM_API_SECRET` | Stream API secret (server-side only) |

### Supabase Edge Functions

The AI inference runs on Supabase Edge Functions. Deploy them with:

```bash
supabase functions deploy analyze-image
supabase functions deploy chat
supabase functions deploy generate-ticket

# Set secrets
supabase secrets set STREAM_API_KEY=your-key
supabase secrets set AI_GATEWAY_URL=https://openrouter.ai/api/v1/chat/completions
```

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── VisionAgentView.tsx    # Live detection + voice + procedures
│   │   ├── CameraView.tsx         # Single-frame camera analysis
│   │   ├── ChatView.tsx           # AI assistant with voice I/O
│   │   ├── UploadView.tsx         # Image upload + analysis
│   │   ├── DashboardHome.tsx      # KPIs, topology, alerts
│   │   ├── AnalysisResultCard.tsx # Structured analysis display
│   │   ├── IncidentsView.tsx      # Incident history
│   │   ├── HealthView.tsx         # System health
│   │   └── SettingsView.tsx       # Configuration
│   └── ui/                        # shadcn/ui components
├── hooks/
│   ├── useVoice.ts                # Speech recognition + TTS
│   └── useLiveDetection.ts        # Continuous frame analysis
├── lib/
│   └── api.ts                     # API client (Supabase functions)
├── routes/
│   ├── __root.tsx                 # HTML shell + meta tags
│   ├── index.tsx                  # Landing page
│   └── app.tsx                    # Main app shell
└── styles.css                     # Cyber-dark design system
```

## 🎨 Design System

Custom cyber-dark theme built with oklch colors:
- **Electric cyan** (`oklch(0.82 0.20 200)`) — primary actions, highlights
- **Violet** (`oklch(0.65 0.22 290)`) — accent, AI indicators
- **Mint** (`oklch(0.85 0.18 175)`) — success, resolved states
- **Glass morphism** — frosted glass cards with backdrop blur
- **Scan line animations** — real-time detection feedback

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built for the modern NOC — because infrastructure shouldn't be diagnosed by guesswork.</strong>
</div>

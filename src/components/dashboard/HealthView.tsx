import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Cpu, HardDrive, Wifi, Server, Play, Copy, Check, Volume2, ShieldAlert,
  Terminal, ArrowRight, Gauge, CornerDownRight, Database, RefreshCw
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ScenarioData {
  id: string;
  name: string;
  track: string;
  focus: string;
  prompt: string;
  telemetry: {
    latency: string;
    errors: number;
    queuedRequests: number;
    unhealthyNode: string;
    temp: number;
    power: number;
    queueWait?: string;
    strandedGpus?: number;
    timeouts?: number;
    congestedRack?: string;
  };
  alerts: { type: string; severity: string; count: number }[];
  action: string;
  target: string;
  reason: string;
  confidence: number;
  evidence: string[];
  speechText: string;
  chartData: { time: string; value: number }[];
}

const SCENARIOS: ScenarioData[] = [
  {
    id: "perf-001",
    name: "perf-001: Chat Model KV Cache Spikes",
    track: "Performance Advisor",
    focus: "chat-mid-34b",
    prompt: "chat-mid-34b has elevated first-token latency, high p95 latency, and GPU memory pressure after a serving change.",
    telemetry: { latency: "59.0s", errors: 8, queuedRequests: 120, unhealthyNode: "gpu-node-03", temp: 66.9, power: 6499 },
    alerts: [{ type: "MemoryPressureHigh", severity: "critical", count: 6 }],
    action: "reduce_load",
    target: "chat-mid-34b",
    reason: "memory_pressure",
    confidence: 0.95,
    evidence: [
      "Model chat-mid-34b has active MemoryPressureHigh critical alerts on gpu-node-03.",
      "Maximum queued requests reached 120, indicating severe KV cache memory pressure after the serving change."
    ],
    speechText: "Alert detected on model chat-mid-34b. Severe memory pressure and high KV cache usage observed on node 3 with 120 queued requests. Recommend reducing load and batch size immediately.",
    chartData: [
      { time: "10:00", value: 3200 },
      { time: "10:15", value: 5400 },
      { time: "10:30", value: 12000 },
      { time: "10:45", value: 24000 },
      { time: "11:00", value: 48000 },
      { time: "11:15", value: 59027 },
      { time: "11:30", value: 55400 },
    ]
  },
  {
    id: "perf-002",
    name: "perf-002: Embedding Demand Spikes",
    track: "Performance Advisor",
    focus: "embed-small",
    prompt: "The embedding service returns elevated 429s during a short evening burst.",
    telemetry: { latency: "19.7s", errors: 22, queuedRequests: 132, unhealthyNode: "None", temp: 57.8, power: 4764 },
    alerts: [{ type: "ReplicaErrorRateHigh", severity: "warning", count: 5 }],
    action: "add_capacity",
    target: "embed-small",
    reason: "traffic_burst",
    confidence: 0.90,
    evidence: [
      "Embedding service embed-small returned elevated 429 ReplicaErrorRateHigh alerts.",
      "p95 latency spiked to 19767ms with 22 client errors (HTTP 429) during the traffic burst, indicating capacity deficit."
    ],
    speechText: "Embedding service is reporting high error rates due to an evening traffic burst. We observed 22 client rate-limit errors and a latency of 19.7 seconds. Recommend adding additional capacity.",
    chartData: [
      { time: "18:00", value: 1200 },
      { time: "18:10", value: 3400 },
      { time: "18:20", value: 8500 },
      { time: "18:30", value: 19767 },
      { time: "18:40", value: 18200 },
      { time: "18:50", value: 12400 },
    ]
  },
  {
    id: "perf-003",
    name: "perf-003: Fabric Congestion in Rack-C",
    track: "Performance Advisor",
    focus: "rack-c",
    prompt: "Serving latency rises while the fabric segment for rack-c shows congestion and retransmits.",
    telemetry: { latency: "44.9s", errors: 7, queuedRequests: 19, unhealthyNode: "None", temp: 65.3, power: 6017, congestedRack: "rack-c" },
    alerts: [
      { type: "FabricCongestionHigh", severity: "critical", count: 6 },
      { type: "MemoryPressureHigh", severity: "warning", count: 1 }
    ],
    action: "reroute_traffic",
    target: "rack-c",
    reason: "fabric_congestion",
    confidence: 0.95,
    evidence: [
      "FabricCongestionHigh alerts triggered in rack-c with high RDMA latency and network retransmits.",
      "Serving latency for models within rack-c spiked to 44977ms; traffic must be shifted to alternative racks."
    ],
    speechText: "Critical fabric congestion alert triggered in rack-c. High RDMA latency and packet retransmits observed. Recommend immediately rerouting traffic away from rack-c.",
    chartData: [
      { time: "09:30", value: 800 },
      { time: "09:45", value: 2400 },
      { time: "10:00", value: 18500 },
      { time: "10:15", value: 44977 },
      { time: "10:30", value: 42100 },
      { time: "10:45", value: 38400 },
    ]
  },
  {
    id: "perf-004",
    name: "perf-004: Tokenizer Rollout Mismatch",
    track: "Performance Advisor",
    focus: "code-assist-15b",
    prompt: "code-assist-15b starts returning 5xx errors shortly after a config rollout.",
    telemetry: { latency: "41.9s", errors: 25, queuedRequests: 21, unhealthyNode: "None", temp: 65.0, power: 5641 },
    alerts: [{ type: "RolloutErrorRateHigh", severity: "critical", count: 6 }],
    action: "rollback_config",
    target: "code-assist-15b",
    reason: "config_error",
    confidence: 0.98,
    evidence: [
      "RolloutErrorRateHigh alert triggered for code-assist-15b following a config rollout.",
      "Inference gateway logs show config_version=v2026.04.09-rc tokenizer checksum mismatch, causing 5xx errors."
    ],
    speechText: "Critical config rollout error on model code-assist-15b. Logs show a tokenizer checksum mismatch leading to 25 server 5xx errors. Recommend rolling back configuration version immediately.",
    chartData: [
      { time: "13:15", value: 1200 },
      { time: "13:30", value: 1500 },
      { time: "13:45", value: 41957 },
      { time: "14:00", value: 41500 },
      { time: "14:15", value: 40800 },
      { time: "14:30", value: 39500 },
    ]
  },
  {
    id: "perf-005",
    name: "perf-005: Thermal Limit on Node 2",
    track: "Performance Advisor",
    focus: "gpu-node-02",
    prompt: "A serving node shows high power and temperature while user-facing requests continue landing there.",
    telemetry: { latency: "44.2s", errors: 3, queuedRequests: 16, unhealthyNode: "gpu-node-02", temp: 91.8, power: 7278 },
    alerts: [
      { type: "NodeTemperatureHigh", severity: "critical", count: 4 },
      { type: "QueueDepthHigh", severity: "warning", count: 1 }
    ],
    action: "reroute_traffic",
    target: "gpu-node-02",
    reason: "node_temperature",
    confidence: 0.95,
    evidence: [
      "gpu-node-02 telemetry reports critical temperature of 91.8C and power levels exceeding normal thresholds.",
      "NodeTemperatureHigh alerts are active; serving traffic must be shifted away from gpu-node-02 to prevent throttling."
    ],
    speechText: "Thermal alert. Node 2 has reached a critical temperature of 91.8 degrees celsius with 7278 watts draw. Serving traffic must be rerouted to cooler nodes to prevent thermal shutdown.",
    chartData: [
      { time: "09:15", value: 72 },
      { time: "09:30", value: 78 },
      { time: "09:45", value: 85 },
      { time: "10:00", value: 91.8 },
      { time: "10:15", value: 91.2 },
      { time: "10:30", value: 90.5 },
    ]
  },
  {
    id: "perf-006",
    name: "perf-006: Normal Telemetry Window",
    track: "Performance Advisor",
    focus: "all-services",
    prompt: "A normal operating window with no major alert pattern or SLO breach.",
    telemetry: { latency: "28.0s", errors: 0, queuedRequests: 18, unhealthyNode: "None", temp: 62.3, power: 5591 },
    alerts: [],
    action: "no_action",
    target: "all-services",
    reason: "normal_operation",
    confidence: 1.0,
    evidence: [
      "Normal operating window with zero major alert patterns or SLO breaches.",
      "All model latencies and error rates are well within healthy operational thresholds."
    ],
    speechText: "All factory systems report normal status. Telemetry and queue latency are well within limits. No operational action is needed.",
    chartData: [
      { time: "07:00", value: 27 },
      { time: "07:15", value: 28 },
      { time: "07:30", value: 26 },
      { time: "07:45", value: 28 },
      { time: "08:00", value: 28 },
    ]
  },
  {
    id: "gpu-001",
    name: "gpu-001: Scheduler Gridlock",
    track: "GPU Placement",
    focus: "8-gpu-and-16-gpu-jobs",
    prompt: "Large training jobs are waiting while many small jobs occupy partial 8-GPU nodes.",
    telemetry: { latency: "0ms", errors: 0, queuedRequests: 0, unhealthyNode: "None", temp: 56.1, power: 4717, queueWait: "75.7m", strandedGpus: 13 },
    alerts: [
      { type: "QueueDepthHigh", severity: "warning", count: 8 },
      { type: "InferenceLatencyHigh", severity: "warning", count: 1 }
    ],
    action: "reserve_full_node",
    target: "gpu_scheduler",
    reason: "fragmentation",
    confidence: 0.90,
    evidence: [
      "Large 8-GPU and 16-GPU training jobs are blocked in queue with p95 wait of 230 minutes.",
      "Multiple small jobs occupy partial single-GPU slots, causing fragmentation; need to reserve full 8-GPU nodes."
    ],
    speechText: "Gridlock detected in training queue. Large 8 and 16 GPU jobs are waiting with a wait time of over 75 minutes, while 13 stranded GPUs are scattered across partially filled nodes. Recommend reserving full nodes.",
    chartData: [
      { time: "14:00", value: 12 },
      { time: "14:20", value: 24 },
      { time: "14:40", value: 45 },
      { time: "15:00", value: 75.7 },
      { time: "15:20", value: 72.0 },
      { time: "15:40", value: 68.0 },
    ]
  },
  {
    id: "gpu-002",
    name: "gpu-002: Idle Capacity Backfill",
    track: "GPU Placement",
    focus: "idle-gpu-slots",
    prompt: "The cluster has idle GPU slots and no large-job pressure in the queue.",
    telemetry: { latency: "0ms", errors: 0, queuedRequests: 0, unhealthyNode: "None", temp: 58.3, power: 4983, queueWait: "32.3m", strandedGpus: 0 },
    alerts: [],
    action: "backfill_small_jobs",
    target: "gpu_scheduler",
    reason: "idle_capacity",
    confidence: 0.95,
    evidence: [
      "The cluster has idle GPU slots and no large-job or high-priority pressure in the queue.",
      "Small jobs should be backfilled to fill the empty GPU slots and maximize factory utilization."
    ],
    speechText: "The scheduler reports under-utilization. Multiple idle slots exist, and there are no large training jobs waiting in queue. Recommend backfilling small jobs immediately.",
    chartData: [
      { time: "06:00", value: 12 },
      { time: "06:15", value: 18 },
      { time: "06:30", value: 25 },
      { time: "06:45", value: 32.3 },
      { time: "07:00", value: 29.0 },
    ]
  },
  {
    id: "gpu-003",
    name: "gpu-003: Priority Preemption",
    track: "GPU Placement",
    focus: "high-priority-jobs",
    prompt: "High-priority jobs are waiting behind lower-priority work.",
    telemetry: { latency: "0ms", errors: 0, queuedRequests: 0, unhealthyNode: "None", temp: 60.6, power: 5771, queueWait: "101.5m", strandedGpus: 0 },
    alerts: [{ type: "PriorityWaitHigh", severity: "warning", count: 5 }],
    action: "prioritize_urgent_jobs",
    target: "high-priority-jobs",
    reason: "priority_wait",
    confidence: 0.95,
    evidence: [
      "High-priority evaluation jobs are blocked in queue with an average wait time of 101.5 minutes.",
      "Lower-priority training jobs are occupying capacity; scheduling priority must be adjusted to move high-priority jobs forward."
    ],
    speechText: "High priority preemption warning. Critical evaluation jobs are blocked in the scheduler queue for over 101 minutes by low-priority training workloads. Recommend adjusting scheduler to prioritize urgent jobs.",
    chartData: [
      { time: "15:00", value: 20 },
      { time: "15:15", value: 45 },
      { time: "15:30", value: 78 },
      { time: "15:45", value: 101.5 },
      { time: "16:00", value: 98.0 },
      { time: "16:15", value: 92.0 },
    ]
  },
  {
    id: "gpu-004",
    name: "gpu-004: Hot Node Quarantine",
    track: "GPU Placement",
    focus: "gpu-node-02",
    prompt: "One node is hot and near its power limit while new jobs are waiting.",
    telemetry: { latency: "0ms", errors: 0, queuedRequests: 0, unhealthyNode: "gpu-node-02", temp: 91.8, power: 7278, queueWait: "61.0m", strandedGpus: 0 },
    alerts: [
      { type: "NodeTemperatureHigh", severity: "critical", count: 4 },
      { type: "QueueDepthHigh", severity: "warning", count: 1 }
    ],
    action: "avoid_unhealthy_node",
    target: "gpu-node-02",
    reason: "unhealthy_node",
    confidence: 0.95,
    evidence: [
      "gpu-node-02 temperature reached 91.8C with NodeTemperatureHigh alerts active.",
      "Avoid placing new jobs on this hot node until temperature and power draw stabilize."
    ],
    speechText: "Node 2 is running hot at 91.8 degrees with maximum power draw. To prevent hardware throttling or fault, recommend quarantining node 2 from any new job placements.",
    chartData: [
      { time: "09:15", value: 72 },
      { time: "09:30", value: 80 },
      { time: "09:45", value: 86 },
      { time: "10:00", value: 91.8 },
      { time: "10:15", value: 91.0 },
      { time: "10:30", value: 90.0 },
    ]
  },
  {
    id: "gpu-005",
    name: "gpu-005: 32-GPU Multi-Node Fragmentation",
    track: "GPU Placement",
    focus: "32-gpu-training-jobs",
    prompt: "Multi-node 32-GPU jobs are waiting while capacity is scattered across partially used nodes.",
    telemetry: { latency: "0ms", errors: 0, queuedRequests: 0, unhealthyNode: "None", temp: 65.8, power: 6245, queueWait: "173.9m", strandedGpus: 6 },
    alerts: [{ type: "MultiNodePlacementBlocked", severity: "warning", count: 8 }],
    action: "reserve_full_node",
    target: "32-gpu-training-jobs",
    reason: "fragmentation",
    confidence: 0.92,
    evidence: [
      "Multi-node 32-GPU training jobs are blocked in queue with MultiNodePlacementBlocked alert.",
      "Capacity is scattered across partially used nodes, making it impossible to aggregate 4 adjacent 8-GPU nodes."
    ],
    speechText: "Multi node fragmentation detected. A 32-GPU job is blocked in queue for 173 minutes due to scattered partial capacity. To avoid multinode blocks, recommend reserving full 8-GPU nodes.",
    chartData: [
      { time: "10:00", value: 45 },
      { time: "10:20", value: 85 },
      { time: "10:40", value: 120 },
      { time: "11:00", value: 173.9 },
      { time: "11:20", value: 170.0 },
      { time: "11:40", value: 165.0 },
    ]
  },
  {
    id: "gpu-006",
    name: "gpu-006: Balanced Queue state",
    track: "GPU Placement",
    focus: "normal-training-queue",
    prompt: "The training queue is short, no urgent jobs are blocked, and node health is normal.",
    telemetry: { latency: "0ms", errors: 0, queuedRequests: 0, unhealthyNode: "None", temp: 62.3, power: 5591, queueWait: "0m", strandedGpus: 0 },
    alerts: [],
    action: "no_action",
    target: "gpu_scheduler",
    reason: "normal_operation",
    confidence: 1.0,
    evidence: [
      "The training queue is short, no urgent jobs are blocked, and node health is fully normal.",
      "All telemetry and scheduling placement metrics indicate optimal operational equilibrium."
    ],
    speechText: "Training scheduler reports balanced health. Zero queue wait time, low priority queue is empty, and node health is stable. No placement modifications required.",
    chartData: [
      { time: "07:00", value: 0 },
      { time: "07:15", value: 0 },
      { time: "07:30", value: 0 },
      { time: "07:45", value: 0 },
      { time: "08:00", value: 0 },
    ]
  },
  {
    id: "fail-001",
    name: "fail-001: Storage Write Degradation",
    track: "Failure Detective",
    focus: "checkpoint-storage",
    prompt: "Several training jobs fail while checkpoint writes are timing out.",
    telemetry: { latency: "0ms", errors: 0, queuedRequests: 0, unhealthyNode: "None", temp: 56.5, power: 4651, timeouts: 106 },
    alerts: [{ type: "CheckpointWriteTimeout", severity: "critical", count: 7 }],
    action: "restart_from_checkpoint",
    target: "failed_jobs",
    reason: "storage_latency",
    confidence: 0.95,
    evidence: [
      "Several training jobs failed with exit_reason=checkpoint_write_timeout.",
      "Corresponds to 106 storage timeouts and CheckpointWriteTimeout alerts; jobs should be restarted from the last good checkpoint."
    ],
    speechText: "Checkpoint storage failure. Multiple training workloads crashed with checkpoint write timeouts due to 106 write timeouts on the storage tier. Recommend restarting jobs from the last successful checkpoint.",
    chartData: [
      { time: "02:00", value: 5 },
      { time: "02:20", value: 22 },
      { time: "02:40", value: 56 },
      { time: "03:00", value: 106 },
      { time: "03:20", value: 95 },
      { time: "03:40", value: 80 },
    ]
  },
  {
    id: "fail-002",
    name: "fail-002: Overheated Node Evacuation",
    track: "Failure Detective",
    focus: "gpu-node-02",
    prompt: "Jobs are running on a node with high power and temperature alerts.",
    telemetry: { latency: "0ms", errors: 0, queuedRequests: 0, unhealthyNode: "gpu-node-02", temp: 91.8, power: 7278 },
    alerts: [
      { type: "NodeTemperatureHigh", severity: "critical", count: 4 },
      { type: "QueueDepthHigh", severity: "warning", count: 1 }
    ],
    action: "move_job",
    target: "gpu-node-02",
    reason: "unhealthy_node",
    confidence: 0.95,
    evidence: [
      "Active training jobs are running on gpu-node-02 which is reporting critical NodeTemperatureHigh (91.8C).",
      "To prevent further issues and thermal throttling, active jobs must be moved to healthier nodes immediately."
    ],
    speechText: "Thermal alert. Node 2 has breached safety temperatures at 91.8 degrees. Active training jobs are in danger of thermal failure. Recommend moving active workloads to alternative nodes immediately.",
    chartData: [
      { time: "09:15", value: 72 },
      { time: "09:30", value: 79 },
      { time: "09:45", value: 86 },
      { time: "10:00", value: 91.8 },
      { time: "10:15", value: 91.0 },
      { time: "10:30", value: 90.0 },
    ]
  },
  {
    id: "fail-003",
    name: "fail-003: Model Batch Throttling",
    track: "Failure Detective",
    focus: "chat-mid-34b",
    prompt: "A serving model shows latency and memory pressure alerts after a batch setting change.",
    telemetry: { latency: "0ms", errors: 0, queuedRequests: 0, unhealthyNode: "gpu-node-03", temp: 66.9, power: 6499 },
    alerts: [{ type: "MemoryPressureHigh", severity: "critical", count: 6 }],
    action: "reduce_load",
    target: "chat-mid-34b",
    reason: "memory_pressure",
    confidence: 0.95,
    evidence: [
      "Model chat-mid-34b experienced high KV cache pressure and severe latency spikes on gpu-node-03.",
      "Triggered critical MemoryPressureHigh alerts following a batch setting change; reducing batch size is required."
    ],
    speechText: "Memory allocation warning. Model chat-mid-34b reports high memory pressure and KV cache spikes on node 3 after a batch configuration change. Recommend reducing batch size or concurrency to mitigate pressure.",
    chartData: [
      { time: "10:00", value: 3000 },
      { time: "10:20", value: 5200 },
      { time: "10:40", value: 8400 },
      { time: "11:00", value: 12000 },
      { time: "11:20", value: 11500 },
      { time: "11:40", value: 10800 },
    ]
  },
  {
    id: "fail-004",
    name: "fail-004: Network Fabric Evacuation",
    track: "Failure Detective",
    focus: "rack-c",
    prompt: "Training and serving symptoms overlap with fabric congestion in one rack.",
    telemetry: { latency: "0ms", errors: 0, queuedRequests: 0, unhealthyNode: "None", temp: 65.3, power: 6017, congestedRack: "rack-c" },
    alerts: [
      { type: "FabricCongestionHigh", severity: "critical", count: 6 },
      { type: "MemoryPressureHigh", severity: "warning", count: 1 }
    ],
    action: "move_job",
    target: "rack-c",
    reason: "fabric_congestion",
    confidence: 0.90,
    evidence: [
      "FabricCongestionHigh alerts active in rack-c with high RDMA latency and network retransmits.",
      "Network degradation overlaps with active training failures; training jobs must be moved to a healthy rack."
    ],
    speechText: "SRE Alert. High RDMA congestion detected in rack-c. Packet drops are causing active training jobs to stall and fail. Recommend moving all jobs away from rack-c.",
    chartData: [
      { time: "09:30", value: 80 },
      { time: "09:45", value: 240 },
      { time: "10:00", value: 1200 },
      { time: "10:15", value: 4497 },
      { time: "10:30", value: 4100 },
      { time: "10:45", value: 3800 },
    ]
  },
  {
    id: "fail-005",
    name: "fail-005: Hardware GPU ECC Errors",
    track: "Failure Detective",
    focus: "gpu-node-09",
    prompt: "Several jobs on one shared node fail while GPU XID/ECC messages appear in logs.",
    telemetry: { latency: "0ms", errors: 5, queuedRequests: 0, unhealthyNode: "gpu-node-09", temp: 55.4, power: 4348 },
    alerts: [{ type: "GpuXidEccError", severity: "critical", count: 5 }],
    action: "move_job",
    target: "gpu-node-09",
    reason: "hardware_fault",
    confidence: 0.98,
    evidence: [
      "gpu-node-09 health daemon logged multiple GPU XID 79 and double-bit ECC hardware faults.",
      "Active training jobs failed with exit_reason=gpu_xid_ecc_error; jobs must be moved and node quarantined."
    ],
    speechText: "Hardware failure warning. Node 9 has logged multiple GPU XID 79 and double-bit ECC errors, causing 5 training jobs to crash. Recommend moving active workloads and placing node 9 into quarantine.",
    chartData: [
      { time: "20:00", value: 0 },
      { time: "20:15", value: 1 },
      { time: "20:30", value: 3 },
      { time: "20:45", value: 5 },
      { time: "21:00", value: 5 },
      { time: "21:15", value: 5 },
    ]
  },
  {
    id: "fail-006",
    name: "fail-006: User Code Crash Escalation",
    track: "Failure Detective",
    focus: "training-job-failure",
    prompt: "A few jobs fail, but there is no clear node, storage, network, or service-wide incident pattern.",
    telemetry: { latency: "0ms", errors: 3, queuedRequests: 0, unhealthyNode: "None", temp: 64.3, power: 5733 },
    alerts: [
      { type: "JobFailureCluster", severity: "warning", count: 3 },
      { type: "MemoryPressureHigh", severity: "warning", count: 1 }
    ],
    action: "escalate",
    target: "training-job-failure",
    reason: "user_code_error",
    confidence: 0.95,
    evidence: [
      "Training jobs failed with exit_reason=user_code_error due to python traceback in training step.",
      "No infrastructure, network, storage, or node alerts occurred; issue is localized to user code, escalate to job owner."
    ],
    speechText: "Scheduler reports training job crashes. Log analysis reveals a python traceback and exit reason matching user code errors. No infrastructure anomalies found. Recommend escalating to job owner.",
    chartData: [
      { time: "13:00", value: 0 },
      { time: "13:15", value: 1 },
      { time: "13:30", value: 2 },
      { time: "13:45", value: 3 },
      { time: "14:00", value: 3 },
    ]
  }
];

export function HealthView() {
  const [selectedId, setSelectedId] = useState<string>("perf-005");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"terminal" | "json" | "ticket">("terminal");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const active = SCENARIOS.find(s => s.id === selectedId) || SCENARIOS[4];

  const handleCopyJson = () => {
    const payload = {
      scenario_id: active.id,
      recommended_action: active.action,
      target: active.target,
      reason_category: active.reason,
      confidence: active.confidence,
      evidence: active.evidence
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ("speechSynthesis" in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(active.speechText);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Scenario Selector */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyber animate-pulse" />
            AI Factory Ops Command Center
          </h2>
          <p className="text-xs text-muted-foreground">
            Correlate raw telemetry, alarms, and logs to isolate fabric faults in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Active Incident Profile:</span>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }
            }}
            className="rounded-lg border border-border bg-sidebar px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-cyber"
          >
            <optgroup label="Track 1: Performance Advisor" className="bg-sidebar">
              {SCENARIOS.filter(s => s.track === "Performance Advisor").map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
            <optgroup label="Track 2: GPU Placement Planner" className="bg-sidebar">
              {SCENARIOS.filter(s => s.track === "GPU Placement").map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
            <optgroup label="Track 3: Failure Detective" className="bg-sidebar">
              {SCENARIOS.filter(s => s.track === "Failure Detective").map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: AR Visualizer and Active Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AR Telemetry Overlay Canvas */}
          <div className="glass-strong relative overflow-hidden rounded-xl p-5 h-[340px]">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyber bg-cyber/10 px-2 py-0.5 rounded-full border border-cyber/20">
                  AR Visualizer Simulation
                </span>
                <h3 className="mt-1 font-semibold text-foreground text-sm">GPU Node & Rack State Overlay</h3>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-cyber-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyber-3" /> Visual Diagnostic
              </span>
            </div>

            {/* Virtual Rack Representation */}
            <div className="relative mt-6 grid h-52 grid-cols-2 gap-4">
              {/* Rack Layout representation */}
              <div className="rounded-lg border border-border/60 bg-background/40 p-4 flex flex-col justify-between">
                <div className="text-[10px] font-mono text-muted-foreground flex justify-between">
                  <span>SYSTEM RACK CHASSIS</span>
                  <span className="text-cyber">8x GPU NODES</span>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2 flex-1">
                  {Array.from({ length: 8 }, (_, idx) => {
                    const nodeName = `gpu-node-0${idx + 1}`;
                    const isHot = active.telemetry.unhealthyNode === nodeName;
                    return (
                      <motion.div
                        key={idx}
                        className={`relative rounded border p-2 flex flex-col justify-between transition-all ${
                          isHot 
                            ? "bg-destructive/15 border-destructive shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse" 
                            : "bg-sidebar/40 border-border/60"
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono font-medium text-foreground">{nodeName}</span>
                          <span className={`h-1.5 w-1.5 rounded-full ${isHot ? "bg-destructive animate-ping" : "bg-cyber-3"}`} />
                        </div>
                        <div className="flex justify-between items-end mt-1">
                          <span className="text-[8px] text-muted-foreground font-mono">Temp</span>
                          <span className={`text-[9px] font-mono ${isHot ? "text-destructive font-bold" : "text-cyber-3"}`}>
                            {isHot ? `${active.telemetry.temp}°C` : "62.3°C"}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Data Flow & Signal telemetry */}
              <div className="flex flex-col gap-3 justify-between">
                {/* Telemetry quick indicators */}
                <div className="glass rounded-lg border border-border/50 bg-background/20 p-3 flex-1 flex flex-col justify-between">
                  <div className="text-[10px] font-mono text-muted-foreground">INCIDENT TARGET FOCUS</div>
                  <div className="text-sm font-bold text-cyber flex items-center gap-1.5 mt-1 font-mono">
                    <Database className="h-4 w-4" />
                    {active.focus}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-sidebar/30 border border-border/40 rounded p-1.5">
                      <div className="text-[8px] font-mono text-muted-foreground uppercase">Latency</div>
                      <div className="text-xs font-bold font-mono text-foreground">{active.telemetry.latency}</div>
                    </div>
                    <div className="bg-sidebar/30 border border-border/40 rounded p-1.5">
                      <div className="text-[8px] font-mono text-muted-foreground uppercase">Errors</div>
                      <div className="text-xs font-bold font-mono text-destructive">{active.telemetry.errors}</div>
                    </div>
                  </div>
                </div>

                {/* Fabric congestion mapping */}
                <div className="glass rounded-lg border border-border/50 bg-background/20 p-3 flex-1 flex flex-col justify-between">
                  <div className="text-[10px] font-mono text-muted-foreground">FABRIC LINK CONGESTION</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Wifi className={`h-4 w-4 ${active.telemetry.congestedRack ? "text-cyber-2 animate-bounce" : "text-cyber-3"}`} />
                    <div className="font-mono text-xs">
                      {active.telemetry.congestedRack ? (
                        <span className="text-cyber-2 font-semibold">congested ({active.telemetry.congestedRack})</span>
                      ) : (
                        <span className="text-cyber-3">all fabrics healthy</span>
                      )}
                    </div>
                  </div>
                  <div className="text-[9px] text-muted-foreground font-mono mt-1">
                    {active.telemetry.congestedRack 
                      ? "RDMA latency and network retransmits are elevated." 
                      : "Packet loss and RDMA retransmission rates within tolerance."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry charts */}
          <div className="glass-strong rounded-xl p-5">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Gauge className="h-4 w-4 text-cyber" />
              Historical Anomaly Metric Wave
            </h3>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={active.chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.82 0.20 200)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.82 0.20 200)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={10} fontClassName="font-mono" />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} fontClassName="font-mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "rgba(10,10,12,0.85)", borderColor: "rgba(255,255,255,0.1)", borderRadius: 8 }}
                    labelClassName="font-mono text-xs text-cyber"
                  />
                  <Area type="monotone" dataKey="value" stroke="oklch(0.82 0.20 200)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Side: Copilot Diagnoses & Resolution playbook */}
        <div className="space-y-6">

          {/* AI Copilot Card */}
          <div className="glass-strong relative overflow-hidden rounded-xl p-5 border border-cyber/20 shadow-[0_0_15px_rgba(6,182,212,0.08)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber/60 to-transparent" />
            
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyber/10 ring-1 ring-cyber/30">
                <ShieldAlert className="h-5 w-5 text-cyber animate-pulse" />
              </div>
              <div>
                <div className="text-xs text-cyber font-mono font-semibold">AUTOMATED TRIAGE</div>
                <h3 className="font-bold text-foreground text-sm">Virtual SRE Playbook</h3>
              </div>
            </div>

            {/* Recommended Action Neon Badge */}
            <div className="mt-5 p-4 rounded-lg bg-cyber/5 border border-cyber/30 flex flex-col justify-between gap-2">
              <div className="text-[10px] font-mono text-cyber uppercase tracking-wider">RECOMMENDED REMEDIATION</div>
              <div className="text-md font-bold font-mono text-foreground flex items-center gap-1.5 capitalize">
                <Play className="h-4.5 w-4.5 text-cyber fill-cyber" />
                {active.action.replace("_", " ")}
              </div>
              <div className="flex justify-between items-center mt-2 border-t border-cyber/20 pt-2 text-[11px] font-mono text-muted-foreground">
                <span>Confidence score:</span>
                <span className="text-cyber font-bold">{(active.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Diagnostic Narrative Text */}
            <div className="mt-4 text-xs text-foreground bg-sidebar/40 border border-border/40 rounded-lg p-3">
              <span className="font-semibold text-cyber">Issue Description:</span> {active.prompt}
            </div>

            {/* Hearing Voice synthesizer button */}
            <button
              onClick={handleSpeak}
              className={`mt-4 w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all ${
                isSpeaking 
                  ? "bg-destructive/20 border border-destructive text-destructive hover:bg-destructive/30 animate-pulse" 
                  : "bg-cyber/15 border border-cyber/40 text-cyber hover:bg-cyber/25"
              }`}
            >
              <Volume2 className="h-4.5 w-4.5" />
              {isSpeaking ? "Mute Copilot Audio" : "Play Voice Copilot"}
            </button>
          </div>

          {/* Incident details tabs (Terminal, JSON, Ticket) */}
          <div className="glass-strong rounded-xl p-5 flex flex-col h-[278px]">
            {/* Tab selector */}
            <div className="flex border-b border-border/40 pb-2">
              {[
                { key: "terminal", label: "Evidence", icon: Terminal },
                { key: "json", label: "Judging Hook", icon: Copy },
                { key: "ticket", label: "Ticket", icon: CornerDownRight }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono transition-all ${
                    activeTab === tab.key 
                      ? "border-b border-cyber text-cyber" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 mt-3 overflow-y-auto min-h-0 text-[11px] font-mono leading-relaxed text-muted-foreground">
              <AnimatePresence mode="wait">
                {activeTab === "terminal" && (
                  <motion.div
                    key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="text-[10px] text-cyber-3 font-semibold uppercase tracking-wider">Telemetry Evidence Logs</div>
                    {active.evidence.map((line, index) => (
                      <div key={index} className="flex gap-2 items-start text-foreground">
                        <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-cyber shrink-0" />
                        <span>{line}</span>
                      </div>
                    ))}
                    {active.alerts.map((al, index) => (
                      <div key={index} className="flex gap-2 items-start mt-2 border border-destructive/20 bg-destructive/5 rounded p-2 text-destructive">
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-[10px] uppercase">Telemetry Alarm Triggered</div>
                          <div className="text-[10px]">{al.type} ({al.severity}) detected {al.count} times.</div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === "json" && (
                  <motion.div
                    key="json" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="relative h-full flex flex-col"
                  >
                    <pre className="bg-background/80 border border-border/40 rounded p-2 text-[10px] text-cyber overflow-auto max-h-[160px] flex-1">
{JSON.stringify({
  scenario_id: active.id,
  recommended_action: active.action,
  target: active.target,
  reason_category: active.reason,
  confidence: active.confidence,
  evidence: active.evidence
}, null, 2)}
                    </pre>
                    <button
                      onClick={handleCopyJson}
                      className="mt-2 self-end flex items-center gap-1.5 rounded bg-cyber px-3 py-1.5 text-xs font-bold text-background hover:bg-cyber/90"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy to Clipboard"}
                    </button>
                  </motion.div>
                )}

                {activeTab === "ticket" && (
                  <motion.div
                    key="ticket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between items-center border-b border-border/30 pb-1.5">
                      <span className="text-foreground font-semibold">TICKET ID: INC-{(active.id).toUpperCase()}</span>
                      <span className="bg-destructive/10 text-destructive border border-destructive/20 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold">
                        OPEN
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <div className="text-[9px] uppercase">Assigned Component</div>
                        <div className="text-xs text-foreground font-semibold font-mono">{active.target}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase">Resolution Action</div>
                        <div className="text-xs text-foreground font-semibold font-mono">{active.action}</div>
                      </div>
                    </div>
                    <div className="mt-2 border-t border-border/30 pt-1.5">
                      <div className="text-[9px] uppercase">Diagnostic Notes</div>
                      <p className="text-[10px] text-foreground italic mt-0.5">
                        "Verified infrastructure anomalies observed in logs matching category {active.reason}."
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

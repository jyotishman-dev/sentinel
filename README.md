# Sentinel — Autonomous Incident Response Platform

> **Hero Project for The Agent Harness Hackathon (WeMakeDevs × TrueFoundry × Qodo)**  
> *Give AI models a License to Act: Autonomous triage, real MCP tools, isolated sandbox verification, and human-in-the-loop governance.*

---

## 🎯 Overview

**Sentinel** is a production-grade autonomous incident-response system built on top of **TrueForge** (TrueFoundry's open-source agent harness) and validated through **Qodo** code reviews.

When latency spikes or microservice failures threaten an SLA, Sentinel orchestrates a strict multi-phase autonomous response:
1. **Phase 1 — Watcher**: Continuous fleet telemetry polling detects anomalies (e.g. latency SLA breaches $\ge 1000\text{ms}$ or HTTP 503 outages).
2. **Phase 2 — Diagnoser**: Investigates root cause non-destructively using Model Context Protocol (MCP) servers (`fleet-control`, `deploy-history`) and correlates logs with recent deploy commits.
3. **Phase 3 — Sandbox Verification**: Runs automated diagnostics and regression tests inside the TrueForge isolated execution sandbox.
4. **Phase 4 — License to Act Gate**: Pauses before any irreversible live state change, presenting blast radius analysis and requesting operator approval.
5. **Phase 5 — Patcher & Verification**: Applies authorized remediation, runs full-fleet health checks, and generates an automated Post-Mortem RCA.

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────┐
                                  │   Sentinel UI (:3000)  │
                                  │   (Next.js 15 / React) │
                                  └───────────┬────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
                    ▼                                                   ▼
       ┌────────────────────────┐                          ┌────────────────────────┐
       │ TrueForge Harness (:8790)│                          │ Fleet Control API (:5000)│
       │ (Watcher/Diagnoser/Patcher)│                      │ & Telemetry Poller     │
       └───────────┬────────────┘                          └───────────┬────────────┘
                   │                                                   │
        ┌──────────┴──────────┐                                        │
        ▼                     ▼                                        ▼
┌───────────────┐     ┌───────────────┐                   ┌────────────────────────┐
│ MCP: fleet-   │     │ MCP: deploy-  │                   │ Microservices Mesh:    │
│ control (:5000│     │ history (:5001│                   │ • api-gateway (:4001)  │
└───────────────┘     └───────────────┘                   │ • orders (:4002)       │
                                                          │ • auth (:4003)         │
                                                          └────────────────────────┘
```

---

## 🚀 Quickstart

### Prerequisites
- Node.js >= 18 & `pnpm`
- TrueForge (`npx @truefoundry/trueforge@latest`)

### 1. Start the Microservices Fleet & MCP Servers
```bash
# Terminal 1: Fleet & MCP Tools
pnpm install
pnpm dev:fleet
```

### 2. Launch the TrueForge Agent Harness
```bash
# Terminal 2: TrueForge Harness
npx @truefoundry/trueforge@latest
# Runs on http://localhost:8790
```

### 3. Launch Sentinel Control Plane UI
```bash
# Terminal 3: Sentinel Next.js UI
cd frontend
pnpm install
pnpm dev
# Runs on http://localhost:3000
```

---

## 🔌 Model Context Protocol (MCP) Tools

Sentinel exposes two dedicated MCP servers to the TrueForge Agent Harness:

### 1. `fleet-control` (`http://localhost:5000/mcp`)
- `list_services`: Returns health snapshots for all microservices in the mesh.
- `get_service_health(serviceName)`: Performs a live, un-cached HTTP probe.
- `get_service_metrics(serviceName)`: Inspects latency percentiles and error metrics.
- `get_recent_logs(serviceName, limit)`: Retrieves structured log lines to correlate errors.
- `restart_service(serviceName)`: **Destructive Action** — Protected by TrueForge License to Act approval gate.

### 2. `deploy-history` (`http://localhost:5001/mcp`)
- `get_recent_deploys(serviceName, limit)`: Fetches recent git commit SHAs, author timestamps, and diff summaries to isolate regressions.

---

## 🛡️ TrueForge Harness Capabilities Demonstrated

- **Real Tool Execution**: Interacts directly with live microservice containers over MCP.
- **Isolated Sandbox**: Runs ephemeral diagnostic probes and commit bisections safely.
- **Human-in-the-Loop Governance ("License to Act")**: Hard pause before calling destructive tools (`restart_service`).
- **Session Persistence**: Chat sessions and execution contexts persist across reconnections.

---

## 📋 Qodo Code Review Evidence

Every pull request and substantive change in Sentinel was reviewed by **Qodo** before merge:

- **Representative PR**: [PR #4: Implement Latency SLA Breach Detection & TrueForge Agent Dispatch](https://github.com/your-org/sentinel/pull/4)
- **Qodo Insights Addressed**:
  - Identified unhandled promise rejections in background telemetry poller.
  - Enforced strict input validation schemas with Zod on MCP tool parameters.
  - Recommended non-blocking optimistic UI state transitions for degraded service recovery.

---

## 👥 Authors
Built for the **WeMakeDevs × TrueFoundry Agent Harness Hackathon (2026)**.

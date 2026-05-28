# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart water treatment plant demo — React + TypeScript + Vite frontend with 3D visualization (Three.js/R3F), AI Agent workflow simulation, and anomaly scenario playback. Backend is deferred; frontend is the active deliverable.

## Commands

```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Dev server on port 3000
npm run build        # Production build
npm run lint         # TypeScript type check (tsc --noEmit)
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run
```

All changes must pass `npm run lint` and `npm run build` before submission.

## Architecture

### State Machine (Core Pattern)

The app is driven by a 9-phase scenario state machine in `useScenarioStore`:

IDLE → ANOMALY_DETECTED → SUPERVISOR_ANALYZING → DISPATCHING → AGENT_ANALYZING → EXECUTING → DEVICE_OPERATING → RECOVERING → RECOVERED

Phase transitions drive everything: UI status, 3D particle effects, camera focus, notifications, and agent card states. Transitions are unidirectional via `advancePhase()`.

### Three Zustand Stores

- **useScenarioStore** — scenario phase, active agent, incident type, thinking content, decision steps, particle/camera/device state
- **useSystemStore** — alarm metrics, production health, event log, notifications, FPS/LOD, agent counts
- **useWindowStore** — draggable agent info windows (position, z-index, open/minimize/focus)

### Layer Composition

- **app/** — global layout, providers, error boundary
- **pages/** — page-level composition only, no business logic
- **features/** — business domain modules (agents/, simulation/)
- **components/** — reusable UI (AgentCard, HeaderHUD, Dock, InfoPanel, etc.)
- **simulation3d/** — 3D scene isolated from page state; subscribes to stores, never writes back
- **stores/** — cross-page shared state (Zustand)
- **hooks/** — reusable logic (useKeyboard, useAnimationLoop, usePhaseEffects, etc.)
- **api/** — fetch wrapper with BASE_URL from env; mock/ for demo data
- **types/** — all domain types centralized (scenario.ts is the source of truth)
- **data/** — static config, demo snapshots, agent metadata

### Key Types (types/scenario.ts)

- `ScenarioPhase` — 9-state enum
- `AgentId` — 'supervisor' | 'dosing' | 'uf' | 'ro' | 'pump'
- `IncidentType` — 'dosing_abnormal' | 'uf_clogging' | 'ro_fouling' | 'pump_overload'
- `AgentUIStatus` — 'normal' | 'pending' | 'alarm' | 'recovering'
- `ParticleIntent` — 'anomaly' | 'dispatch' | 'execute'

### Data Flow

1. User triggers incident (keyboard Ctrl+1-4 or demo panel)
2. `startIncident()` sets phase → stores update → components re-render
3. 3D scene subscribes to store changes → renders particles, camera, device highlights
4. Events logged and notifications pushed via useSystemStore

## Directory Boundaries

- Frontend code: `frontend/src/`
- Backend code: `backend/app/` (empty, deferred)
- Cross-boundary contracts: `contracts/` (OpenAPI, event schemas, mock payloads)
- 3D model sources: `assets/models/source/`
- 3D model exports: `assets/models/exported/`
- Documentation: `docs/`

## Conventions

- Path alias: `@/*` maps to `frontend/src/`
- Package manager: npm only (not pnpm/yarn/bun)
- Node: ^20.19.0 || >=22.12.0
- Functional components only, explicit TypeScript types
- Components don't hardcode URLs — all requests go through `api/`
- 3D components receive explicit inputs, never read complex page state directly
- Interface field changes must update `contracts/` and `types/` first, then UI
- Commit messages: Conventional Commits in Chinese, e.g. `feat(frontend): 添加设备状态面板`
- Team-facing documentation in Chinese

## Constraints from AGENTS.md

- Only modify files within the explicitly requested scope
- Do not refactor unrelated modules, move directories, or bulk-format unrelated files
- Do not commit real keys, customer data, hardware params, or production addresses
- Hardware operations are simulation/animation only — no real hardware control
- Check git status before changes to avoid overwriting others' work
- New dependencies require justification (necessity, maintenance status, bundle impact)
- Contract/event/model path changes must sync with `contracts/`

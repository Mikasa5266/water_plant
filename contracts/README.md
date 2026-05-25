# Contracts

Shared API, event, and data contracts live here.

## Files

- `openapi.yaml`: HTTP API draft.
- `agent-events.schema.json`: Agent run timeline event schema.
- `simulation-events.schema.json`: 3D simulation event schema.
- `mock/`: mock payloads aligned with the contracts.

## Rules

- Update contracts before wiring frontend/backend behavior that depends on new fields.
- Keep IDs stable and language-neutral, for example `pump-001`, not a display name.
- Mock data is allowed, but it should follow these contracts.
- This project currently demonstrates hardware behavior through simulation events, not real hardware control.

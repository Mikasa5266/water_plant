import type { AgentRun, CreateAgentRunRequest } from '../../types/index';

let runCounter = 0;

export function createMockAgentRun(_req: CreateAgentRunRequest): AgentRun {
  runCounter += 1;
  return {
    id: `run-mock-${runCounter}-${Date.now()}`,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };
}

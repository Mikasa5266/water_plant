import type { AgentRun, CreateAgentRunRequest } from '../../types/index';
import { isMockMode } from '../config';
import { request } from '../client';
import { createMockAgentRun } from '../mock/agentMock';

export async function createAgentRun(req: CreateAgentRunRequest): Promise<AgentRun> {
  if (isMockMode()) {
    return createMockAgentRun(req);
  }
  return request<AgentRun>('/agent/runs', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

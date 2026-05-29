import { useState } from 'react';
import type { AgentId, AgentLog } from '../../types/index';
import { INITIAL_AGENT_LOGS } from '../../data/initialAgentLogs';

export function useAgentState() {
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentId, 'idle' | 'monitoring' | 'processing' | 'warning'>>({
    supervisor: 'monitoring',
    dosing: 'monitoring',
    uf: 'monitoring',
    ro: 'monitoring',
    pump: 'monitoring'
  });

  const [agentLogs, setAgentLogs] = useState<Record<AgentId, AgentLog[]>>(
    () => Object.fromEntries(
      Object.entries(INITIAL_AGENT_LOGS).map(([k, v]) => [k, [...v]])
    ) as Record<AgentId, AgentLog[]>
  );

  const resetAgentStatuses = () => {
    setAgentStatuses({
      supervisor: 'monitoring',
      dosing: 'monitoring',
      uf: 'monitoring',
      ro: 'monitoring',
      pump: 'monitoring'
    });
  };

  return {
    agentStatuses,
    setAgentStatuses,
    agentLogs,
    setAgentLogs,
    resetAgentStatuses
  };
}

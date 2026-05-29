import type { AgentEvent } from '../../types/index';

export interface EventStreamSubscription {
  unsubscribe: () => void;
}

export type AgentEventHandler = (event: AgentEvent) => void;

export interface IEventStreamClient {
  subscribe(runId: string, handler: AgentEventHandler): EventStreamSubscription;
  close(): void;
}

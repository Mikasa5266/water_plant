import type { IEventStreamClient } from './types';
import { isMockMode } from '../config';
import { MockEventStreamClient } from './mockEventStream';

export type { IEventStreamClient, EventStreamSubscription, AgentEventHandler } from './types';

export function createEventStreamClient(): IEventStreamClient {
  if (isMockMode()) {
    return new MockEventStreamClient();
  }
  // TODO: 后端就绪后实现 SSE 客户端
  // return new SSEEventStreamClient();
  return new MockEventStreamClient();
}

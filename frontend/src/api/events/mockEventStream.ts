import type { AgentEvent } from '../../types/index';
import type { IEventStreamClient, EventStreamSubscription, AgentEventHandler } from './types';

const MOCK_EVENTS: Omit<AgentEvent, 'id' | 'runId' | 'timestamp'>[] = [
  { type: 'run.started', message: 'Agent 运行启动' },
  { type: 'plan.created', message: '已生成处置方案' },
  { type: 'tool.called', message: '调用工艺参数读取工具', toolCall: { id: 'tc-1', name: 'read_telemetry', status: 'running' } },
  { type: 'tool.succeeded', message: '工艺参数读取完成', toolCall: { id: 'tc-1', name: 'read_telemetry', status: 'succeeded', durationMs: 120 } },
  { type: 'simulation.requested', message: '请求 3D 场景模拟设备操作' },
  { type: 'run.succeeded', message: 'Agent 运行完成，异常已恢复' },
];

const REPLAY_INTERVAL_MS = 1000;

export class MockEventStreamClient implements IEventStreamClient {
  private timers: ReturnType<typeof setTimeout>[] = [];

  subscribe(runId: string, handler: AgentEventHandler): EventStreamSubscription {
    let eventIndex = 0;

    const scheduleNext = () => {
      if (eventIndex >= MOCK_EVENTS.length) return;

      const timer = setTimeout(() => {
        const template = MOCK_EVENTS[eventIndex];
        const event: AgentEvent = {
          ...template,
          id: `evt-${runId}-${eventIndex}`,
          runId,
          timestamp: new Date().toISOString(),
        };
        handler(event);
        eventIndex += 1;
        scheduleNext();
      }, REPLAY_INTERVAL_MS);

      this.timers.push(timer);
    };

    scheduleNext();

    return {
      unsubscribe: () => {
        this.timers.forEach(clearTimeout);
        this.timers = [];
      },
    };
  }

  close(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}

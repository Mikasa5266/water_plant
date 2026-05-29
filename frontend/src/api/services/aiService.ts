import type { AIAnalyzeRequest, AIStreamEvent } from '../../types/ai';

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL ?? 'http://localhost:8000/api';

export type StreamCallback = (event: AIStreamEvent) => void;

export function streamAnalysis(
  request: AIAnalyzeRequest,
  onEvent: StreamCallback,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    fetch(`${AI_BASE_URL}/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
      .then((res) => {
        if (!res.ok) {
          onEvent({ type: 'error', message: `HTTP ${res.status}` });
          resolve();
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          onEvent({ type: 'error', message: 'No response body' });
          resolve();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        function processBuffer() {
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;
            try {
              const event = JSON.parse(jsonStr) as AIStreamEvent;
              onEvent(event);
              if (event.type === 'done' || event.type === 'error') {
                reader!.cancel();
                resolve();
                return;
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        function pump(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              if (buffer.trim()) processBuffer();
              resolve();
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            processBuffer();
            return pump();
          });
        }

        pump().catch(reject);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          resolve();
        } else {
          onEvent({ type: 'error', message: err.message ?? 'Network error' });
          resolve();
        }
      });
  });
}

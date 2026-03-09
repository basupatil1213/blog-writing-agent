import { useCallback, useRef, useState } from 'react';
import { streamBlogGeneration } from '@/api/blogApi';
import type {
  BlogResult,
  GenerationStatus,
  ProgressStep,
} from '@/types';

interface UseBlogGenerationReturn {
  status: GenerationStatus;
  steps: ProgressStep[];
  result: BlogResult | null;
  error: string | null;
  elapsedMs: number;
  generate: (topic: string) => Promise<void>;
  reset: () => void;
}

export function useBlogGeneration(): UseBlogGenerationReturn {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [result, setResult] = useState<BlogResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 200);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    stopTimer();
    setStatus('idle');
    setSteps([]);
    setResult(null);
    setError(null);
    setElapsedMs(0);
  }, [stopTimer]);

  const generate = useCallback(
    async (topic: string) => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Reset state
      setStatus('generating');
      setSteps([]);
      setResult(null);
      setError(null);
      startTimer();

      try {
        const stream = streamBlogGeneration(
          { topic },
          controller.signal,
        );

        for await (const event of stream) {
          if (controller.signal.aborted) break;

          switch (event.type) {
            case 'progress':
              setSteps((prev) => [
                ...prev,
                { step: event.step, message: event.message, completedAt: Date.now() },
              ]);
              break;

            case 'complete':
              setResult({
                title: event.title,
                blog_kind: event.blog_kind,
                mode: event.mode,
                needs_research: event.needs_research,
                evidence_count: event.evidence_count,
                section_count: event.section_count,
                content: event.content,
              });
              setStatus('complete');
              stopTimer();
              setElapsedMs(Date.now() - startTimeRef.current);
              break;

            case 'error':
              setError(event.message);
              setStatus('error');
              stopTimer();
              break;
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // User cancelled — stay in current state
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus('error');
        stopTimer();
      }
    },
    [startTimer, stopTimer],
  );

  return { status, steps, result, error, elapsedMs, generate, reset };
}

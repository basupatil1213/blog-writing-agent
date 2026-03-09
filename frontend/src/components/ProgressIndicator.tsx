import {
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  Globe,
  Image,
  Layout,
  Loader2,
  Merge,
  PenLine,
  Sparkles,
  Wand2,
  ZapIcon,
} from 'lucide-react';
import type { GenerationStatus, ProgressStep } from '@/types';

// ── Icons per step ────────────────────────────────────────────────────────────

const STEP_ICONS: Record<string, React.ElementType> = {
  queued:                        ZapIcon,
  router:                        Compass,
  research:                      Globe,
  orchestrator:                  Layout,
  worker:                        PenLine,
  merge_content:                 Merge,
  decide_images:                 Image,
  generate_and_place_images:     Wand2,
  reducer:                       Sparkles,
};

// ─────────────────────────────────────────────────────────────────────────────

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  status: GenerationStatus;
}

export function ProgressIndicator({ steps, status }: ProgressIndicatorProps) {
  const isGenerating = status === 'generating';

  if (steps.length === 0 && !isGenerating) return null;

  return (
    <div className="animate-fade-in rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isGenerating ? (
            <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
          ) : status === 'complete' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <Clock className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-sm font-semibold text-slate-800">
            {isGenerating ? 'Generating your blog…' : status === 'complete' ? 'Generation complete' : 'Generation failed'}
          </span>
        </div>

        {isGenerating && (
          <span className="text-xs text-brand-600 font-medium animate-pulse-slow">
            Working…
          </span>
        )}
      </div>

      <ol className="divide-y divide-slate-50">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isActive = isLast && isGenerating;
          const Icon = STEP_ICONS[step.step] ?? Circle;

          return (
            <li key={`${step.step}-${idx}`} className="flex items-start gap-3 px-5 py-3">
              {/* Icon */}
              <div
                className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-brand-100 text-brand-600'
                    : 'bg-emerald-50 text-emerald-500'
                }`}
              >
                {isActive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug ${
                    isActive ? 'text-brand-700 font-medium' : 'text-slate-600'
                  }`}
                >
                  {step.message}
                </p>
              </div>

              {/* Done indicator */}
              {!isActive && (
                <CheckCircle2 className="flex-shrink-0 mt-0.5 w-4 h-4 text-emerald-400" />
              )}
            </li>
          );
        })}

        {/* Placeholder row while generating with no steps yet */}
        {steps.length === 0 && isGenerating && (
          <li className="flex items-center gap-3 px-5 py-3">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin" />
            </div>
            <p className="text-sm text-brand-700 font-medium">Initialising…</p>
          </li>
        )}
      </ol>
    </div>
  );
}

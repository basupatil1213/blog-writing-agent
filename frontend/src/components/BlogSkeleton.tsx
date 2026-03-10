import {
  CheckCircle2,
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
import { Fragment } from 'react';
import type { GenerationStatus, ProgressStep } from '@/types';

// ── Pipeline definition ───────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { id: 'queued',                    label: 'Start',    icon: ZapIcon,   desc: 'Initialising request'     },
  { id: 'router',                    label: 'Route',    icon: Compass,   desc: 'Classifying topic'        },
  { id: 'research',                  label: 'Research', icon: Globe,     desc: 'Gathering sources'        },
  { id: 'orchestrator',              label: 'Plan',     icon: Layout,    desc: 'Structuring outline'      },
  { id: 'worker',                    label: 'Write',    icon: PenLine,   desc: 'Drafting sections'        },
  { id: 'merge_content',             label: 'Merge',    icon: Merge,     desc: 'Combining content'        },
  { id: 'decide_images',             label: 'Visuals',  icon: Image,     desc: 'Planning visuals'         },
  { id: 'generate_and_place_images', label: 'Diagrams', icon: Wand2,     desc: 'Generating diagrams'      },
  { id: 'reducer',                   label: 'Polish',   icon: Sparkles,  desc: 'Final polish'             },
] as const;

type PipelineStep = (typeof PIPELINE_STEPS)[number];
type StepState = 'pending' | 'active' | 'done';

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeStates(
  steps: ProgressStep[],
  isGenerating: boolean,
): Record<string, StepState> {
  const result: Record<string, StepState> = Object.fromEntries(
    PIPELINE_STEPS.map((s) => [s.id, 'pending' as StepState]),
  );
  for (let i = 0; i < steps.length; i++) {
    const isLast = i === steps.length - 1;
    result[steps[i].step] = isLast && isGenerating ? 'active' : 'done';
  }
  return result;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PipelineNode({ step, state }: { step: PipelineStep; state: StepState }) {
  const Icon = step.icon;
  return (
    <div className="flex flex-col items-center gap-1.5 w-14 flex-shrink-0">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 transition-all duration-500 ${
          state === 'done'
            ? 'ring-emerald-300 bg-emerald-50 shadow-sm'
            : state === 'active'
              ? 'ring-brand-400 bg-brand-50 shadow-sm shadow-brand-100'
              : 'ring-slate-200 bg-slate-50'
        }`}
      >
        {state === 'done' && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />}
        {state === 'active' && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
        {state === 'pending' && <Icon className="w-4 h-4 text-slate-300" />}
      </div>
      <span
        className={`text-[10px] font-semibold text-center leading-tight ${
          state === 'done'
            ? 'text-emerald-600'
            : state === 'active'
              ? 'text-brand-600'
              : 'text-slate-400'
        }`}
      >
        {step.label}
      </span>
    </div>
  );
}

function Connector({ filled }: { filled: boolean }) {
  return (
    <div className="flex items-center w-6 pb-5 flex-shrink-0">
      <div
        className={`w-full h-0.5 transition-colors duration-500 ${
          filled ? 'bg-emerald-300' : 'bg-slate-200'
        }`}
      />
    </div>
  );
}

function SkeletonLine({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} style={style} />;
}

// ── Main component ────────────────────────────────────────────────────────────

interface BlogSkeletonProps {
  steps: ProgressStep[];
  status: GenerationStatus;
  elapsedMs: number;
}

export function BlogSkeleton({ steps, status, elapsedMs }: BlogSkeletonProps) {
  const isGenerating = status === 'generating';
  const states = computeStates(steps, isGenerating);

  const doneCount = PIPELINE_STEPS.filter((s) => states[s.id] === 'done').length;
  const activeCount = PIPELINE_STEPS.filter((s) => states[s.id] === 'active').length;
  const progressPct = ((doneCount + activeCount * 0.5) / PIPELINE_STEPS.length) * 100;

  const activeStep = steps[steps.length - 1] ?? null;
  const completedSteps = isGenerating ? steps.slice(0, -1) : steps;

  const elapsedSec = (elapsedMs / 1000).toFixed(1);

  return (
    <div className="animate-slide-up space-y-5">
      {/* ── Pipeline Card ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-brand-50/60 to-white border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 bg-brand-600 rounded-lg shadow-sm">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">Generating your blog post…</p>
                <p className="text-xs text-slate-500">
                  {doneCount + activeCount} of {PIPELINE_STEPS.length} pipeline steps
                </p>
              </div>
            </div>
            <span className="text-xs tabular-nums font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {elapsedSec}s
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Pipeline nodes */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-4">
            AI Pipeline
          </p>
          <div className="overflow-x-auto pb-1">
            <div className="flex items-start min-w-max">
              {PIPELINE_STEPS.map((step, i) => (
                <Fragment key={step.id}>
                  <PipelineNode step={step} state={states[step.id]} />
                  {i < PIPELINE_STEPS.length - 1 && (
                    <Connector
                      filled={
                        states[PIPELINE_STEPS[i + 1].id] === 'done' ||
                        states[PIPELINE_STEPS[i + 1].id] === 'active'
                      }
                    />
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Active step callout */}
        {activeStep && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-brand-50 border border-brand-100 rounded-xl">
              <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse flex-shrink-0" />
              <p className="text-sm text-brand-800 font-medium leading-snug">{activeStep.message}</p>
            </div>
          </div>
        )}

        {/* Recently completed steps log */}
        {completedSteps.length > 0 && (
          <div className="px-6 pb-5 pt-1 border-t border-slate-50">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
              Completed
            </p>
            <div className="space-y-1.5">
              {completedSteps.slice(-4).reverse().map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{s.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Blog skeleton card ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Skeleton "header bar" */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
          <SkeletonLine className="h-4 w-48" />
          <div className="flex items-center gap-2">
            <SkeletonLine className="h-6 w-16 rounded-full" />
            <SkeletonLine className="h-6 w-20 rounded-full" />
          </div>
        </div>

        {/* Skeleton title banner */}
        <div className="px-6 py-4 bg-brand-950">
          <SkeletonLine className="h-5 w-3/5" style={{ background: 'rgba(255,255,255,0.12)', animation: 'none' }} />
        </div>

        {/* Skeleton blog body */}
        <div className="px-6 py-8 space-y-8">
          {/* Intro */}
          <div className="space-y-2.5">
            {[1, 0.9, 0.95, 0.85, 0.7].map((w, i) => (
              <SkeletonLine key={i} className="h-3.5" style={{ width: `${w * 100}%` }} />
            ))}
          </div>

          {/* Section 1 heading + paragraphs */}
          <div className="space-y-2.5">
            <SkeletonLine className="h-5 w-2/5" />
            {[1, 0.9, 0.85, 0.6].map((w, i) => (
              <SkeletonLine key={i} className="h-3.5" style={{ width: `${w * 100}%` }} />
            ))}
          </div>

          {/* Code block placeholder */}
          <div className="rounded-xl bg-slate-900 p-5 space-y-2.5">
            {[0.55, 0.82, 0.48, 0.72, 0.38, 0.62].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded-md"
                style={{ width: `${w * 100}%`, background: 'rgba(255,255,255,0.10)' }}
              />
            ))}
          </div>

          {/* Section 2 */}
          <div className="space-y-2.5">
            <SkeletonLine className="h-5 w-1/3" />
            {[1, 0.88, 0.93, 0.78, 0.5].map((w, i) => (
              <SkeletonLine key={i} className="h-3.5" style={{ width: `${w * 100}%` }} />
            ))}
          </div>

          {/* Section 3 — partial, to give "still writing" feel */}
          <div className="space-y-2.5">
            <SkeletonLine className="h-5 w-2/5" />
            {[1, 0.9].map((w, i) => (
              <SkeletonLine key={i} className="h-3.5" style={{ width: `${w * 100}%` }} />
            ))}
            {/* "Cursor" */}
            <div className="flex items-center gap-1.5">
              <SkeletonLine className="h-3.5" style={{ width: '45%' }} />
              <span className="w-0.5 h-4 bg-brand-400 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

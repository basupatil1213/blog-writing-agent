import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Github,
  Globe,
  Image,
  Layers,
  LogIn,
  PenLine,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Globe,
    title: 'Live Web Research',
    desc: 'Tavily-powered search gathers fresh evidence, citations, and industry sources for every post.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
  },
  {
    icon: Layers,
    title: 'Structured Outlines',
    desc: 'GPT-4o orchestrates 5–9 sections with clear goals, word-count targets, and tone guidance.',
    color: 'text-brand-500',
    bg: 'bg-brand-50',
  },
  {
    icon: PenLine,
    title: 'Parallel Section Writing',
    desc: 'LangGraph fans out section workers in parallel — cutting generation time dramatically.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Image,
    title: 'AI-Generated Diagrams',
    desc: 'Gemini creates custom architecture diagrams, flow charts and visuals stored in MinIO.',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
  },
  {
    icon: Code2,
    title: 'Syntax-Highlighted Code',
    desc: 'Every code block is language-tagged and beautifully highlighted with a dark theme.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: BookOpen,
    title: 'Save & Revisit',
    desc: 'Log in once and your generated posts are saved to your personal library, forever.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Enter a topic',
    desc: 'Type any technical subject — from "LangGraph agents" to "Zero-knowledge proofs". Be as specific or broad as you like.',
    icon: PenLine,
  },
  {
    n: '02',
    title: 'Watch the pipeline',
    desc: 'A 9-stage AI pipeline researches, plans, writes, and illustrates your post in real time. Track every step live.',
    icon: Wand2,
  },
  {
    n: '03',
    title: 'Publish & save',
    desc: 'Copy the Markdown, download it, or save it straight to your library. All images are hosted automatically.',
    icon: Sparkles,
  },
];

const BLOG_KINDS = [
  { label: 'Explainer', color: 'bg-blue-100 text-blue-700' },
  { label: 'Tutorial', color: 'bg-emerald-100 text-emerald-700' },
  { label: 'News roundup', color: 'bg-amber-100 text-amber-700' },
  { label: 'Comparison', color: 'bg-violet-100 text-violet-700' },
  { label: 'System design', color: 'bg-rose-100 text-rose-700' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function NavBar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">BlogAgent</span>
          </div>

          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How it works</a>
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-600 transition-colors"
            >
              API Docs
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/app"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors"
                >
                  Open App <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Log in
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow transition-colors"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <NavBar />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 text-white">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-800/60 border border-brand-700/50 rounded-full text-xs font-medium text-brand-200 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Powered by LangGraph · GPT-4o · Tavily · Gemini
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Expert technical blogs,
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 via-cyan-300 to-emerald-300">
              written by AI in minutes.
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Enter any topic. A 9-stage AI pipeline researches, writes and illustrates a complete,
            publication-ready blog post — with code examples, citations and diagrams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={user ? '/app' : '/register'}
              className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-900/50 hover:shadow-brand-800/60 transition-all text-base"
            >
              <Sparkles className="w-5 h-5" />
              {user ? 'Open the app' : 'Start writing for free'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium rounded-2xl transition-all text-base"
            >
              See how it works
            </a>
          </div>

          {/* Blog-kind chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-10">
            {BLOG_KINDS.map((k) => (
              <span key={k.label} className={`px-3 py-1 text-xs font-semibold rounded-full ${k.color}`}>
                {k.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '5–9', label: 'Sections per post', icon: Layers },
            { value: '3', label: 'Research modes', icon: Globe },
            { value: '<3 min', label: 'Average generation', icon: Zap },
            { value: '∞', label: 'Topics supported', icon: PenLine },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="w-5 h-5 text-brand-500 mb-1" />
              <span className="text-2xl font-extrabold text-slate-900">{value}</span>
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Everything you need to ship great content
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            From first keyword to final Markdown — a complete AI authoring pipeline.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-bold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
              Three steps to a publish-ready post
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              No prompting engineering. No copy-pasting. Just a topic.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, desc, icon: Icon }) => (
              <div key={n} className="relative text-center">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-200 mb-5">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 sm:left-1/2 sm:-translate-x-1/2 sm:top-0 sm:left-auto sm:translate-x-0 text-xs font-black text-brand-300">
                  {n}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline peek ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-brand-950 to-slate-900 p-8 sm:p-12 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(99,102,241,.6) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(6,182,212,.4) 0%, transparent 50%)',
          }} />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">The 9-stage AI pipeline</h2>
            <p className="text-slate-400 mb-8 text-sm">Every blog post passes through all these nodes in real time.</p>

            <div className="flex flex-wrap gap-3">
              {[
                { label: '1. Queue',    color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
                { label: '2. Route',    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                { label: '3. Research', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                { label: '4. Plan',     color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
                { label: '5. Write',    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                { label: '6. Merge',    color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
                { label: '7. Visuals',  color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                { label: '8. Diagrams', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
                { label: '9. Polish',   color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
              ].map(({ label, color }) => (
                <span key={label} className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${color}`}>
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              {[
                'Real-time SSE streaming',
                'Parallel section workers',
                'MinIO image storage',
                'Citation extraction',
                'Markdown output',
              ].map((f) => (
                <div key={f} className="flex items-center gap-1.5 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-brand-600 to-brand-700 py-20 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Sparkles className="w-10 h-10 mx-auto mb-4 text-brand-200" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to write your first post?
          </h2>
          <p className="text-brand-100 text-lg mb-8">
            Create a free account and generate your first blog in under 3 minutes.
          </p>
          <Link
            to={user ? '/app' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:bg-brand-50 transition-all text-base"
          >
            <Sparkles className="w-5 h-5" />
            {user ? 'Go to app' : 'Get started — it\'s free'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-brand-500 to-brand-700 rounded-md flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-slate-600">BlogAgent</span>
            <span>· LangGraph + GPT-4o + Gemini</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/api/docs" className="hover:text-slate-600 transition-colors">API Docs</a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-slate-600 transition-colors"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

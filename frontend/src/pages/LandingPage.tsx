// Public landing page (light). Logged-in visitors go straight to the dashboard.

import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Captions,
  FileText,
  GitBranch,
  MessageSquareQuote,
  Mic,
  Sparkles,
  Timer,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router'

import { Logo } from '@/components/Brand'
import { useAuth } from '@/features/auth/context'
import { INTERVIEWERS } from '@/features/interview/constants'
import { cn } from '@/lib/utils'

const FEATURES: { icon: typeof Mic; title: string; text: string }[] = [
  { icon: Mic, title: 'A real voice conversation', text: 'The interviewer speaks, listens and replies naturally. Just answer out loud; pausing for two seconds hands the turn back.' },
  { icon: MessageSquareQuote, title: 'Reactions to what you said', text: 'Correct answers get specific credit, mistakes get a one-line correction. No generic "thank you" after every answer.' },
  { icon: GitBranch, title: 'Follow-ups like a real interviewer', text: 'Strong answers lead to deeper questions; if you are stuck, the interviewer explains and moves on, as a real one would.' },
  { icon: Captions, title: 'Live captions', text: 'See your words appear as you speak, and the interviewer’s words as they are said.' },
  { icon: BadgeCheck, title: 'Detailed feedback report', text: 'Scores per question, what was good, what was missing, a model answer, and your speaking pace and filler words.' },
  { icon: Timer, title: 'Time-boxed sessions', text: '5, 10 or 15 minutes. Refresh by accident? The interview picks up exactly where you left off.' },
]

const TYPES: { icon: typeof Mic; title: string; text: string }[] = [
  { icon: Sparkles, title: 'Any topic', text: 'Machine learning, React, SQL, system design… you choose.' },
  { icon: FileText, title: 'Your resume', text: 'Questions about your own projects and experience.' },
  { icon: BriefcaseBusiness, title: 'A job description', text: 'Paste a posting and practise for that role.' },
  { icon: Users, title: 'HR & behavioral', text: 'Introductions, teamwork, challenges, scored on STAR.' },
]

function Section({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase">{eyebrow}</p>
      <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-10">{children}</div>
    </section>
  )
}

/** A static preview of a conversation, built in HTML (no screenshots). */
function ConversationPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200/60 via-accent-500/10 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020] p-5 text-sm text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between text-xs text-ink-400">
          <span className="flex items-center gap-2"><span className="size-2 animate-pulse rounded-full bg-emerald-400" /> Live interview · Bias-Variance</span>
          <span className="rounded-full border border-white/15 px-2 py-0.5 tabular-nums">7:42</span>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl bg-brand-500/20 px-3 py-2">
            <p className="text-[10px] font-medium tracking-wide text-ink-400 uppercase">Arjun · interviewer</p>
            Your model scores 99% on training data but 80% on test data. What is going on?
          </div>
          <div className="ml-8 rounded-xl bg-white/[0.07] px-3 py-2">
            <p className="text-[10px] font-medium tracking-wide text-ink-400 uppercase">You</p>
            That gap means it’s overfitting: low bias but high variance. I’d add regularisation or more data…
          </div>
          <div className="rounded-xl bg-brand-500/20 px-3 py-2">
            <p className="text-[10px] font-medium tracking-wide text-ink-400 uppercase">Arjun · speaking</p>
            Right, that’s high variance. How would a learning curve confirm it?
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-300">✓ Correct diagnosis</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-ink-200">132 wpm · 1 filler word</span>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-white">
      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Logo />
          <nav className="hidden gap-6 text-sm text-ink-500 md:flex">
            <a href="#features" className="hover:text-ink-900">Features</a>
            <a href="#how" className="hover:text-ink-900">How it works</a>
            <a href="#interviewers" className="hover:text-ink-900">Interviewers</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100">Log in</Link>
            <Link to="/register" className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-ink-700">Get started</Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 -top-40 -z-0 h-96 bg-[radial-gradient(ellipse_at_top,var(--color-brand-100),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <Sparkles className="size-3.5" /> Free · Voice-first · Instant feedback
            </span>
            <h1 className="mt-5 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Practise interviews out loud with an AI interviewer that <span className="text-gradient">actually listens</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-500">
              Speak your answers, get follow-up questions based on what you said, and finish with a
              detailed report on your knowledge and your communication.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-3 font-medium text-white shadow-lg shadow-brand-600/25 hover:opacity-95">
                Start practising free <ArrowRight className="size-4" />
              </Link>
              <Link to="/login" className="rounded-xl border border-ink-200 px-6 py-3 font-medium text-ink-700 hover:bg-ink-50">I have an account</Link>
            </div>
            <p className="mt-4 text-xs text-ink-400">Your camera stays on your device. Works best in Chrome or Edge.</p>
          </div>
          <ConversationPreview />
        </div>
      </section>

      {/* interview types */}
      <div className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-ink-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Section id="features" eyebrow="Features" title="Everything a practice interview needs, nothing it doesn’t">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-5" aria-hidden /></span>
              <p className="mt-4 font-semibold">{title}</p>
              <p className="mt-1.5 text-sm text-ink-500">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="bg-ink-50">
        <Section id="how" eyebrow="How it works" title="From sign-up to feedback in three steps">
          <ol className="grid gap-5 md:grid-cols-3">
            {[
              ['Set it up', 'Pick a topic, your resume, a job description or HR questions. Choose your level, length and interviewer, and check your mic.'],
              ['Talk it through', 'The interviewer asks, listens and follows up. Pause for two seconds when you’re done, or type if you prefer.'],
              ['Learn from it', 'Get scores, specific strengths and gaps, a model answer for every question, and your speaking stats.'],
            ].map(([title, text], i) => (
              <li key={title} className="rounded-2xl border border-ink-100 bg-white p-6">
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-500 text-sm font-semibold text-white">{i + 1}</span>
                <p className="mt-4 font-semibold">{title}</p>
                <p className="mt-1.5 text-sm text-ink-500">{text}</p>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Section id="interviewers" eyebrow="Interviewers" title="Choose who you practise with">
        <div className="grid gap-5 md:grid-cols-3">
          {INTERVIEWERS.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5">
              <span className={cn('flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xl font-semibold text-white', p.color)}>{p.name[0]}</span>
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-ink-500">{p.style}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* final CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-accent-600 px-8 py-12 text-white">
          <h2 className="text-3xl font-semibold tracking-tight">Your next interview is a conversation. Practise one.</h2>
          <p className="mt-2 text-brand-100">It takes a minute to set up and five to practise.</p>
          <Link to="/register" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-brand-700 hover:bg-brand-50">
            Create a free account <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink-100 py-8 text-center text-sm text-ink-400">
        MockInterview AI · Built with FastAPI, LangGraph, Groq and Kokoro
      </footer>
    </div>
  )
}

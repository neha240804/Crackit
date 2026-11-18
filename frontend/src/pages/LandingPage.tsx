// Public landing page: editorial layout, warm paper, one sage accent, serif headlines.
// Logged-in visitors go straight to the dashboard.

import { ArrowRight, AudioLines, Captions, FileSearch, Gauge, MessageSquareQuote, Route } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router'

import { Avatar, Logo } from '@/components/Brand'
import { Card, Eyebrow } from '@/components/ui'
import { buttonClass } from '@/components/ui/styles'
import { useAuth } from '@/features/auth/context'
import { FORMAT_TONE, INTERVIEWERS } from '@/features/interview/constants'
import { cn } from '@/lib/utils'

const TYPES = [
  ['Any topic', 'Machine learning, React, SQL, system design. You choose the subject.'],
  ['Your resume', 'Questions about the projects and experience you actually have.'],
  ['A job post', 'Paste a description and rehearse for that specific role.'],
  ['Behavioral', 'Introductions, teamwork and challenges, judged on structure.'],
]

const FEATURES: { icon: typeof AudioLines; title: string; text: string }[] = [
  { icon: AudioLines, title: 'Spoken, not typed', text: 'Answer out loud. A two-second pause hands the turn back, the way it does in a real room.' },
  { icon: MessageSquareQuote, title: 'It responds to you', text: 'Credit where you were right, a one-line correction where you were not. Never a generic "thank you".' },
  { icon: Route, title: 'Follow-ups with intent', text: 'Strong answers lead deeper. When you are stuck, it explains the idea and moves on.' },
  { icon: Captions, title: 'Live captions', text: 'Your words appear as you speak; the interviewer’s appear as they are said.' },
  { icon: Gauge, title: 'Feedback you can use', text: 'Scores for every question, a model answer, and your pace and filler words, measured.' },
  { icon: FileSearch, title: 'ATS resume check', text: 'See how a screening system scores your resume against a job, what is missing, and what to fix first.' },
]

// Quiet per-format tones (sage, clay, mist, honey) for icons and numbers.
const TONES = Object.values(FORMAT_TONE).map((t) => t.chip)
const NUMBER_TONES = ['text-brand-600', 'text-clay-600', 'text-mist-600', 'text-warning-600']

const STEPS = [
  ['Choose', 'Pick a topic, your resume, a job post or behavioral questions. Set the level, the length and who interviews you.'],
  ['Converse', 'The interviewer asks, listens and follows up on what you said. Just speak naturally; a short pause hands the turn back.'],
  ['Review', 'Read a clear report: what was strong, what was missing, and what a great answer would have covered.'],
]

function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 sm:px-8 ${className}`}>{children}</div>
}

/** The product, shown as a quiet transcript card rather than a screenshot. */
function TranscriptPreview() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5 text-xs text-ink-500">
        <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-brand-600" /> Live · Bias–Variance · Fresher</span>
        <span className="tabular-nums">07:42</span>
      </div>
      <div className="space-y-5 px-5 py-6 text-[0.94rem] leading-relaxed">
        <div>
          <p className="mb-1 text-[11px] font-medium tracking-[0.12em] text-ink-400 uppercase">Arjun</p>
          <p className="text-ink-900">Your model scores 99% on training data but 80% on the test set. What is going on?</p>
        </div>
        <div className="border-l-2 border-brand-200 pl-4">
          <p className="mb-1 text-[11px] font-medium tracking-[0.12em] text-ink-400 uppercase">You</p>
          <p className="text-ink-700">That gap means it is overfitting: low bias, high variance. I would add regularisation or more data.</p>
        </div>
        <div>
          <p className="mb-1 flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] text-ink-400 uppercase">
            Arjun <span className="flex items-end gap-0.5" aria-hidden>{[3, 6, 4].map((h, i) => <span key={i} className="w-0.5 rounded-full bg-brand-500" style={{ height: h * 2 }} />)}</span>
          </p>
          <p className="text-ink-900">Right, that is high variance. How would a learning curve confirm it?</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-ink-200 bg-ink-50 px-5 py-3.5 text-xs">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">Correct diagnosis</span>
        <span className="rounded-full bg-white px-2.5 py-1 text-ink-500 ring-1 ring-ink-200">132 wpm · 1 filler word</span>
      </div>
    </Card>
  )
}

export function LandingPage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-paper">
      {/* ---------------------------------------------------------------- header */}
      <header className="border-b border-ink-200/80">
        <Container className="flex h-[72px] items-center gap-4 md:gap-10">
          <Link to="/" aria-label="MockInterview home" className="shrink-0"><Logo /></Link>
          <nav className="hidden gap-8 text-sm text-ink-500 md:flex" aria-label="Sections">
            <a href="#how" className="transition-colors hover:text-ink-900">How it works</a>
            <a href="#features" className="transition-colors hover:text-ink-900">Features</a>
            <a href="#interviewers" className="transition-colors hover:text-ink-900">Interviewers</a>
          </nav>
          <div className="ml-auto flex items-center gap-1 whitespace-nowrap sm:gap-4">
            <Link to="/login" className="px-2 text-sm font-medium text-ink-700 transition-colors hover:text-ink-900">Log in</Link>
            {/* shorter label on phones so the bar never wraps */}
            <Link to="/register" className={buttonClass('primary', 'px-4 sm:px-5')}>
              <span className="sm:hidden">Sign up</span><span className="hidden sm:inline">Start practising</span>
            </Link>
          </div>
        </Container>
      </header>

      {/* ---------------------------------------------------------------- hero */}
      <section>
        <Container className="grid items-center gap-14 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Eyebrow>Voice mock interviews</Eyebrow>
            <h1 className="mt-6 text-[2.75rem] leading-[1.05] font-semibold sm:text-6xl lg:text-[4.25rem]">
              Practise the conversation, <em className="font-medium text-brand-700">not just the answers.</em>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-500">
              An AI interviewer that speaks, listens and follows up on what you actually said, then
              gives you an honest, detailed account of how it went.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link to="/register" className={buttonClass('primary', 'px-7 py-3 text-[0.95rem]')}>
                Start your first interview <ArrowRight className="size-4" />
              </Link>
              <a href="#how" className="text-sm font-medium text-ink-700 underline decoration-ink-300 underline-offset-4 transition-colors hover:decoration-ink-700">
                See how it works
              </a>
            </div>
            <p className="mt-8 text-sm text-ink-400">Free to use · No camera recording · Best in Chrome or Edge</p>
          </div>
          <div className="lg:col-span-5">
            <TranscriptPreview />
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- interview types */}
      <section className="border-y border-ink-200/80 bg-white">
        <Container className="grid sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map(([title, text], i) => (
            <div key={title} className="border-ink-200/80 py-10 sm:px-8 sm:first:pl-0 lg:border-l lg:first:border-l-0 [&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0 [&:nth-child(2)]:border-t sm:[&:nth-child(2)]:border-t-0">
              <p className={cn('font-serif text-sm', NUMBER_TONES[i])}>0{i + 1}</p>
              <p className="mt-3 font-serif text-xl font-semibold">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{text}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* ---------------------------------------------------------------- how it works */}
      <section id="how" className="scroll-mt-8">
        <Container className="grid gap-12 py-24 sm:py-32 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-5 text-4xl leading-tight font-semibold sm:text-5xl">Three steps, one honest conversation.</h2>
          </div>
          <ol className="divide-y divide-ink-200 lg:col-span-7 lg:col-start-6">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="grid grid-cols-[3.5rem_1fr] gap-4 py-8 first:pt-0 last:pb-0">
                <span className="font-serif text-3xl leading-none text-brand-600">{i + 1}.</span>
                <div>
                  <p className="font-serif text-2xl font-semibold">{title}</p>
                  <p className="mt-2 leading-relaxed text-ink-500">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- features */}
      <section id="features" className="scroll-mt-8 bg-paper-deep/60">
        <Container className="py-24 sm:py-32">
          <div className="max-w-2xl">
            <Eyebrow>Features</Eyebrow>
            <h2 className="mt-5 text-4xl leading-tight font-semibold sm:text-5xl">Built to feel like the real thing.</h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <Card key={title} className="card-hover p-7">
                <span className={cn('flex size-10 items-center justify-center rounded-full', TONES[i % TONES.length])}><Icon className="size-[18px]" aria-hidden /></span>
                <p className="mt-6 font-serif text-xl font-semibold">{title}</p>
                <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-500">{text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- pull quote */}
      <section>
        <Container className="py-24 text-center sm:py-32">
          <blockquote className="mx-auto max-w-3xl font-serif text-3xl leading-snug font-medium text-ink-900 italic sm:text-[2.6rem]">
            “The best preparation for a conversation is a conversation.”
          </blockquote>
          <p className="mt-6 text-sm text-ink-400">The idea behind MockInterview</p>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- what you get */}
      <section className="border-t border-ink-200/80 bg-white">
        <Container className="grid items-center gap-14 py-24 sm:py-32 lg:grid-cols-2">
          <div>
            <Eyebrow>After every session</Eyebrow>
            <h2 className="mt-5 text-4xl leading-tight font-semibold sm:text-5xl">A report worth reading.</h2>
            <ul className="mt-8 space-y-4 text-ink-500">
              {['A score for every question, calibrated to your level', 'What you got right, and exactly what was missing', 'A model outline of a strong answer', 'Speaking pace, filler words and answer length, measured'].map((t) => (
                <li key={t} className="flex gap-3"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-600" />{t}</li>
              ))}
            </ul>
          </div>
          <Card className="p-7 sm:p-9">
            <div className="flex items-end justify-between border-b border-ink-200 pb-6">
              <div>
                <p className="text-xs tracking-[0.12em] text-ink-500 uppercase">Overall</p>
                <p className="mt-2 font-serif text-6xl leading-none font-semibold text-success-700">78</p>
              </div>
              <p className="text-right text-sm text-ink-500">Bias–Variance<br />10 minutes with Arjun</p>
            </div>
            <dl className="grid grid-cols-3 gap-4 py-6 text-center">
              {[['Technical', 74], ['Clarity', 82], ['Structure', 79]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-ink-500">{k}</dt><dd className="mt-1 font-serif text-2xl font-semibold">{v}</dd></div>
              ))}
            </dl>
            <p className="rounded-xl bg-brand-50 p-4 text-sm leading-relaxed text-ink-700">
              <span className="font-medium text-brand-700">A strong answer</span> would name the train–validation
              gap, read it from a learning curve, then choose between more data and regularisation.
            </p>
          </Card>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- interviewers */}
      <section id="interviewers" className="scroll-mt-8 border-t border-ink-200/80">
        <Container className="py-24 sm:py-32">
          <div className="max-w-2xl">
            <Eyebrow>Interviewers</Eyebrow>
            <h2 className="mt-5 text-4xl leading-tight font-semibold sm:text-5xl">Choose who sits across the table.</h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {INTERVIEWERS.map((p) => (
              <Card key={p.id} className="card-hover flex items-center gap-5 p-6">
                <Avatar persona={p.id} />
                <div>
                  <p className="font-serif text-xl font-semibold">{p.name}</p>
                  <p className="text-sm text-ink-500">{p.style}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- closing CTA */}
      <section className="pb-24 sm:pb-32">
        <Container>
          <div className="rounded-3xl border border-ink-200 bg-paper-deep px-8 py-16 text-center sm:px-16 sm:py-20">
            <h2 className="mx-auto max-w-2xl text-4xl leading-tight font-semibold sm:text-5xl">Your next interview is a conversation. Rehearse one.</h2>
            <p className="mx-auto mt-5 max-w-md text-ink-500">It takes a minute to set up and five to practise.</p>
            <Link to="/register" className={buttonClass('primary', 'mt-9 px-7 py-3 text-[0.95rem]')}>
              Create a free account <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </section>

      <footer className="border-t border-ink-200/80">
        <Container className="flex flex-col gap-4 py-10 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p>Practise out loud. Improve with every session.</p>
        </Container>
      </footer>
    </div>
  )
}

// Public landing page. Goal: within five seconds a visitor knows what Crackit is (a free
// interview coach), the three tools it offers, and where to start.
//   hero (what it is + all three tools) → the three tools → how a mock interview works →
//   what the interviewer does → the report → interviewers → one closing call to action.
// Logged-in visitors go straight to the dashboard.

import { ArrowRight, AudioLines, Captions, Check, Gauge, Layers, MessageSquareQuote, Route } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router'

import { Avatar, Logo } from '@/components/Brand'
import { Card, Eyebrow } from '@/components/ui'
import { buttonClass } from '@/components/ui/styles'
import { useAuth } from '@/features/auth/context'
import { FORMAT_TONE, INTERVIEWERS } from '@/features/interview/constants'
import { TOOLS } from '@/features/product'
import { cn } from '@/lib/utils'

// What makes the mock interview feel real (the tools section already covers prep and ATS).
const FEATURES: { icon: typeof AudioLines; title: string; text: string }[] = [
  { icon: AudioLines, title: 'Spoken, not typed', text: 'Answer out loud, the way you will on the day. When you finish, the interviewer picks it up from there.' },
  { icon: MessageSquareQuote, title: 'It responds to you', text: 'Credit where you were right, a one-line correction where you were not. Never a generic "thank you".' },
  { icon: Route, title: 'Follow-ups with intent', text: 'Strong answers lead deeper. When you are stuck, it explains the idea and moves on.' },
  { icon: Layers, title: 'Four formats', text: 'Any topic, your own resume, a specific job post, or HR and behavioral questions, at your level.' },
  { icon: Captions, title: 'Live captions', text: 'Your words appear as you speak; the interviewer’s appear as they are said.' },
  { icon: Gauge, title: 'Feedback you can use', text: 'Scores for every question, a model answer, and your pace and filler words, measured.' },
]

// Quiet tones cycled across feature icons (sage, clay, mist, honey).
const TONES = Object.values(FORMAT_TONE).map((t) => t.chip)

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
    <Card className="overflow-hidden shadow-lift">
      <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5 text-xs text-ink-500">
        <span className="flex items-center gap-2"><span className="size-1.5 animate-pulse rounded-full bg-brand-600" /> Live · Bias–Variance · Fresher</span>
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
      {/* ---------------------------------------------------------------- header: the product's tools, not page sections */}
      <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-paper">
        <Container className="flex h-[68px] items-center gap-4 md:gap-10">
          <Link to="/" aria-label="Crackit home" className="shrink-0"><Logo /></Link>
          <nav className="hidden gap-7 text-sm whitespace-nowrap text-ink-500 lg:flex" aria-label="Product">
            {TOOLS.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="transition-colors hover:text-ink-900">{t.name}</a>
            ))}
            <a href="#how" className="transition-colors hover:text-ink-900">How it works</a>
          </nav>
          <div className="ml-auto flex items-center gap-1 whitespace-nowrap sm:gap-4">
            <Link to="/login" className="px-2 text-sm font-medium text-ink-700 transition-colors hover:text-ink-900">Log in</Link>
            {/* shorter label on phones so the bar never wraps */}
            <Link to="/register" className={buttonClass('primary', 'px-4 sm:px-5')}>
              <span className="sm:hidden">Sign up</span><span className="hidden sm:inline">Start free</span>
            </Link>
          </div>
        </Container>
      </header>

      {/* ---------------------------------------------------------------- hero: what it is, all three tools, one action */}
      <section>
        <Container className="grid items-center gap-14 pt-14 pb-20 sm:pt-20 sm:pb-24 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Eyebrow>Free interview coach</Eyebrow>
            <h1 className="mt-5 text-[2.6rem] leading-[1.05] font-semibold sm:text-6xl lg:text-[4rem]">
              Practise the conversation, <em className="font-medium text-brand-700">not just the answers.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-500">
              Rehearse with an AI interviewer that speaks and listens, study the questions you&apos;ll be asked,
              and check how your resume scores against the job. All in one place, free.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link to="/register" className={buttonClass('primary', 'px-7 py-3 text-[0.95rem]')}>
                Start practising free <ArrowRight className="size-4" />
              </Link>
              <a href="#how" className="text-sm font-medium text-ink-700 underline decoration-ink-300 underline-offset-4 transition-colors hover:decoration-ink-700">
                See how it works
              </a>
            </div>
            {/* the three tools at a glance, each a jump link to its section */}
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="What you can do">
              {TOOLS.map(({ id, name, icon: Icon, tone }) => (
                <li key={id}>
                  <a href={`#${id}`} className="flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1.5 pr-3.5 pl-1.5 text-sm text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-900">
                    <span className={cn('flex size-6 items-center justify-center rounded-full', tone)}><Icon className="size-3.5" aria-hidden /></span>
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5">
            <TranscriptPreview />
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- the three tools */}
      <section className="border-y border-ink-200/80 bg-white">
        <Container className="py-20 sm:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Three tools, one goal</Eyebrow>
            <h2 className="mt-4 text-3xl leading-tight font-semibold sm:text-[2.6rem]">Everything you need before the interview.</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TOOLS.map(({ id, name, icon: Icon, tone, tagline, points, cta }) => (
              <Card key={id} id={id} className="card-hover flex scroll-mt-24 flex-col p-7">
                <span className={cn('flex size-11 items-center justify-center rounded-full', tone)}><Icon className="size-5" aria-hidden /></span>
                <p className="mt-6 font-serif text-2xl font-semibold">{name}</p>
                <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-500">{tagline}</p>
                <ul className="mt-5 flex-1 space-y-2.5 border-t border-ink-200 pt-5 text-sm text-ink-700">
                  {points.map((p) => (
                    <li key={p} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />{p}</li>
                  ))}
                </ul>
                <Link to="/register" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-900 underline decoration-ink-300 underline-offset-4 transition-colors hover:decoration-ink-900">
                  {cta} <ArrowRight className="size-3.5" />
                </Link>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- how a mock interview works */}
      <section id="how" className="scroll-mt-20">
        <Container className="grid gap-12 py-24 sm:py-28 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Eyebrow>How a mock interview works</Eyebrow>
            <h2 className="mt-4 text-3xl leading-tight font-semibold sm:text-[2.6rem]">Three steps, one honest conversation.</h2>
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

      {/* ---------------------------------------------------------------- what the interviewer does */}
      <section className="bg-paper-deep/60">
        <Container className="py-24 sm:py-28">
          <div className="max-w-2xl">
            <Eyebrow>Inside the interview</Eyebrow>
            <h2 className="mt-4 text-3xl leading-tight font-semibold sm:text-[2.6rem]">Built to feel like the real thing.</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* ---------------------------------------------------------------- the report */}
      <section className="border-t border-ink-200/80 bg-white">
        <Container className="grid items-center gap-14 py-24 sm:py-28 lg:grid-cols-2">
          <div>
            <Eyebrow>After every session</Eyebrow>
            <h2 className="mt-4 text-3xl leading-tight font-semibold sm:text-[2.6rem]">A report worth reading.</h2>
            <ul className="mt-8 space-y-4 text-ink-500">
              {['A score for every question, calibrated to your level', 'What you got right, and exactly what was missing', 'A model outline of a strong answer', 'Speaking pace, filler words and answer length, measured'].map((t) => (
                <li key={t} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />{t}</li>
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
      <section id="interviewers" className="scroll-mt-20 border-t border-ink-200/80">
        <Container className="py-24 sm:py-28">
          <div className="max-w-2xl">
            <Eyebrow>Interviewers</Eyebrow>
            <h2 className="mt-4 text-3xl leading-tight font-semibold sm:text-[2.6rem]">Choose who sits across the table.</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
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
      <section className="pb-24 sm:pb-28">
        <Container>
          <div className="rounded-3xl bg-ink-900 px-8 py-16 text-center text-paper sm:px-16 sm:py-20">
            <h2 className="mx-auto max-w-2xl text-3xl leading-tight font-semibold text-balance text-paper sm:text-[2.6rem]">Practice out loud. Crack the real one.</h2>
            <p className="mx-auto mt-5 max-w-md text-ink-300">Free, and ready in a minute. Five minutes is enough for your first session.</p>
            <Link to="/register" className={buttonClass('secondary', 'mt-9 border-transparent px-7 py-3 text-[0.95rem]')}>
              Create a free account <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- footer */}
      <footer className="border-t border-ink-200/80">
        <Container className="flex flex-col gap-6 py-10 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="text-ink-400">Practice out loud, crack the real one.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
            {TOOLS.map((t) => <a key={t.id} href={`#${t.id}`} className="transition-colors hover:text-ink-900">{t.name}</a>)}
            <Link to="/login" className="transition-colors hover:text-ink-900">Log in</Link>
          </nav>
        </Container>
      </footer>
    </div>
  )
}

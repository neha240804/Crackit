// The product in one place: the three tools MockInterview offers, each with ONE name, icon,
// colour and description. The landing page, the app navigation and the dashboard all read
// from here, so a visitor sees the same three things everywhere and learns them once.

import { ListChecks, Mic, ScanSearch, type LucideIcon } from 'lucide-react'

export interface Tool {
  id: 'interview' | 'prep' | 'ats'
  name: string
  short: string // phone navigation label
  icon: LucideIcon
  to: string // where the tool starts in the app
  tone: string // icon badge (quiet tint + strong text)
  tagline: string // one sentence: what it does for you
  cta: string // call to action, written per tool (lowercasing names broke 'ATS')
  points: string[] // what you get, three short lines
}

export const TOOLS: Tool[] = [
  {
    id: 'interview',
    name: 'Mock interviews',
    short: 'Interview',
    icon: Mic,
    to: '/interviews/new',
    tone: 'bg-brand-50 text-brand-700',
    tagline: 'Rehearse out loud with an AI interviewer that speaks, listens and follows up.',
    cta: 'Start a mock interview',
    points: ['Any topic, your resume, a job post or HR', 'Real follow-ups on what you actually said', 'A scored report with model answers'],
  },
  {
    id: 'prep',
    name: 'Question prep',
    short: 'Prep',
    icon: ListChecks,
    to: '/prep',
    tone: 'bg-clay-50 text-clay-700',
    tagline: 'Study the questions you will be asked, with a model answer for each.',
    cta: 'Start studying',
    points: ['By topic, or from your own resume', 'Think first, then reveal the answer', 'Track what you have mastered'],
  },
  {
    id: 'ats',
    name: 'ATS check',
    short: 'ATS',
    icon: ScanSearch,
    to: '/resume',
    tone: 'bg-mist-50 text-mist-700',
    tagline: 'See how a screening system scores your resume against the job.',
    cta: 'Check your resume',
    points: ['Score for format and job match', 'The keywords and skills you are missing', 'A prioritised list of fixes'],
  },
]

export const toolById = (id: Tool['id']) => TOOLS.find((t) => t.id === id) as Tool

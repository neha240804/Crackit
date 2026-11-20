// The product in one place: the three tools Crackit offers, each with ONE name, icon,
// colour and description. The landing page, the app navigation and the dashboard all read
// from here, so a visitor sees the same three things everywhere and learns them once.

import { Activity, Cog, Cpu, HardHat, ListChecks, Mic, ScanSearch, ShieldCheck, Zap, type LucideIcon } from 'lucide-react'

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
    points: ['Machines, power systems, protection, your resume or HR', 'Real follow-ups on what you actually said', 'A scored report with model answers'],
  },
  {
    id: 'prep',
    name: 'Question prep',
    short: 'Prep',
    icon: ListChecks,
    to: '/prep',
    tone: 'bg-clay-50 text-clay-700',
    tagline: 'Study the questions core companies and PSUs ask, with a model answer for each.',
    cta: 'Start studying',
    points: ['Six electrical tracks, any topic, or your own resume', 'Think first, then reveal the answer', 'Track what you have mastered'],
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

// Who Crackit is for: mainly electrical engineering students facing core-company and PSU
// interviews. These match the six electrical tracks of the question bank
// (knowledge_base/questions, built from questions candidates reported being asked).
export interface Subject {
  name: string
  icon: LucideIcon
  tone: string
  covers: string // what panels ask about, in a few words
}

export const ELECTRICAL_SUBJECTS: Subject[] = [
  { name: 'Electrical machines', icon: Cog, tone: 'bg-brand-50 text-brand-700', covers: 'Transformers, induction motors and starters, alternators, DC machines' },
  { name: 'Power systems', icon: Zap, tone: 'bg-warning-50 text-warning-700', covers: 'Generation, transmission, HVDC, faults, power factor, load flow' },
  { name: 'Protection', icon: ShieldCheck, tone: 'bg-danger-50 text-danger-700', covers: 'Circuit breakers, relays, Buchholz, MCB, MCCB and RCCB' },
  { name: 'Earthing & safety', icon: HardHat, tone: 'bg-clay-50 text-clay-700', covers: 'Earthing, megger tests, CTs and PTs, cables, site safety' },
  { name: 'Power electronics', icon: Cpu, tone: 'bg-mist-50 text-mist-700', covers: 'SCR, MOSFET and IGBT, inverters, VFDs and soft starters' },
  { name: 'Circuits & control', icon: Activity, tone: 'bg-teal-50 text-teal-700', covers: 'Three-phase, phasors, transients, PID and control systems' },
]

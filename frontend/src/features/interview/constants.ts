import { BookOpen, Briefcase, FileText, Users, type LucideIcon } from 'lucide-react'

import type { ExperienceLevel, InterviewerId, InterviewType } from '@/lib/types'

// One name per format, used everywhere (dashboard cards, new-interview page, room titles).
export const INTERVIEW_TYPES: { id: InterviewType; label: string; hint: string; icon: LucideIcon }[] = [
  { id: 'topic', label: 'Any topic', hint: 'Any subject, e.g. transformers, power systems, protection', icon: BookOpen },
  { id: 'resume', label: 'Your resume', hint: 'Questions about your own projects and skills', icon: FileText },
  { id: 'jd', label: 'A job post', hint: 'Rehearse for a specific job description', icon: Briefcase },
  { id: 'hr', label: 'HR & behavioral', hint: 'Introduction, teamwork, strengths, challenges', icon: Users },
]

// A quiet colour per format, so the four are told apart at a glance (sage, clay, mist,
// honey). chip = icon badge; soft = a light panel tint; ring = the selected outline.
export const FORMAT_TONE: Record<InterviewType, { chip: string; soft: string; ring: string }> = {
  topic: { chip: 'bg-brand-50 text-brand-700', soft: 'bg-brand-50', ring: 'ring-brand-500/40' },
  resume: { chip: 'bg-clay-50 text-clay-700', soft: 'bg-clay-50', ring: 'ring-clay-500/40' },
  jd: { chip: 'bg-mist-50 text-mist-700', soft: 'bg-mist-50', ring: 'ring-mist-500/40' },
  hr: { chip: 'bg-warning-50 text-warning-700', soft: 'bg-warning-50', ring: 'ring-warning-600/40' },
}

// Difficulty colours, one family each, used everywhere a difficulty shows (prep cards, the
// pickers on Prep and New interview): sage = easy, honey = intermediate, clay = hard.
// pill = label; bar = solid accent and signal bars; tile / ring = a selected difficulty card.
export const DIFFICULTY: Record<ExperienceLevel, { pill: string; bar: string; dot: string; tile: string; ring: string; level: number }> = {
  easy: { pill: 'bg-brand-50 text-brand-700', bar: 'bg-brand-500', dot: 'bg-brand-500', tile: 'bg-brand-50', ring: 'ring-brand-500/50', level: 1 },
  intermediate: { pill: 'bg-warning-50 text-warning-700', bar: 'bg-warning-600', dot: 'bg-warning-600', tile: 'bg-warning-50', ring: 'ring-warning-600/50', level: 2 },
  hard: { pill: 'bg-clay-50 text-clay-700', bar: 'bg-clay-500', dot: 'bg-clay-500', tile: 'bg-clay-50', ring: 'ring-clay-500/50', level: 3 },
}

// What each difficulty means (mirrors LEVEL_GUIDE in backend agents/common/levels.py).
export const LEVEL_HINT: Record<ExperienceLevel, string> = {
  easy: 'The core how and why questions a panel opens with.',
  intermediate: 'Applied: compare and choose, what-if, site situations, short calculations.',
  hard: 'Troubleshooting, design decisions, numericals and edge cases.',
}

export const EXPERIENCE: { id: ExperienceLevel; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'hard', label: 'Hard' },
]

export const DURATIONS = [5, 10, 15] as const

// Portraits and their palettes live in components/Brand.tsx (Avatar).
export const INTERVIEWERS: { id: InterviewerId; name: string; style: string }[] = [
  { id: 'maya', name: 'Maya', style: 'Warm & encouraging' },
  { id: 'arjun', name: 'Arjun', style: 'Direct & technical' },
  { id: 'sara', name: 'Sara', style: 'Calm & structured' },
]

// One-tap topics on the New interview page. Electrical engineering first (the main audience,
// matching the question bank's electrical tracks), then a few common software topics.
export const POPULAR_TOPICS = [
  'Transformers', 'Induction motors', 'Synchronous machines', 'Power systems',
  'Protection & switchgear', 'Earthing & safety', 'Power electronics', 'HVDC transmission',
  'Control systems', 'Python', 'SQL',
]

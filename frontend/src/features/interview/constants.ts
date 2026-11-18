import type { ExperienceLevel, InterviewerId, InterviewType } from '@/lib/types'

// One name per format, used everywhere (dashboard cards, new-interview page, room titles).
export const INTERVIEW_TYPES: { id: InterviewType; label: string; hint: string }[] = [
  { id: 'topic', label: 'Any topic', hint: 'Any subject, e.g. Bias-Variance, React, SQL' },
  { id: 'resume', label: 'Your resume', hint: 'Questions about your own projects and skills' },
  { id: 'jd', label: 'A job post', hint: 'Rehearse for a specific job description' },
  { id: 'hr', label: 'HR & behavioral', hint: 'Introduction, teamwork, strengths, challenges' },
]

// A quiet colour per format, so the four are told apart at a glance (sage, clay, mist,
// honey). chip = icon badge; soft = a light panel tint.
export const FORMAT_TONE: Record<InterviewType, { chip: string; soft: string }> = {
  topic: { chip: 'bg-brand-50 text-brand-700', soft: 'bg-brand-50' },
  resume: { chip: 'bg-clay-50 text-clay-700', soft: 'bg-clay-50' },
  jd: { chip: 'bg-mist-50 text-mist-700', soft: 'bg-mist-50' },
  hr: { chip: 'bg-warning-50 text-warning-700', soft: 'bg-warning-50' },
}

export const EXPERIENCE: { id: ExperienceLevel; label: string }[] = [
  { id: 'fresher', label: 'Fresher' },
  { id: '1-3', label: '1-3 years' },
  { id: '3-5', label: '3-5 years' },
  { id: '5+', label: '5+ years' },
]

export const DURATIONS = [5, 10, 15] as const

// Portraits and their palettes live in components/Brand.tsx (Avatar).
export const INTERVIEWERS: { id: InterviewerId; name: string; style: string }[] = [
  { id: 'maya', name: 'Maya', style: 'Warm & encouraging' },
  { id: 'arjun', name: 'Arjun', style: 'Direct & technical' },
  { id: 'sara', name: 'Sara', style: 'Calm & structured' },
]

export const POPULAR_TOPICS = [
  'Bias-Variance', 'Machine Learning', 'Generative AI & RAG', 'Python', 'React',
  'REST APIs', 'SQL', 'System Design', 'Data Analysis', 'DSA (Python)',
]

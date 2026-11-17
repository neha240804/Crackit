import type { ExperienceLevel, InterviewerId, InterviewType } from '@/lib/types'

export const INTERVIEW_TYPES: { id: InterviewType; label: string; hint: string }[] = [
  { id: 'topic', label: 'Topic / role', hint: 'Any subject, e.g. Bias-Variance, React, SQL' },
  { id: 'resume', label: 'My resume', hint: 'Questions about your own projects and skills' },
  { id: 'jd', label: 'Job description', hint: 'Practise for a specific job posting' },
  { id: 'hr', label: 'HR & behavioral', hint: 'Introduction, teamwork, strengths, challenges' },
]

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

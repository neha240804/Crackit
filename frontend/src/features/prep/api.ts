// Question prep: curated tracks (from the question bank) and generated study sets.
// Sets are kept in localStorage, not on the server: reopening a set costs no AI call, and
// "Got it / Review again" marks are personal study state that only this browser needs.

import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import type { ExperienceLevel, PrepQuestion, PrepSetOut, PrepTrack } from '@/lib/types'

export function useTracks() {
  // The tracks come from Markdown files that only change with a deploy.
  return useQuery({ queryKey: ['prep-tracks'], queryFn: () => api<PrepTrack[]>('/prep/tracks'), staleTime: Infinity })
}

// What a resume set is about: the projects and roles on it, or the HR round answered from it.
export type PrepKind = 'technical' | 'hr'

export interface PrepInput {
  topic: string | null // with a resume: an optional focus ("projects"), else the topic
  resume_id: string | null // questions about this resume instead of a topic
  track: string | null
  kind?: PrepKind // with a resume: questions about the projects, or the HR round
  experience: ExperienceLevel
  count: number
  exclude: string[]
}

export function useGeneratePrep() {
  return useMutation({
    mutationFn: (input: PrepInput) => api<PrepSetOut>('/prep/questions', { method: 'POST', json: input }),
  })
}

// ------------------------------------------------------------------ saved sets
export type Mark = 'got' | 'review'

export interface SavedSet {
  id: string
  topic: string
  track: string | null
  resumeId?: string | null // set built from a resume ("More questions" asks about it again)
  kind?: PrepKind // resume sets: 'technical' (projects) or 'hr' (HR round from the resume)
  experience: ExperienceLevel
  questions: PrepQuestion[]
  marks: Record<number, Mark>
  createdAt: number
}

const KEY = 'mockinterview_prep_v1'
// Only the current set is kept (so a refresh doesn't lose it). There used to be a "Recent
// sets" row with up to 8; questions worth keeping are now starred instead (see below).
const MAX_SETS = 1

// Sets saved before levels became difficulties hold 'fresher' / '1-3' ... and questions tagged
// 'medium'. Map them once on load (same mapping as the backend), so the UI only sees new values.
const OLD_LEVEL: Record<string, ExperienceLevel> = { fresher: 'easy', '1-3': 'intermediate', '3-5': 'hard', '5+': 'hard' }

function upgrade(set: SavedSet): SavedSet {
  return {
    ...set,
    experience: OLD_LEVEL[set.experience] ?? set.experience,
    questions: set.questions.map((q) => ((q.difficulty as string) === 'medium' ? { ...q, difficulty: 'intermediate' } : q)),
  }
}

export function loadSets(): SavedSet[] {
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedSet[]).map(upgrade)
  } catch {
    return [] // corrupted or from an older version: start fresh rather than crash
  }
}

export function saveSets(sets: SavedSet[]) {
  localStorage.setItem(KEY, JSON.stringify(sets.slice(0, MAX_SETS)))
}

// ------------------------------------------------------------------ starred questions
// Questions a student stars to revise later, kept in this browser like the sets. Each star
// keeps a full copy of the question (with its answer), so it survives the set being replaced.
export interface StarredQuestion {
  key: string // normalised question text: the same question is starred only once
  question: PrepQuestion
  topic: string
  experience: ExperienceLevel
  starredAt: number
}

const STAR_KEY = 'mockinterview_starred_v1'

export const starKey = (question: string) => question.trim().toLowerCase().replace(/\s+/g, ' ')

export function loadStarred(): StarredQuestion[] {
  try {
    return JSON.parse(localStorage.getItem(STAR_KEY) ?? '[]') as StarredQuestion[]
  } catch {
    return []
  }
}

export function saveStarred(items: StarredQuestion[]) {
  localStorage.setItem(STAR_KEY, JSON.stringify(items))
}

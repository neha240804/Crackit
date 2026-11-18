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

export interface PrepInput {
  topic: string | null // with a resume: an optional focus ("projects"), else the topic
  resume_id: string | null // questions about this resume instead of a topic
  track: string | null
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
  experience: ExperienceLevel
  questions: PrepQuestion[]
  marks: Record<number, Mark>
  createdAt: number
}

const KEY = 'mockinterview_prep_v1'
const MAX_SETS = 8

export function loadSets(): SavedSet[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedSet[]
  } catch {
    return [] // corrupted or from an older version: start fresh rather than crash
  }
}

export function saveSets(sets: SavedSet[]) {
  localStorage.setItem(KEY, JSON.stringify(sets.slice(0, MAX_SETS)))
}

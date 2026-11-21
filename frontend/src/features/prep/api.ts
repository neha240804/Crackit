// Question prep: curated tracks (from the question bank) and generated study sets.
// The current set and starred questions are saved to the account (see below): reopening a set
// costs no AI call, and they follow the student to any device.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

// Both the current set and the starred questions are saved to the ACCOUNT (Postgres, via
// /prep/current and /prep/starred), so they follow the student to any device and survive
// clearing the browser. They used to live in localStorage; what an older version left there is
// moved to the account once (migrateLocal below) and then removed.
const OLD_SET_KEY = 'mockinterview_prep_v1'
const OLD_STAR_KEY = 'mockinterview_starred_v1'

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

function readLocal<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
  } catch {
    return [] // corrupted: nothing worth moving
  }
}

/** One-time move of an older version's browser data to the account. It goes to the first
 * account that opens Prep in this browser (that data never said whose it was). */
async function migrateLocal() {
  const stars = readLocal<{ key: string; question: PrepQuestion; topic: string; experience: string }>(OLD_STAR_KEY)
  const sets = readLocal<SavedSet>(OLD_SET_KEY)
  if (!stars.length && !sets.length) return
  // Oldest first, so the newest star ends up newest on the server too.
  for (const s of [...stars].reverse()) {
    await api('/prep/starred', { method: 'PUT', json: { key: s.key, question: s.question, topic: s.topic, experience: s.experience } })
  }
  if (sets[0] && !(await api<SavedSet | null>('/prep/current'))) {
    await api('/prep/current', { method: 'PUT', json: { data: upgrade(sets[0]) } })
  }
  localStorage.removeItem(OLD_STAR_KEY)
  localStorage.removeItem(OLD_SET_KEY)
}

// Both queries wait for the same migration, which runs once per page load.
let migration: Promise<void> | null = null
const migrated = () => (migration ??= migrateLocal().catch(() => { migration = null }))

/** The current study set saved on the account (null = none yet). */
export function useCurrentSet() {
  return useQuery({
    queryKey: ['prep-current'],
    queryFn: async () => {
      await migrated()
      const set = await api<SavedSet | null>('/prep/current')
      return set ? upgrade(set) : null
    },
    staleTime: Infinity, // this page is the only writer, and it updates the cache itself
  })
}

/** Returns save(set): updates the cache at once and writes to the account shortly after.
 * Marks can be clicked quickly in a row; a short debounce sends one write for the burst. */
export function useSaveCurrentSet() {
  const queryClient = useQueryClient()
  return (set: SavedSet | null) => {
    queryClient.setQueryData(['prep-current'], set)
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      void (set ? api('/prep/current', { method: 'PUT', json: { data: set } }) : api('/prep/current', { method: 'DELETE' }))
    }, 400)
  }
}
let saveTimer: ReturnType<typeof setTimeout> | null = null

// ------------------------------------------------------------------ starred questions
// Questions a student stars to revise later. Each star keeps a full copy of the question (with
// its answer), so it survives the set being replaced.
export interface StarredQuestion {
  id: string | null // null for a moment, while a new star is being saved
  key: string // normalised question text: the same question is starred only once
  question: PrepQuestion
  topic: string
  experience: ExperienceLevel
  created_at: string
}

export const starKey = (question: string) => question.trim().toLowerCase().replace(/\s+/g, ' ')

export function useStarred() {
  return useQuery({
    queryKey: ['starred'],
    queryFn: async () => {
      await migrated()
      return api<StarredQuestion[]>('/prep/starred')
    },
  })
}

interface StarChange {
  question: PrepQuestion
  topic: string
  experience: ExperienceLevel
  existing: StarredQuestion | undefined // decided BEFORE the optimistic update changes the cache
}

/** Returns toggle(question, topic, level): star or unstar, shown at once (optimistic) and
 * saved to the account; on failure the list goes back to what it was. */
export function useToggleStar() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ question, topic, experience, existing }: StarChange) => {
      if (existing) {
        // A star still being saved has no id yet: the refetch in onSettled settles it.
        if (existing.id) await api(`/prep/starred/${existing.id}`, { method: 'DELETE' })
      } else {
        await api('/prep/starred', { method: 'PUT', json: { key: starKey(question.question), question, topic, experience } })
      }
    },
    onMutate: async ({ question, topic, experience, existing }: StarChange) => {
      await queryClient.cancelQueries({ queryKey: ['starred'] })
      const before = queryClient.getQueryData<StarredQuestion[]>(['starred']) ?? []
      const key = starKey(question.question)
      const next = existing
        ? before.filter((s) => s.key !== key)
        : [{ id: null, key, question, topic, experience, created_at: new Date().toISOString() }, ...before]
      queryClient.setQueryData(['starred'], next)
      return { before }
    },
    onError: (_e, _v, ctx) => { if (ctx) queryClient.setQueryData(['starred'], ctx.before) },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['starred'] }),
  })
  return (question: PrepQuestion, topic: string, experience: ExperienceLevel) => {
    const key = starKey(question.question)
    const existing = queryClient.getQueryData<StarredQuestion[]>(['starred'])?.find((s) => s.key === key)
    mutation.mutate({ question, topic, experience, existing })
  }
}

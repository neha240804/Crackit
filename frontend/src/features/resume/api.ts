// TanStack Query hooks for resumes.
//
// useQuery   = READ: fetches, caches under a key, refetches when told the data is stale.
// useMutation = WRITE: runs a POST; on success we invalidate ['resumes', purpose] so the
//               list refetches automatically, without manually updating any state.
//
// Two separate lists (`purpose`): resumes for interviews, and resumes checked in the ATS
// tool. Uploading a draft to the ATS checker never changes what the interviewer asks about.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import type { Resume, ResumePurpose } from '@/lib/types'

export function useResumes(purpose: ResumePurpose) {
  return useQuery({
    queryKey: ['resumes', purpose],
    queryFn: () => api<Resume[]>(`/resumes?purpose=${purpose}`),
  })
}

export function useUploadResume(purpose: ResumePurpose) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file) // field name must match the FastAPI parameter `file`
      return api<Resume>(`/resumes?purpose=${purpose}`, { method: 'POST', body: form })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes', purpose] }),
  })
}

/** The interview resume a resume-/JD-based interview will use: the one the user picked,
 * else the default (primary) one, else the newest readable one. */
export function useSelectedInterviewResume(selectedId: string | null) {
  const resumes = useResumes('interview')
  const ready = (resumes.data ?? []).filter((r) => r.status === 'ready')
  return ready.find((r) => r.id === selectedId) ?? ready.find((r) => r.is_primary) ?? ready[0]
}

// One hook per action; all of them refresh the resume lists when they finish.
function useResumeAction<T>(request: (id: string) => Promise<T>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  })
}

export const useReparseResume = () =>
  useResumeAction((id) => api<Resume>(`/resumes/${id}/reparse`, { method: 'POST' }))

export const useSetPrimaryResume = () =>
  useResumeAction((id) => api<Resume>(`/resumes/${id}/primary`, { method: 'POST' }))

export const useDeleteResume = () =>
  useResumeAction((id) => api<void>(`/resumes/${id}`, { method: 'DELETE' }))

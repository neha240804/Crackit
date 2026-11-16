// TanStack Query hooks for resumes.
//
// useQuery   = READ: fetches, caches under a key, refetches when told the data is stale.
// useMutation = WRITE: runs a POST; on success we invalidate ['resumes'] so the list
//               refetches automatically, without manually updating any state.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import type { Resume } from '@/lib/types'

export function useResumes() {
  return useQuery({ queryKey: ['resumes'], queryFn: () => api<Resume[]>('/resumes') })
}

export function useUploadResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file) // field name must match the FastAPI parameter `file`
      return api<Resume>('/resumes', { method: 'POST', body: form })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  })
}

// One hook per action; all of them refresh the list when they finish.
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

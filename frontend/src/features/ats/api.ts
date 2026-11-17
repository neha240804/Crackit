// TanStack Query hooks for the ATS check and the resume optimizer.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, ApiError, tokenStore } from '@/lib/api'
import type { AnalysisResult, ResumeVersion } from '@/lib/types'

interface CheckInput {
  resume_id: string
  jd_text: string | null
}

/** Fast check (~5 s): code-based format rules, plus keyword match and gaps when a JD is given. */
export function useAnalyze() {
  return useMutation({
    mutationFn: (input: CheckInput) =>
      api<AnalysisResult>('/optimizer/analyze', { method: 'POST', json: input }),
  })
}

/** Full rewrite with fact verification (~30-90 s). Saves a new version. */
export function useOptimize() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CheckInput) =>
      api<ResumeVersion>('/optimizer/optimize', { method: 'POST', json: input }),
    onSuccess: (version) =>
      queryClient.invalidateQueries({ queryKey: ['versions', version.resume_id] }),
  })
}

export function useVersions(resumeId: string | undefined) {
  return useQuery({
    queryKey: ['versions', resumeId],
    queryFn: () => api<ResumeVersion[]>(`/optimizer/resumes/${resumeId}/versions`),
    enabled: Boolean(resumeId),
  })
}

// A plain <a href> can't send our Authorization header, so we fetch the file ourselves,
// turn it into a temporary blob URL, and click a hidden link to save it.
export async function downloadDocx(versionId: string, filename: string) {
  const response = await fetch(`/api/v1/optimizer/versions/${versionId}/docx`, {
    headers: { Authorization: `Bearer ${tokenStore.get() ?? ''}` },
  })
  if (!response.ok) throw new ApiError(response.status, 'Download failed')
  const url = URL.createObjectURL(await response.blob())
  const link = Object.assign(document.createElement('a'), { href: url, download: filename })
  link.click()
  URL.revokeObjectURL(url)
}

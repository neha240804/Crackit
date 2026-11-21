// TanStack Query hook for the ATS check.

import { useMutation } from '@tanstack/react-query'

import { api } from '@/lib/api'
import type { AnalysisResult } from '@/lib/types'

interface CheckInput {
  resume_id: string
  jd_text: string | null
}

/** ATS check (~5 s): code-based format rules, plus keyword match and skill gaps when a JD
 * is given. Nothing is saved: the report is computed fresh each time. */
export function useAnalyze() {
  return useMutation({
    mutationFn: (input: CheckInput) =>
      api<AnalysisResult>('/optimizer/analyze', { method: 'POST', json: input }),
  })
}

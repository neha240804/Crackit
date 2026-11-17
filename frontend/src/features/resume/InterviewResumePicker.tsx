// Choose (or upload) the resume a resume-/JD-based interview asks about.
// These are INTERVIEW resumes, a separate list from the ATS checker's resumes.

import { Check, FileText, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { ErrorAlert } from '@/components/ui'
import { useDeleteResume, useSelectedInterviewResume, useResumes, useUploadResume } from '@/features/resume/api'
import { UploadDropzone } from '@/features/resume/UploadDropzone'
import { cn, formatDate } from '@/lib/utils'

interface Props {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function InterviewResumePicker({ selectedId, onSelect }: Props) {
  const resumes = useResumes('interview')
  const upload = useUploadResume('interview')
  const remove = useDeleteResume()
  const [clientError, setClientError] = useState<string | null>(null)
  const list = resumes.data ?? []
  const current = useSelectedInterviewResume(selectedId)
  const error = clientError ?? (upload.error ?? remove.error)?.message

  return (
    <div className="space-y-3">
      {list.length > 0 && (
        <ul className="space-y-2" role="radiogroup" aria-label="Resume for this interview">
          {list.map((r) => {
            const active = r.id === current?.id
            return (
              <li key={r.id}>
                <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                  active ? 'border-ink-900 bg-white shadow-soft' : 'border-ink-200 bg-white/50 hover:border-ink-300')}>
                  <button type="button" role="radio" aria-checked={active} disabled={r.status !== 'ready'}
                    onClick={() => onSelect(r.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed">
                    <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border',
                      active ? 'border-ink-900 bg-ink-900 text-paper' : 'border-ink-300')}>
                      {active && <Check className="size-3" />}
                    </span>
                    <FileText className="size-4 shrink-0 text-ink-400" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{r.filename}</span>
                      <span className="block text-xs text-ink-500">
                        {formatDate(r.created_at)}
                        {r.status === 'failed' && <span className="text-danger-700"> · could not be read</span>}
                        {r.status === 'processing' && ' · reading…'}
                      </span>
                    </span>
                  </button>
                  <button type="button" aria-label={`Delete ${r.filename}`} title="Delete"
                    onClick={() => {
                      if (!window.confirm(`Delete "${r.filename}"?`)) return
                      if (r.id === selectedId) onSelect(null)
                      remove.mutate(r.id)
                    }}
                    className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-700">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <UploadDropzone busy={upload.isPending} onInvalid={setClientError}
        onFile={(file) => {
          setClientError(null)
          upload.mutate(file, { onSuccess: (r) => onSelect(r.id) })
        }} />
      {error && <ErrorAlert message={error} />}
    </div>
  )
}

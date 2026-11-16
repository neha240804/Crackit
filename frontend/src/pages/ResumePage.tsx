// My resume: upload a resume so resume- and JD-based interviews can ask about YOUR work.

import { ArrowRight, FileText, RefreshCw, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/AppShell'
import { Badge, Button, Card, ErrorAlert, Spinner } from '@/components/ui'
import {
  useDeleteResume,
  useReparseResume,
  useResumes,
  useSetPrimaryResume,
  useUploadResume,
} from '@/features/resume/api'
import { ProfileView } from '@/features/resume/ProfileView'
import { UploadDropzone } from '@/features/resume/UploadDropzone'
import type { Resume } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'

const STATUS_TONE = { ready: 'success', processing: 'warning', failed: 'danger' } as const

export function ResumePage() {
  const resumes = useResumes()
  const upload = useUploadResume()
  const reparse = useReparseResume()
  const setPrimary = useSetPrimaryResume()
  const remove = useDeleteResume()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)

  const list = resumes.data ?? []
  const selected: Resume | undefined = list.find((r) => r.id === selectedId) ?? list.find((r) => r.is_primary) ?? list[0]
  const error = clientError ?? (upload.error ?? reparse.error ?? setPrimary.error ?? remove.error)?.message

  return (
    <div>
      <PageHeader
        title="My resume"
        description="Used for resume-based and job-description interviews, so questions are about your own projects."
        action={selected?.status === 'ready' ? (
          <Link to="/interviews/new" className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-medium text-white hover:opacity-95">
            Practise with it <ArrowRight className="size-4" />
          </Link>
        ) : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <UploadDropzone
            busy={upload.isPending}
            onInvalid={setClientError}
            onFile={(file) => {
              setClientError(null)
              upload.mutate(file, { onSuccess: (r) => setSelectedId(r.id) })
            }}
          />
          {error && <ErrorAlert message={error} />}
          <Card className="p-2">
            <p className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-ink-500 uppercase">Uploaded</p>
            {resumes.isLoading && <Spinner />}
            {!resumes.isLoading && list.length === 0 && <p className="px-3 py-4 text-sm text-ink-500">No resume yet.</p>}
            <ul>
              {list.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setSelectedId(r.id)}
                    className={cn('flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left', r.id === selected?.id ? 'bg-brand-50' : 'hover:bg-ink-50')}>
                    <FileText className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.filename}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                        {formatDate(r.created_at)}
                        <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                        {r.is_primary && <Badge tone="brand">in use</Badge>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div>
          {upload.isPending ? (
            <Card><Spinner label="Reading your resume with AI…" /></Card>
          ) : selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="mr-auto truncate text-sm font-medium text-ink-700">{selected.filename}</p>
                {!selected.is_primary && selected.status === 'ready' && (
                  <Button variant="secondary" loading={setPrimary.isPending} onClick={() => setPrimary.mutate(selected.id)}>
                    <Star className="size-4" /> Use for interviews
                  </Button>
                )}
                <Button variant="secondary" loading={reparse.isPending} onClick={() => reparse.mutate(selected.id)}>
                  <RefreshCw className="size-4" /> Re-read
                </Button>
                <Button variant="ghost" loading={remove.isPending} className="text-red-600 hover:bg-red-50"
                  onClick={() => window.confirm(`Delete "${selected.filename}"?`) && remove.mutate(selected.id)}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
              {selected.status === 'ready' && selected.profile ? (
                <ProfileView profile={selected.profile} />
              ) : (
                <Card className="p-6"><ErrorAlert message={selected.error ?? 'This resume could not be read.'} /></Card>
              )}
            </div>
          ) : (
            <Card className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-ink-500">
              <FileText className="size-8 text-ink-400" />
              Upload a PDF, DOCX or TXT resume to see what the interviewer will know about you.
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

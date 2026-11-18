// ATS resume check: upload a resume, optionally paste a job description, and get an ATS
// report: the score, what is missing (keywords, skills, format rules) and a prioritised
// list of what to improve. Format rules and keyword matching are code; only the skill-gap
// analysis uses the LLM. (The backend can also rewrite a resume, but this page is a
// checker by design: the candidate makes the changes, guided by the report.)

import { FileText, Gauge, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { PageHeader } from '@/components/AppShell'
import { Button, Card, ErrorAlert } from '@/components/ui'
import { fieldClass } from '@/components/ui/styles'
import { useAnalyze } from '@/features/ats/api'
import { AtsReport } from '@/features/ats/AtsReport'
import { useDeleteResume, useResumes, useUploadResume } from '@/features/resume/api'
import { UploadDropzone } from '@/features/resume/UploadDropzone'
import { cn, formatDate } from '@/lib/utils'

function StepLabel({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="flex items-baseline gap-2.5 text-sm font-medium text-ink-900">
      <span className="font-serif text-brand-600">0{n}</span>{children}
    </p>
  )
}

const CHECK_STEPS = ['Checking format and structure', 'Reading the job description', 'Matching keywords and skills', 'Finding gaps and fixes']

export function ResumePage() {
  // The ATS checker keeps its own resume list, separate from the interview resumes.
  const resumes = useResumes('ats')
  const upload = useUploadResume('ats')
  const remove = useDeleteResume()
  const analyze = useAnalyze()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [jdText, setJdText] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const list = resumes.data ?? []
  const selected = list.find((r) => r.id === selectedId) ?? list.find((r) => r.is_primary) ?? list[0]
  const ready = selected?.status === 'ready'
  const error = clientError ?? (upload.error ?? remove.error ?? analyze.error)?.message

  // Bring the report into view as soon as it arrives.
  useEffect(() => {
    if (analyze.data) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [analyze.data])

  function pick(id: string) {
    setSelectedId(id)
    analyze.reset() // a report belongs to the resume it was made for
  }

  function onCheck() {
    analyze.mutate({ resume_id: selected?.id ?? '', jd_text: jdText.trim() || null })
  }

  return (
    <div>
      <PageHeader compact eyebrow="ATS resume check" title="Will your resume get past the filter?"
        description="Most companies screen resumes with an applicant tracking system before a person reads them. Get your score, see exactly what is missing for the job, and what to fix first. Resumes here are kept separate from your interview resume." />

      {/* ------------------------------------------------ inputs */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="space-y-5 p-6 sm:p-8">
          <StepLabel n={1}>Your resume</StepLabel>
          <UploadDropzone busy={upload.isPending} onInvalid={setClientError}
            onFile={(file) => {
              setClientError(null)
              upload.mutate(file, { onSuccess: (r) => pick(r.id) })
            }} />
          {list.length > 0 && (
            <ul className="space-y-2">
              {list.map((r) => (
                <li key={r.id}>
                  <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                    r.id === selected?.id ? 'border-ink-900 bg-white' : 'border-ink-200 hover:border-ink-300')}>
                    <button type="button" onClick={() => pick(r.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-pressed={r.id === selected?.id}>
                      <FileText className="size-4 shrink-0 text-ink-400" aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{r.filename}</span>
                        <span className="block text-xs text-ink-500">
                          {formatDate(r.created_at)}
                          {r.status !== 'ready' && <span className="text-danger-700"> · {r.status === 'failed' ? 'could not be read' : 'reading…'}</span>}
                        </span>
                      </span>
                    </button>
                    <button type="button" aria-label={`Delete ${r.filename}`} title="Delete"
                      onClick={() => window.confirm(`Delete "${r.filename}"?`) && remove.mutate(r.id)}
                      className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-700">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col p-6 sm:p-8">
          <StepLabel n={2}>Target job <span className="font-normal text-ink-400">(optional, recommended)</span></StepLabel>
          <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} rows={9} aria-label="Job description"
            placeholder="Paste the full job description to get a job-match score, the keywords and skills you are missing, and what to improve for this role. Without it, only format and structure are checked."
            className={cn(fieldClass, 'mt-5 flex-1 resize-none leading-relaxed')} />
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button loading={analyze.isPending} disabled={analyze.isPending || !ready} className="px-6 py-3" onClick={onCheck}>
              <Gauge className="size-4" aria-hidden /> Check ATS score
            </Button>
            <p className="text-xs text-ink-500">
              {!selected ? 'Upload a resume first.' : !ready ? 'Waiting for your resume to be read…' : jdText.trim() ? 'Scored against this job.' : 'Format only: add a job description for the full report.'}
            </p>
          </div>
        </Card>
      </div>

      {error && <div className="mt-6"><ErrorAlert message={error} /></div>}

      {/* ------------------------------------------------ report */}
      <div ref={resultsRef} className="mt-12 scroll-mt-24">
        {analyze.isPending && (
          <Card className="p-6 sm:p-8">
            <p className="font-serif text-lg font-semibold">Checking your resume…</p>
            <ul className="mt-4 space-y-2.5">
              {(jdText.trim() ? CHECK_STEPS : CHECK_STEPS.slice(0, 1)).map((s) => (
                <li key={s} className="flex items-center gap-3 text-sm text-ink-700">
                  <span className="size-2 animate-pulse rounded-full bg-brand-500" />{s}
                </li>
              ))}
            </ul>
          </Card>
        )}
        {analyze.data && !analyze.isPending && <AtsReport result={analyze.data} />}
        {!analyze.data && !analyze.isPending && !list.length && !resumes.isLoading && (
          <div className="rounded-2xl border border-dashed border-ink-300 px-8 py-14 text-center text-ink-500">
            Upload a PDF, DOCX or TXT resume to start.
          </div>
        )}
      </div>
    </div>
  )
}

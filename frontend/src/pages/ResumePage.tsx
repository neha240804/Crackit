// ATS resume check: upload a resume, optionally paste a job description, and get
//   - a fast ATS report (format rules in code + keyword match + honest skill gaps), or
//   - a full rewrite tailored to the job, fact-checked line by line, as a DOCX.
// The same uploaded resume also powers resume- and JD-based interviews.

import { FileText, Gauge, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { PageHeader } from '@/components/AppShell'
import { Button, Card, ErrorAlert } from '@/components/ui'
import { fieldClass } from '@/components/ui/styles'
import { useAnalyze, useOptimize, useVersions } from '@/features/ats/api'
import { AtsReport } from '@/features/ats/AtsReport'
import { OptimizedVersion } from '@/features/ats/OptimizedVersion'
import { useDeleteResume, useResumes, useUploadResume } from '@/features/resume/api'
import { UploadDropzone } from '@/features/resume/UploadDropzone'
import { cn, formatDate } from '@/lib/utils'

// The current time, re-read every second while `active`. Elapsed time is *derived*
// (now - startedAt) instead of counted in state, so there is nothing to reset.
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

const OPTIMIZE_STEPS = ['Reading the job description', 'Checking format and keywords', 'Finding honest skill gaps', 'Rewriting your bullets', 'Fact-checking every line']

function OptimizeProgress({ seconds }: { seconds: number }) {
  // Steps advance on a rough schedule; the real work is one request, so this is a guide only.
  const active = Math.min(OPTIMIZE_STEPS.length - 1, Math.floor(seconds / 9))
  return (
    <Card className="p-8">
      <p className="font-serif text-xl font-semibold">Optimizing your resume… <span className="text-ink-400 tabular-nums">{seconds}s</span></p>
      <p className="mt-2 text-sm text-ink-500">This usually takes 30-90 seconds.</p>
      <ol className="mt-6 space-y-3">
        {OPTIMIZE_STEPS.map((s, i) => (
          <li key={s} className={cn('flex items-center gap-3 text-sm', i <= active ? 'text-ink-900' : 'text-ink-400')}>
            <span className={cn('size-2 rounded-full', i < active ? 'bg-success-600' : i === active ? 'animate-pulse bg-brand-500' : 'bg-ink-200')} />
            {s}
          </li>
        ))}
      </ol>
    </Card>
  )
}

function StepLabel({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="flex items-baseline gap-2.5 text-sm font-medium text-ink-900">
      <span className="font-serif text-brand-600">0{n}</span>{children}
    </p>
  )
}

type Shown = { kind: 'analysis' } | { kind: 'optimize' } | { kind: 'version'; id: string } | null

export function ResumePage() {
  // The ATS checker keeps its own resume list, separate from the interview resumes.
  const resumes = useResumes('ats')
  const upload = useUploadResume('ats')
  const remove = useDeleteResume()
  const analyze = useAnalyze()
  const optimize = useOptimize()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [jdText, setJdText] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)
  const [shown, setShown] = useState<Shown>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const list = resumes.data ?? []
  const selected = list.find((r) => r.id === selectedId) ?? list.find((r) => r.is_primary) ?? list[0]
  const versions = useVersions(selected?.id)
  const busy = analyze.isPending || optimize.isPending
  const now = useNow(optimize.isPending)
  const seconds = Math.max(0, Math.round((now - optimize.submittedAt) / 1000))
  const ready = selected?.status === 'ready'
  const input = { resume_id: selected?.id ?? '', jd_text: jdText.trim() || null }

  const error = clientError
    ?? (upload.error ?? remove.error)?.message
    ?? (shown?.kind === 'analysis' ? analyze.error?.message : shown?.kind === 'optimize' ? optimize.error?.message : undefined)
  const pastVersion = shown?.kind === 'version' ? versions.data?.find((v) => v.id === shown.id) : undefined

  function pick(id: string) {
    setSelectedId(id)
    setShown(null) // results belong to the previous resume
  }

  return (
    <div>
      <PageHeader compact eyebrow="ATS resume check" title="Will your resume get past the filter?"
        description="Most companies screen resumes with an applicant tracking system before a person reads them. See your score, exactly what is costing you points, and get a version tailored to the job. Resumes here are kept separate from your interview resume." />

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
            placeholder="Paste the full job description to get a job-match score, the keywords you are missing, an honest skill-gap analysis and a resume tailored to this role."
            className={cn(fieldClass, 'mt-5 flex-1 resize-none leading-relaxed')} />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button loading={analyze.isPending} disabled={busy || !ready} className="px-6 py-3"
              onClick={() => { setShown({ kind: 'analysis' }); analyze.mutate(input) }}>
              <Gauge className="size-4" aria-hidden /> Check ATS score
            </Button>
            <Button variant="secondary" loading={optimize.isPending} disabled={busy || !ready} className="px-6 py-3"
              onClick={() => { setShown({ kind: 'optimize' }); optimize.mutate(input) }}>
              <Sparkles className="size-4" aria-hidden /> {jdText.trim() ? 'Optimize for this job' : 'Optimize resume'}
            </Button>
          </div>
          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-ink-500">
            <ShieldCheck className="size-4 shrink-0 text-brand-600" aria-hidden />
            The optimizer never invents skills, numbers or achievements. Every rewritten line cites your original resume and is fact-checked.
          </p>
        </Card>
      </div>

      {error && <div className="mt-6"><ErrorAlert message={error} /></div>}

      {/* ------------------------------------------------ results */}
      <div ref={resultsRef} className="mt-12 scroll-mt-24">
        {shown?.kind === 'analysis' && analyze.isPending && <Card className="p-8 text-ink-500">Scoring your resume…</Card>}
        {shown?.kind === 'analysis' && analyze.data && <AtsReport result={analyze.data} />}
        {shown?.kind === 'optimize' && optimize.isPending && <OptimizeProgress seconds={seconds} />}
        {shown?.kind === 'optimize' && optimize.data && (
          <div className="space-y-14">
            <OptimizedVersion version={optimize.data} />
            <AtsReport result={optimize.data.analysis} />
          </div>
        )}
        {pastVersion && (
          <div className="space-y-14">
            <OptimizedVersion version={pastVersion} />
            <AtsReport result={pastVersion.analysis} />
          </div>
        )}
        {!shown && !list.length && !resumes.isLoading && (
          <div className="rounded-2xl border border-dashed border-ink-300 px-8 py-14 text-center text-ink-500">
            Upload a PDF, DOCX or TXT resume to start.
          </div>
        )}
      </div>

      {/* ------------------------------------------------ saved versions */}
      {(versions.data?.length ?? 0) > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-baseline justify-between border-b border-ink-200 pb-4">
            <h2 className="text-xl font-semibold">Optimized versions</h2>
            <span className="text-sm text-ink-400">{versions.data?.length} saved</span>
          </div>
          <ul className="divide-y divide-ink-200">
            {versions.data?.map((v) => (
              <li key={v.id}>
                <button type="button" onClick={() => { setShown({ kind: 'version', id: v.id }); resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
                  className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-5 rounded-xl px-3 py-4 text-left transition-colors hover:bg-white">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{v.job_title ?? 'General improvement (no job description)'}</span>
                    <span className="text-sm text-ink-500">{formatDate(v.created_at)}{v.verified && ' · fully verified'}</span>
                  </span>
                  {v.overall_score != null && <span className="font-serif text-xl font-semibold tabular-nums">{Math.round(v.overall_score)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

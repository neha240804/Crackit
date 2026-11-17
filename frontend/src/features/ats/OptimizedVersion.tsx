// An optimized resume version: the fact-check story, the DOCX download and the rewrite.

import { Download, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { Button, Card, ErrorAlert } from '@/components/ui'
import type { OptimizedEntry, ResumeVersion } from '@/lib/types'
import { cn } from '@/lib/utils'

import { downloadDocx } from './api'

function Entry({ entry }: { entry: OptimizedEntry }) {
  return (
    <div>
      <p className="font-medium">{entry.heading}</p>
      {entry.subheading && <p className="text-sm text-ink-500">{entry.subheading}</p>}
      <ul className="mt-3 space-y-2">
        {entry.bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-[0.94rem] leading-relaxed text-ink-700">
            <span className="mt-2.5 size-1 shrink-0 rounded-full bg-ink-400" aria-hidden />
            <span className="flex-1">
              {b.text}{' '}
              <span className="text-[11px] text-ink-400" title="Lines of your original resume this bullet is based on">
                [{b.source_ids.join(', ')}]
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function OptimizedVersion({ version }: { version: ResumeVersion }) {
  const { content, verification: v } = version
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const caught = v.history.flatMap((h) => h.issues.map((i) => ({ ...i, attempt: h.attempt })))

  async function onDownload() {
    setDownloadError(null)
    try {
      await downloadDocx(version.id, 'resume_optimized.docx')
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed')
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex gap-4">
            <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full',
              v.verified ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700')}>
              {v.verified ? <ShieldCheck className="size-5" aria-hidden /> : <ShieldAlert className="size-5" aria-hidden />}
            </span>
            <div>
              <p className="font-serif text-lg font-semibold">
                {v.verified ? 'Every claim traced to your original resume' : 'Verified, with some lines restored'}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {v.attempts} rewrite attempt{v.attempts > 1 ? 's' : ''} · issues found per attempt: {v.issues_per_attempt.join(' → ')}
                {v.reverted.length > 0 && ` · ${v.reverted.length} line(s) restored to your original wording`}
              </p>
            </div>
          </div>
          <Button onClick={onDownload}><Download className="size-4" aria-hidden /> Download DOCX</Button>
        </div>
        {downloadError && <div className="mt-4"><ErrorAlert message={downloadError} /></div>}
        {caught.length > 0 && (
          <details className="mt-6 rounded-xl bg-paper-deep/60 p-4">
            <summary className="cursor-pointer text-sm font-medium text-ink-700">
              What the fact-checker caught and removed ({caught.length})
            </summary>
            <ul className="mt-4 space-y-4">
              {caught.map((issue, i) => (
                <li key={i} className="text-sm">
                  <p className="text-xs text-ink-400">Attempt {issue.attempt} · {issue.location}</p>
                  <p className="mt-1 text-ink-500 line-through">{issue.text}</p>
                  <p className="mt-1 text-danger-700">{issue.problem}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>

      <Card className="divide-y divide-ink-200">
        <section className="px-6 py-7 sm:px-8">
          <h3 className="text-lg font-semibold">Summary</h3>
          <p className="mt-3 leading-relaxed text-ink-700">{content.summary}</p>
        </section>
        <section className="px-6 py-7 sm:px-8">
          <h3 className="text-lg font-semibold">Skills <span className="font-sans text-sm font-normal text-ink-400">ordered for this job</span></h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {content.skills.map((s) => (
              <span key={s} className="rounded-full border border-ink-200 px-3 py-1 text-sm text-ink-700">{s}</span>
            ))}
          </div>
        </section>
        {content.experience.length > 0 && (
          <section className="space-y-6 px-6 py-7 sm:px-8">
            <h3 className="text-lg font-semibold">Experience</h3>
            {content.experience.map((e) => <Entry key={e.source_id} entry={e} />)}
          </section>
        )}
        {content.projects.length > 0 && (
          <section className="space-y-6 px-6 py-7 sm:px-8">
            <h3 className="text-lg font-semibold">Projects</h3>
            {content.projects.map((p) => <Entry key={p.source_id} entry={p} />)}
          </section>
        )}
      </Card>
    </div>
  )
}

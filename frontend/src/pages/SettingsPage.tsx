// Settings: the user's own free Groq key (bring-your-own-key) and today's free allowance.
//
// Why users add a key: everyone without one shares the site's free AI allowance, which has
// small daily limits. With their own free Groq key, interviews, prep and ATS checks run on
// their own free quota, with no daily limit from us.

import { CheckCircle2, ExternalLink, KeyRound, Lock, ShieldCheck, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { PageHeader } from '@/components/AppShell'
import { Badge, Button, Card, ErrorAlert, Spinner } from '@/components/ui'
import { fieldClass } from '@/components/ui/styles'
import { useGroqKey, useRemoveGroqKey, useSaveGroqKey, useUsage, type UsageAction } from '@/features/account/api'
import { useAuth } from '@/features/auth/context'
import { cn, formatDate } from '@/lib/utils'

const GROQ_KEYS_URL = 'https://console.groq.com/keys'

const STEPS = [
  <>Open <a href={GROQ_KEYS_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline underline-offset-2">console.groq.com/keys</a> and sign in. It's free, and no card is needed.</>,
  <>Select <span className="font-medium text-ink-900">Create API Key</span>, give it any name (for example "Crackit"), and copy it.</>,
  <>Paste it below and save. Crackit checks it with Groq before storing it.</>,
]

const PROTECTION = [
  'Checked with Groq before it is saved, so a typo is caught right away.',
  'Encrypted (AES-256-GCM) before it is stored, with a key only the server holds.',
  'Never shown again, not even to you: only its first and last four characters.',
  'Never stored in this browser, and never written to logs.',
  'Used only for your own interviews, prep and ATS checks. Remove it any time.',
]

const USAGE_LABEL: Record<UsageAction, string> = {
  interview: 'Mock interviews',
  prep: 'Question-prep sets',
  ats: 'ATS checks',
  resume: 'Resume uploads',
}

function KeyCard() {
  const key = useGroqKey()
  const save = useSaveGroqKey()
  const remove = useRemoveGroqKey()
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSaved(false)
    save.mutate(value.trim(), {
      onSuccess: () => { setValue(''); setSaved(true) }, // don't keep the key in memory
    })
  }

  const status = key.data
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><KeyRound className="size-[18px]" aria-hidden /></span>
          <div>
            <h2 className="text-xl font-semibold">Your free Groq key</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-500">
              Crackit's AI runs on Groq. Add your own free key and everything runs on your own free quota, with no daily limit from us.
            </p>
          </div>
        </div>
        {key.isLoading ? null : status?.saved ? (
          <Badge tone={status.readable ? 'success' : 'warning'}>{status.readable ? 'Key saved' : 'Add your key again'}</Badge>
        ) : (
          <Badge>Using the shared allowance</Badge>
        )}
      </div>

      {status?.saved && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-paper px-4 py-3">
          <p className="flex items-center gap-2.5 text-sm text-ink-700">
            <Lock className="size-4 text-ink-400" aria-hidden />
            <span className="font-mono text-[13px]">{status.hint}</span>
            {status.added_at && <span className="text-ink-400">· added {formatDate(status.added_at)}</span>}
          </p>
          <Button variant="ghost" className="px-3 py-1.5 text-danger-700 hover:bg-danger-50"
            loading={remove.isPending} onClick={() => { setSaved(false); remove.mutate() }}>
            <Trash2 className="size-4" aria-hidden /> Remove
          </Button>
        </div>
      )}
      {status?.saved && !status.readable && (
        <p className="mt-3 text-sm text-warning-700">The saved key can no longer be read (the server's encryption key changed). Paste it again below.</p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-ink-900">{status?.saved ? 'Replace it with a new key' : 'Get a free key in two minutes'}</p>
          <ol className="mt-3 space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-700">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-700">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <label htmlFor="groq-key" className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Groq API key</span>
              {/* type=password: hidden on screen and never offered for autofill or spellcheck */}
              <input id="groq-key" type="password" autoComplete="off" spellCheck={false}
                placeholder="gsk_…" value={value} onChange={(e) => { setValue(e.target.value); setSaved(false) }}
                className={cn(fieldClass, 'font-mono')} />
            </label>
            {save.error && <ErrorAlert message={save.error.message} />}
            {saved && !save.error && (
              <p className="flex items-center gap-2 text-sm text-success-700"><CheckCircle2 className="size-4" aria-hidden /> Key checked and saved. You have no daily limit now.</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={save.isPending} disabled={!value.trim()}>
                {save.isPending ? 'Checking with Groq…' : 'Save key'}
              </Button>
              <a href={GROQ_KEYS_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
                Open Groq console <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
          </form>
        </div>

        <div className="rounded-xl bg-paper p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-ink-900"><ShieldCheck className="size-4 text-brand-700" aria-hidden /> How your key is protected</p>
          <ul className="mt-3 space-y-2.5">
            {PROTECTION.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-ink-700">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />{line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

function AllowanceCard() {
  const usage = useUsage()
  const key = useGroqKey()
  if (key.data?.saved && key.data.readable) {
    return (
      <Card className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Today's allowance</h2>
        <p className="mt-2 text-sm text-ink-500">No daily limit: everything runs on your own Groq key.</p>
      </Card>
    )
  }
  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-xl font-semibold">Today's free allowance</h2>
      <p className="mt-1 text-sm text-ink-500">Shared by everyone without their own key. Resets at midnight UTC.</p>
      {usage.isLoading ? <Spinner /> : usage.error ? <div className="mt-4"><ErrorAlert message={usage.error.message} /></div> : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2">
          {(Object.keys(USAGE_LABEL) as UsageAction[]).map((action) => {
            const { used, limit } = usage.data![action]
            const left = Math.max(0, limit - used)
            return (
              <li key={action}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink-700">{USAGE_LABEL[action]}</span>
                  <span className={cn('font-medium', left === 0 ? 'text-danger-700' : 'text-ink-900')}>{left} of {limit} left</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div className={cn('h-full rounded-full', left === 0 ? 'bg-danger-600' : 'bg-brand-500')}
                    style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export function SettingsPage() {
  const { user } = useAuth()
  return (
    <div>
      <PageHeader compact eyebrow="Settings" title="Your account"
        description={user ? `Signed in as ${user.name} (${user.email}).` : undefined} />
      <div className="grid gap-6">
        <KeyCard />
        <AllowanceCard />
      </div>
    </div>
  )
}

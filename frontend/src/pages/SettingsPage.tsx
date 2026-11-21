// Settings: the user's own free Groq key. Bring-your-own-key only (product decision): there is
// no shared key or free allowance, so interviews, prep and ATS checks all need it. The key
// stays in this browser (features/account/groqKey.ts); the server never stores it.

import { CheckCircle2, ExternalLink, KeyRound, Lock, ShieldCheck, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { PageHero } from '@/components/PageHero'
import { Badge, Button, Card, ErrorAlert } from '@/components/ui'
import { fieldClass } from '@/components/ui/styles'
import { useGroqKey, useRemoveGroqKey, useSaveGroqKey } from '@/features/account/api'
import { useAuth } from '@/features/auth/context'
import { cn, formatDate } from '@/lib/utils'

const GROQ_KEYS_URL = 'https://console.groq.com/keys'
const VOICE_TERMS_URL = 'https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english'

const STEPS = [
  <>Open <a href={GROQ_KEYS_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline underline-offset-2">console.groq.com/keys</a> and sign in. It's free, and no card is needed.</>,
  <>Select <span className="font-medium text-ink-900">Create API Key</span>, give it any name (for example "Crackit"), and copy it.</>,
  <>Paste it below and save. Crackit checks it with Groq, then keeps it in this browser only.</>,
  // The interviewer's voice runs on Groq too (Orpheus), which needs a one-time terms
  // acceptance per Groq account. Without it Crackit uses its own server voice instead.
  <>For the most natural interviewer voice, open the <a href={VOICE_TERMS_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline underline-offset-2">Orpheus voice model</a> in the Groq console and accept its terms once. Skip this and Crackit uses its own voice.</>,
]

const PROTECTION = [
  'Never saved on our servers: not in the database, logs or traces.',
  'Kept only in this browser, encrypted (AES-256-GCM) with a device key the page itself cannot read out.',
  'Sent with your own requests over HTTPS and used only for them.',
  'Never shown again, not even to you: only its first and last four characters.',
  'On another device or browser, add it again there. Remove it any time.',
]

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
              Crackit's AI runs on Groq, and it uses your own free key: mock interviews, question prep, resume uploads and ATS checks all need it.
            </p>
          </div>
        </div>
        {key.isLoading ? null : status?.saved ? (
          <Badge tone={status.readable ? 'success' : 'warning'}>{status.readable ? 'Key saved' : 'Add your key again'}</Badge>
        ) : (
          <Badge tone="warning">No key yet</Badge>
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
              <p className="flex items-center gap-2 text-sm text-success-700"><CheckCircle2 className="size-4" aria-hidden /> Key checked and saved in this browser. You're all set.</p>
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

export function SettingsPage() {
  const { user } = useAuth()
  const key = useGroqKey()
  const ownKey = Boolean(key.data?.saved && key.data.readable)
  return (
    <div>
      <div className="mb-8">
        <PageHero compact eyebrow="Settings" title="Your account"
          description={user ? `Signed in as ${user.name} (${user.email}). ${ownKey ? 'Your Groq key is saved in this browser.' : 'Add your free Groq key to use the AI features.'}` : undefined}
          stats={[
            { label: 'Groq key', value: key.isLoading ? '–' : ownKey ? 'Saved' : 'None', icon: KeyRound, tone: ownKey ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700' },
          ]} />
      </div>
      <KeyCard />
    </div>
  )
}

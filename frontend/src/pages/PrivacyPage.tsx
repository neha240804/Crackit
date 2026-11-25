// Privacy notice (/privacy, public). Plain language, and only what the code really does:
// every statement here was checked against the backend and frontend (Nov 21, 2026). Update it
// whenever data handling changes (a new table, a new outside service, a new log).

import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Logo } from '@/components/Brand'

// Who to contact, set at build time (VITE_CONTACT_EMAIL; frontend/Dockerfile, docs/DEPLOYMENT.md).
const CONTACT = import.meta.env.VITE_CONTACT_EMAIL as string | undefined
const UPDATED = '21 November 2026'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink-700">{children}</div>
    </section>
  )
}

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper px-6 py-12 sm:px-10">
      <article className="mx-auto max-w-2xl">
        <Link to="/" aria-label="Crackit home"><Logo /></Link>
        <h1 className="mt-10 text-4xl font-semibold">Privacy notice</h1>
        <p className="mt-3 text-sm text-ink-500">Last updated {UPDATED}</p>
        <p className="mt-6 leading-relaxed text-ink-700">
          Crackit is a practice tool for interviews. This page says, plainly, what it keeps about you, what it
          never keeps, who else sees your data, and how to delete it.
        </p>

        <Section title="What Crackit stores">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Your account:</strong> name, email address, and your password as a one-way hash (the password itself is never stored).</li>
            <li><strong>Resumes you upload:</strong> the file, the text read from it, the details extracted from it, and a searchable index of it, so interviews and question prep can refer to your experience.</li>
            <li><strong>Job descriptions</strong> you paste for job-based interviews.</li>
            <li><strong>Your interviews:</strong> the settings you chose, what the interviewer said, the written transcript of your answers, your feedback report, and the rating you gave at the end.</li>
            <li><strong>Question prep:</strong> your current study set, your marks on it, and the questions you starred.</li>
            <li><strong>Feedback you send</strong> from the Feedback page: the topic, your rating and your message.</li>
            <li><strong>Password reset:</strong> for 30 minutes after you ask for one, a scrambled copy of the reset link.</li>
            <li><strong>Quality checks:</strong> after each interview, automatic checks of how well the AI interviewer and report did (for example, whether it gave an answer away), with short quotes of the turns that failed. They are used only to improve Crackit and are deleted with the interview.</li>
          </ul>
        </Section>

        <Section title="What Crackit never stores">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Your camera:</strong> the video stays in your browser. It is never sent anywhere.</li>
            <li><strong>Recordings of your voice:</strong> each spoken answer is sent once to be turned into text, then discarded. Only the text is kept.</li>
            <li><strong>Your Groq API key:</strong> it is kept only in your browser, encrypted, and sent with your own requests. Our servers never save it.</li>
          </ul>
        </Section>

        <Section title="Who else sees your data">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Groq</strong>, the AI service, under <em>your own</em> Groq account (your API key): it receives your spoken
              answers to transcribe them, and the interview conversation, your resume's details and job descriptions to run the
              interviewer, question prep, the ATS check and your report. Groq's own privacy policy applies to that.
            </li>
            <li>
              <strong>Groq, for quality checks:</strong> some finished interviews (only the conversation and the report: not your
              account details, resume file or key) are read by an AI reviewer on Crackit's own Groq account, to check that the interviewer and
              the report did their job. Your Groq key and quota are never used for this.
            </li>
            <li>
              <strong>Your browser's speech services.</strong> Live captions use your browser's built-in speech recognition. In
              Chrome, for example, this sends your microphone audio to Google to produce the captions. The interviewer's voice is
              your browser's voice; some of those voices (such as Edge's "Natural" voices) are online, which sends the
              interviewer's words to the browser maker to be spoken.
            </li>
            <li>
              <strong>Performance monitoring:</strong> if this site has it switched on, LangSmith (LangChain) receives how
              long each AI step took, how many tokens it used and whether it failed. Never your answers, resume, report or
              any other content.
            </li>
            <li><strong>Email delivery:</strong> when you ask for a password reset, your email address and the link go through the email service this site uses.</li>
            <li>
              <strong>Error reports:</strong> if this site has error alerts switched on, unexpected server errors are reported to
              Sentry without the content of your requests (no answers, resumes, keys or passwords).
            </li>
          </ul>
          <p>Crackit doesn't sell your data, doesn't show ads, and uses no advertising or tracking cookies. Your browser keeps your login and settings in local storage on your device.</p>
        </Section>

        <Section title="How long it is kept, and deleting it">
          <p>
            Your data stays until you delete it. You can delete a resume at any time, and you can delete your whole account in{' '}
            <Link to="/settings" className="font-medium text-brand-700 underline underline-offset-2">Settings</Link>: that
            removes your account, resumes (files included), interviews, reports, prep data and feedback straight away.
          </p>
          <p>Nightly backups of the database are kept for up to 7 days, so a deleted account disappears from backups within a week.</p>
        </Section>

        <Section title="Questions">
          <p>
            {CONTACT
              ? <>Write to <a href={`mailto:${CONTACT}`} className="font-medium text-brand-700 underline underline-offset-2">{CONTACT}</a> with any question about your data, or to ask what Crackit holds about you.</>
              : <>Contact the person or team who runs this Crackit site with any question about your data.</>}
          </p>
        </Section>
      </article>
    </div>
  )
}

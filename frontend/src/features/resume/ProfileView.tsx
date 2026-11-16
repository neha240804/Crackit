// Displays a parsed CandidateProfile: what the AI understood from the resume.
// Users should check this; every other module builds on it.

import { Award, Briefcase, FolderGit2, GraduationCap, Link2, Mail, MapPin, Phone } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge, Card } from '@/components/ui'
import type { CandidateProfile } from '@/lib/types'

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-ink-100 px-6 py-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-700">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export function ProfileView({ profile }: { profile: CandidateProfile }) {
  const { contact } = profile
  const contactBits = [
    contact.email && { icon: <Mail className="size-3.5" />, text: contact.email },
    contact.phone && { icon: <Phone className="size-3.5" />, text: contact.phone },
    contact.location && { icon: <MapPin className="size-3.5" />, text: contact.location },
    ...contact.links.map((l) => ({ icon: <Link2 className="size-3.5" />, text: l })),
  ].filter(Boolean) as { icon: ReactNode; text: string }[]

  return (
    <Card>
      <div className="px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold">{contact.name ?? 'Unnamed candidate'}</h2>
          {profile.total_years_experience != null && (
            <Badge tone="brand">{profile.total_years_experience} yrs experience</Badge>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
          {contactBits.map((bit, i) => (
            <span key={i} className="flex items-center gap-1">
              {bit.icon}
              {bit.text}
            </span>
          ))}
        </div>
        {profile.summary && <p className="mt-3 text-sm text-ink-700">{profile.summary}</p>}
      </div>

      {profile.skills.length > 0 && (
        <Section title={`Skills (${profile.skills.length})`} icon={<Award className="size-4" />}>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        </Section>
      )}

      {profile.experience.length > 0 && (
        <Section title="Experience" icon={<Briefcase className="size-4" />}>
          <div className="space-y-4">
            {profile.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">
                    {exp.title} <span className="text-ink-500">· {exp.company}</span>
                  </p>
                  <p className="text-xs text-ink-500">
                    {[exp.start_date, exp.end_date].filter(Boolean).join(' – ')}
                  </p>
                </div>
                <Bullets items={exp.highlights} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {profile.projects.length > 0 && (
        <Section title="Projects" icon={<FolderGit2 className="size-4" />}>
          <div className="space-y-4">
            {profile.projects.map((p, i) => (
              <div key={i}>
                <p className="text-sm font-medium">{p.name}</p>
                {p.description && <p className="mt-1 text-sm text-ink-700">{p.description}</p>}
                <Bullets items={p.highlights} />
                {p.technologies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.technologies.map((t) => (
                      <Badge key={t} tone="brand">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {(profile.education.length > 0 || profile.certifications.length > 0) && (
        <Section title="Education & certifications" icon={<GraduationCap className="size-4" />}>
          <div className="space-y-2 text-sm">
            {profile.education.map((e, i) => (
              <p key={i}>
                <span className="font-medium">{e.degree}</span>
                <span className="text-ink-500">
                  {' '}
                  · {e.institution}
                  {e.end_date && ` · ${e.end_date}`}
                  {e.grade && ` · ${e.grade}`}
                </span>
              </p>
            ))}
            {profile.certifications.map((c) => (
              <p key={c} className="text-ink-700">
                {c}
              </p>
            ))}
          </div>
        </Section>
      )}
    </Card>
  )
}

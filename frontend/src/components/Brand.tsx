// Brand pieces shared by every page: logo and interviewer portraits.

import type { InterviewerId } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Crackit mark: a "C" whose end turns into a tick, i.e. you cracked it. Ink C + sage tick on
 *  light pages; paper C + lighter sage on the dark interview room. Drawn inline (no image file)
 *  so it stays crisp at any size and takes its colours from the design tokens. */
export function LogoMark({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('size-7 shrink-0', className)} aria-hidden>
      <path d="M36 12A16 16 0 1 0 38 34" fill="none" strokeWidth="6" strokeLinecap="round" className={dark ? 'stroke-paper' : 'stroke-ink-900'} />
      <path d="M22 24l6 6 14-16" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className={dark ? 'stroke-brand-500' : 'stroke-brand-600'} />
    </svg>
  )
}

/** Mark + serif wordmark. `dark` = for the dark interview room. The wordmark must stay the
 *  last child: phone headers hide it with `[&>span:last-child]:hidden`. */
export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark dark={dark} />
      <span className={cn('font-serif text-[1.15rem] leading-none font-semibold tracking-tight whitespace-nowrap', dark ? 'text-paper' : 'text-ink-900')}>
        Crackit
      </span>
    </span>
  )
}

// ------------------------------------------------------------------ interviewer portraits
// Original, faceless "editorial" portraits drawn as inline SVG (no image files, no real
// people): each persona is recognisable by silhouette alone (hair, clothing, palette), which
// reads well from 32 px in a list to 160 px in the interview room. Flat shapes, no gradients.

interface Palette { bg: string; glow: string; skin: string; hair: string; top: string; accent: string }

const PALETTES: Record<InterviewerId, Palette> = {
  maya: { bg: '#647f6a', glow: '#7d9a80', skin: '#e8c3a0', hair: '#3b2a22', top: '#f2ece1', accent: '#c9d6c8' },
  arjun: { bg: '#a8805a', glow: '#bb9572', skin: '#b98760', hair: '#231d19', top: '#2e3a40', accent: '#f2efe9' },
  sara: { bg: '#6f7f8f', glow: '#8493a2', skin: '#f0d0b8', hair: '#5a3b2b', top: '#3a4450', accent: '#e6e1d7' },
}

// Shared geometry: neck, head and shoulders; only hair and clothing details differ.
const SHOULDERS = 'M14 124 C16 94 36 83 60 83 C84 83 104 94 106 124 Z'
const NECK = 'M52 62 L68 62 L69 84 C66 88 54 88 51 84 Z'

function Maya({ p }: { p: Palette }) {
  return (
    <>
      {/* long hair falling behind the shoulders */}
      <path d="M37 54 C34 30 47 21 61 21 C77 21 87 32 84 56 C83 72 88 82 93 92 L27 92 C33 82 37 70 37 54 Z" fill={p.hair} />
      <path d={SHOULDERS} fill={p.top} />
      <path d="M48 84 C52 92 68 92 72 84 L69 84 C66 88 54 88 51 84 Z" fill={p.accent} />
      <path d={NECK} fill={p.skin} />
      <ellipse cx="60" cy="49" rx="17" ry="20" fill={p.skin} />
      {/* side-swept fringe */}
      <path d="M42 48 C42 32 52 26 63 27 C75 28 81 37 79 50 C73 39 61 35 50 44 C47 46 44 49 42 48 Z" fill={p.hair} />
      <circle cx="44.5" cy="55" r="1.8" fill={p.accent} />
    </>
  )
}

function Arjun({ p }: { p: Palette }) {
  return (
    <>
      <path d={SHOULDERS} fill={p.top} />
      {/* open collar */}
      <path d="M48 83 L60 97 L72 83 L66 82 L60 90 L54 82 Z" fill={p.accent} />
      <path d={NECK} fill={p.skin} />
      <ellipse cx="60" cy="49" rx="17" ry="20" fill={p.skin} />
      {/* short textured crop */}
      <path d="M42 47 C40 31 50 24 61 24 C72 24 81 31 78 47 C75 39 69 35 60 36 C51 36 45 40 42 47 Z" fill={p.hair} />
      {/* trimmed beard along the jaw */}
      <path d="M43.6 54 C45 65.5 52 71 60 71 C68 71 75 65.5 76.4 54 C74 62 68.5 66.8 60 66.8 C51.5 66.8 46 62 43.6 54 Z" fill={p.hair} />
      {/* moustache */}
      <path d="M54 61.2 C57 59.6 63 59.6 66 61.2 C63 62.2 57 62.2 54 61.2 Z" fill={p.hair} />
    </>
  )
}

function Sara({ p }: { p: Palette }) {
  return (
    <>
      <path d={SHOULDERS} fill={p.top} />
      {/* blazer lapels over a light top */}
      <path d="M50 83 L60 100 L70 83 C66 87 54 87 50 83 Z" fill={p.accent} />
      <path d="M44 85 L54 104 L50 83 Z M76 85 L66 104 L70 83 Z" fill="#2c343e" />
      <path d={NECK} fill={p.skin} />
      <ellipse cx="60" cy="49" rx="17" ry="20" fill={p.skin} />
      {/* neat top bun */}
      <circle cx="60" cy="24" r="9.5" fill={p.hair} />
      <path d="M42 50 C40 34 49 29 60 29 C71 29 80 34 78 50 C75 41 68 38 60 38 C52 38 45 41 42 50 Z" fill={p.hair} />
      {/* round glasses */}
      <g fill="none" stroke="#2b2622" strokeWidth="1.6">
        <circle cx="53" cy="51" r="5" />
        <circle cx="67" cy="51" r="5" />
        <path d="M58 51 L62 51" />
      </g>
    </>
  )
}

const FIGURES: Record<InterviewerId, typeof Maya> = { maya: Maya, arjun: Arjun, sara: Sara }

/** Illustrated interviewer portrait. sm = lists, md = cards, lg = interview room. */
export function Avatar({ persona, size = 'md', className }: { persona: InterviewerId; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'size-9', md: 'size-14', lg: 'size-36' }
  const p = PALETTES[persona]
  const Figure = FIGURES[persona]
  const clip = `clip-${persona}`
  return (
    <svg viewBox="0 0 120 120" className={cn('shrink-0 rounded-full', sizes[size], className)} aria-hidden>
      <defs>
        <clipPath id={clip}><circle cx="60" cy="60" r="60" /></clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="120" height="120" fill={p.bg} />
        <circle cx="60" cy="50" r="40" fill={p.glow} />
        {/* figure scaled ~10% so the portrait fills the circle like a photo crop */}
        <g transform="translate(-6 -1) scale(1.1)"><Figure p={p} /></g>
      </g>
    </svg>
  )
}

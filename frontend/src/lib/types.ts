// TypeScript mirrors of the backend's Pydantic schemas (backend/app/schemas/*).
// If the backend changes a field, update it here and the compiler shows every place to fix.

export interface User {
  id: string
  email: string
  name: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface Contact {
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
  links: string[]
}

export interface Experience {
  title: string
  company: string
  location: string | null
  start_date: string | null
  end_date: string | null
  highlights: string[]
  technologies: string[]
}

export interface Project {
  name: string
  description: string | null
  highlights: string[]
  technologies: string[]
  link: string | null
}

export interface Education {
  degree: string
  institution: string
  start_date: string | null
  end_date: string | null
  grade: string | null
}

export interface CandidateProfile {
  contact: Contact
  summary: string | null
  total_years_experience: number | null
  skills: string[]
  experience: Experience[]
  projects: Project[]
  education: Education[]
  certifications: string[]
  achievements: string[]
}

export type ResumeStatus = 'processing' | 'ready' | 'failed'

export type ResumePurpose = 'interview' | 'ats'

export interface Resume {
  id: string
  filename: string
  status: ResumeStatus
  error: string | null
  is_primary: boolean
  purpose: ResumePurpose
  created_at: string
  profile: CandidateProfile | null
}

// ---------------------------------------------------------------- ATS check + optimizer
export interface JDAnalysis {
  title: string | null
  company: string | null
  seniority: string
  min_years_experience: number | null
  must_have_skills: string[]
  nice_to_have_skills: string[]
  responsibilities: string[]
  keywords: string[]
}

export interface AtsRuleResult {
  id: string
  label: string
  passed: boolean
  weight: number
  detail: string
}

export interface KeywordMatch {
  score: number
  matched_must: string[]
  missing_must: string[]
  matched_nice: string[]
  missing_nice: string[]
  matched_keywords: string[]
  missing_keywords: string[]
}

export interface GapItem {
  skill: string
  status: 'implied' | 'missing'
  evidence_source_ids: string[]
  explanation: string
  suggestion: string
}

export interface AnalysisResult {
  ats: { score: number; rules: AtsRuleResult[] }
  jd: JDAnalysis | null
  match: KeywordMatch | null
  gaps: { gaps: GapItem[]; strengths: string[]; summary: string } | null
  overall_score: number
}

export interface OptimizedBullet {
  text: string
  source_ids: string[]
}

export interface OptimizedEntry {
  source_id: string
  heading: string
  subheading: string | null
  bullets: OptimizedBullet[]
}

export interface OptimizedResume {
  summary: string
  summary_source_ids: string[]
  skills: string[]
  experience: OptimizedEntry[]
  projects: OptimizedEntry[]
}

export interface VerificationIssue {
  location: string
  text: string
  problem: string
}

export interface Verification {
  attempts: number
  issues_per_attempt: number[]
  history: { attempt: number; issues: VerificationIssue[] }[]
  reverted: { location: string; rewritten: string; replaced_with: string | null }[]
  removed_skills: string[]
  verified: boolean
}

export interface ResumeVersion {
  id: string
  resume_id: string
  created_at: string
  job_title: string | null
  overall_score: number | null
  verified: boolean
  content: OptimizedResume
  analysis: AnalysisResult
  verification: Verification
}

// ---------------------------------------------------------------- mock interview
export type InterviewType = 'topic' | 'resume' | 'jd' | 'hr'
export type ExperienceLevel = 'fresher' | '1-3' | '3-5' | '5+'
export type InterviewerId = 'maya' | 'arjun' | 'sara'

export interface InterviewConfig {
  interview_type: InterviewType
  topic: string | null
  subtopics: string[]
  experience: ExperienceLevel
  duration_minutes: 5 | 10 | 15
  interviewer: InterviewerId
  jd_text: string | null
  resume_id: string | null // resume / jd formats: which interview resume to ask about
}

export interface InterviewMessage {
  role: 'interviewer' | 'candidate'
  text: string
  kind: string | null
  duration_sec: number | null
}

export interface InterviewTurn {
  utterance: string | null
  kind: string | null
  done: boolean
  remaining_seconds: number
  transcript: string | null
  speech_chunks: string[] // the utterance split for the voice; already generating on the server
}

export interface AnswerMetrics {
  words: number
  duration_sec: number | null
  wpm: number | null
  filler_count: number
  fillers_per_100_words: number
}

export interface InterviewReport {
  overall_score: number
  technical_score: number
  communication_score: number
  structure_score: number
  summary: string
  strengths: string[]
  improvements: string[]
  next_steps: string[]
  questions: {
    question_index: number
    question: string
    answer: string
    score: number
    strengths: string[]
    improvements: string[]
    ideal_answer: string
    metrics: AnswerMetrics
  }[]
  metrics: {
    answers: number
    total_words: number
    speaking_seconds: number
    avg_wpm: number | null
    avg_answer_words: number
    fillers_per_100_words: number
    top_fillers: string[]
  }
}

export interface InterviewSession {
  id: string
  status: 'active' | 'completed'
  title: string
  created_at: string
  config: InterviewConfig & { title?: string; started_at?: number }
  interviewer_name: string
  remaining_seconds: number
  messages: InterviewMessage[]
  current: InterviewTurn | null
  report: InterviewReport | null
  deadline_ms: number // client-side: when the timer hits zero
}

export interface InterviewSummary {
  id: string
  status: 'active' | 'completed'
  title: string
  created_at: string
  duration_minutes: number
  overall_score: number | null
}

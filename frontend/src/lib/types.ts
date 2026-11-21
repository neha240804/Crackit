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

// ---------------------------------------------------------------- ATS check
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

// ---------------------------------------------------------------- mock interview
export type InterviewType = 'topic' | 'resume' | 'jd' | 'hr'
// Question difficulty. The API field is still called `experience` (it used to hold experience
// bands such as 'fresher'; the backend maps those old values).
export type ExperienceLevel = 'easy' | 'intermediate' | 'hard'
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
  voice?: VoiceEngine // which voice speaks this line (server setting; older servers omit it)
}

/** 'browser': the student's own browser voice (the default). 'server': /tts (Kokoro or Groq). */
export type VoiceEngine = 'browser' | 'server'

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

// ---------------------------------------------------------------- question prep
export interface PrepQuestion {
  question: string
  difficulty: 'easy' | 'intermediate' | 'hard'
  answer: string
  key_points: string[]
  tip: string
}

export interface PrepSetOut {
  topic: string
  experience: ExperienceLevel
  questions: PrepQuestion[]
}

export interface PrepTrack {
  id: string
  label: string
  topics: string[]
}

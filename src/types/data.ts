export type JobStatus = 'active' | 'archived'

export interface Job {
  id: string
  title: string
  slug: string
  status: JobStatus
  tags: string[]
  order: number
  description: string
  openings: number
  createdAt: string
  updatedAt: string
}

export type CandidateStage =
  | 'applied'
  | 'screen'
  | 'tech'
  | 'offer'
  | 'hired'
  | 'rejected'

export interface Candidate {
  id: string
  jobId: string
  name: string
  email: string
  stage: CandidateStage
  appliedAt: string
  avatarColor: string
  phone: string
}

export interface CandidateTimelineEvent {
  id: string
  candidateId: string
  stage: CandidateStage
  changedAt: string
  note?: string
}

export interface CandidateNote {
  id: string
  candidateId: string
  author: string
  content: string
  createdAt: string
}

export type QuestionType =
  | 'singleChoice'
  | 'multiChoice'
  | 'shortText'
  | 'longText'
  | 'numeric'
  | 'file'

export interface QuestionConditional {
  sourceQuestionId: string
  expectedValue: string
}

export interface BaseQuestion {
  id: string
  prompt: string
  type: QuestionType
  required: boolean
  helperText?: string
  conditional?: QuestionConditional
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'singleChoice' | 'multiChoice'
  options: string[]
  maxSelections?: number
}

export interface TextQuestion extends BaseQuestion {
  type: 'shortText' | 'longText'
  maxLength?: number
}

export interface NumericQuestion extends BaseQuestion {
  type: 'numeric'
  min?: number
  max?: number
}

export interface FileQuestion extends BaseQuestion {
  type: 'file'
}

export type AssessmentQuestion =
  | ChoiceQuestion
  | TextQuestion
  | NumericQuestion
  | FileQuestion

export interface AssessmentSection {
  id: string
  title: string
  description?: string
  questions: AssessmentQuestion[]
}

export interface Assessment {
  jobId: string
  sections: AssessmentSection[]
  updatedAt: string
}

export interface AssessmentResponse {
  id: string
  jobId: string
  candidateId: string
  answers: Record<string, string | string[] | number | null>
  submittedAt: string
}

import type {
  Candidate,
  CandidateNote,
  CandidateStage,
  CandidateTimelineEvent
} from '../../../types/data'
import { apiClient } from '../../../lib/apiClient'

export type CandidateFilters = {
  search?: string
  stage?: CandidateStage | ''
  jobId?: string
  page?: number
  pageSize?: number
}

export type CandidatesResponse = {
  data: Candidate[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

export function fetchCandidates(filters: CandidateFilters): Promise<CandidatesResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.stage) params.set('stage', filters.stage)
  if (filters.jobId) params.set('jobId', filters.jobId)
  params.set('page', String(filters.page ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 50))
  return apiClient.get<CandidatesResponse>(`/candidates?${params.toString()}`)
}

export function fetchCandidate(candidateId: string): Promise<Candidate> {
  return apiClient.get<Candidate>(`/candidates/${candidateId}`)
}


export function createCandidate(payload: Pick<Candidate, "jobId" | "name" | "email"> & Partial<Pick<Candidate, "stage" | "phone" | "avatarColor">>): Promise<Candidate> {
  return apiClient.post<Candidate>('/candidates', payload)
}
export function updateCandidate(
  candidateId: string,
  payload: Partial<Pick<Candidate, 'stage' | 'jobId' | 'name' | 'email' | 'phone'>>
): Promise<Candidate> {
  return apiClient.patch<Candidate>(`/candidates/${candidateId}`, payload)
}

export function fetchCandidateTimeline(candidateId: string): Promise<CandidateTimelineEvent[]> {
  return apiClient.get<CandidateTimelineEvent[]>(`/candidates/${candidateId}/timeline`)
}

export function fetchCandidateNotes(candidateId: string): Promise<CandidateNote[]> {
  return apiClient.get<CandidateNote[]>(`/candidates/${candidateId}/notes`)
}

export function addCandidateNote(
  candidateId: string,
  payload: Omit<CandidateNote, 'id' | 'createdAt' | 'candidateId'>
): Promise<CandidateNote> {
  return apiClient.post<CandidateNote>(`/candidates/${candidateId}/notes`, payload)
}

import type { Assessment, AssessmentResponse } from '../../../types/data'
import { apiClient } from '../../../lib/apiClient'

export function fetchAssessment(jobId: string): Promise<Assessment> {
  return apiClient.get<Assessment>(`/assessments/${jobId}`)
}

export function saveAssessment(jobId: string, payload: Omit<Assessment, 'jobId'>): Promise<Assessment> {
  return apiClient.put<Assessment>(`/assessments/${jobId}`, { ...payload, jobId })
}

export function submitAssessment(jobId: string, payload: Omit<AssessmentResponse, 'id' | 'submittedAt' | 'jobId'>): Promise<AssessmentResponse> {
  return apiClient.post<AssessmentResponse>(`/assessments/${jobId}/submit`, payload)
}

export function fetchAssessmentResponses(jobId: string, candidateId?: string): Promise<AssessmentResponse[]> {
  const params = candidateId ? `?candidateId=${candidateId}` : ''
  return apiClient.get<AssessmentResponse[]>(`/assessments/${jobId}/responses${params}`)
}

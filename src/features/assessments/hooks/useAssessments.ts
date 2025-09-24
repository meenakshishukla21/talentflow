import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Assessment, AssessmentResponse } from '../../../types/data'
import { fetchAssessment, fetchAssessmentResponses, saveAssessment, submitAssessment } from '../api/assessmentsApi'

const ASSESSMENTS_KEY = ['assessments']

export function useAssessment(jobId?: string) {
  return useQuery<Assessment, Error>({
    queryKey: [...ASSESSMENTS_KEY, jobId],
    queryFn: () => fetchAssessment(jobId!),
    enabled: Boolean(jobId)
  })
}

export function useSaveAssessment(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<Assessment, 'jobId'>) => saveAssessment(jobId, payload),
    onSuccess: (assessment) => {
      queryClient.setQueryData([...ASSESSMENTS_KEY, jobId], assessment)
    }
  })
}

export function useSubmitAssessment(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<AssessmentResponse, 'id' | 'submittedAt' | 'jobId'>) => submitAssessment(jobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ASSESSMENTS_KEY, jobId, 'responses'] })
    }
  })
}

export function useAssessmentResponses(jobId?: string, candidateId?: string) {
  return useQuery<AssessmentResponse[], Error>({
    queryKey: [...ASSESSMENTS_KEY, jobId, 'responses', candidateId ?? 'all'],
    queryFn: () => fetchAssessmentResponses(jobId!, candidateId),
    enabled: Boolean(jobId)
  })
}

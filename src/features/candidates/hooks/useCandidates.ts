import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Candidate, CandidateNote, CandidateStage } from '../../../types/data'
import type { CandidateFilters, CandidatesResponse } from '../api/candidatesApi'
import {
  addCandidateNote,
  createCandidate,
  fetchCandidate,
  fetchCandidateNotes,
  fetchCandidateTimeline,
  fetchCandidates,
  updateCandidate
} from '../api/candidatesApi'

const CANDIDATES_KEY = ['candidates']

export function useCandidates(filters: CandidateFilters) {
  return useQuery<CandidatesResponse, Error>({
    queryKey: [...CANDIDATES_KEY, filters],
    queryFn: () => fetchCandidates(filters),
    placeholderData: (previous) => previous
  })
}

export function useCandidate(candidateId?: string) {
  return useQuery<Candidate, Error>({
    queryKey: [...CANDIDATES_KEY, 'detail', candidateId],
    queryFn: () => fetchCandidate(candidateId!),
    enabled: Boolean(candidateId)
  })
}

export function useCandidateTimeline(candidateId?: string) {
  return useQuery({
    queryKey: [...CANDIDATES_KEY, 'timeline', candidateId],
    queryFn: () => fetchCandidateTimeline(candidateId!),
    enabled: Boolean(candidateId)
  })
}

export function useCandidateNotes(candidateId?: string) {
  return useQuery({
    queryKey: [...CANDIDATES_KEY, 'notes', candidateId],
    queryFn: () => fetchCandidateNotes(candidateId!),
    enabled: Boolean(candidateId)
  })
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: { candidateId: string; updates: Partial<Candidate> }) =>
      updateCandidate(variables.candidateId, variables.updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CANDIDATES_KEY })
      queryClient.invalidateQueries({ queryKey: [...CANDIDATES_KEY, 'detail', variables.candidateId] })
      queryClient.invalidateQueries({ queryKey: [...CANDIDATES_KEY, 'timeline', variables.candidateId] })
    }
  })
}

export function useCreateCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CANDIDATES_KEY })
    }
  })
}

export function useAddCandidateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: { candidateId: string; payload: Omit<CandidateNote, 'id' | 'createdAt' | 'candidateId'> }) =>
      addCandidateNote(variables.candidateId, variables.payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...CANDIDATES_KEY, 'notes', variables.candidateId] })
    }
  })
}

export function stageLabel(stage: CandidateStage): string {
  switch (stage) {
    case 'applied':
      return 'Applied'
    case 'screen':
      return 'Screen'
    case 'tech':
      return 'Technical'
    case 'offer':
      return 'Offer'
    case 'hired':
      return 'Hired'
    case 'rejected':
      return 'Rejected'
    default:
      return stage
  }
}

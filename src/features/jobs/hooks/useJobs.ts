import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Job } from '../../../types/data'
import type { JobFilters, JobsResponse } from '../api/jobsApi'
import {
  createJob,
  fetchJob,
  fetchJobs,
  reorderJob,
  toggleArchive,
  updateJob
} from '../api/jobsApi'

const JOBS_KEY = ['jobs']

export function useJobs(filters: JobFilters) {
  return useQuery<JobsResponse, Error>({
    queryKey: [...JOBS_KEY, filters],
    queryFn: () => fetchJobs(filters),
    placeholderData: (previous) => previous
  })
}

export function useJob(jobId?: string) {
  return useQuery<Job, Error>({
    queryKey: [...JOBS_KEY, 'detail', jobId],
    queryFn: () => fetchJob(jobId!),
    enabled: Boolean(jobId)
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY })
    }
  })
}

export function useUpdateJob(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof updateJob>[1]) => updateJob(jobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY })
      queryClient.invalidateQueries({ queryKey: [...JOBS_KEY, 'detail', jobId] })
    }
  })
}

export function useToggleArchive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleArchive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY })
    }
  })
}

export function useReorderJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, fromOrder, toOrder }: { jobId: string; fromOrder: number; toOrder: number }) =>
      reorderJob(jobId, fromOrder, toOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY })
    }
  })
}

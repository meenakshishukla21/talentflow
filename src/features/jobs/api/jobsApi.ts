import type { Job, JobStatus } from '../../../types/data'
import { apiClient } from '../../../lib/apiClient'

export type JobFilters = {
  search?: string
  status?: JobStatus | ''
  tags?: string[]
  page?: number
  pageSize?: number
  sort?: 'order' | 'createdAt'
}

export type JobsResponse = {
  data: Job[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

export async function fetchJobs(filters: JobFilters): Promise<JobsResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status) params.set('status', filters.status)
  if (filters.tags && filters.tags.length) params.set('tags', filters.tags.join(','))
  params.set('page', String(filters.page ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 10))
  params.set('sort', filters.sort ?? 'order')
  return apiClient.get<JobsResponse>(`/jobs?${params.toString()}`)
}

export function fetchJob(jobId: string): Promise<Job> {
  return apiClient.get<Job>(`/jobs/${jobId}`)
}

export type JobPayload = {
  title: string
  description: string
  tags: string[]
  openings: number
}

export function createJob(payload: JobPayload): Promise<Job> {
  return apiClient.post<Job>('/jobs', payload)
}

export function updateJob(
  jobId: string,
  payload: Partial<JobPayload> & { status?: JobStatus }
): Promise<Job> {
  return apiClient.patch<Job>(`/jobs/${jobId}`, payload)
}

export function toggleArchive(jobId: string): Promise<Job> {
  return apiClient.post<Job>(`/jobs/${jobId}/archive`)
}

export function reorderJob(jobId: string, fromOrder: number, toOrder: number): Promise<{ success: boolean }> {
  return apiClient.patch<{ success: boolean }>(`/jobs/${jobId}/reorder`, { fromOrder, toOrder })
}

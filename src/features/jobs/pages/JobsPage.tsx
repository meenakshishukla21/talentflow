import { useEffect, useMemo, useState } from 'react'
import type { Job } from '../../../types/data'
import JobFormDrawer from '../components/JobFormDrawer'
import JobFiltersPanel from '../components/JobFilters'
import JobList from '../components/JobList'
import type { JobFilters as JobFiltersType, JobPayload } from '../api/jobsApi'
import { useCreateJob, useJobs, useReorderJob, useToggleArchive, useUpdateJob } from '../hooks/useJobs'

const PAGE_SIZE = 8

const defaultFilters: JobFiltersType = {
  search: '',
  status: '',
  tags: [],
  page: 1,
  pageSize: PAGE_SIZE,
  sort: 'order'
}

type DrawerState = {
  open: boolean
  mode: 'create' | 'edit'
  job?: Job
}

function JobsPage() {
  const [filters, setFilters] = useState<JobFiltersType>(defaultFilters)
  const [drawerState, setDrawerState] = useState<DrawerState>({ open: false, mode: 'create' })
  const [orderedJobs, setOrderedJobs] = useState<Job[]>([])
  const [tagRegistry, setTagRegistry] = useState<string[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)

  const jobsQuery = useJobs(filters)
  const createJobMutation = useCreateJob()
  const updateJobMutation = useUpdateJob(drawerState.job?.id ?? '')
  const archiveMutation = useToggleArchive()
  const reorderMutation = useReorderJob()

  useEffect(() => {
    if (jobsQuery.data?.data) {
      setOrderedJobs(jobsQuery.data.data)
      setTagRegistry((current) => {
        const tags = jobsQuery.data?.data.flatMap((job) => job.tags) ?? []
        return Array.from(new Set([...current, ...tags]))
      })
    }
  }, [jobsQuery.data])

  const pageCount = useMemo(() => {
    if (!jobsQuery.data) return 1
    return Math.max(1, Math.ceil(jobsQuery.data.pagination.total / (filters.pageSize ?? PAGE_SIZE)))
  }, [jobsQuery.data, filters.pageSize])

  const openCreateDrawer = () => {
    setDrawerState({ open: true, mode: 'create' })
  }

  const openEditDrawer = (job: Job) => {
    setDrawerState({ open: true, mode: 'edit', job })
  }

  const closeDrawer = () => {
    setDrawerState({ open: false, mode: 'create', job: undefined })
  }

  const handleDrawerSubmit = async (payload: JobPayload) => {
    if (drawerState.mode === 'create') {
      await createJobMutation.mutateAsync(payload)
    } else if (drawerState.job) {
      await updateJobMutation.mutateAsync(payload)
    }
  }

  const handleArchive = (job: Job) => {
    setFeedback(null)
    archiveMutation.mutate(job.id, {
      onError: (error) => {
        setFeedback(error instanceof Error ? error.message : 'Unable to update job')
      }
    })
  }

  const handlePageChange = (page: number) => {
    setFilters((current) => ({ ...current, page }))
  }

  const handleReorderCommit = async (jobId: string, fromIndex: number, toIndex: number) => {
    setFeedback(null)
    await reorderMutation.mutateAsync({ jobId, fromOrder: fromIndex, toOrder: toIndex })
  }

  const activeDrawerError = drawerState.mode === 'create' ? createJobMutation.error : updateJobMutation.error
  const drawerPending = drawerState.mode === 'create' ? createJobMutation.isPending : updateJobMutation.isPending

  const availableTags = useMemo(() => [...tagRegistry].sort(), [tagRegistry])
  const totalItems = jobsQuery.data?.pagination.total ?? 0
  const pageStart = totalItems === 0 ? 0 : ((filters.page ?? 1) - 1) * (filters.pageSize ?? PAGE_SIZE) + 1
  const pageEnd = Math.min(totalItems, pageStart + (filters.pageSize ?? PAGE_SIZE) - 1)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Jobs Board</h1>
          <p className="muted">Manage openings, publish roles, and keep the hiring plan aligned.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreateDrawer}>
          Create job
        </button>
      </div>

      <JobFiltersPanel
        filters={filters}
        onChange={(next) => {
          setFilters({ ...next, page: 1 })
        }}
        availableTags={availableTags}
      />

      {feedback ? (
        <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(220, 38, 38, 0.4)', color: '#b91c1c' }}>
          {feedback}
        </div>
      ) : null}

      {jobsQuery.isLoading ? (
        <div className="card">Loading jobs...</div>
      ) : jobsQuery.isError ? (
        <div className="card" style={{ color: '#b91c1c' }}>{jobsQuery.error.message}</div>
      ) : orderedJobs.length === 0 ? (
        <div className="card">No jobs match the current filters.</div>
      ) : (
        <JobList
          jobs={orderedJobs}
          onReorder={setOrderedJobs}
          onCommitReorder={handleReorderCommit}
          onReorderError={() => {
            setFeedback('Reorder failed. Restored previous order.')
          }}
          onEdit={openEditDrawer}
          onArchive={handleArchive}
        />
      )}

      <div className="flex-between" style={{ marginTop: '24px' }}>
        <span className="muted">
          Showing {pageStart}-{pageEnd} of {totalItems}
        </span>
        <div className="flex" style={{ gap: '12px' }}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => handlePageChange(Math.max(1, (filters.page ?? 1) - 1))}
            disabled={(filters.page ?? 1) === 1}
          >
            Previous
          </button>
          <span className="muted">
            Page {filters.page} of {pageCount}
          </span>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => handlePageChange(Math.min(pageCount, (filters.page ?? 1) + 1))}
            disabled={(filters.page ?? 1) >= pageCount}
          >
            Next
          </button>
        </div>
      </div>

      <JobFormDrawer
        open={drawerState.open}
        mode={drawerState.mode}
        initialJob={drawerState.job}
        onClose={closeDrawer}
        onSubmit={handleDrawerSubmit}
        pending={drawerPending}
        error={activeDrawerError ? activeDrawerError.message : null}
      />
    </div>
  )
}

export default JobsPage

import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Candidate, CandidateStage, Job } from '../../../types/data'
import CandidateBoard from '../components/CandidateBoard'
import CandidateFormDrawer from '../components/CandidateFormDrawer'
import { stageLabel, useCandidates, useCreateCandidate, useUpdateCandidate } from '../hooks/useCandidates'
import type { CandidateFilters } from '../api/candidatesApi'
import type { JobFilters } from '../../jobs/api/jobsApi'
import { useJobs } from '../../jobs/hooks/useJobs'

const stages: CandidateStage[] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

const boardFilters: CandidateFilters = {
  page: 1,
  pageSize: 1000
}

const jobDirectoryFilters: JobFilters = {
  search: '',
  status: '',
  tags: [],
  page: 1,
  pageSize: 60,
  sort: 'order'
}

type DrawerState = {
  open: boolean
}

const ITEM_HEIGHT = 96
const VIEWPORT_HEIGHT = 520
const OVERSCAN = 6

function CandidateListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStage = (searchParams.get('stage') as CandidateStage | null) ?? ''
  const initialJob = searchParams.get('jobId') ?? ''
  const [filters, setFilters] = useState<CandidateFilters>({
    ...boardFilters,
    stage: stages.includes(initialStage as CandidateStage) ? (initialStage as CandidateStage) : '',
    jobId: initialJob || undefined
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [drawerState, setDrawerState] = useState<DrawerState>({ open: false })
  const [listWidth, setListWidth] = useState(960)
  const [scrollTop, setScrollTop] = useState(0)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const resize = () => {
      if (typeof window !== 'undefined') {
        setListWidth(Math.max(640, Math.min(window.innerWidth - 360, 1080)))
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const stageButtons = useMemo<(CandidateStage | '')[]>(() => ['' as const, ...stages], [])

  const candidatesQuery = useCandidates(filters)
  const jobsQuery = useJobs(jobDirectoryFilters)
  const updateCandidateMutation = useUpdateCandidate()
  const createCandidateMutation = useCreateCandidate()

  const jobsMap = useMemo(() => {
    const map = new Map<string, Job>()
    const jobList = jobsQuery.data?.data ?? []
    jobList.forEach((job) => {
      map.set(job.id, job)
    })
    return map
  }, [jobsQuery.data])

  const allCandidates = candidatesQuery.data?.data ?? []

  const filteredCandidates = useMemo(() => {
    if (!searchTerm.trim()) return allCandidates
    const term = searchTerm.toLowerCase()
    return allCandidates.filter((candidate) =>
      candidate.name.toLowerCase().includes(term) || candidate.email.toLowerCase().includes(term)
    )
  }, [allCandidates, searchTerm])

  const stageGroups = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage] = allCandidates.filter((candidate) => candidate.stage === stage)
      return acc
    }, {} as Record<CandidateStage, Candidate[]>)
  }, [allCandidates])

  const totalCandidates = allCandidates.length
  const filteredCount = filteredCandidates.length

  const totalHeight = filteredCandidates.length * ITEM_HEIGHT
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) + OVERSCAN * 2
  const endIndex = Math.min(filteredCandidates.length, startIndex + visibleCount)
  const visibleCandidates = filteredCandidates.slice(startIndex, endIndex)

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 })
    setScrollTop(0)
  }, [filters.stage, filters.jobId, searchTerm])

  const handleStageFilter = (stage: CandidateStage | '') => {
    setFilters((current) => ({
      ...current,
      stage,
      page: 1
    }))
    const params = new URLSearchParams(searchParams)
    if (stage) {
      params.set('stage', stage)
    } else {
      params.delete('stage')
    }
    setSearchParams(params)
  }

  const handleJobFilter = (jobId: string) => {
    setFilters((current) => ({
      ...current,
      jobId: jobId || undefined,
      page: 1
    }))
    const params = new URLSearchParams(searchParams)
    if (jobId) {
      params.set('jobId', jobId)
    } else {
      params.delete('jobId')
    }
    setSearchParams(params)
  }

  const handleStageChange = async (candidateId: string, stage: CandidateStage) => {
    setFeedback(null)
    await updateCandidateMutation.mutateAsync({ candidateId, updates: { stage } })
  }

  const jobOptions = jobsQuery.data?.data ?? []

  return (
    <div className="grid" style={{ gap: '24px' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Candidates</h1>
          <p className="muted">Monitor the pipeline, collaborate with interviewers, and keep momentum high.</p>
        </div>
        <div className="flex" style={{ gap: '12px' }}>
          <button className="btn btn-secondary" type="button" onClick={() => setDrawerState({ open: true })}>
            Add candidate
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex" style={{ gap: '12px', flexWrap: 'wrap' }}>
          {stageButtons.map((stage) => {
            const label = stage ? stageLabel(stage as CandidateStage) : 'All'
            const active = stage === (filters.stage ?? '')
            return (
              <button
                key={stage || 'all'}
                type="button"
                className="btn"
                style={{
                  background: active ? 'rgba(37, 99, 235, 0.15)' : 'rgba(15, 23, 42, 0.05)',
                  color: active ? 'var(--primary)' : 'var(--muted)',
                  borderColor: active ? 'var(--primary)' : 'transparent'
                }}
                onClick={() => handleStageFilter(stage as CandidateStage | '')}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="grid" style={{ marginTop: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="form-row">
            <label className="label" htmlFor="candidate-search">
              Search directory
            </label>
            <input
              id="candidate-search"
              className="input"
              placeholder="Search name or email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="candidate-job-filter">
              Filter by job
            </label>
            <select
              id="candidate-job-filter"
              className="select"
              value={filters.jobId ?? ''}
              onChange={(event) => handleJobFilter(event.target.value)}
            >
              <option value="">All roles</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: '16px' }} className="muted">
          Showing {filteredCount} of {totalCandidates} candidates
        </div>
      </div>

      {feedback ? (
        <div className="card" style={{ border: '1px solid rgba(220, 38, 38, 0.3)', color: '#b91c1c' }}>{feedback}</div>
      ) : null}

      <div className="card">
        <h2 className="section-title">Pipeline board</h2>
        <CandidateBoard
          data={stageGroups}
          onStageChange={handleStageChange}
          onStageChangeError={(error) => {
            setFeedback(error instanceof Error ? error.message : 'Unable to move candidate')
          }}
        />
      </div>

      <div className="card">
        <h2 className="section-title">Directory</h2>
        {candidatesQuery.isLoading ? (
          <div>Loading candidates...</div>
        ) : filteredCandidates.length === 0 ? (
          <div>No candidates match the current filters.</div>
        ) : (
          <div style={{ maxWidth: listWidth }}>
            <div
              ref={listRef}
              style={{
                height: VIEWPORT_HEIGHT,
                overflowY: 'auto',
                position: 'relative'
              }}
              onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            >
              <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleCandidates.map((candidate, index) => {
                  const absoluteIndex = startIndex + index
                  const job = jobsMap.get(candidate.jobId)
                  return (
                    <div
                      key={candidate.id}
                      style={{
                        position: 'absolute',
                        top: absoluteIndex * ITEM_HEIGHT,
                        left: 0,
                        right: 0,
                        height: ITEM_HEIGHT,
                        padding: '0 12px'
                      }}
                    >
                      <div className="board-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{candidate.name}</div>
                          <div className="muted" style={{ fontSize: '13px' }}>
                            {candidate.email} • {job ? job.title : 'Unknown role'}
                          </div>
                        </div>
                        <div className="flex" style={{ gap: '12px', alignItems: 'center' }}>
                          <span className="badge">{stageLabel(candidate.stage)}</span>
                          <Link className="btn btn-secondary" to={`/candidates/${candidate.id}`}>
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <CandidateFormDrawer
        open={drawerState.open}
        onClose={() => setDrawerState({ open: false })}
        onSubmit={async (values) => {
          setFeedback(null)
          await createCandidateMutation.mutateAsync(values)
        }}
        pending={createCandidateMutation.isPending}
        error={createCandidateMutation.error?.message ?? null}
        jobs={jobOptions}
      />
    </div>
  )
}

export default CandidateListPage

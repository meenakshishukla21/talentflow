import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useJobs } from '../../jobs/hooks/useJobs'
import type { JobFilters } from '../../jobs/api/jobsApi'

const overviewFilters: JobFilters = {
  search: '',
  status: '',
  tags: [],
  page: 1,
  pageSize: 50,
  sort: 'order'
}

function AssessmentsOverviewPage() {
  const jobsQuery = useJobs(overviewFilters)

  const jobs = useMemo(() => jobsQuery.data?.data ?? [], [jobsQuery.data])

  return (
    <div className="grid" style={{ gap: '24px' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Assessments</h1>
          <p className="muted">Design structured evaluations and preview the candidate experience for each role.</p>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Jobs</h2>
        {jobsQuery.isLoading ? (
          <div>Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div>No jobs available yet. Create a job first.</div>
        ) : (
          <div className="grid" style={{ gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {jobs.map((job) => (
              <div key={job.id} className="board-card" style={{ cursor: 'pointer' }}>
                <div style={{ fontWeight: 600, fontSize: '18px' }}>{job.title}</div>
                <div className="muted" style={{ margin: '8px 0' }}>Updated {new Date(job.updatedAt).toLocaleDateString()}</div>
                <div className="flex-wrap" style={{ marginBottom: '12px' }}>
                  {job.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link className="btn btn-primary" to={`/assessments/${job.id}`}>
                  Open builder
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AssessmentsOverviewPage

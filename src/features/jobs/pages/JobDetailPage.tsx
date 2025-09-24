import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { CandidateStage } from '../../../types/data'
import { useJob } from '../hooks/useJobs'
import { fetchCandidates } from '../../candidates/api/candidatesApi'

const stages: CandidateStage[] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const jobQuery = useJob(jobId)
  const candidateSummaryQuery = useQuery({
    queryKey: ['job-candidates-summary', jobId],
    queryFn: () => fetchCandidates({ jobId, pageSize: 500 }),
    enabled: Boolean(jobId)
  })

  const stageCounts = useMemo(() => {
    const counts: Record<CandidateStage, number> = {
      applied: 0,
      screen: 0,
      tech: 0,
      offer: 0,
      hired: 0,
      rejected: 0
    }
    candidateSummaryQuery.data?.data.forEach((candidate) => {
      counts[candidate.stage] += 1
    })
    return counts
  }, [candidateSummaryQuery.data])

  if (jobQuery.isLoading) {
    return <div className="card">Loading job...</div>
  }

  if (jobQuery.isError || !jobQuery.data) {
    return <div className="card">Unable to load job.</div>
  }

  const job = jobQuery.data

  return (
    <div className="grid" style={{ gap: '24px' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">{job.title}</h1>
          <div className="muted">Slug: {job.slug}</div>
        </div>
        <div className="flex" style={{ gap: '12px' }}>
          <Link className="btn btn-secondary" to="/jobs">
            Back to jobs
          </Link>
          <Link className="btn btn-primary" to={`/assessments/${job.id}`}>
            Assessment builder
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Role overview</h2>
        <div className="flex" style={{ gap: '16px', flexWrap: 'wrap' as const }}>
          <span className="badge" style={{ background: job.status === 'active' ? 'rgba(22, 163, 74, 0.18)' : 'rgba(148, 163, 184, 0.25)', color: job.status === 'active' ? '#166534' : '#475569' }}>
            {job.status === 'active' ? 'Active' : 'Archived'}
          </span>
          <span className="badge">Openings: {job.openings}</span>
        </div>
        <p style={{ marginTop: '16px', fontSize: '15px', lineHeight: 1.6 }}>
          {job.description || 'No description yet. Use the edit action in the jobs board to add more context.'}
        </p>
        <div className="flex-wrap" style={{ marginTop: '16px' }}>
          {job.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Pipeline snapshot</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          {stages.map((stage) => (
            <Link
              key={stage}
              to={`/candidates?stage=${stage}&jobId=${job.id}`}
              className="card"
              style={{ boxShadow: 'none', border: '1px solid rgba(15, 23, 42, 0.08)' }}
            >
              <div className="muted" style={{ textTransform: 'capitalize', marginBottom: '8px' }}>
                {stage}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>
                {candidateSummaryQuery.isSuccess ? stageCounts[stage] : '—'}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Next steps</h2>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', lineHeight: 1.7 }}>
          <li>Review candidates currently in the tech and offer stages.</li>
          <li>Customize the assessment to reflect the latest requirements.</li>
          <li>Collaborate with hiring managers on interview panels.</li>
        </ul>
      </div>
    </div>
  )
}

export default JobDetailPage

import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useJobs } from '../../jobs/hooks/useJobs'
import type { JobFilters } from '../../jobs/api/jobsApi'
import {
  stageLabel,
  useAddCandidateNote,
  useCandidate,
  useCandidateNotes,
  useCandidateTimeline,
  useUpdateCandidate
} from '../hooks/useCandidates'
import type { CandidateStage } from '../../../types/data'

const jobDirectoryFilters: JobFilters = {
  search: '',
  status: '',
  tags: [],
  page: 1,
  pageSize: 60,
  sort: 'order'
}

const mentionSuggestions = ['@Alex Rivera', '@Priya Desai', '@Morgan Lee', '@Sam Parker', '@Taylor Chen']

function highlightMentions(text: string) {
  const parts = text.split(/(@[\w ]+)/g)
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={index} className="badge" style={{ marginRight: '6px' }}>
          {part}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}

function CandidateProfilePage() {
  const { candidateId } = useParams<{ candidateId: string }>()
  const candidateQuery = useCandidate(candidateId)
  const timelineQuery = useCandidateTimeline(candidateId)
  const notesQuery = useCandidateNotes(candidateId)
  const jobsQuery = useJobs(jobDirectoryFilters)
  const updateCandidateMutation = useUpdateCandidate()
  const addNoteMutation = useAddCandidateNote()
  const [noteContent, setNoteContent] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const jobMap = useMemo(() => {
    const map = new Map<string, string>()
    jobsQuery.data?.data.forEach((job) => {
      map.set(job.id, job.title)
    })
    return map
  }, [jobsQuery.data])

  if (candidateQuery.isLoading) {
    return <div className="card">Loading candidate...</div>
  }

  if (candidateQuery.isError || !candidateQuery.data) {
    return <div className="card">Candidate not found.</div>
  }

  const candidate = candidateQuery.data
  const jobTitle = jobMap.get(candidate.jobId) ?? 'Unknown role'

  const handleStageUpdate = async (stage: CandidateStage) => {
    setFeedback(null)
    try {
      await updateCandidateMutation.mutateAsync({ candidateId: candidate.id, updates: { stage } })
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to update stage')
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) return
    setFeedback(null)
    try {
      await addNoteMutation.mutateAsync({
        candidateId: candidate.id,
        payload: {
          author: 'You',
          content: noteContent.trim()
        }
      })
      setNoteContent('')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to add note')
    }
  }

  return (
    <div className="grid" style={{ gap: '24px' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">{candidate.name}</h1>
          <div className="muted">{candidate.email}</div>
        </div>
        <Link className="btn btn-secondary" to="/candidates">
          Back to candidates
        </Link>
      </div>

      <div className="card">
        <h2 className="section-title">Profile</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <div className="label">Role</div>
            <div>{jobTitle}</div>
          </div>
          <div>
            <div className="label">Stage</div>
            <select
              className="select"
              value={candidate.stage}
              onChange={(event) => handleStageUpdate(event.target.value as CandidateStage)}
            >
              {(['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'] as CandidateStage[]).map((stage) => (
                <option key={stage} value={stage}>
                  {stageLabel(stage)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="label">Phone</div>
            <div>{candidate.phone || 'Not provided'}</div>
          </div>
          <div>
            <div className="label">Applied on</div>
            <div>{new Date(candidate.appliedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {feedback ? (
        <div className="card" style={{ color: '#b91c1c', border: '1px solid rgba(220, 38, 38, 0.3)' }}>{feedback}</div>
      ) : null}

      <div className="card">
        <h2 className="section-title">Timeline</h2>
        {timelineQuery.isLoading ? (
          <div>Loading timeline...</div>
        ) : (
          <div className="timeline">
            {(timelineQuery.data ?? []).map((event) => (
              <div key={event.id} className="timeline-item">
                <div style={{ fontWeight: 600 }}>{stageLabel(event.stage)}</div>
                <div className="muted">{new Date(event.changedAt).toLocaleString()}</div>
                {event.note ? <div style={{ marginTop: '8px' }}>{event.note}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Notes</h2>
        <div className="form-row">
          <textarea
            className="textarea"
            rows={4}
            placeholder="Share feedback with @mentions so the team sees it"
            value={noteContent}
            onChange={(event) => setNoteContent(event.target.value)}
          />
        </div>
        <div className="flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
          {mentionSuggestions.map((mention) => (
            <button
              key={mention}
              type="button"
              className="btn btn-secondary"
              onClick={() => setNoteContent((current) => `${current.trim()} ${mention} `.trim())}
            >
              {mention}
            </button>
          ))}
        </div>
        <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-primary" type="button" onClick={handleAddNote} disabled={addNoteMutation.isPending}>
            {addNoteMutation.isPending ? 'Saving note...' : 'Add note'}
          </button>
        </div>
        <div className="timeline" style={{ marginTop: '24px' }}>
          {(notesQuery.data ?? []).map((note) => (
            <div key={note.id} className="note-item">
              <div style={{ fontWeight: 600 }}>{note.author}</div>
              <div className="muted" style={{ fontSize: '12px' }}>{new Date(note.createdAt).toLocaleString()}</div>
              <div style={{ marginTop: '8px', lineHeight: 1.6 }}>{highlightMentions(note.content)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CandidateProfilePage

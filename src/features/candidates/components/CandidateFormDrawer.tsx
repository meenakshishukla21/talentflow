import React, { useEffect, useMemo, useState } from 'react'
import type { Candidate, CandidateStage } from '../../../types/data'

const stages: CandidateStage[] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

export type CandidateFormValues = {
  name: string
  email: string
  phone: string
  jobId: string
  stage: CandidateStage
}

type CandidateFormDrawerProps = {
  open: boolean
  onClose: () => void
  onSubmit: (values: CandidateFormValues) => Promise<void>
  pending?: boolean
  error?: string | null
  jobs: { id: string; title: string }[]
  initialCandidate?: Candidate
}

const emptyValues: CandidateFormValues = {
  name: '',
  email: '',
  phone: '',
  jobId: '',
  stage: 'applied'
}

function CandidateFormDrawer({ open, onClose, onSubmit, pending, error, jobs, initialCandidate }: CandidateFormDrawerProps) {
  const [values, setValues] = useState<CandidateFormValues>(emptyValues)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (initialCandidate) {
      setValues({
        name: initialCandidate.name,
        email: initialCandidate.email,
        phone: initialCandidate.phone,
        jobId: initialCandidate.jobId,
        stage: initialCandidate.stage
      })
    } else {
      setValues(emptyValues)
    }
  }, [initialCandidate])

  useEffect(() => {
    setFormError(error ?? null)
  }, [error])

  const jobOptions = useMemo(() => [...jobs].sort((a, b) => a.title.localeCompare(b.title)), [jobs])
  const canSubmit = values.name.trim() && values.email.trim() && values.jobId

  if (!open) return null

  const handleChange = (key: keyof CandidateFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    if (!canSubmit) {
      setFormError('Name, email, and job are required')
      return
    }
    try {
      await onSubmit({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        jobId: values.jobId,
        stage: values.stage
      })
      onClose()
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setFormError(submissionError.message)
      } else {
        setFormError('Unable to save candidate')
      }
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="drawer">
        <div className="drawer-header">
          <h2>{initialCandidate ? 'Edit candidate' : 'Add candidate'}</h2>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <form className="drawer-body" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="label" htmlFor="candidate-name">
              Full name
            </label>
            <input
              id="candidate-name"
              className="input"
              value={values.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Jordan Blake"
              required
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="candidate-email">
              Email
            </label>
            <input
              id="candidate-email"
              className="input"
              type="email"
              value={values.email}
              onChange={(event) => handleChange('email', event.target.value)}
              placeholder="jordan@example.com"
              required
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="candidate-phone">
              Phone
            </label>
            <input
              id="candidate-phone"
              className="input"
              value={values.phone}
              onChange={(event) => handleChange('phone', event.target.value)}
              placeholder="415-555-0123"
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="candidate-job">
              Job
            </label>
            <select
              id="candidate-job"
              className="select"
              value={values.jobId}
              onChange={(event) => handleChange('jobId', event.target.value)}
              required
            >
              <option value="">Select job</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label className="label" htmlFor="candidate-stage">
              Stage
            </label>
            <select
              id="candidate-stage"
              className="select"
              value={values.stage}
              onChange={(event) => handleChange('stage', event.target.value)}
            >
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {formError ? <div className="muted" style={{ color: '#dc2626' }}>{formError}</div> : null}
          <div className="flex" style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending || !canSubmit}>
              {pending ? 'Saving...' : initialCandidate ? 'Save changes' : 'Add candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CandidateFormDrawer

import React, { useEffect, useMemo, useState } from 'react'
import type { Job } from '../../../types/data'
import type { JobPayload } from '../api/jobsApi'

export type JobFormDrawerProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialJob?: Job
  onClose: () => void
  onSubmit: (values: JobPayload) => Promise<void>
  pending?: boolean
  error?: string | null
}

const defaultValues: JobPayload = {
  title: '',
  description: '',
  tags: [],
  openings: 1
}

function useJobFormState(initialJob?: Job) {
  const [values, setValues] = useState<JobPayload>(defaultValues)

  useEffect(() => {
    if (initialJob) {
      setValues({
        title: initialJob.title,
        description: initialJob.description,
        tags: initialJob.tags,
        openings: initialJob.openings
      })
    } else {
      setValues(defaultValues)
    }
  }, [initialJob])

  return [values, setValues] as const
}

function JobFormDrawer({ open, mode, initialJob, onClose, onSubmit, pending, error }: JobFormDrawerProps) {
  const [values, setValues] = useJobFormState(initialJob)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setFormError(error ?? null)
  }, [error])

  const canSubmit = useMemo(() => values.title.trim().length > 0, [values.title])

  if (!open) {
    return null
  }

  const handleChange = (key: keyof JobPayload, value: string | string[] | number) => {
    setValues((current) => ({
      ...current,
      [key]: value
    }))
  }

  const handleTagInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      const value = event.currentTarget.value.trim()
      if (value.length === 0) return
      handleChange('tags', Array.from(new Set([...values.tags, value])))
      event.currentTarget.value = ''
    }
  }

  const removeTag = (tag: string) => {
    handleChange(
      'tags',
      values.tags.filter((item) => item !== tag)
    )
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    if (!canSubmit) {
      setFormError('Title is required')
      return
    }
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        tags: values.tags,
        openings: values.openings
      })
      onClose()
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setFormError(submissionError.message)
      } else {
        setFormError('Unable to save job')
      }
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="drawer">
        <div className="drawer-header">
          <h2>{mode === 'create' ? 'Create Job' : 'Edit Job'}</h2>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <form className="drawer-body" onSubmit={submit}>
          <div className="form-row">
            <label className="label" htmlFor="job-title">
              Job Title
            </label>
            <input
              id="job-title"
              className="input"
              placeholder="Senior Frontend Engineer"
              value={values.title}
              onChange={(event) => handleChange('title', event.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="job-description">
              Description
            </label>
            <textarea
              id="job-description"
              className="textarea"
              rows={4}
              placeholder="Role summary, responsibilities, impact..."
              value={values.description}
              onChange={(event) => handleChange('description', event.target.value)}
            />
          </div>
          <div className="form-row">
            <label className="label">Tags</label>
            <div className="flex-wrap">
              {values.tags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                  <button
                    type="button"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              className="input"
              placeholder="Press enter to add tag"
              onKeyDown={handleTagInput}
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="job-openings">
              Openings
            </label>
            <input
              id="job-openings"
              className="input"
              type="number"
              min={1}
              value={values.openings}
              onChange={(event) => handleChange('openings', Number(event.target.value))}
            />
          </div>
          {formError ? <div className="muted" style={{ color: '#dc2626' }}>{formError}</div> : null}
          <div className="flex" style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending || !canSubmit}>
              {pending ? 'Saving...' : mode === 'create' ? 'Create Job' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default JobFormDrawer

import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type {
  Assessment,
  AssessmentQuestion,
  AssessmentSection,
  QuestionConditional,
  QuestionType
} from '../../../types/data'
import { createId } from '../../../utils/id'
import { useAssessment, useAssessmentResponses, useSaveAssessment, useSubmitAssessment } from '../hooks/useAssessments'
import { useJobs } from '../../jobs/hooks/useJobs'
import type { JobFilters } from '../../jobs/api/jobsApi'

const jobDirectoryFilters: JobFilters = {
  search: '',
  status: '',
  tags: [],
  page: 1,
  pageSize: 60,
  sort: 'order'
}

type QuestionDraft = AssessmentQuestion

type SectionDraft = AssessmentSection

type DraftAssessment = Assessment
type AnswerValue = string | number | string[] | null

const questionTypes: { type: QuestionType; label: string }[] = [
  { type: 'singleChoice', label: 'Single choice' },
  { type: 'multiChoice', label: 'Multi choice' },
  { type: 'shortText', label: 'Short text' },
  { type: 'longText', label: 'Long text' },
  { type: 'numeric', label: 'Numeric' },
  { type: 'file', label: 'File upload' }
]

function emptyQuestion(type: QuestionType): QuestionDraft {
  const base = {
    id: createId('question'),
    prompt: 'Untitled question',
    type,
    required: true
  } as AssessmentQuestion
  if (type === 'singleChoice' || type === 'multiChoice') {
    return {
      ...base,
      type,
      options: ['Option A', 'Option B']
    }
  }
  if (type === 'shortText' || type === 'longText') {
    return {
      ...base,
      type,
      maxLength: type === 'shortText' ? 120 : 600
    }
  }
  if (type === 'numeric') {
    return {
      ...base,
      type,
      min: 0,
      max: 100
    }
  }
  return base
}

function updateQuestionInSection(section: SectionDraft, questionId: string, updater: (question: QuestionDraft) => QuestionDraft): SectionDraft {
  return {
    ...section,
    questions: section.questions.map((question) => (question.id === questionId ? updater(question) : question))
  }
}

function AssessmentBuilderPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const assessmentQuery = useAssessment(jobId)
  const saveAssessmentMutation = useSaveAssessment(jobId ?? '')
  const submitAssessmentMutation = useSubmitAssessment(jobId ?? '')
  const responsesQuery = useAssessmentResponses(jobId)
  const jobsQuery = useJobs(jobDirectoryFilters)
  const [draft, setDraft] = useState<DraftAssessment | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [candidateId, setCandidateId] = useState('')
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})

  useEffect(() => {
    if (assessmentQuery.data) {
      setDraft(assessmentQuery.data)
    }
  }, [assessmentQuery.data])

  const jobTitle = useMemo(() => {
    const job = jobsQuery.data?.data.find((item) => item.id === jobId)
    return job?.title ?? 'Assessment'
  }, [jobsQuery.data, jobId])

  if (!jobId) {
    return <div className="card">Select a job to manage its assessment.</div>
  }

  if (assessmentQuery.isLoading || !draft) {
    return <div className="card">Loading assessment...</div>
  }

  const updateDraft = (updater: (current: DraftAssessment) => DraftAssessment) => {
    setDraft((current) => (current ? updater(current) : current))
  }

  const addSection = () => {
    updateDraft((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: createId('section'),
          title: 'New section',
          description: '',
          questions: []
        }
      ]
    }))
  }

  const updateSection = (sectionId: string, updates: Partial<SectionDraft>) => {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? { ...section, ...updates } : section))
    }))
  }

  const removeSection = (sectionId: string) => {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.filter((section) => section.id !== sectionId)
    }))
  }

  const addQuestion = (sectionId: string, type: QuestionType) => {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: [...section.questions, emptyQuestion(type)]
            }
          : section
      )
    }))
  }

  const removeQuestion = (sectionId: string, questionId: string) => {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.filter((question) => question.id !== questionId)
            }
          : section
      )
    }))
  }

  const updateQuestion = (sectionId: string, questionId: string, updater: (question: QuestionDraft) => QuestionDraft) => {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? updateQuestionInSection(section, questionId, updater) : section
      )
    }))
  }

  const handleSave = async () => {
    if (!draft) return
    setFeedback(null)
    try {
      await saveAssessmentMutation.mutateAsync({ sections: draft.sections, updatedAt: new Date().toISOString() })
      setFeedback('Assessment saved')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to save assessment')
    }
  }

  const visibleQuestions = (section: SectionDraft, responses: Record<string, AnswerValue>) => {
    return section.questions.filter((question) => {
      if (!('conditional' in question) || !question.conditional) return true
      const conditional = question.conditional as QuestionConditional
      const sourceValue = responses[conditional.sourceQuestionId]
      if (Array.isArray(sourceValue)) {
        return sourceValue.includes(conditional.expectedValue)
      }
      return sourceValue === conditional.expectedValue
    })
  }

  const validateAnswers = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    draft.sections.forEach((section) => {
      visibleQuestions(section, answers).forEach((question) => {
        const value = answers[question.id]
        if (question.required) {
          if (question.type === 'multiChoice') {
            if (!Array.isArray(value) || value.length === 0) {
              errors[question.id] = 'Select at least one option'
            }
          } else if (value === undefined || value === null || value === '') {
            errors[question.id] = 'This field is required'
          }
        }
        if (question.type === 'numeric' && value !== undefined && value !== null && value !== '') {
          const numericValue = Number(value)
          if (Number.isNaN(numericValue)) {
            errors[question.id] = 'Enter a number'
          }
          if (question.min !== undefined && numericValue < question.min) {
            errors[question.id] = `Minimum ${question.min}`
          }
          if (question.max !== undefined && numericValue > question.max) {
            errors[question.id] = `Maximum ${question.max}`
          }
        }
        if ((question.type === 'shortText' || question.type === 'longText') && typeof value === 'string' && question.maxLength) {
          if (value.length > question.maxLength) {
            errors[question.id] = `Max ${question.maxLength} characters`
          }
        }
        if (question.type === 'multiChoice' && Array.isArray(value)) {
          const typedQuestion = question
          if (typedQuestion.maxSelections && value.length > typedQuestion.maxSelections) {
            errors[question.id] = `Select up to ${typedQuestion.maxSelections}`
          }
        }
      })
    })
    return errors
  }

  const [submissionErrors, setSubmissionErrors] = useState<Record<string, string>>({})

  const handlePreviewSubmit = async () => {
    const errors = validateAnswers()
    setSubmissionErrors(errors)
    if (Object.keys(errors).length > 0) {
      setFeedback('Resolve validation errors before submitting')
      return
    }
    if (!candidateId.trim()) {
      setFeedback('Candidate ID or email is required')
      return
    }
    setFeedback(null)
    try {
      await submitAssessmentMutation.mutateAsync({ candidateId: candidateId.trim(), answers })
      setFeedback('Sample response stored')
      setSubmissionErrors({})
      setAnswers({})
      setCandidateId('')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to submit response')
    }
  }

  const responses = responsesQuery.data ?? []

  return (
    <div className="grid" style={{ gap: '24px' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">{jobTitle} assessment</h1>
          <p className="muted">Assemble questions, preview the candidate flow, and capture structured feedback.</p>
        </div>
        <div className="flex" style={{ gap: '12px' }}>
          <Link className="btn btn-secondary" to="/assessments">
            Back to overview
          </Link>
          <button className="btn btn-primary" type="button" onClick={handleSave} disabled={saveAssessmentMutation.isPending}>
            {saveAssessmentMutation.isPending ? 'Saving...' : 'Save assessment'}
          </button>
        </div>
      </div>

      {feedback ? (
        <div className="card" style={{ color: feedback.includes('saved') || feedback.includes('stored') ? '#166534' : '#b91c1c', border: feedback.includes('saved') || feedback.includes('stored') ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid rgba(220, 38, 38, 0.3)' }}>
          {feedback}
        </div>
      ) : null}

      <div className="grid" style={{ gap: '24px', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <div className="card">
          <h2 className="section-title">Builder</h2>
          <button className="btn btn-secondary" type="button" onClick={addSection} style={{ marginBottom: '16px' }}>
            Add section
          </button>
          <div className="grid" style={{ gap: '16px' }}>
            {draft.sections.map((section) => (
              <div key={section.id} className="question-card">
                <div className="flex-between" style={{ marginBottom: '12px' }}>
                  <input
                    className="input"
                    value={section.title}
                    onChange={(event) => updateSection(section.id, { title: event.target.value })}
                  />
                  <button className="btn btn-secondary" type="button" onClick={() => removeSection(section.id)}>
                    Remove
                  </button>
                </div>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Section description"
                  value={section.description ?? ''}
                  onChange={(event) => updateSection(section.id, { description: event.target.value })}
                  style={{ marginBottom: '12px' }}
                />
                <div className="flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
                  {questionTypes.map((option) => (
                    <button key={option.type} className="btn btn-secondary" type="button" onClick={() => addQuestion(section.id, option.type)}>
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="grid" style={{ gap: '12px', marginTop: '16px' }}>
                  {section.questions.map((question) => (
                    <div key={question.id} className="question-card" style={{ border: '1px solid rgba(15, 23, 42, 0.08)' }}>
                      <div className="flex-between" style={{ marginBottom: '10px' }}>
                        <input
                          className="input"
                          value={question.prompt}
                          onChange={(event) =>
                            updateQuestion(section.id, question.id, (current) => ({ ...current, prompt: event.target.value }))
                          }
                        />
                        <button className="btn btn-secondary" type="button" onClick={() => removeQuestion(section.id, question.id)}>
                          Remove
                        </button>
                      </div>
                      <div className="flex" style={{ gap: '12px', marginBottom: '10px' }}>
                        <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(event) =>
                              updateQuestion(section.id, question.id, (current) => ({
                                ...current,
                                required: event.target.checked
                              }))
                            }
                          />
                          Required
                        </label>
                      </div>
                      {question.type === 'singleChoice' || question.type === 'multiChoice' ? (
                        <div className="form-row">
                          <label className="label">Options (one per line)</label>
                          <textarea
                            className="textarea"
                            rows={3}
                            value={(question.options ?? []).join('\n')}
                            onChange={(event) =>
                              updateQuestion(section.id, question.id, (current) => ({
                                ...current,
                                options: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean)
                              }))
                            }
                          />
                          {question.type === 'multiChoice' ? (
                            <input
                              className="input"
                              type="number"
                              min={1}
                              placeholder="Max selections"
                              value={question.maxSelections ?? ''}
                              onChange={(event) =>
                                updateQuestion(section.id, question.id, (current) => ({
                                  ...current,
                                  maxSelections: event.target.value ? Number(event.target.value) : undefined
                                }))
                              }
                            />
                          ) : null}
                        </div>
                      ) : null}
                      {question.type === 'shortText' || question.type === 'longText' ? (
                        <div className="form-row">
                          <label className="label">Max length</label>
                          <input
                            className="input"
                            type="number"
                            value={question.maxLength ?? ''}
                            onChange={(event) =>
                              updateQuestion(section.id, question.id, (current) => ({
                                ...current,
                                maxLength: event.target.value ? Number(event.target.value) : undefined
                              }))
                            }
                          />
                        </div>
                      ) : null}
                      {question.type === 'numeric' ? (
                        <div className="flex" style={{ gap: '12px' }}>
                          <input
                            className="input"
                            type="number"
                            placeholder="Min"
                            value={question.min ?? ''}
                            onChange={(event) =>
                              updateQuestion(section.id, question.id, (current) => ({
                                ...current,
                                min: event.target.value ? Number(event.target.value) : undefined
                              }))
                            }
                          />
                          <input
                            className="input"
                            type="number"
                            placeholder="Max"
                            value={question.max ?? ''}
                            onChange={(event) =>
                              updateQuestion(section.id, question.id, (current) => ({
                                ...current,
                                max: event.target.value ? Number(event.target.value) : undefined
                              }))
                            }
                          />
                        </div>
                      ) : null}
                      {section.questions.length > 1 ? (
                        <div className="form-row">
                          <label className="label">Conditional visibility</label>
                          <select
                            className="select"
                            value={question.conditional?.sourceQuestionId ?? ''}
                            onChange={(event) =>
                              updateQuestion(section.id, question.id, (current) => ({
                                ...current,
                                conditional: event.target.value
                                  ? {
                                      sourceQuestionId: event.target.value,
                                      expectedValue: current.conditional?.expectedValue ?? ''
                                    }
                                  : undefined
                              }))
                            }
                          >
                            <option value="">Always show</option>
                            {section.questions
                              .filter((candidate) => candidate.id !== question.id)
                              .map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.prompt.slice(0, 60)}
                                </option>
                              ))}
                          </select>
                          {question.conditional?.sourceQuestionId ? (
                            <input
                              className="input"
                              placeholder="Expected answer"
                              value={question.conditional.expectedValue}
                              onChange={(event) =>
                                updateQuestion(section.id, question.id, (current) => ({
                                  ...current,
                                  conditional: {
                                    sourceQuestionId: current.conditional?.sourceQuestionId ?? '',
                                    expectedValue: event.target.value
                                  }
                                }))
                              }
                            />
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="section-title">Preview</h2>
          <div className="form-row">
            <label className="label" htmlFor="candidate-id">
              Candidate identifier
            </label>
            <input
              id="candidate-id"
              className="input"
              placeholder="jordan@example.com"
              value={candidateId}
              onChange={(event) => setCandidateId(event.target.value)}
            />
          </div>
          <div className="grid" style={{ gap: '16px' }}>
            {draft.sections.map((section) => (
              <div key={section.id} className="preview-pane">
                <h3 style={{ marginTop: 0 }}>{section.title}</h3>
                {section.description ? <p className="muted">{section.description}</p> : null}
                <div className="grid" style={{ gap: '12px' }}>
                  {visibleQuestions(section, answers).map((question) => (
                    <div key={question.id}>
                      <div style={{ fontWeight: 600 }}>{question.prompt}</div>
                      {question.type === 'singleChoice' ? (
                        <div className="option-list">
                          {(question.options ?? []).map((option) => (
                            <label key={option} className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="radio"
                                name={question.id}
                                checked={answers[question.id] === option}
                                onChange={() => setAnswers((current: Record<string, AnswerValue>) => ({ ...current, [question.id]: option }))}
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      ) : null}
                      {question.type === 'multiChoice' ? (
                        <div className="option-list">
                          {(question.options ?? []).map((option) => {
                            const selections = (answers[question.id] as string[]) ?? []
                            const checked = selections.includes(option)
                            return (
                              <label key={option} className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    setAnswers((current: Record<string, AnswerValue>) => {
                                      const existing = ((current[question.id] as string[]) ?? []).filter((item): item is string => Boolean(item))
                                      if (checked) {
                                        return { ...current, [question.id]: existing.filter((item) => item !== option) }
                                      }
                                      return { ...current, [question.id]: [...existing, option] }
                                    })
                                  }
                                />
                                {option}
                              </label>
                            )
                          })}
                        </div>
                      ) : null}
                      {question.type === 'shortText' || question.type === 'longText' ? (
                        <textarea
                          className="textarea"
                          rows={question.type === 'shortText' ? 2 : 4}
                          value={(answers[question.id] as string) ?? ''}
                          onChange={(event) => setAnswers((current: Record<string, AnswerValue>) => ({ ...current, [question.id]: event.target.value }))}
                        />
                      ) : null}
                      {question.type === 'numeric' ? (
                        <input
                          className="input"
                          type="number"
                          value={(answers[question.id] as number | string | undefined) ?? ''}
                          onChange={(event) => setAnswers((current: Record<string, AnswerValue>) => ({ ...current, [question.id]: event.target.value }))}
                        />
                      ) : null}
                      {question.type === 'file' ? (
                        <input
                          className="input"
                          type="text"
                          placeholder="Paste link to file"
                          value={(answers[question.id] as string) ?? ''}
                          onChange={(event) => setAnswers((current: Record<string, AnswerValue>) => ({ ...current, [question.id]: event.target.value }))}
                        />
                      ) : null}
                      {submissionErrors[question.id] ? (
                        <div className="muted" style={{ color: '#b91c1c', marginTop: '4px' }}>{submissionErrors[question.id]}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="btn btn-primary" type="button" onClick={handlePreviewSubmit} disabled={submitAssessmentMutation.isPending}>
              {submitAssessmentMutation.isPending ? 'Submitting...' : 'Submit sample response'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Recent responses</h2>
        {responsesQuery.isLoading ? (
          <div>Loading responses...</div>
        ) : responses.length === 0 ? (
          <div>No responses have been submitted yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Submitted</th>
                <th>Answers</th>
              </tr>
            </thead>
            <tbody>
              {responses.slice(0, 5).map((response) => (
                <tr key={response.id}>
                  <td>{response.candidateId}</td>
                  <td>{new Date(response.submittedAt).toLocaleString()}</td>
                  <td>
                    <div style={{ maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {Object.keys(response.answers).length} answers
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AssessmentBuilderPage

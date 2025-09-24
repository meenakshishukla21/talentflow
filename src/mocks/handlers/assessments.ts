import { http, HttpResponse } from 'msw'
import { db } from '../../lib/database'
import type { Assessment, AssessmentResponse } from '../../types/data'
import { createId } from '../../utils/id'
import { shouldFailWrite, withLatency } from '../utils'

// controller: assessment routes
export const assessmentHandlers = [
  http.get('/assessments/:jobId', async ({ params }) =>
    withLatency(async () => {
      const jobId = String(params.jobId)
      const assessment = await db.assessments.where('jobId').equals(jobId).first()
      if (!assessment) {
        const emptyAssessment: Assessment = {
          jobId,
          sections: [],
          updatedAt: new Date().toISOString()
        }
        await db.assessments.put(emptyAssessment)
        return HttpResponse.json(emptyAssessment)
      }
      return HttpResponse.json(assessment)
    })
  ),
  http.put('/assessments/:jobId', async ({ params, request }) =>
    withLatency(async () => {
      if (shouldFailWrite()) {
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 500 })
      }
      const jobId = String(params.jobId)
      const payload = (await request.json()) as Assessment
      const updated: Assessment = {
        ...payload,
        jobId,
        updatedAt: new Date().toISOString()
      }
      await db.assessments.put(updated)
      return HttpResponse.json(updated)
    })
  ),
  http.post('/assessments/:jobId/submit', async ({ params, request }) =>
    withLatency(async () => {
      if (shouldFailWrite()) {
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 500 })
      }
      const jobId = String(params.jobId)
      const payload = (await request.json()) as Omit<AssessmentResponse, 'id' | 'submittedAt' | 'jobId'>
      const response: AssessmentResponse = {
        id: createId('response'),
        jobId,
        candidateId: payload.candidateId,
        answers: payload.answers,
        submittedAt: new Date().toISOString()
      }
      await db.assessmentResponses.put(response)
      return HttpResponse.json(response, { status: 201 })
    })
  ),
  http.get('/assessments/:jobId/responses', async ({ params, request }) =>
    withLatency(async () => {
      const jobId = String(params.jobId)
      const url = new URL(request.url)
      const candidateId = url.searchParams.get('candidateId')
      const collection = await db.assessmentResponses.where('jobId').equals(jobId).toArray()
      const filtered = candidateId ? collection.filter((item) => item.candidateId === candidateId) : collection
      return HttpResponse.json(filtered)
    })
  )
]

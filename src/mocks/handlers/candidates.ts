import { http, HttpResponse } from 'msw'
import { db } from '../../lib/database'
import type {
  Candidate,
  CandidateNote,
  CandidateStage,
  CandidateTimelineEvent
} from '../../types/data'
import { createId } from '../../utils/id'
import { shouldFailWrite, withLatency } from '../utils'

const stageOrder: CandidateStage[] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

function sortByStage(a: CandidateStage, b: CandidateStage): number {
  return stageOrder.indexOf(a) - stageOrder.indexOf(b)
}

function formatCandidate(candidate: Candidate) {
  return candidate
}

// controller: candidate routes
export const candidateHandlers = [
  http.get('/candidates', async ({ request }) =>
    withLatency(async () => {
      const url = new URL(request.url)
      const search = url.searchParams.get('search')?.toLowerCase() ?? ''
      const stage = url.searchParams.get('stage') ?? ''
      const jobId = url.searchParams.get('jobId') ?? ''
      const page = Number(url.searchParams.get('page') ?? '1')
      const pageSize = Number(url.searchParams.get('pageSize') ?? '50')

      const allCandidates = await db.candidates.toArray()
      const filtered = allCandidates
        .filter((candidate) => {
          const matchesSearch = search
            ? candidate.name.toLowerCase().includes(search) || candidate.email.toLowerCase().includes(search)
            : true
          const matchesStage = stage ? candidate.stage === stage : true
          const matchesJob = jobId ? candidate.jobId === jobId : true
          return matchesSearch && matchesStage && matchesJob
        })
        .sort((a, b) => {
          const stageComparison = sortByStage(a.stage, b.stage)
          if (stageComparison !== 0) {
            return stageComparison
          }
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        })

      const total = filtered.length
      const start = (page - 1) * pageSize
      const data = filtered.slice(start, start + pageSize).map(formatCandidate)

      return HttpResponse.json({
        data,
        pagination: {
          page,
          pageSize,
          total
        }
      })
    })
  ),
  http.get('/candidates/:candidateId', async ({ params }) =>
    withLatency(async () => {
      const candidate = await db.candidates.get(String(params.candidateId))
      if (!candidate) {
        return HttpResponse.json({ message: 'Candidate not found' }, { status: 404 })
      }
      return HttpResponse.json(formatCandidate(candidate))
    })
  ),
  http.post('/candidates', async ({ request }) =>
    withLatency(async () => {
      if (shouldFailWrite()) {
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 500 })
      }
      const payload = (await request.json()) as Partial<Candidate>
      if (!payload.name || !payload.email || !payload.jobId) {
        return HttpResponse.json({ message: 'Missing required fields' }, { status: 422 })
      }
      const candidate: Candidate = {
        id: createId('cand'),
        jobId: payload.jobId,
        name: payload.name,
        email: payload.email.toLowerCase(),
        stage: payload.stage ?? 'applied',
        appliedAt: new Date().toISOString(),
        avatarColor: payload.avatarColor ?? '#8884d8',
        phone: payload.phone ?? ''
      }
      await db.candidates.add(candidate)
      const timeline: CandidateTimelineEvent = {
        id: createId('timeline'),
        candidateId: candidate.id,
        stage: candidate.stage,
        changedAt: candidate.appliedAt,
        note: 'Application submitted'
      }
      await db.candidateTimelines.add(timeline)
      return HttpResponse.json(candidate, { status: 201 })
    })
  ),
  http.patch('/candidates/:candidateId', async ({ params, request }) =>
    withLatency(async () => {
      if (shouldFailWrite()) {
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 500 })
      }
      const candidateId = String(params.candidateId)
      const existing = await db.candidates.get(candidateId)
      if (!existing) {
        return HttpResponse.json({ message: 'Candidate not found' }, { status: 404 })
      }
      const updates = (await request.json()) as Partial<Candidate>
      const updated: Candidate = {
        ...existing,
        ...updates
      }
      await db.candidates.put(updated)
      if (updates.stage && updates.stage !== existing.stage) {
        const timeline: CandidateTimelineEvent = {
          id: createId('timeline'),
          candidateId,
          stage: updates.stage,
          changedAt: new Date().toISOString(),
          note: `Stage moved to ${updates.stage}`
        }
        await db.candidateTimelines.add(timeline)
      }
      return HttpResponse.json(updated)
    })
  ),
  http.get('/candidates/:candidateId/timeline', async ({ params }) =>
    withLatency(async () => {
      const candidateId = String(params.candidateId)
      const events = await db.candidateTimelines.where('candidateId').equals(candidateId).toArray()
      const sorted = events.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
      return HttpResponse.json(sorted)
    })
  ),
  http.get('/candidates/:candidateId/notes', async ({ params }) =>
    withLatency(async () => {
      const notes = await db.notes.where('candidateId').equals(String(params.candidateId)).toArray()
      const sorted = notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return HttpResponse.json(sorted)
    })
  ),
  http.post('/candidates/:candidateId/notes', async ({ params, request }) =>
    withLatency(async () => {
      if (shouldFailWrite()) {
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 500 })
      }
      const candidateId = String(params.candidateId)
      const payload = (await request.json()) as Omit<CandidateNote, 'id' | 'createdAt'>
      const note: CandidateNote = {
        id: createId('note'),
        candidateId,
        author: payload.author,
        content: payload.content,
        createdAt: new Date().toISOString()
      }
      await db.notes.add(note)
      return HttpResponse.json(note, { status: 201 })
    })
  )
]

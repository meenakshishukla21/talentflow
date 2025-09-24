import { http, HttpResponse } from 'msw'
import { db } from '../../lib/database'
import type { Job } from '../../types/data'
import { slugify } from '../../utils/slug'
import { createId } from '../../utils/id'
import { shouldFailWrite, withLatency } from '../utils'

// controller: job routes
export const jobHandlers = [
  http.get('/jobs', async ({ request }) =>
    withLatency(async () => {
      const url = new URL(request.url)
      const search = url.searchParams.get('search')?.toLowerCase() ?? ''
      const status = url.searchParams.get('status') ?? ''
      const tags = url.searchParams.get('tags')?.split(',').filter(Boolean) ?? []
      const page = Number(url.searchParams.get('page') ?? '1')
      const pageSize = Number(url.searchParams.get('pageSize') ?? '10')
      const sort = url.searchParams.get('sort') ?? 'order'

      const allJobs = await db.jobs.toArray()
      const filtered = allJobs
        .filter((job) => {
          const matchesSearch = search
            ? job.title.toLowerCase().includes(search) || job.slug.includes(search)
            : true
          const matchesStatus = status ? job.status === status : true
          const matchesTags = tags.length ? tags.every((tag) => job.tags.includes(tag)) : true
          return matchesSearch && matchesStatus && matchesTags
        })
        .sort((a, b) => {
          if (sort === 'createdAt') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          }
          return a.order - b.order
        })

      const total = filtered.length
      const start = (page - 1) * pageSize
      const data = filtered.slice(start, start + pageSize)

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
  http.get('/jobs/:jobId', async ({ params }) =>
    withLatency(async () => {
      const job = await db.jobs.get(String(params.jobId))
      if (!job) {
        return HttpResponse.json({ message: 'Job not found' }, { status: 404 })
      }
      return HttpResponse.json(job)
    })
  ),
  http.post('/jobs', async ({ request }) =>
    withLatency(async () => {
      if (shouldFailWrite()) {
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 500 })
      }
      const payload = (await request.json()) as Partial<Job>
      const title = payload.title?.trim()
      if (!title) {
        return HttpResponse.json({ message: 'Title is required' }, { status: 422 })
      }
      const baseSlug = slugify(title)
      const existingSlug = await db.jobs.where('slug').equals(baseSlug).first()
      if (existingSlug) {
        return HttpResponse.json({ message: 'Slug already exists' }, { status: 422 })
      }
      const now = new Date().toISOString()
      const order = await db.jobs.count()
      const newJob: Job = {
        id: createId('job'),
        title,
        slug: baseSlug,
        status: 'active',
        tags: payload.tags ?? [],
        order,
        description: payload.description ?? '',
        openings: payload.openings ?? 1,
        createdAt: now,
        updatedAt: now
      }
      await db.jobs.add(newJob)
      return HttpResponse.json(newJob, { status: 201 })
    })
  ),
  http.patch('/jobs/:jobId', async ({ params, request }) =>
    withLatency(async () => {
      if (shouldFailWrite()) {
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 500 })
      }
      const jobId = String(params.jobId)
      const existing = await db.jobs.get(jobId)
      if (!existing) {
        return HttpResponse.json({ message: 'Job not found' }, { status: 404 })
      }
      const updates = (await request.json()) as Partial<Job>
      if (updates.title) {
        updates.title = updates.title.trim()
      }
      if (updates.title && updates.title !== existing.title) {
        const newSlug = slugify(updates.title)
        const conflict = await db.jobs.where('slug').equals(newSlug).first()
        if (conflict && conflict.id !== jobId) {
          return HttpResponse.json({ message: 'Slug already exists' }, { status: 422 })
        }
        updates.slug = newSlug
      }
      const updated: Job = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      await db.jobs.put(updated)
      return HttpResponse.json(updated)
    })
  ),
  http.patch('/jobs/:jobId/reorder', async ({ params, request }) =>
    withLatency(async () => {
      if (shouldFailWrite()) {
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 500 })
      }
      const jobId = String(params.jobId)
      const body = (await request.json()) as { fromOrder: number; toOrder: number }
      const allJobs = await db.jobs.orderBy('order').toArray()
      const targetIndex = allJobs.findIndex((job) => job.id === jobId)
      if (targetIndex === -1) {
        return HttpResponse.json({ message: 'Job not found' }, { status: 404 })
      }
      const [movingJob] = allJobs.splice(targetIndex, 1)
      allJobs.splice(body.toOrder, 0, movingJob)
      await Promise.all(
        allJobs.map((job, index) => db.jobs.update(job.id, { order: index, updatedAt: new Date().toISOString() }))
      )
      return HttpResponse.json({ success: true })
    })
  ),
  http.post('/jobs/:jobId/archive', async ({ params }) =>
    withLatency(async () => {
      if (shouldFailWrite()) {
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 500 })
      }
      const jobId = String(params.jobId)
      const job = await db.jobs.get(jobId)
      if (!job) {
        return HttpResponse.json({ message: 'Job not found' }, { status: 404 })
      }
      const updated: Job = {
        ...job,
        status: job.status === 'archived' ? 'active' : 'archived',
        updatedAt: new Date().toISOString()
      }
      await db.jobs.put(updated)
      return HttpResponse.json(updated)
    })
  )
]

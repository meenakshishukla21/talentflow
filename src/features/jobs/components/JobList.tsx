import { Link } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState } from 'react'
import type { Job } from '../../../types/data'

export type JobListProps = {
  jobs: Job[]
  onReorder: (jobs: Job[]) => void
  onCommitReorder: (jobId: string, fromIndex: number, toIndex: number) => Promise<void>
  onReorderError?: (error: unknown) => void
  onEdit: (job: Job) => void
  onArchive: (job: Job) => void
}

function JobCard({ job, dragging, onEdit, onArchive }: { job: Job; dragging?: boolean; onEdit: (job: Job) => void; onArchive: (job: Job) => void }) {
  return (
    <div
      className="board-card"
      style={{
        opacity: dragging ? 0.6 : 1,
        cursor: 'grab',
        border: job.status === 'archived' ? '1px dashed rgba(148, 163, 184, 0.7)' : undefined
      }}
    >
      <div className="flex-between">
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>{job.title}</h3>
          <div className="muted" style={{ fontSize: '13px' }}>Slug: {job.slug}</div>
        </div>
        <span
          className="badge"
          style={{
            background: job.status === 'active' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(148, 163, 184, 0.2)',
            color: job.status === 'active' ? '#166534' : '#475569'
          }}
        >
          {job.status === 'active' ? 'Active' : 'Archived'}
        </span>
      </div>
      <p className="muted" style={{ margin: '12px 0', fontSize: '14px' }}>{job.description || 'No description yet.'}</p>
      <div className="flex-between" style={{ alignItems: 'flex-end' }}>
        <div className="flex-wrap">
          {job.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex" style={{ gap: '8px' }}>
          <Link className="btn btn-secondary" to={`/jobs/${job.id}`}>
            View
          </Link>
          <button className="btn btn-secondary" type="button" onClick={() => onEdit(job)}>
            Edit
          </button>
          <button className="btn btn-primary" type="button" onClick={() => onArchive(job)}>
            {job.status === 'archived' ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SortableJobCard({ job, onEdit, onArchive }: { job: Job; onEdit: (job: Job) => void; onArchive: (job: Job) => void }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: job.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard job={job} dragging={isDragging} onEdit={onEdit} onArchive={onArchive} />
    </div>
  )
}

function JobList({ jobs, onReorder, onCommitReorder, onReorderError, onEdit, onArchive }: JobListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }))
  const [activeId, setActiveId] = useState<string | null>(null)
  const items = useMemo(() => jobs.map((job) => job.id), [jobs])
  const activeJob = jobs.find((job) => job.id === activeId)

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const oldIndex = jobs.findIndex((job) => job.id === active.id)
    const newIndex = jobs.findIndex((job) => job.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(jobs, oldIndex, newIndex)
    onReorder(reordered)
    try {
      await onCommitReorder(String(active.id), oldIndex, newIndex)
    } catch (error) {
      onReorder(arrayMove(reordered, newIndex, oldIndex))
      onReorderError?.(error)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => setActiveId(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="grid" style={{ gap: '16px' }}>
          {jobs.map((job) => (
            <SortableJobCard key={job.id} job={job} onEdit={onEdit} onArchive={onArchive} />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeJob ? <JobCard job={activeJob} dragging onEdit={onEdit} onArchive={onArchive} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

export default JobList

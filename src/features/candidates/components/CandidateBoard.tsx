import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Candidate, CandidateStage } from '../../../types/data'
import { stageLabel } from '../hooks/useCandidates'

type CandidateBoardProps = {
  data: Record<CandidateStage, Candidate[]>
  onStageChange: (candidateId: string, toStage: CandidateStage) => Promise<void>
  onStageChangeError?: (error: unknown) => void
}

const boardStages: CandidateStage[] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

type ColumnMap = Record<CandidateStage, Candidate[]>

function cloneColumns(data: ColumnMap): ColumnMap {
  return boardStages.reduce((acc, stage) => {
    acc[stage] = [...(data[stage] ?? [])]
    return acc
  }, {} as ColumnMap)
}

function CandidateCard({ candidate, dragging }: { candidate: Candidate; dragging?: boolean }) {
  return (
    <div
      className="board-card"
      style={{
        opacity: dragging ? 0.5 : 1,
        cursor: 'grab',
        padding: '12px 14px',
        border: `1px solid ${candidate.avatarColor}`
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ fontWeight: 600 }}>{candidate.name}</div>
        <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#1d4ed8' }}>
          {stageLabel(candidate.stage)}
        </span>
      </div>
      <div className="muted" style={{ fontSize: '13px' }}>{candidate.email}</div>
    </div>
  )
}

function DroppableColumn({ stage, children, count }: { stage: CandidateStage; children: ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, data: { stage } })
  return (
    <div
      ref={setNodeRef}
      className="board-column"
      style={{
        border: isOver ? '2px dashed rgba(37, 99, 235, 0.35)' : undefined,
        transition: 'border 0.2s ease'
      }}
    >
      <div className="board-column-header">
        <strong style={{ textTransform: 'capitalize' }}>{stageLabel(stage)}</strong>
        <span className="muted">{count}</span>
      </div>
      {children}
    </div>
  )
}

function SortableCandidate({ stage, candidate }: { stage: CandidateStage; candidate: Candidate }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: candidate.id,
    data: { stage }
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CandidateCard candidate={candidate} dragging={isDragging} />
    </div>
  )
}

function CandidateBoard({ data, onStageChange, onStageChangeError }: CandidateBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }))
  const [columns, setColumns] = useState<ColumnMap>(() => cloneColumns(data))
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setColumns(cloneColumns(data))
  }, [data])

  const activeCandidate = useMemo(() => {
    if (!activeId) return undefined
    for (const stage of boardStages) {
      const candidate = columns[stage]?.find((item) => item.id === activeId)
      if (candidate) return candidate
    }
    return undefined
  }, [activeId, columns])

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const originStage = active.data.current?.stage as CandidateStage | undefined
    const destinationStage = over.data.current?.stage as CandidateStage | undefined
    const fallbackStage = destinationStage
      ?? ((): CandidateStage | undefined => {
        if (typeof over.id === 'string') {
          return boardStages.find((stage) => columns[stage]?.some((candidate) => candidate.id === over.id))
        }
        return undefined
      })()
    if (!originStage || !fallbackStage || originStage === fallbackStage) {
      return
    }

    const originList = columns[originStage] ?? []
    const destinationList = columns[fallbackStage] ?? []
    const movingCandidate = originList.find((candidate) => candidate.id === active.id)
    if (!movingCandidate) return

    const updatedOrigin = originList.filter((candidate) => candidate.id !== active.id)
    const updatedDestination = [{ ...movingCandidate, stage: fallbackStage }, ...destinationList]

    setColumns((current: ColumnMap) => ({
      ...current,
      [originStage]: updatedOrigin,
      [fallbackStage]: updatedDestination
    }))

    try {
      await onStageChange(String(active.id), fallbackStage)
    } catch (error) {
      setColumns(cloneColumns(data))
      onStageChangeError?.(error)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => setActiveId(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="board-columns">
        {boardStages.map((stage) => (
          <DroppableColumn key={stage} stage={stage} count={columns[stage]?.length ?? 0}>
            <SortableContext items={(columns[stage] ?? []).map((candidate) => candidate.id)} strategy={verticalListSortingStrategy}>
              <div className="grid" style={{ gap: '12px' }}>
                {(columns[stage] ?? []).slice(0, 15).map((candidate) => (
                  <SortableCandidate key={candidate.id} stage={stage} candidate={candidate} />
                ))}
              </div>
            </SortableContext>
          </DroppableColumn>
        ))}
      </div>
      <DragOverlay>
        {activeCandidate ? <CandidateCard candidate={activeCandidate} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

export default CandidateBoard

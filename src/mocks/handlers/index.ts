import { assessmentHandlers } from './assessments'
import { candidateHandlers } from './candidates'
import { jobHandlers } from './jobs'

export const handlers = [...jobHandlers, ...candidateHandlers, ...assessmentHandlers]

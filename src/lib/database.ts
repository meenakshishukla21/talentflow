import Dexie, { type Table } from 'dexie'
import type {
  Assessment,
  AssessmentQuestion,
  AssessmentResponse,
  Candidate,
  CandidateNote,
  CandidateStage,
  CandidateTimelineEvent,
  Job
} from '../types/data'
import { createId } from '../utils/id'
import {
  randomEmail,
  randomHexColor,
  randomInt,
  randomJobTitle,
  randomName,
  randomPhone,
  randomTags
} from '../utils/random'
import { slugify } from '../utils/slug'

export class TalentflowDatabase extends Dexie {
  jobs!: Table<Job, string>
  candidates!: Table<Candidate, string>
  candidateTimelines!: Table<CandidateTimelineEvent, string>
  assessments!: Table<Assessment, string>
  assessmentResponses!: Table<AssessmentResponse, string>
  notes!: Table<CandidateNote, string>
}

export const db = new TalentflowDatabase('talentflow-db')

db.version(1).stores({
  jobs: 'id, slug, status, order',
  candidates: 'id, jobId, stage',
  candidateTimelines: 'id, candidateId',
  assessments: 'jobId',
  assessmentResponses: 'id, jobId, candidateId',
  notes: 'id, candidateId'
})

const stages: CandidateStage[] = [
  'applied',
  'screen',
  'tech',
  'offer',
  'hired',
  'rejected'
]

const mentionAuthors = ['Alex Rivera', 'Priya Desai', 'Morgan Lee', 'Sam Parker', 'Taylor Chen']

function buildAssessment(index: number, jobId: string): Assessment {
  const templates: AssessmentQuestion[][] = [
    [
      {
        id: createId('q'),
        type: 'singleChoice',
        prompt: 'How many years of professional experience do you have with React?',
        required: true,
        options: ['0-1', '2-3', '4-5', '6+']
      },
      {
        id: createId('q'),
        type: 'shortText',
        prompt: 'Describe a challenging frontend performance issue you solved.',
        required: true,
        maxLength: 280
      },
      {
        id: createId('q'),
        type: 'numeric',
        prompt: 'How many people have you mentored directly?',
        required: false,
        min: 0,
        max: 50
      },
      {
        id: createId('q'),
        type: 'multiChoice',
        prompt: 'Which build tools have you used in production?',
        required: true,
        options: ['Webpack', 'Vite', 'Rollup', 'Parcel', 'ESBuild'],
        maxSelections: 3
      },
      {
        id: createId('q'),
        type: 'longText',
        prompt: 'Share a system design you are proud of.',
        required: true
      },
      {
        id: createId('q'),
        type: 'singleChoice',
        prompt: 'Are you comfortable working across time zones?',
        required: true,
        options: ['Yes', 'No']
      },
      {
        id: createId('q'),
        type: 'shortText',
        prompt: 'If you answered yes above, describe your strategy for async collaboration.',
        required: false,
        conditional: {
          sourceQuestionId: '',
          expectedValue: 'Yes'
        },
        maxLength: 200
      },
      {
        id: createId('q'),
        type: 'file',
        prompt: 'Upload a portfolio or case study (link placeholder).',
        required: false
      },
      {
        id: createId('q'),
        type: 'singleChoice',
        prompt: 'Are you legally authorized to work in the hiring region?',
        required: true,
        options: ['Yes', 'No']
      },
      {
        id: createId('q'),
        type: 'numeric',
        prompt: 'Preferred team size.',
        required: false,
        min: 1,
        max: 20
      }
    ],
    [
      {
        id: createId('q'),
        type: 'singleChoice',
        prompt: 'How comfortable are you with stakeholder communication?',
        required: true,
        options: ['Beginner', 'Intermediate', 'Advanced']
      },
      {
        id: createId('q'),
        type: 'longText',
        prompt: 'Walk through a time you managed conflicting priorities.',
        required: true
      },
      {
        id: createId('q'),
        type: 'multiChoice',
        prompt: 'Select the frameworks you have launched products with.',
        required: true,
        options: ['Scrum', 'Kanban', 'Dual Track Agile', 'Shape Up'],
        maxSelections: 2
      },
      {
        id: createId('q'),
        type: 'shortText',
        prompt: 'What is your biggest product intuition win?',
        required: true,
        maxLength: 220
      },
      {
        id: createId('q'),
        type: 'numeric',
        prompt: 'How many product launches have you led?',
        required: true,
        min: 0,
        max: 50
      },
      {
        id: createId('q'),
        type: 'singleChoice',
        prompt: 'Do you have experience with P&L ownership?',
        required: true,
        options: ['Yes', 'No']
      },
      {
        id: createId('q'),
        type: 'shortText',
        prompt: 'If yes, describe the scope of the P&L you managed.',
        required: false,
        conditional: {
          sourceQuestionId: '',
          expectedValue: 'Yes'
        }
      },
      {
        id: createId('q'),
        type: 'multiChoice',
        prompt: 'Which tools have you used for roadmap planning?',
        required: true,
        options: ['Jira', 'Linear', 'Aha!', 'Productboard', 'Notion'],
        maxSelections: 3
      },
      {
        id: createId('q'),
        type: 'longText',
        prompt: 'Describe how you measure feature success.',
        required: true
      },
      {
        id: createId('q'),
        type: 'singleChoice',
        prompt: 'Are you comfortable working with technical teams?',
        required: true,
        options: ['Yes', 'No']
      }
    ],
    [
      {
        id: createId('q'),
        type: 'shortText',
        prompt: 'What data stack do you currently use?',
        required: true
      },
      {
        id: createId('q'),
        type: 'singleChoice',
        prompt: 'Do you productionize models?',
        required: true,
        options: ['Yes', 'No']
      },
      {
        id: createId('q'),
        type: 'multiChoice',
        prompt: 'Choose the cloud platforms you have deployed on.',
        required: true,
        options: ['AWS', 'GCP', 'Azure', 'DigitalOcean'],
        maxSelections: 3
      },
      {
        id: createId('q'),
        type: 'numeric',
        prompt: 'Number of experiments you ran last quarter.',
        required: false,
        min: 0,
        max: 100
      },
      {
        id: createId('q'),
        type: 'longText',
        prompt: 'Tell us about a surprising insight from your data work.',
        required: true
      },
      {
        id: createId('q'),
        type: 'singleChoice',
        prompt: 'Do you work with BI stakeholders regularly?',
        required: true,
        options: ['Yes', 'No']
      },
      {
        id: createId('q'),
        type: 'shortText',
        prompt: 'If yes, how do you align deliverables?',
        required: false,
        conditional: {
          sourceQuestionId: '',
          expectedValue: 'Yes'
        }
      },
      {
        id: createId('q'),
        type: 'multiChoice',
        prompt: 'What analytics tools have you configured?',
        required: true,
        options: ['Looker', 'Tableau', 'PowerBI', 'Metabase', 'Mode'],
        maxSelections: 3
      },
      {
        id: createId('q'),
        type: 'file',
        prompt: 'Upload a dashboard export or share a link placeholder.',
        required: false
      },
      {
        id: createId('q'),
        type: 'longText',
        prompt: 'Describe a model you would revisit with more time.',
        required: true
      }
    ]
  ]

  const questions = templates[index % templates.length]
  const sectionId = createId('section')
  const withConditionals = questions.map((question, questionIndex) => {
    if (!question.conditional) {
      return question
    }
    const previousQuestion = questions[questionIndex - 1]
    return {
      ...question,
      conditional: previousQuestion
        ? {
            ...question.conditional,
            sourceQuestionId: previousQuestion.id
          }
        : undefined
    }
  })

  return {
    jobId,
    sections: [
      {
        id: sectionId,
        title: 'Core Fit',
        description: 'Evaluate alignment and experience across focus areas.',
        questions: withConditionals
      }
    ],
    updatedAt: new Date().toISOString()
  }
}

export async function ensureSeedData(): Promise<void> {
  const hasJobs = await db.jobs.count()
  if (hasJobs > 0) {
    return
  }

  await db.transaction('rw', [db.jobs, db.candidates, db.candidateTimelines, db.assessments, db.notes], async () => {
    const now = new Date()
    const jobs: Job[] = []
    const candidates: Candidate[] = []
    const timelines: CandidateTimelineEvent[] = []
    const notes: CandidateNote[] = []
    const assessments: Assessment[] = []

    for (let i = 0; i < 25; i += 1) {
      const title = `${randomJobTitle()} ${i + 1}`
      const id = createId('job')
      const order = i
      const status = i % 5 === 0 ? 'archived' : 'active'
      const job: Job = {
        id,
        title,
        slug: `${slugify(title)}-${i + 1}`,
        status,
        tags: randomTags(),
        order,
        description: `We are hiring a ${title} to join our growing team and solve complex business challenges.`,
        openings: randomInt(1, 4),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
      jobs.push(job)
      assessments.push(buildAssessment(i, id))
    }

    const totalCandidates = 1000
    const stageDistribution: Record<CandidateStage, number> = {
      applied: 0,
      screen: 0,
      tech: 0,
      offer: 0,
      hired: 0,
      rejected: 0
    }

    for (let i = 0; i < totalCandidates; i += 1) {
      const candidateId = createId('cand')
      const job = jobs[i % jobs.length]
      const name = randomName()
      const stage = stages[randomInt(0, stages.length - 1)]
      stageDistribution[stage] += 1
      const appliedAt = new Date(now.getTime() - randomInt(1, 45) * 86400000)
      const candidate: Candidate = {
        id: candidateId,
        jobId: job.id,
        name,
        email: randomEmail(name),
        stage,
        appliedAt: appliedAt.toISOString(),
        avatarColor: randomHexColor(),
        phone: randomPhone()
      }
      candidates.push(candidate)

      const historyStages = stages.slice(0, stages.indexOf(stage) + 1)
      historyStages.forEach((historyStage, historyIndex) => {
        const changedAt = new Date(appliedAt.getTime() + historyIndex * 86400000)
        timelines.push({
          id: createId('timeline'),
          candidateId,
          stage: historyStage,
          changedAt: changedAt.toISOString(),
          note: historyIndex === historyStages.length - 1 ? `Moved to ${historyStage}` : undefined
        })
      })

      if (i % 4 === 0) {
        notes.push({
          id: createId('note'),
          candidateId,
          author: randomName(),
          content: `@${mentionAuthors[randomInt(0, mentionAuthors.length - 1)]} please review portfolio before the next round.`,
          createdAt: new Date(appliedAt.getTime() + 3 * 86400000).toISOString()
        })
      }
    }

    await Promise.all([
      db.jobs.bulkAdd(jobs),
      db.candidates.bulkAdd(candidates),
      db.candidateTimelines.bulkAdd(timelines),
      db.assessments.bulkAdd(assessments),
      db.notes.bulkAdd(notes)
    ])
  })
}

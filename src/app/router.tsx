import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import JobsPage from '../features/jobs/pages/JobsPage'
import JobDetailPage from '../features/jobs/pages/JobDetailPage'
import CandidateListPage from '../features/candidates/pages/CandidateListPage'
import CandidateProfilePage from '../features/candidates/pages/CandidateProfilePage'
import AssessmentsOverviewPage from '../features/assessments/pages/AssessmentsOverviewPage'
import AssessmentBuilderPage from '../features/assessments/pages/AssessmentBuilderPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/jobs" replace />
      },
      {
        path: 'jobs',
        element: <JobsPage />
      },
      {
        path: 'jobs/:jobId',
        element: <JobDetailPage />
      },
      {
        path: 'candidates',
        element: <CandidateListPage />
      },
      {
        path: 'candidates/:candidateId',
        element: <CandidateProfilePage />
      },
      {
        path: 'assessments',
        element: <AssessmentsOverviewPage />
      },
      {
        path: 'assessments/:jobId',
        element: <AssessmentBuilderPage />
      }
    ]
  }
])

import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import ErrorPage from './ErrorPage'
import NotFoundPage from './pages/NotFoundPage'
import JobsPage from '../features/jobs/pages/JobsPage'
import JobDetailPage from '../features/jobs/pages/JobDetailPage'
import CandidateListPage from '../features/candidates/pages/CandidateListPage'
import CandidateProfilePage from '../features/candidates/pages/CandidateProfilePage'
import AssessmentsOverviewPage from '../features/assessments/pages/AssessmentsOverviewPage'
import AssessmentBuilderPage from '../features/assessments/pages/AssessmentBuilderPage'

const baseName = import.meta.env.BASE_URL.replace(/\/$/, '')

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      errorElement: <ErrorPage />,
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
        },
        {
          path: '*',
          element: <NotFoundPage />
        }
      ]
    }
  ],
  {
    basename: baseName
  }
)

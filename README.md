# Talentflow – React Front-End Assessment

Talentflow is a front-end only hiring platform built with React, Vite, TypeScript, TanStack Query, and MSW. It simulates a full hiring workflow without a real backend by persisting data locally via IndexedDB (Dexie) and exposing a REST-like interface through MSW handlers.

## Features

- **Jobs management** – Paginated, filterable job board with drag-and-drop ordering, optimistic reorder rollback, archive toggle, and modal-based creation/editing with validation.
- **Candidate workspace** – Virtualized candidate directory with stage filters, search, add-candidate form, and a kanban board that supports stage transitions with optimistic updates and timeline logging.
- **Candidate profiles** – Detailed profile route showing contact info, stage control, status timeline, and collaborative notes with @mention helpers.
- **Assessments** – Section-based assessment builder supporting choice/text/numeric/file prompts, conditional visibility, auto-save, live preview with validation, and local submission storage.
- **Routing & deep links** – React Router pages for jobs (`/jobs/:id`), candidates (`/candidates/:id`), and assessments (`/assessments/:jobId`).
- **Robust mock API** – MSW layer with artificial latency and error rate, backed by Dexie for read/write persistence and seeded with 25 jobs, 1000 candidates, and rich assessments.

## Getting Started

```bash
npm install
npm run dev
```

This launches the Vite dev server and the MSW worker. All data persists in IndexedDB, so the app state survives refreshes. To reset the dataset, clear the browser storage for the site.

## Available Scripts

| Command           | Description                                     |
|-------------------|-------------------------------------------------|
| `npm run dev`     | Start Vite dev server with MSW worker           |
| `npm run build`   | Type-check and produce production build         |
| `npm run preview` | Preview the production bundle locally           |
| `npm run lint`    | Run ESLint over the project                     |

## Project Structure

```
src/
  app/            React Query + router wiring
  features/
    jobs/         Jobs board, detail, hooks, components
    candidates/   Candidate list, profile, kanban, notes
    assessments/  Builder, preview, API hooks
  lib/            Dexie database, API client utilities
  mocks/          MSW handlers & worker configuration
  types/          Shared data model definitions
  utils/          Helpers for ids, random data, slugs
```

## Mock API & Persistence

- **Dexie** keeps all entities (`jobs`, `candidates`, timelines, assessments, responses, notes) in IndexedDB.
- **MSW** exposes REST-like endpoints with 200–1200 ms latency and 8% failure rate on mutating routes to stress-test optimistic updates.
- Seed data includes 25 jobs (mixed statuses), 1,000 candidates with timelines and notes, and three assessment templates with 10+ questions each.

## Key Implementation Details

- **Optimistic interactions** – Drag reorder and kanban moves update UI immediately and rollback on MSW error responses.
- **Virtualized directory** – A lightweight custom virtualization layer renders only visible candidate cards for smooth scrolling through 1,000+ records.
- **Conditional assessments** – Questions can depend on prior answers; preview form enforces required, max length, numeric range, and multi-select constraints.
- **Local collaboration** – Candidate notes support inline @mentions with quick insert buttons and highlight rendering.

## Deployment Notes

The production bundle can be hosted on any static host. Ensure the generated `public/mockServiceWorker.js` file is deployed alongside the app so MSW can intercept requests in production mode.

## Tooling

- React 19 + TypeScript + Vite 7
- TanStack Query for client-side caching and mutations
- MSW for API mocking
- Dexie for IndexedDB persistence
- @dnd-kit for drag-and-drop interactions


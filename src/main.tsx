import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { queryClient } from './app/queryClient'
import { ensureSeedData } from './lib/database'
import './index.css'

async function prepare(): Promise<void> {
  await ensureSeedData()
  if (typeof window !== 'undefined') {
    const { worker } = await import('./mocks/browser')
    const workerUrl = `${import.meta.env.BASE_URL}mockServiceWorker.js`
    await worker.start({
      serviceWorker: {
        url: workerUrl
      },
      onUnhandledRequest: 'bypass'
    })
  }
}

prepare().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  )
})

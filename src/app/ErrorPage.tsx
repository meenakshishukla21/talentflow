import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

function ErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div className="card" style={{ maxWidth: '520px', margin: '60px auto' }}>
        <h1 className="page-title" style={{ marginTop: 0 }}>Oops, something went wrong.</h1>
        <p className="muted">
          {error.status === 404
            ? 'We could not find the page you were looking for.'
            : 'The application hit an unexpected error.'}
        </p>
        {error.statusText ? <pre style={{ background: '#f1f5f9', padding: '12px', borderRadius: '10px' }}>{error.statusText}</pre> : null}
        <div style={{ marginTop: '24px' }}>
          <Link className="btn btn-primary" to="/">
            Return home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ maxWidth: '520px', margin: '60px auto' }}>
      <h1 className="page-title" style={{ marginTop: 0 }}>Unexpected error</h1>
      <p className="muted">An unexpected issue occurred. Head back to safety and try again.</p>
      <div style={{ marginTop: '24px' }}>
        <Link className="btn btn-primary" to="/">
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}

export default ErrorPage

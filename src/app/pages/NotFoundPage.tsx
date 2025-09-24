import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="card" style={{ maxWidth: '520px', margin: '60px auto' }}>
      <h1 className="page-title" style={{ marginTop: 0 }}>Page not found</h1>
      <p className="muted">The route you tried to visit does not exist. Choose a destination below.</p>
      <div className="grid" style={{ gap: '12px', marginTop: '24px' }}>
        <Link className="btn btn-primary" to="/jobs">
          Jobs board
        </Link>
        <Link className="btn btn-secondary" to="/candidates">
          Candidates
        </Link>
        <Link className="btn btn-secondary" to="/assessments">
          Assessments
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage

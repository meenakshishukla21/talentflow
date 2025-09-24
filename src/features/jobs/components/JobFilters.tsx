import type { JobFilters } from '../api/jobsApi'

type JobFiltersProps = {
  filters: JobFilters
  onChange: (next: JobFilters) => void
  availableTags: string[]
}

function JobFiltersPanel({ filters, onChange, availableTags }: JobFiltersProps) {
  const handleInput = (key: keyof JobFilters, value: string | number | string[]) => {
    onChange({
      ...filters,
      [key]: value
    })
  }

  const toggleTag = (tag: string) => {
    const alreadySelected = filters.tags?.includes(tag)
    if (alreadySelected) {
      handleInput(
        'tags',
        (filters.tags ?? []).filter((item) => item !== tag)
      )
    } else {
      handleInput('tags', [...(filters.tags ?? []), tag])
    }
  }

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="form-row">
          <label className="label" htmlFor="job-search">
            Search
          </label>
          <input
            id="job-search"
            className="input"
            placeholder="Search title or slug"
            value={filters.search ?? ''}
            onChange={(event) => handleInput('search', event.target.value)}
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="job-status">
            Status
          </label>
          <select
            id="job-status"
            className="select"
            value={filters.status ?? ''}
            onChange={(event) => handleInput('status', event.target.value)}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="form-row">
          <label className="label" htmlFor="job-sort">
            Sort
          </label>
          <select
            id="job-sort"
            className="select"
            value={filters.sort ?? 'order'}
            onChange={(event) => handleInput('sort', event.target.value)}
          >
            <option value="order">Manual order</option>
            <option value="createdAt">Newest</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: '16px' }}>
        <span className="label">Tags</span>
        <div className="flex-wrap" style={{ marginTop: '10px' }}>
          {availableTags.map((tag) => {
            const selected = filters.tags?.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                className="btn"
                style={{
                  background: selected ? 'rgba(37, 99, 235, 0.15)' : 'rgba(15, 23, 42, 0.04)',
                  color: selected ? 'var(--primary)' : 'var(--muted)',
                  borderColor: selected ? 'var(--primary)' : 'transparent'
                }}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default JobFiltersPanel

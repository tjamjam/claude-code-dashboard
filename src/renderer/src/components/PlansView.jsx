import { useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function PlansView() {
  const { data, loading } = useApi('/plans');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  if (loading) return <div className="loading">Loading</div>;
  if (!data?.length) return (
    <div>
      <div className="section-header">
        <h1>Plans</h1>
        <p>No plans found</p>
      </div>
    </div>
  );

  const filtered = data.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.content?.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div className="detail-view">
        <div className="detail-header">
          <button className="btn-back" onClick={() => setSelected(null)}>
            &larr; Back
          </button>
          <h2>{selected.title}</h2>
        </div>
        <div className="detail-meta">
          <div className="detail-meta-item">
            <span className="label">File:</span>
            <span className="value">{selected.file}</span>
          </div>
        </div>
        <div className="detail-body">
          <pre>{selected.content}</pre>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h1>Plans</h1>
        <p>{filtered.length} plan{filtered.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search plans..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="card-grid">
        {filtered.map(plan => {
          const preview = plan.content?.slice(0, 150).replace(/^#+\s.*\n/, '').trim();
          return (
            <div key={plan.id} className="card" onClick={() => setSelected(plan)}>
              <h3>{plan.title}</h3>
              <p>{preview || 'Empty plan'}</p>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="empty-state">No plans match your search</div>}
    </div>
  );
}

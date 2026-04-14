import { useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function CommandsView() {
  const { data, loading } = useApi('/commands');
  const [selected, setSelected] = useState(null);

  if (loading) return <div className="loading">Loading</div>;
  if (!data?.length) return (
    <div>
      <div className="section-header">
        <h1>Commands</h1>
        <p>No commands found</p>
      </div>
    </div>
  );

  if (selected) {
    return (
      <div className="detail-view">
        <div className="detail-header">
          <button className="btn-back" onClick={() => setSelected(null)}>
            &larr; Back
          </button>
          <h2>/{selected.name}</h2>
        </div>
        <div className="detail-meta">
          <div className="detail-meta-item">
            <span className="label">Files:</span>
            <span className="value">{selected.files.join(', ')}</span>
          </div>
        </div>
        <div className="detail-body">
          <pre>{selected.content || 'No content'}</pre>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h1>Commands</h1>
        <p>{data.length} command{data.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="card-grid">
        {data.map(cmd => {
          const preview = cmd.content?.slice(0, 120).trim();
          return (
            <div key={cmd.id} className="card" onClick={() => setSelected(cmd)}>
              <h3>/{cmd.name}</h3>
              <p>{preview || 'No content'}</p>
              <div className="card-meta">
                {cmd.files.map(f => (
                  <span key={f} className="badge muted">{f}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function AgentsView() {
  const { data, loading } = useApi('/agents');
  const [selected, setSelected] = useState(null);

  if (loading) return <div className="loading">Loading</div>;
  if (!data?.length) return (
    <div>
      <div className="section-header">
        <h1>Agents</h1>
        <p>No agent definitions found</p>
      </div>
    </div>
  );

  if (selected) {
    const fm = selected.frontmatter || {};
    return (
      <div className="detail-view">
        <div className="detail-header">
          <button className="btn-back" onClick={() => setSelected(null)}>
            &larr; Back
          </button>
          <h2>{selected.name}</h2>
        </div>
        <div className="detail-meta">
          {fm.model && (
            <div className="detail-meta-item">
              <span className="label">Model:</span>
              <span className="value">{fm.model}</span>
            </div>
          )}
          {fm.description && (
            <div className="detail-meta-item">
              <span className="label">Description:</span>
              <span className="value">{fm.description}</span>
            </div>
          )}
          {fm.tools && (
            <div className="detail-meta-item">
              <span className="label">Tools:</span>
              <span className="value">
                {Array.isArray(fm.tools) ? fm.tools.join(', ') : String(fm.tools)}
              </span>
            </div>
          )}
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
        <h1>Agents</h1>
        <p>{data.length} agent definition{data.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="card-grid">
        {data.map(agent => (
          <div key={agent.id} className="card" onClick={() => setSelected(agent)}>
            <h3>{agent.name}</h3>
            <p>{agent.frontmatter?.description || 'No description'}</p>
            <div className="card-meta">
              {agent.frontmatter?.model && (
                <span className="badge">{agent.frontmatter.model}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function MemoryView() {
  const { data, loading, error } = useApi('/memory');
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  if (loading) return <div className="loading">Loading</div>;
  if (error) return <div className="loading">Failed to load memory</div>;
  if (!data?.length) return (
    <div>
      <div className="section-header">
        <h1>Memory</h1>
        <p>No project memories found</p>
      </div>
    </div>
  );

  const filtered = data.filter(p =>
    p.displayPath.toLowerCase().includes(search.toLowerCase()) ||
    p.memories.some(m =>
      m.frontmatter?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.frontmatter?.description?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      <div className="section-header">
        <h1>Memory</h1>
        <p>{data.length} project{data.length !== 1 ? 's' : ''} with stored memory</p>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search projects and memories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search projects and memories"
        />
      </div>
      {filtered.map(project => (
        <div key={project.id} className="project-group">
          <div
            className="project-header"
            onClick={() => setExpanded(expanded === project.id ? null : project.id)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(expanded === project.id ? null : project.id); } }}
            role="button"
            tabIndex={0}
            aria-expanded={expanded === project.id}
          >
            <h3>{project.displayPath}</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {project.hasMemory && (
                <span className="badge">
                  {project.memories.length} memor{project.memories.length !== 1 ? 'ies' : 'y'}
                </span>
              )}
              {project.hasClaude && <span className="badge muted">CLAUDE.md</span>}
              <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                {expanded === project.id ? '\u25B2' : '\u25BC'}
              </span>
            </div>
          </div>
          {expanded === project.id && (
            <div className="project-body">
              {project.memories.map(mem => (
                <div key={mem.id} className="memory-item">
                  <h4>{mem.frontmatter?.name || mem.file}</h4>
                  {mem.frontmatter?.type && (
                    <div className="memory-type">{mem.frontmatter.type}</div>
                  )}
                  {mem.frontmatter?.description && (
                    <p>{mem.frontmatter.description}</p>
                  )}
                  {mem.content && (
                    <pre style={{
                      fontSize: '12px',
                      marginTop: '8px',
                      background: 'var(--bg)',
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {mem.content.trim()}
                    </pre>
                  )}
                </div>
              ))}
              {project.claudeMd && (
                <div className="memory-item">
                  <h4>CLAUDE.md</h4>
                  <pre style={{
                    fontSize: '12px',
                    marginTop: '8px',
                    background: 'var(--bg)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}>
                    {project.claudeMd.trim()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {filtered.length === 0 && <div className="empty-state">No projects match your search</div>}
    </div>
  );
}

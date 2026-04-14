import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import RepoItemsSection, { SectionDivider } from './RepoItemsSection';

function CommandCard({ cmd, onClick }) {
  const preview = cmd.content?.slice(0, 120).trim();
  return (
    <div className="card" onClick={onClick}>
      <h3>/{cmd.name}</h3>
      <p>{preview || 'No content'}</p>
      {cmd.files?.length > 0 && (
        <div className="card-meta">
          {cmd.files.map(f => (
            <span key={f} className="badge muted">{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommandsView() {
  const commands = useApi('/commands');
  const repos = useApi('/repos');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const loading = commands.loading || repos.loading;
  if (loading) return <div className="loading">Loading</div>;

  const globalCommands = commands.data || [];
  const q = search.toLowerCase();
  const filteredGlobal = globalCommands.filter(c =>
    !q || c.name.toLowerCase().includes(q) || c.content?.toLowerCase().includes(q)
  );
  const hasRepoCommands = (repos.data || []).some(r => r.commands?.length > 0);

  if (selected) {
    return (
      <div className="detail-view">
        <div className="detail-header">
          <button className="btn-back" onClick={() => setSelected(null)}>
            &larr; Back
          </button>
          <h2>/{selected.name}</h2>
        </div>
        {selected.files?.length > 0 && (
          <div className="detail-meta">
            <div className="detail-meta-item">
              <span className="label">Files:</span>
              <span className="value">{selected.files.join(', ')}</span>
            </div>
          </div>
        )}
        <div className="detail-body">
          <pre>{selected.content || 'No content'}</pre>
        </div>
      </div>
    );
  }

  const totalCount = globalCommands.length + (repos.data || []).reduce((n, r) => n + (r.commands?.length || 0), 0);

  return (
    <div>
      <div className="section-header">
        <h1>Commands</h1>
        <p>{totalCount} command{totalCount !== 1 ? 's' : ''} total</p>
      </div>

      {(globalCommands.length > 0 || hasRepoCommands) && (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search commands..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{
            background: 'rgba(139,92,246,0.07)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            marginBottom: 20,
            lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--text)' }}>Commands vs Skills — </strong>
            Commands are simple prompt templates stored in <code>.claude/commands/</code> and invoked with <code>/name</code>.
            Skills (in <code>.claude/skills/</code>) are structured workflows with metadata, versioning, and references.
            Both use <code>/name</code> to invoke, but skills are more powerful.
          </div>
        </>
      )}

      {globalCommands.length === 0 && !hasRepoCommands ? (
        <div className="empty-state">No commands found</div>
      ) : (
        <>
          {globalCommands.length > 0 && (
            <>
              {hasRepoCommands && <SectionDivider label="Global" />}
              <div className="card-grid">
                {filteredGlobal.map(cmd => (
                  <CommandCard key={cmd.id} cmd={cmd} onClick={() => setSelected(cmd)} />
                ))}
              </div>
            </>
          )}

          <RepoItemsSection
            repos={repos.data}
            getItems={r => r.commands || []}
            search={search}
            renderCard={(cmd, repo) => (
              <CommandCard
                key={`${repo.name}-${cmd.id}`}
                cmd={cmd}
                onClick={() => setSelected(cmd)}
              />
            )}
          />
        </>
      )}
    </div>
  );
}

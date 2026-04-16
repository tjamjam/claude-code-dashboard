import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

function repoSetupPrompt(repo) {
  return `I'm in the ${repo.name} repo at ${repo.path}. Analyze the codebase. Look at the languages used, project structure, package.json/Cargo.toml/etc., and recent git history. Then set up Claude Code for this project: create a CLAUDE.md with project-specific conventions and context, and if the project would benefit from custom skills or commands, create those too in .claude/skills/ or .claude/commands/.`;
}

function repoAuditPrompt(repo) {
  return `Audit the Claude Code setup for ${repo.name} at ${repo.path}. Review the existing CLAUDE.md, skills, commands, agents, and settings. Suggest what to add, update, or remove to make Claude more effective in this project.`;
}

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={`btn-copy${copied ? ' copied' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      style={{
        padding: '5px 12px',
        fontSize: 11.5,
        fontWeight: 600,
        borderRadius: 0,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

function ServerBadge({ server, onKill, onOpen }) {
  return (
    <div className="status-allowed" style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px',
      borderRadius: 'var(--radius-sm)',
    }}>
      <span className="server-dot" style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0 }} />
      <a
        href="#"
        onClick={e => { e.preventDefault(); e.stopPropagation(); onOpen(server.port); }}
        className="server-port"
        style={{
          fontSize: 12, fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        :{server.port}
      </a>
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{server.command}</span>
      <button
        className="btn-danger"
        onClick={e => { e.stopPropagation(); onKill(server.pid); }}
        style={{
          marginLeft: 'auto', padding: '2px 8px', fontSize: 11, fontWeight: 600,
          borderRadius: 0, cursor: 'pointer',
          transition: 'background 0.12s',
        }}
      >
        Stop
      </button>
    </div>
  );
}

function RepoDetail({ repo, servers, onKill, onOpen, onBack }) {
  const [tab, setTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    repo.claudeMd && { id: 'claudemd', label: 'CLAUDE.md' },
    repo.skills.length > 0 && { id: 'skills', label: `Skills (${repo.skills.length})` },
    repo.commands.length > 0 && { id: 'commands', label: `Commands (${repo.commands.length})` },
    repo.agents.length > 0 && { id: 'agents', label: `Agents (${repo.agents.length})` },
    repo.rules.length > 0 && { id: 'rules', label: `Rules (${repo.rules.length})` },
    (repo.settings || repo.settingsLocal) && { id: 'settings', label: 'Settings' },
  ].filter(Boolean);

  return (
    <div className="detail-view">
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>&larr; Back</button>
        <h2>{repo.name}</h2>
      </div>

      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '8px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        overflowX: 'auto'
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: tab === t.id ? 'var(--bg-card)' : 'transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: '12.5px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: tab === t.id ? 'var(--shadow)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="detail-body">
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, flex: 1 }}>
                {repo.path}
              </p>
              <CopyButton text={`cd ${repo.path} && claude --dangerously-skip-permissions`} label="cd && claude --yolo" />
              <CopyButton text={repo.path} label="Copy path" />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {repo.configItems.map(item => (
                <span key={item} className="badge">{item}</span>
              ))}
              {!repo.hasConfig && (
                <span className="badge muted">No Claude configuration</span>
              )}
            </div>
            {repo.hooks && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>Hooks</h4>
                <pre>{JSON.stringify(repo.hooks, null, 2)}</pre>
              </div>
            )}
            {servers.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>Running Servers</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {servers.map(s => (
                    <ServerBadge key={`${s.pid}-${s.port}`} server={s} onKill={onKill} onOpen={onOpen} />
                  ))}
                </div>
              </div>
            )}
            <PromptCard
              title={repo.hasConfig ? 'Audit this repo\'s Claude setup' : `Set up Claude Code for ${repo.name}`}
              description={repo.hasConfig
                ? 'Ask Claude Code to review what\'s configured and suggest improvements.'
                : 'Ask Claude Code to analyze the codebase and create a CLAUDE.md, skills, and commands tailored to this project.'}
              prompt={repo.hasConfig ? repoAuditPrompt(repo) : repoSetupPrompt(repo)}
            />
          </div>
        )}

        {tab === 'claudemd' && repo.claudeMd && (
          <pre>{repo.claudeMd}</pre>
        )}

        {tab === 'skills' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {repo.skills.map(skill => (
              <div key={skill.id} style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600 }}>{skill.name}</h4>
                  {skill.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {skill.description}
                    </p>
                  )}
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <pre style={{ maxHeight: '300px' }}>{skill.content}</pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'commands' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {repo.commands.map(cmd => (
              <div key={cmd.id} style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600 }}>/{cmd.name}</h4>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <pre style={{ maxHeight: '300px' }}>{cmd.content}</pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'agents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {repo.agents.map(agent => (
              <div key={agent.id} style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600 }}>{agent.name}</h4>
                  {agent.frontmatter?.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {agent.frontmatter.description}
                    </p>
                  )}
                  <div className="card-meta" style={{ marginTop: '6px' }}>
                    {agent.frontmatter?.model && <span className="badge muted">{agent.frontmatter.model}</span>}
                  </div>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <pre style={{ maxHeight: '300px' }}>{agent.content}</pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'rules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {repo.rules.map(rule => (
              <div key={rule.id} style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600 }}>{rule.name}</h4>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <pre style={{ maxHeight: '300px' }}>{rule.content}</pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {repo.settings && (
              <div>
                <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>settings.json</h4>
                <pre>{JSON.stringify(repo.settings, null, 2)}</pre>
              </div>
            )}
            {repo.settingsLocal && (
              <div>
                <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>settings.local.json</h4>
                <pre>{JSON.stringify(repo.settingsLocal, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReposView() {
  const { data, loading, error, refetch } = useApi('/repos');
  const setupStatus = useApi('/setup/status');
  const servers = useApi('/dev-servers');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'configured' | 'vanilla'

  const reposDir = setupStatus.data?.reposDir || '~/Documents/GitHub';

  async function changeFolder() {
    const result = await window.api.invoke('/api/repos-dir/change');
    if (result.ok) {
      setupStatus.refetch(true);
      refetch();
    }
  }

  if (loading) return <div className="loading">Loading</div>;
  if (error) return <div className="loading">Failed to load repos</div>;
  if (!data?.length) return (
    <div>
      <div className="section-header">
        <h1>Repos</h1>
        <p>No repos found in this folder</p>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', marginBottom: 20,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flex: 1 }}>
          {reposDir}
        </span>
        <button onClick={changeFolder} className="btn-accent" style={{
          padding: '5px 14px', fontSize: 12, fontWeight: 600,
          borderRadius: 0, cursor: 'pointer',
        }}>
          Change folder
        </button>
      </div>
    </div>
  );

  // Group servers by repo path, deduplicate by port
  const serversByRepo = {};
  if (servers.data) {
    for (const s of servers.data) {
      if (!serversByRepo[s.repoPath]) serversByRepo[s.repoPath] = [];
      if (!serversByRepo[s.repoPath].some(e => e.port === s.port)) {
        serversByRepo[s.repoPath].push(s);
      }
    }
  }

  async function killServer(pid) {
    await window.api.invoke('/api/dev-servers/kill', { pid });
    setTimeout(() => servers.refetch(true), 500);
  }

  function openPort(port) {
    window.api.openExternal(`http://localhost:${port}`);
  }

  const filtered = data.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'configured' && r.hasConfig) ||
      (filter === 'vanilla' && !r.hasConfig);
    return matchesSearch && matchesFilter;
  });

  const configuredCount = data.filter(r => r.hasConfig).length;

  if (selected) {
    return (
      <RepoDetail
        repo={selected}
        servers={serversByRepo[selected.path] || []}
        onKill={killServer}
        onOpen={openPort}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <div className="section-header">
        <h1>Repos</h1>
        <p>{data.length} repo{data.length !== 1 ? 's' : ''}, {configuredCount} with Claude configuration</p>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', marginBottom: 16,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {reposDir}
        </span>
        <button onClick={changeFolder} className="btn-accent" style={{
          padding: '5px 14px', fontSize: 12, fontWeight: 600,
          borderRadius: 0, cursor: 'pointer', flexShrink: 0,
        }}>
          Change folder
        </button>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div className="search-bar" style={{ marginBottom: 0, flex: 1 }}>
          <input
            type="text"
            placeholder="Search repos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search repos"
          />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'configured', label: 'Configured' },
            { id: 'vanilla', label: 'Vanilla' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '7px 14px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: filter === f.id ? 'var(--accent)' : 'var(--bg-card)',
                color: filter === f.id ? '#fff' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card-grid">
        {filtered.map(repo => {
          const repoServers = serversByRepo[repo.path] || [];
          return (
            <div key={repo.name} className="card" onClick={() => setSelected(repo)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(repo); } }} role="button" tabIndex={0}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ flex: 1 }}>{repo.name}</h3>
                {repoServers.length > 0 && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {repoServers.map(s => (
                      <a
                        key={s.port}
                        href="#"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); openPort(s.port); }}
                        title={`${s.command} on port ${s.port} (PID ${s.pid})`}
                        className="server-port-badge"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 0, fontSize: 11, fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <span className="server-dot" style={{ width: 5, height: 5, borderRadius: '50%' }} />
                        :{s.port}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="card-meta" style={{ marginTop: '8px' }}>
                {repo.configItems.length > 0
                  ? repo.configItems.map(item => (
                      <span key={item} className="badge">{item}</span>
                    ))
                  : <span className="badge muted">No config</span>
                }
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="empty-state">No repos match your search</div>}
    </div>
  );
}

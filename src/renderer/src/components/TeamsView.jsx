import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const TEAMS_PROMPT = `I want to set up Claude Code Agent Teams. Here's what I need:

1. Enable the feature by adding CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 to the env key in ~/.claude/settings.json
2. Check if tmux is installed (brew install tmux) for split-pane mode where each teammate gets its own terminal pane
3. Create a team config in ~/.claude/teams/ with teammates suited for my workflow
4. Explain how to start a team session and coordinate work through the shared task list`;

export default function TeamsView() {
  const { data, loading, error } = useApi('/teams');
  const [selected, setSelected] = useState(null);

  if (loading) return <div className="loading">Loading</div>;
  if (error) return <div className="loading">Failed to load teams</div>;
  if (!data?.length) return (
    <div>
      <div className="section-header">
        <h1>Teams</h1>
        <p>No teams configured</p>
      </div>
      <div className="empty-state">
        <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u2687'}</div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>No teams found</div>
        <div style={{ fontSize: 13, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
          Agent Teams let multiple Claude instances work in parallel on the same codebase with shared task coordination.
          Requires the <code>CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS</code> env var and optionally tmux for split-pane mode.
        </div>
      </div>
      <PromptCard
        title="Set up Agent Teams"
        description="Copy this prompt into a Claude Code session to enable and configure teams."
        prompt={TEAMS_PROMPT}
      />
    </div>
  );

  if (selected) {
    const config = selected.config || {};
    const members = config.members || {};
    return (
      <>
      <div className="detail-view">
        <div className="detail-header">
          <button className="btn-back" onClick={() => setSelected(null)}>
            &larr; Back
          </button>
          <h2>{selected.name}</h2>
          {!selected.hasConfig && <span className="badge muted">No config</span>}
        </div>
        {Object.keys(members).length > 0 && (
          <div className="detail-meta" style={{ flexDirection: 'column', gap: '8px' }}>
            <span className="label" style={{ fontWeight: 600, fontSize: '13px' }}>Members</span>
            {Object.entries(members).map(([name, member]) => (
              <div key={name} className="team-member">
                <span className="member-name">{name}</span>
                {member.model && <span className="badge muted">{member.model}</span>}
              </div>
            ))}
          </div>
        )}
        {selected.inboxes?.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)' }}>
            <span className="label" style={{ fontWeight: 600, fontSize: '13px' }}>Inboxes</span>
            <div className="card-meta" style={{ marginTop: '8px' }}>
              {selected.inboxes.map(inbox => (
                <span key={inbox.name} className="badge">{inbox.name}</span>
              ))}
            </div>
          </div>
        )}
        <div className="detail-body">
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      </div>
      <PromptCard
        title="Manage your teams"
        description="Ask Claude Code to review your team configuration and suggest improvements."
        prompt={TEAMS_PROMPT}
      />
    </>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h1>Teams</h1>
        <p>{data.length} team{data.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="card-grid">
        {data.map(team => {
          const memberCount = team.config?.members
            ? Object.keys(team.config.members).length
            : 0;
          return (
            <div key={team.id} className="card" onClick={() => setSelected(team)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(team); } }} role="button" tabIndex={0}>
              <h3>{team.name}</h3>
              <p>
                {team.hasConfig
                  ? `${memberCount} member${memberCount !== 1 ? 's' : ''}`
                  : 'No configuration file'}
              </p>
              <div className="card-meta">
                {team.hasConfig && <span className="badge">Configured</span>}
                {!team.hasConfig && <span className="badge muted">Empty</span>}
              </div>
            </div>
          );
        })}
      </div>
      <PromptCard
        title="Manage your teams"
        description="Ask Claude Code to review your team configuration and suggest improvements."
        prompt={TEAMS_PROMPT}
      />
    </div>
  );
}

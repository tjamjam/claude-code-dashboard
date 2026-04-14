import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';
import RepoItemsSection, { SectionDivider } from './RepoItemsSection';

const COMMANDS_AUDIT_PROMPT = `Audit all commands in ~/.claude/commands/ and my repo .claude/commands/ directories. For each command: determine if it should be promoted to a proper skill (with SKILL.md structure), if it overlaps with an existing skill, or if it can be improved. Produce the SKILL.md for any that should be promoted.`;

function commandDetailPrompt(cmd) {
  return `Review this command "/${cmd.name}":\n\n${cmd.content || '(no content)'}\n\nAnalyze it and suggest:\n1. Whether it should be promoted to a skill — if yes, write the full SKILL.md for ~/.claude/skills/${cmd.name}/SKILL.md\n2. Whether it overlaps with any existing skills or agents and should be consolidated\n3. How to improve the prompt itself for more consistent output`;
}

function CommandCard({ cmd, onClick }) {
  const preview = cmd.content?.slice(0, 120).trim();
  return (
    <div className="card" onClick={onClick} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }} role="button" tabIndex={0}>
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
  if (commands.error || repos.error) return <div className="loading">Failed to load commands</div>;

  const globalCommands = commands.data || [];
  const q = search.toLowerCase();
  const filteredGlobal = globalCommands.filter(c =>
    !q || c.name.toLowerCase().includes(q) || c.content?.toLowerCase().includes(q)
  );
  const hasRepoCommands = (repos.data || []).some(r => r.commands?.length > 0);

  if (selected) {
    return (
      <>
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
        <PromptCard
          title="Improve or promote this command"
          description="Ask Claude Code whether this command should become a skill, and how to improve its prompt."
          prompt={commandDetailPrompt(selected)}
        />
      </>
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
              aria-label="Search commands"
            />
          </div>
          <div className="accent-box" style={{
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

      <PromptCard
        title="Audit your commands"
        description="Ask Claude Code to review all commands, find promotion candidates, and produce the SKILL.md for any worth upgrading."
        prompt={COMMANDS_AUDIT_PROMPT}
      />
    </div>
  );
}

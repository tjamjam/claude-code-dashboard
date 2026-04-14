import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';
import RepoItemsSection, { SectionDivider } from './RepoItemsSection';

const AGENTS_PROMPT = `Review my project CLAUDE.md files across ~/Documents/GitHub and my ~/.claude/settings.json. Based on workflows I do frequently, suggest 2–3 specialized sub-agents I should define in ~/.claude/agents/ and write the full .md file for each — include YAML frontmatter with name, description, model, and tools fields, and a system prompt body that gives the agent a specific role and capabilities.`;

function AgentCard({ agent, onClick }) {
  return (
    <div className="card" onClick={onClick}>
      <h3>{agent.name}</h3>
      <p>{agent.frontmatter?.description || 'No description'}</p>
      <div className="card-meta">
        {agent.frontmatter?.model && (
          <span className="badge">{agent.frontmatter.model}</span>
        )}
      </div>
    </div>
  );
}

export default function AgentsView() {
  const agents = useApi('/agents');
  const repos = useApi('/repos');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const loading = agents.loading || repos.loading;
  if (loading) return <div className="loading">Loading</div>;

  const globalAgents = agents.data || [];
  const q = search.toLowerCase();
  const filteredGlobal = globalAgents.filter(a =>
    !q ||
    a.name.toLowerCase().includes(q) ||
    a.frontmatter?.description?.toLowerCase().includes(q)
  );
  const hasRepoAgents = (repos.data || []).some(r => r.agents?.length > 0);

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

  const totalCount = globalAgents.length + (repos.data || []).reduce((n, r) => n + (r.agents?.length || 0), 0);

  return (
    <div>
      <div className="section-header">
        <h1>Agents</h1>
        <p>{totalCount} agent definition{totalCount !== 1 ? 's' : ''} total</p>
      </div>

      {(globalAgents.length > 0 || hasRepoAgents) && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {globalAgents.length === 0 && !hasRepoAgents ? (
        <PromptCard
          title="Create your first agents"
          description="No agents defined yet. Ask Claude Code to suggest specialized sub-agents based on your workflow."
          prompt={AGENTS_PROMPT}
        />
      ) : (
        <>
          {globalAgents.length > 0 && (
            <>
              {hasRepoAgents && <SectionDivider label="Global" />}
              <div className="card-grid">
                {filteredGlobal.map(agent => (
                  <AgentCard key={agent.id} agent={agent} onClick={() => setSelected(agent)} />
                ))}
              </div>
            </>
          )}

          <RepoItemsSection
            repos={repos.data}
            getItems={r => r.agents || []}
            search={search}
            renderCard={(agent, repo) => (
              <AgentCard
                key={`${repo.name}-${agent.id}`}
                agent={agent}
                onClick={() => setSelected(agent)}
              />
            )}
          />
        </>
      )}
    </div>
  );
}

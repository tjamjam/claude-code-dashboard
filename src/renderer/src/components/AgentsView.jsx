import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';
import RepoItemsSection, { SectionDivider } from './RepoItemsSection';

const AGENTS_CREATE_PROMPT = `Review my project CLAUDE.md files across ~/Documents/GitHub and my ~/.claude/settings.json. Based on workflows I do frequently, suggest 2–3 specialized sub-agents I should define in ~/.claude/agents/ and write the full .md file for each — include YAML frontmatter with name, description, model, and tools fields, and a system prompt body that gives the agent a specific role and capabilities.`;

const AGENTS_AUDIT_PROMPT = `Audit all my agents across ~/.claude/agents/ and my repo .claude/agents/ directories. For each agent: check if the tools list is optimal, if the role is clearly defined, and if there are obvious gaps. Suggest improvements and create any missing agents for workflows I do frequently.`;

function agentDetailPrompt(agent) {
  return `Review this agent called "${agent.name}":\n\n${agent.content || '(no content)'}\n\nAnalyze it and suggest:\n1. Improvements to the role definition and system prompt clarity\n2. Whether the tools list is complete and appropriate for this agent's purpose\n3. What complementary agents would pair well with this one`;
}

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
      <>
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
        <PromptCard
          title="Improve this agent"
          description="Ask Claude Code to review this agent's role, tools, and system prompt for improvements."
          prompt={agentDetailPrompt(selected)}
        />
      </>
    );
  }

  const totalCount = globalAgents.length + (repos.data || []).reduce((n, r) => n + (r.agents?.length || 0), 0);

  return (
    <div>
      <div className="section-header">
        <h1>Agents</h1>
        <p>{totalCount} agent definition{totalCount !== 1 ? 's' : ''} total</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

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

      <PromptCard
        title={globalAgents.length === 0 && !hasRepoAgents ? 'Create your first agents' : 'Audit your agents'}
        description={globalAgents.length === 0 && !hasRepoAgents
          ? 'No agents defined yet. Ask Claude Code to suggest specialized sub-agents based on your workflow.'
          : 'Ask Claude Code to review all your agents and identify gaps, tool improvements, and missing agents.'}
        prompt={globalAgents.length === 0 && !hasRepoAgents ? AGENTS_CREATE_PROMPT : AGENTS_AUDIT_PROMPT}
      />
    </div>
  );
}

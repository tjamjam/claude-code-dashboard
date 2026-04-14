import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const PLANS_AUDIT_PROMPT = `Review all my open plans in ~/.claude/plans/. For each plan: determine if it's still relevant, identify what's blocking progress, and recommend the single next action that would move it forward most. Flag any that can be archived.`;

function planDetailPrompt(plan) {
  return `Review this plan called "${plan.title}":\n\n${plan.content || '(no content)'}\n\nBreak down what needs to happen next:\n1. What are the concrete next 3 actions I can take immediately?\n2. Are there any dependencies or blockers I should resolve first?\n3. What parts of this plan are ready to execute right now?`;
}

export default function PlansView() {
  const { data, loading, error } = useApi('/plans');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  if (loading) return <div className="loading">Loading</div>;
  if (error) return <div className="loading">Failed to load plans</div>;

  if (selected) {
    return (
      <>
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
        <PromptCard
          title="Move this plan forward"
          description="Ask Claude Code to identify the next concrete actions and any blockers for this plan."
          prompt={planDetailPrompt(selected)}
        />
      </>
    );
  }

  const plans = data || [];
  const filtered = plans.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="section-header">
        <h1>Plans</h1>
        <p>{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
      </div>
      {plans.length > 0 && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}
      {plans.length > 0 ? (
        <>
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
        </>
      ) : (
        <div className="empty-state">No plans found</div>
      )}
      <PromptCard
        title="Review your open plans"
        description="Ask Claude Code to triage your plans, flag blockers, and recommend next actions for each."
        prompt={PLANS_AUDIT_PROMPT}
      />
    </div>
  );
}

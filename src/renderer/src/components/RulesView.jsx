import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';
import RepoItemsSection, { SectionDivider } from './RepoItemsSection';

const RULES_PROMPT = `Review my Claude Code rules across ~/.claude/rules/ and my repo .claude/rules/ directories. For each rule: check if it's well-written, specific enough, and not contradicting other rules or CLAUDE.md instructions. Suggest new rules I should add based on common mistakes or patterns you see in my codebase. Create any missing rules as .md files in the appropriate directory.`;

function RuleCard({ rule, onClick }) {
  const preview = rule.content?.slice(0, 120).replace(/\n/g, ' ') || 'No content';
  return (
    <div
      className="card"
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
    >
      <h3>{rule.name}</h3>
      <p>{preview}{rule.content?.length > 120 ? '...' : ''}</p>
    </div>
  );
}

function RuleDetail({ rule, onBack }) {
  const prompt = `Review this Claude Code rule "${rule.name}" and suggest improvements. Check if it's clear, specific, and actionable. Here's the current content:\n\n${rule.content}`;
  return (
    <>
      <div className="detail-view">
        <div className="detail-header">
          <button className="btn-back" onClick={onBack}>&larr; Back</button>
          <h2>{rule.name}</h2>
        </div>
        <div className="detail-body">
          <pre>{rule.content}</pre>
        </div>
      </div>
      <PromptCard
        title="Improve this rule"
        description="Ask Claude Code to review and improve this rule."
        prompt={prompt}
      />
    </>
  );
}

export default function RulesView() {
  const rules = useApi('/rules');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  if (rules.loading) return <div className="loading">Loading</div>;
  if (rules.error) return <div className="loading">Failed to load rules</div>;

  if (selected) return <RuleDetail rule={selected} onBack={() => setSelected(null)} />;

  const data = rules.data || { global: [], repos: [], totalCount: 0 };
  const q = search.toLowerCase();
  const filteredGlobal = data.global.filter(r =>
    !q || r.name.toLowerCase().includes(q) || r.content?.toLowerCase().includes(q)
  );
  const hasRepoRules = data.repos.some(r => r.rules.length > 0);

  return (
    <div>
      <div className="section-header">
        <h1>Rules</h1>
        <p>{data.totalCount} rule{data.totalCount !== 1 ? 's' : ''}</p>
      </div>

      {data.totalCount === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u2696'}</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No rules found</div>
          <div style={{ fontSize: 13, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Rules are markdown files in <code>.claude/rules/</code> that provide supplementary instructions
            to Claude Code. Use them to split large CLAUDE.md files into modular, focused guidelines.
          </div>
        </div>
      ) : (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search rules..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search rules"
            />
          </div>

          {filteredGlobal.length > 0 && (
            <>
              {hasRepoRules && <SectionDivider label="Global" />}
              <div className="card-grid">
                {filteredGlobal.map(rule => (
                  <RuleCard key={rule.id} rule={rule} onClick={() => setSelected(rule)} />
                ))}
              </div>
            </>
          )}

          <RepoItemsSection
            repos={data.repos}
            getItems={r => r.rules || []}
            search={search}
            renderCard={(rule, repo) => (
              <RuleCard key={`${repo.name}-${rule.id}`} rule={rule} onClick={() => setSelected(rule)} />
            )}
          />
        </>
      )}

      <PromptCard
        title="Get rule recommendations"
        description="Ask Claude Code to review your rules and suggest new ones."
        prompt={RULES_PROMPT}
      />
    </div>
  );
}

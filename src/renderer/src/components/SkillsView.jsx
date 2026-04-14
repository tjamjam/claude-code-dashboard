import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const SKILLS_PROMPT = `Look at my ~/.claude/ directory structure, any commands in ~/.claude/commands/, and CLAUDE.md files in my ~/Documents/GitHub repos. Based on patterns in how I use Claude Code across projects, recommend 3–5 skills I should create and write the full ~/.claude/skills/[name]/SKILL.md file for each one — include YAML frontmatter with name and description fields, and make the skill body an actionable step-by-step prompt.`;

export default function SkillsView() {
  const { data, loading } = useApi('/skills');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  if (loading) return <div className="loading">Loading</div>;

  const filtered = (data || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div className="detail-view">
        <div className="detail-header">
          <button className="btn-back" onClick={() => setSelected(null)}>
            &larr; Back
          </button>
          <h2>{selected.name}</h2>
        </div>
        {selected.description && (
          <div className="detail-meta">
            <div className="detail-meta-item">
              <span className="label">Description:</span>
              <span className="value">{selected.description}</span>
            </div>
            {selected.frontmatter?.model && (
              <div className="detail-meta-item">
                <span className="label">Model:</span>
                <span className="value">{selected.frontmatter.model}</span>
              </div>
            )}
          </div>
        )}
        <div className="detail-body">
          <pre>{selected.content}</pre>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h1>Skills</h1>
        <p>{filtered.length} skill{filtered.length !== 1 ? 's' : ''} installed</p>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {(data || []).length === 0 ? (
        <PromptCard
          title="Get skill recommendations"
          description="No skills installed yet. Ask Claude Code to analyze your workflow and suggest skills to create."
          prompt={SKILLS_PROMPT}
        />
      ) : (
        <>
          <div className="card-grid">
            {filtered.map(skill => (
              <div key={skill.id} className="card" onClick={() => setSelected(skill)}>
                <h3>{skill.name}</h3>
                <p>{skill.description || 'No description'}</p>
                {skill.frontmatter?.model && (
                  <div className="card-meta">
                    <span className="badge muted">{skill.frontmatter.model}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {filtered.length === 0 && <div className="empty-state">No skills match your search</div>}
        </>
      )}
    </div>
  );
}

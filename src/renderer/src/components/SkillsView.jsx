import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';
import RepoItemsSection, { SectionDivider } from './RepoItemsSection';

const SKILLS_CREATE_PROMPT = `Look at my ~/.claude/ directory structure, any commands in ~/.claude/commands/, and CLAUDE.md files in my ~/Documents/GitHub repos. Based on patterns in how I use Claude Code across projects, recommend 3–5 skills I should create and write the full ~/.claude/skills/[name]/SKILL.md file for each one. Include YAML frontmatter with name and description fields, and make the skill body an actionable step-by-step prompt.`;

const SKILLS_AUDIT_PROMPT = `Audit all my skills across ~/.claude/skills/ and my repo .claude/skills/ directories. For each skill: identify if it's outdated, overlaps with another, or could be made more powerful. Suggest concrete improvements and create any missing skills that would fill obvious gaps in my workflow.`;

function skillDetailPrompt(skill) {
  return `Review this skill called "${skill.name}" with the following content:\n\n${skill.content || '(no content)'}\n\nAnalyze it and suggest:\n1. How to improve the prompt for more consistent, higher-quality output\n2. Whether it should be split into sub-skills or merged with another skill\n3. Any missing steps or edge cases the current version doesn't handle`;
}

function SkillCard({ skill, onClick }) {
  return (
    <div className="card" onClick={onClick} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }} role="button" tabIndex={0}>
      <h3>{skill.name}</h3>
      <p>{skill.description || 'No description'}</p>
      <div className="card-meta">
        {skill.frontmatter?.model && (
          <span className="badge muted">{skill.frontmatter.model}</span>
        )}
      </div>
    </div>
  );
}

export default function SkillsView() {
  const skills = useApi('/skills');
  const repos = useApi('/repos');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const loading = skills.loading || repos.loading;
  if (loading) return <div className="loading">Loading</div>;
  if (skills.error || repos.error) return <div className="loading">Failed to load skills</div>;

  const globalSkills = skills.data || [];
  const q = search.toLowerCase();
  const filteredGlobal = globalSkills.filter(s =>
    !q || s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
  );
  const hasRepoSkills = (repos.data || []).some(r => r.skills?.length > 0);

  if (selected) {
    return (
      <>
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
        <PromptCard
          title="Improve this skill"
          description="Ask Claude Code to review this skill and suggest improvements to its structure and prompt quality."
          prompt={skillDetailPrompt(selected)}
        />
      </>
    );
  }

  const totalCount = globalSkills.length + (repos.data || []).reduce((n, r) => n + (r.skills?.length || 0), 0);

  return (
    <div>
      <div className="section-header">
        <h1>Skills</h1>
        <p>{totalCount} skill{totalCount !== 1 ? 's' : ''} total</p>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search skills"
        />
      </div>

      {globalSkills.length > 0 && (
        <>
          {hasRepoSkills && <SectionDivider label="Global" />}
          <div className="card-grid">
            {filteredGlobal.map(skill => (
              <SkillCard key={skill.id} skill={skill} onClick={() => setSelected(skill)} />
            ))}
          </div>
          {filteredGlobal.length === 0 && !hasRepoSkills && (
            <div className="empty-state">No skills match your search</div>
          )}
        </>
      )}

      <RepoItemsSection
        repos={repos.data}
        getItems={r => r.skills || []}
        search={search}
        renderCard={(skill, repo) => (
          <SkillCard
            key={`${repo.name}-${skill.id}`}
            skill={skill}
            onClick={() => setSelected(skill)}
          />
        )}
      />

      <PromptCard
        title={globalSkills.length === 0 ? 'Get skill recommendations' : 'Audit your skills'}
        description={globalSkills.length === 0
          ? 'No global skills yet. Ask Claude Code to analyze your workflow and suggest skills to create.'
          : 'Ask Claude Code to review all your skills and identify gaps, overlaps, and improvements.'}
        prompt={globalSkills.length === 0 ? SKILLS_CREATE_PROMPT : SKILLS_AUDIT_PROMPT}
      />
    </div>
  );
}

import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const CLAUDE_MD_CREATE_PROMPT = `Generate a global ~/.claude/CLAUDE.md for me. First read any CLAUDE.md files in my ~/Documents/GitHub repos, check ~/.claude/settings.json for preferences, and run git log --oneline -10 in my most active repos to understand my coding patterns. Then write a CLAUDE.md that captures my working style, coding conventions, and preferences that should apply across every project, and save it to ~/.claude/CLAUDE.md.`;

const CLAUDE_MD_IMPROVE_PROMPT = `Analyze my ~/.claude/CLAUDE.md and suggest improvements. Read my recent git history across active repos and any project-level CLAUDE.md files to find: 1) Important patterns or conventions missing from the global file, 2) Outdated or irrelevant instructions to remove, 3) Anything that would make Claude more effective across all my projects. Then update ~/.claude/CLAUDE.md with your recommended changes.`;

export default function ClaudeMdView() {
  const { data, loading, error } = useApi('/claude-md');

  if (loading) return <div className="loading">Loading</div>;
  if (error) return <div className="loading">Failed to load CLAUDE.md</div>;

  const content = data?.global;

  return (
    <div>
      <div className="section-header">
        <h1>CLAUDE.md</h1>
        <p>Global instructions and context given to Claude in every session</p>
      </div>
      {content ? (
        <>
          <div className="detail-view">
            <div className="detail-header">
              <h2>~/.claude/CLAUDE.md</h2>
            </div>
            <div className="detail-body">
              <pre>{content}</pre>
            </div>
          </div>
          <PromptCard
            title="Improve your CLAUDE.md"
            description="Ask Claude Code to analyze your current file and suggest what's missing, outdated, or worth adding."
            prompt={CLAUDE_MD_IMPROVE_PROMPT}
          />
        </>
      ) : (
        <>
          <div className="empty-state">
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No global CLAUDE.md found</div>
            <div style={{ fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
              Create <code>~/.claude/CLAUDE.md</code> to give Claude persistent instructions,
              your preferred working style, and context that applies across every project.
            </div>
          </div>
          <PromptCard
            title="Generate your CLAUDE.md"
            description="Ask Claude Code to analyze your projects and write a global CLAUDE.md tailored to how you work."
            prompt={CLAUDE_MD_CREATE_PROMPT}
          />
        </>
      )}
    </div>
  );
}

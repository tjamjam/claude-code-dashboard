import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const CLAUDE_MD_PROMPT = `Generate a global ~/.claude/CLAUDE.md for me. First read any CLAUDE.md files in my ~/Documents/GitHub repos, check ~/.claude/settings.json for preferences, and run git log --oneline -10 in my most active repos to understand my coding patterns. Then write a CLAUDE.md that captures my working style, coding conventions, and preferences that should apply across every project — and save it to ~/.claude/CLAUDE.md.`;

export default function ClaudeMdView() {
  const { data, loading } = useApi('/claude-md');

  if (loading) return <div className="loading">Loading</div>;

  const content = data?.global;

  return (
    <div>
      <div className="section-header">
        <h1>CLAUDE.md</h1>
        <p>Global instructions and context given to Claude in every session</p>
      </div>
      {content ? (
        <div className="detail-view">
          <div className="detail-header">
            <h2>~/.claude/CLAUDE.md</h2>
          </div>
          <div className="detail-body">
            <pre>{content}</pre>
          </div>
        </div>
      ) : (
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
          prompt={CLAUDE_MD_PROMPT}
        />
      )}
    </div>
  );
}

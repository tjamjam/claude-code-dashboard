import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const OVERVIEW_PROMPT = `Analyze my full Claude Code setup. Check ~/.claude/ globally — review my skills, agents, commands, plans, memory files, settings.json, and CLAUDE.md. Then give me a prioritized 5-point action plan: what to create, what to improve, what to clean up, and what Claude Code features I'm underusing based on my workflow.`;

const GETTING_STARTED_PROMPT = `Set up Claude Code for me. Start by creating a global ~/.claude/CLAUDE.md with my coding preferences and conventions. Then scan my repos in ~/Documents/GitHub/ — for the most active ones, create project-level CLAUDE.md files with project-specific context (architecture, dev commands, key patterns). Finally, suggest 2-3 custom skills or commands I should create based on what you see in my repos.`;

const GLOBAL_STATS = [
  { key: 'skills',            label: 'Global Skills',    section: 'skills' },
  { key: 'commands',          label: 'Commands',         section: 'commands' },
  { key: 'agents',            label: 'Agents',           section: 'agents' },
  { key: 'teams',             label: 'Teams',            section: 'teams' },
  { key: 'plans',             label: 'Plans',            section: 'plans' },
  { key: 'projectsWithMemory',label: 'Projects w/ Memory', section: 'memory' },
];

const REPO_STATS = [
  { key: 'repoSkills',   label: 'Repo Skills' },
  { key: 'repoCommands', label: 'Repo Commands' },
  { key: 'repoAgents',   label: 'Repo Agents' },
  { key: 'reposWithConfig', label: 'Repos Configured' },
  { key: 'totalRepos',   label: 'Total Repos' },
];

const INSIGHT_ICONS = { info: 'ℹ', warning: '⚠', tip: '✦' };
const INSIGHT_CLASSES = { info: 'insight-info', warning: 'insight-warning', tip: 'insight-tip' };

function ModelBanner({ model }) {
  if (!model) return null;
  const m = model.toLowerCase();
  const isOpus = m.includes('opus');
  const isHaiku = m.includes('haiku');
  const isSonnet = m.includes('sonnet');

  if (isOpus) return null;

  const display = model.replace('claude-', '').replace(/-/g, ' ');

  if (isHaiku) {
    return (
      <div style={{
        background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.12), rgba(239,68,68,0.12) 10px, rgba(220,38,38,0.06) 10px, rgba(220,38,38,0.06) 20px)',
        border: '3px dashed rgba(239,68,68,0.5)',
        borderRadius: 'var(--radius)',
        padding: '24px 20px',
        marginBottom: 24,
        lineHeight: 1.7,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -8, right: -8,
          fontSize: 80, opacity: 0.08, transform: 'rotate(12deg)',
          pointerEvents: 'none', userSelect: 'none',
        }}>&#x1F480;</div>
        <div style={{ fontSize: 28, marginBottom: 8 }}>&#x1F6A8;&#x1F525;&#x1F6A8;</div>
        <div className="error-text" style={{
          fontWeight: 800, fontSize: 16, marginBottom: 4,
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          CODE RED: HAIKU DETECTED
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 600 }}>
          Your global model is set to <strong className="error-text">{display}</strong>.
          Haiku is a grocery list model. It is the Honda Civic of LLMs. You are trying to build
          a house with a spoon. Opus is RIGHT THERE. You are literally paying for it. This is
          like owning a Ferrari and taking the bus. Please run <code>/model</code> before
          Haiku hallucinates your entire codebase into a pile of TODO comments.
        </div>
        <div className="error-text" style={{
          marginTop: 12, padding: '8px 12px',
          background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)',
          fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12,
          display: 'inline-block',
        }}>
          THREAT LEVEL: <strong>CATASTROPHIC</strong>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08))',
      border: '1px solid rgba(245,158,11,0.35)',
      borderRadius: 'var(--radius)',
      padding: '14px 20px',
      marginBottom: 24,
      display: 'flex', alignItems: 'flex-start', gap: 14,
      lineHeight: 1.6,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>&#x1F928;</span>
      <div>
        <div className="warning-text" style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>
          Why are you not on Opus?
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
          You're running <strong style={{ color: 'var(--text)' }}>{display}</strong>.
          {isSonnet ? " Sonnet is great for quick stuff, but you deserve the full thing." : ""}
          {' '}Switch to Opus with <code>/model</code> — you'll wonder why you ever settled.
        </div>
      </div>
    </div>
  );
}

export default function Overview({ onNavigate }) {
  const { data, loading, error } = useApi('/overview');
  const { data: insights, loading: insightsLoading } = useApi('/insights');
  const { data: settings } = useApi('/settings');

  if (loading) return <div className="loading">Loading</div>;
  if (error) return <div className="loading">Failed to load overview</div>;

  const model = settings?.global?.model || settings?.local?.model || null;

  // Check if this looks like a fresh install with no Claude Code config
  const totalGlobal = GLOBAL_STATS.reduce((sum, { key }) => sum + (data?.[key] ?? 0), 0);
  const hasSettings = !!(settings?.global || settings?.local);
  const isEmpty = totalGlobal === 0 && !hasSettings && (data?.totalRepos ?? 0) === 0;

  if (isEmpty) {
    return (
      <div>
        <div className="section-header">
          <h1>Overview</h1>
          <p>Your Claude Code configuration at a glance</p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '40px 32px',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>&#x1F44B;</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>
            No Claude Code configuration found
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            This dashboard reads your Claude Code setup from <code>~/.claude/</code> and
            your repos. It looks like you're starting fresh, or Claude Code hasn't been
            installed yet.
          </div>
          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
            textAlign: 'left', maxWidth: 480, margin: '20px auto 0',
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>To get started:</div>
            <div>1. Install Claude Code: <code>npm install -g @anthropic-ai/claude-code</code></div>
            <div>2. Run <code>claude</code> in any project directory</div>
            <div>3. Copy the prompt below into your first session to bootstrap your setup</div>
          </div>
        </div>

        <PromptCard
          title="Bootstrap your Claude Code setup"
          description="Copy this into a Claude Code session to create your global config, project-level CLAUDE.md files, and starter skills."
          prompt={GETTING_STARTED_PROMPT}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h1>Overview</h1>
        <p>Your Claude Code configuration at a glance</p>
      </div>

      <ModelBanner model={model} />

      <div className="overview-group-label">Global (~/.claude/)</div>
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {GLOBAL_STATS.map(({ key, label, section }) => (
          <div
            key={key}
            className="stat-card"
            onClick={() => section && onNavigate?.(section)}
            style={{ cursor: section ? 'pointer' : 'default' }}
          >
            <div className="stat-number">{data?.[key] ?? 0}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="overview-group-label">Across Repos (~/Documents/GitHub/)</div>
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {REPO_STATS.map(({ key, label }) => (
          <div key={key} className="stat-card" style={{ cursor: 'default' }}>
            <div className="stat-number">{data?.[key] ?? 0}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {!insightsLoading && insights?.length > 0 && (
        <div>
          <div className="overview-group-label">Self-Improvement</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {insights.map(ins => {
              return (
                <div key={ins.id} className={INSIGHT_CLASSES[ins.type] || 'insight-info'} style={{
                  borderRadius: 'var(--radius)',
                  padding: '14px 18px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}>
                  <span className="insight-icon" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                    {INSIGHT_ICONS[ins.type]}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 3 }}>
                      {ins.title}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {ins.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PromptCard
        title="Full Claude Code health check"
        description="Ask Claude Code to audit your entire setup and give you a prioritized action plan."
        prompt={OVERVIEW_PROMPT}
      />
    </div>
  );
}

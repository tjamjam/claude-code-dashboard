import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const OVERVIEW_PROMPT = `Analyze my full Claude Code setup. Check ~/.claude/ globally — review my skills, agents, commands, plans, memory files, settings.json, and CLAUDE.md. Then give me a prioritized 5-point action plan: what to create, what to improve, what to clean up, and what Claude Code features I'm underusing based on my workflow.`;

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
const INSIGHT_COLORS = {
  info:    { bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.2)', icon: '#8b5cf6' },
  warning: { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.3)', icon: '#d97706' },
  tip:     { bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.25)', icon: '#059669' },
};

export default function Overview({ onNavigate }) {
  const { data, loading } = useApi('/overview');
  const { data: insights, loading: insightsLoading } = useApi('/insights');

  if (loading) return <div className="loading">Loading</div>;

  return (
    <div>
      <div className="section-header">
        <h1>Overview</h1>
        <p>Your Claude Code configuration at a glance</p>
      </div>

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
              const colors = INSIGHT_COLORS[ins.type] || INSIGHT_COLORS.info;
              return (
                <div key={ins.id} style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 'var(--radius)',
                  padding: '14px 18px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}>
                  <span style={{ color: colors.icon, fontSize: 16, flexShrink: 0, marginTop: 1 }}>
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

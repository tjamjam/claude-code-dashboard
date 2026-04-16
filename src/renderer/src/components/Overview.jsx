import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const OVERVIEW_PROMPT = `Analyze my full Claude Code setup. Check ~/.claude/ globally. Review my skills, agents, commands, plans, memory files, settings.json, and CLAUDE.md. Then give me a prioritized 5-point action plan: what to create, what to improve, what to clean up, and what Claude Code features I'm underusing based on my workflow.`;

const GETTING_STARTED_PROMPT = `Set up Claude Code for me. Start by creating a global ~/.claude/CLAUDE.md with my coding preferences and conventions. Then scan my repos in ~/Documents/GitHub/. For the most active ones, create project-level CLAUDE.md files with project-specific context (architecture, dev commands, key patterns). Finally, suggest 2-3 custom skills or commands I should create based on what you see in my repos.`;

function StatGroup({ label, items, onNavigate, style }) {
  return (
    <>
      <div className="overview-group-label">{label}</div>
      <div className="stat-grid" style={style}>
        {items.map(item => {
          const { label: itemLabel, value, section, subLabel } = item;
          return (
            <div
              key={itemLabel}
              className="stat-card"
              onClick={section ? () => onNavigate?.(section) : undefined}
              onKeyDown={section ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate?.(section); } } : undefined}
              role={section ? 'button' : undefined}
              tabIndex={section ? 0 : undefined}
              style={{ cursor: section ? 'pointer' : 'default' }}
            >
              <div className="stat-number">{value}</div>
              <div className="stat-label">{itemLabel}</div>
              {subLabel && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{subLabel}</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function StatPills({ label, items, onNavigate, style }) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap', ...style }}>
      <div
        className="overview-group-label"
        style={{ margin: 0, minWidth: 110, flexShrink: 0 }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {visible.map(({ label: itemLabel, value, section }) => (
          <span
            key={itemLabel}
            role={section ? 'button' : undefined}
            tabIndex={section ? 0 : undefined}
            onClick={section ? () => onNavigate?.(section) : undefined}
            onKeyDown={section ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate?.(section); } } : undefined}
            style={{
              fontSize: 12, padding: '4px 10px',
              background: 'var(--bg-card)', color: 'var(--text-secondary)',
              border: '1px solid var(--border)', borderRadius: 0,
              cursor: section ? 'pointer' : 'default',
              display: 'inline-flex', gap: 6, alignItems: 'center',
            }}
          >
            {itemLabel} <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ContextChip({ context, onNavigate }) {
  if (!context) return null;
  const env = context.env || {};
  const hasAny = context.effortLevel || context.thinkingEnabled !== null || Object.values(env).some(v => v !== null);
  if (!hasAny) return null;
  const effort = context.effortLevel || '\u2014';
  const thinking = context.thinkingEnabled === true ? 'on' : context.thinkingEnabled === false ? 'off' : '\u2014';
  const autocompact = env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE || 'default';
  return (
    <div
      onClick={() => onNavigate?.('context')}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate?.('context'); } }}
      role="button"
      tabIndex={0}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 16,
        fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}
    >
      <span style={{ fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11 }}>Context</span>
      <span>effort: <strong style={{ color: 'var(--text)' }}>{effort}</strong></span>
      <span style={{ color: 'var(--border)' }}>{'\u00B7'}</span>
      <span>thinking: <strong style={{ color: 'var(--text)' }}>{thinking}</strong></span>
      <span style={{ color: 'var(--border)' }}>{'\u00B7'}</span>
      <span>autocompact: <strong style={{ color: 'var(--text)' }}>{autocompact}</strong></span>
    </div>
  );
}

function ModelBanner({ model }) {
  const m = (model || '').toLowerCase();
  const isOpus = !model || m.includes('opus');
  const isHaiku = m.includes('haiku');
  const isSonnet = m.includes('sonnet');

  if (isOpus) {
    const version = m.match(/(\d+[-.]\d+)/)?.[1]?.replace('-', '.') || null;
    return (
      <div className="model-banner-opus">
        <span className="banner-check">&#x2705;</span>
        <span className="banner-opus-text">Running Opus {version || '(default)'}</span>
      </div>
    );
  }

  const display = model.replace('claude-', '').replace(/-/g, ' ');

  if (isHaiku) {
    return (
      <div className="model-banner-haiku">
        <div className="banner-ebs-header">
          &#x26A0;&#xFE0F; emergency broadcast system &#x26A0;&#xFE0F; this is not a drill &#x26A0;&#xFE0F; emergency broadcast system &#x26A0;&#xFE0F;
        </div>
        <div className="banner-body">
          <div className="banner-siren">&#x1F6A8;</div>
          <div className="banner-defcon">DEFCON 1: HAIKU DETECTED</div>
          <div className="banner-subtitle">Threat Level: Catastrophic</div>
          <div className="banner-model-tag">{display}</div>
          <div className="banner-desc">
            You are currently running <strong>Haiku</strong>. This is the model equivalent
            of bringing a plastic spork to a sword fight. Your code generation quality is
            operating at a fraction of its potential. Every prompt you send is a wasted opportunity.
            This situation is untenable. Run <code>/model</code> immediately and select Opus
            before things get any worse.
          </div>
        </div>
        <div className="banner-marquee">
          <span>
            &#x1F6A8; UPGRADE TO OPUS IMMEDIATELY &#x1F6A8; YOUR CODE DESERVES BETTER &#x1F6A8; THIS IS NOT A DRILL &#x1F6A8; HAIKU IS FOR HAIKUS NOT FOR CODING &#x1F6A8; UPGRADE TO OPUS IMMEDIATELY &#x1F6A8;
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="model-banner-sonnet">
      <div className="banner-ebs-header">
        &#x26A0;&#xFE0F; model integrity warning &#x26A0;&#xFE0F; degraded performance detected &#x26A0;&#xFE0F; model integrity warning &#x26A0;&#xFE0F;
      </div>
      <div className="banner-body">
        <div className="banner-siren">&#x1F92C;</div>
        <div className="banner-defcon">DEFCON 2: SONNET DETECTED</div>
        <div className="banner-subtitle">Threat Level: Severe</div>
        <div className="banner-model-tag">{display}</div>
        <div className="banner-desc">
          You are running <strong>Sonnet</strong>. Yes, it's fast. Yes, it's cheaper.
          No, that does not make it acceptable. You are voluntarily handicapping yourself
          on every complex task, every architectural decision, every debugging session.
          Sonnet is the "we have Opus at home" of models.
          Run <code>/model</code> and select Opus. You are better than this.
        </div>
      </div>
      <div className="banner-marquee">
        <span>
          &#x26A0;&#xFE0F; SONNET IS NOT OPUS &#x26A0;&#xFE0F; YOU ARE SETTLING &#x26A0;&#xFE0F; SWITCH TO OPUS NOW &#x26A0;&#xFE0F; YOUR CODEBASE WILL THANK YOU &#x26A0;&#xFE0F; SONNET IS NOT OPUS &#x26A0;&#xFE0F;
        </span>
      </div>
    </div>
  );
}

export default function Overview({ onNavigate }) {
  const { data, loading, error } = useApi('/overview');
  const { data: usage } = useApi('/usage');
  const { data: settings } = useApi('/settings');
  const { data: rules } = useApi('/rules');
  const { data: hooks } = useApi('/hooks');
  const { data: tasks } = useApi('/tasks');
  const { data: plugins } = useApi('/plugins-full');
  const { data: envVars } = useApi('/env-vars');
  const { data: permissions } = useApi('/permissions-full');
  const { data: context } = useApi('/context');
  const { data: profiles } = useApi('/launch-profiles');

  if (loading) return <div className="loading">Loading</div>;
  if (error) return <div className="loading">Failed to load overview</div>;

  const model = settings?.global?.model || settings?.local?.model || null;

  // Check if this looks like a fresh install with no Claude Code config
  const totalGlobal =
    (data?.skills ?? 0) + (data?.agents ?? 0) + (data?.commands ?? 0) +
    (data?.teams ?? 0) + (data?.plans ?? 0) + (data?.projectsWithMemory ?? 0) +
    (rules?.totalCount ?? 0) + (tasks?.totalSubtasks ?? 0) +
    (hooks?.totalHooks ?? 0) + (plugins?.totalInstalled ?? 0) +
    (envVars?.totalVars ?? 0);
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

      <ContextChip context={context} onNavigate={onNavigate} />

      <StatGroup
        label="Global (~/.claude/)"
        onNavigate={onNavigate}
        style={{ marginBottom: 16 }}
        items={[
          { label: 'Skills', value: data?.skills ?? 0, section: 'skills' },
          { label: 'Agents', value: data?.agents ?? 0, section: 'agents' },
          { label: 'Commands', value: data?.commands ?? 0, section: 'commands' },
          { label: 'Memory', value: data?.projectsWithMemory ?? 0, section: 'memory' },
          { label: 'Plans', value: data?.plans ?? 0, section: 'plans' },
          {
            label: 'Tasks',
            value: tasks?.totalSubtasks ?? 0,
            section: 'tasks',
            subLabel: tasks?.statusCounts?.in_progress > 0
              ? `${tasks.statusCounts.in_progress} in progress`
              : undefined,
          },
        ]}
      />

      <StatPills
        label="Content"
        onNavigate={onNavigate}
        items={[
          { label: 'Teams', value: data?.teams ?? 0, section: 'teams' },
          { label: 'Rules', value: rules?.totalCount ?? 0, section: 'rules' },
        ]}
      />

      <StatPills
        label="Infrastructure"
        onNavigate={onNavigate}
        items={[
          { label: 'Plugins', value: plugins?.totalInstalled ?? 0, section: 'plugins' },
          { label: 'Hooks', value: hooks?.totalHooks ?? 0, section: 'hooks' },
        ]}
      />

      <StatPills
        label="Configuration"
        onNavigate={onNavigate}
        style={{ marginBottom: 24 }}
        items={[
          { label: 'Allow Rules', value: permissions?.effectiveAllow?.length ?? 0, section: 'permissions' },
          { label: 'Deny Rules', value: permissions?.effectiveDeny?.length ?? 0, section: 'permissions' },
          { label: 'Env Vars', value: envVars?.totalVars ?? 0, section: 'env-vars' },
          { label: 'Profiles', value: profiles?.profiles?.length ?? 0, section: 'profiles' },
        ]}
      />

      <StatGroup
        label="Across Repos (~/Documents/GitHub/)"
        onNavigate={onNavigate}
        style={{ marginBottom: 16 }}
        items={[
          { label: 'Repos Configured', value: data?.reposWithConfig ?? 0 },
          { label: 'Total Repos', value: data?.totalRepos ?? 0 },
        ]}
      />

      <StatPills
        label="Repo items"
        onNavigate={onNavigate}
        style={{ marginBottom: 32 }}
        items={[
          { label: 'Skills', value: data?.repoSkills ?? 0, section: 'skills' },
          { label: 'Commands', value: data?.repoCommands ?? 0, section: 'commands' },
          { label: 'Agents', value: data?.repoAgents ?? 0, section: 'agents' },
        ]}
      />


      {usage?.totalSessions > 0 && (
        <>
          <div className="overview-group-label">
            Insights{usage.dateFrom && usage.dateTo ? ` (${usage.dateFrom} \u2192 ${usage.dateTo})` : ''}
          </div>
          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card" style={{ cursor: 'default' }}>
              <div className="stat-number">{usage.totalSessions}</div>
              <div className="stat-label">Sessions</div>
            </div>
            <div className="stat-card" style={{ cursor: 'default' }}>
              <div className="stat-number">{usage.totalMessages.toLocaleString()}</div>
              <div className="stat-label">Messages</div>
            </div>
            <div className="stat-card" style={{ cursor: 'default' }}>
              <div className="stat-number">{usage.totalCommits}</div>
              <div className="stat-label">Commits</div>
            </div>
            <div className="stat-card" style={{ cursor: 'default' }}>
              <div className="stat-number">{usage.totalHours}</div>
              <div className="stat-label">Hours</div>
            </div>
          </div>

          {usage.topTools?.length > 0 && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Top Tools</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {usage.topTools.map(t => (
                  <span key={t.name} style={{
                    fontSize: 12, padding: '3px 9px',
                    background: 'var(--bg)', color: 'var(--text-secondary)', borderRadius: 0,
                  }}>
                    {t.name} <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t.count.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(usage.frictionCats || {}).length > 0 && (
            <div style={{
              background: 'rgba(217,119,6,0.04)', border: '1px solid rgba(217,119,6,0.15)',
              borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Top Friction Points</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(usage.frictionCats).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, count]) => (
                  <span key={cat} style={{
                    fontSize: 12, padding: '3px 9px',
                    background: 'var(--bg-card)', border: '1px solid rgba(217,119,6,0.25)',
                    color: 'var(--text)', borderRadius: 0,
                  }}>
                    {cat.replace(/_/g, ' ')} <span style={{ fontWeight: 600 }}>{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(usage.outcomes || {}).length > 0 && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 24,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Outcomes ({usage.analyzedSessions} analyzed)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(usage.outcomes).sort((a, b) => b[1] - a[1]).map(([outcome, count]) => {
                  const styles = {
                    fully_achieved:     { fg: 'var(--success)',      bg: 'var(--success-soft)' },
                    mostly_achieved:    { fg: 'var(--accent-light)', bg: 'var(--accent-soft)' },
                    partially_achieved: { fg: 'var(--warning)',      bg: 'var(--warning-soft)' },
                    not_achieved:       { fg: 'var(--danger)',       bg: 'var(--danger-soft)' },
                  };
                  const s = styles[outcome] || { fg: 'var(--text-tertiary)', bg: 'var(--border-light)' };
                  return (
                    <span key={outcome} style={{
                      fontSize: 12, padding: '3px 9px',
                      background: s.bg, color: s.fg, borderRadius: 0,
                    }}>
                      {outcome.replace(/_/g, ' ')} <span style={{ fontWeight: 600 }}>{count}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <PromptCard
        title="Full Claude Code health check"
        description="Ask Claude Code to audit your entire setup and give you a prioritized action plan."
        prompt={OVERVIEW_PROMPT}
      />
    </div>
  );
}

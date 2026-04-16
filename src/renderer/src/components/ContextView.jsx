import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const CONTEXT_PROMPT = `Analyze my Claude Code context management settings. Check my current model, thinking configuration, and autocompact threshold. Based on my typical usage patterns, recommend optimal settings for CLAUDE_AUTOCOMPACT_PCT_OVERRIDE, thinking tokens, and effort level. Also suggest if I should be using a different model for certain types of work.`;

function ConfigRow({ label, children }) {
  return (
    <div style={{
      display: 'flex', gap: 16, alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid var(--border-light)',
    }}>
      <div style={{ width: 200, flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
    </div>
  );
}

function Tag({ children, color = 'accent' }) {
  const colors = {
    accent: { bg: 'var(--accent-soft)', text: 'var(--accent-light)' },
    gray: { bg: 'var(--border-light)', text: 'var(--text-tertiary)' },
    green: { bg: 'var(--success-soft)', text: 'var(--success)' },
    red: { bg: 'var(--danger-soft)', text: 'var(--danger)' },
  };
  const c = colors[color] || colors.accent;
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 500, padding: '3px 9px',
      background: c.bg, color: c.text, borderRadius: 0,
    }}>
      {children}
    </span>
  );
}

const TIPS = [
  { title: 'Manual /compact at ~50% context', desc: 'Don\'t wait for auto-compaction. Run /compact proactively when you hit 50% to avoid the "dumb zone" where context is full but not yet compacted.' },
  { title: 'Use /context to visualize usage', desc: 'The /context command shows a colored grid of your context window, making it easy to see how much space is used.' },
  { title: 'Lower autocompact for long sessions', desc: 'Set CLAUDE_AUTOCOMPACT_PCT_OVERRIDE to 50 for earlier compaction during extended work.' },
  { title: 'Match model to task', desc: 'Start with Opus for planning and architecture decisions, then switch to Sonnet for faster execution on well-defined tasks.' },
  { title: 'Use /effort for quick adjustments', desc: 'Set /effort low for simple tasks, high or max for complex reasoning that benefits from extended thinking.' },
];

export default function ContextView() {
  const context = useApi('/context');

  if (context.loading) return <div className="loading">Loading</div>;
  if (context.error) return <div className="loading">Failed to load context settings</div>;

  const data = context.data || {};
  const env = data.env || {};

  return (
    <div>
      <div className="section-header">
        <h1>Context Management</h1>
        <p>Model, thinking, and compaction settings</p>
      </div>

      <div className="json-view" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 4 }}>Current Configuration</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Merged from global and local settings.
        </p>

        <ConfigRow label="Model">
          <Tag color={data.model ? 'accent' : 'gray'}>{data.model || 'not set (default)'}</Tag>
        </ConfigRow>

        <ConfigRow label="Effort Level">
          <Tag color={data.effortLevel ? 'accent' : 'gray'}>{data.effortLevel || 'not set'}</Tag>
        </ConfigRow>

        <ConfigRow label="Extended Thinking">
          {data.thinkingEnabled === true ? (
            <Tag color="green">enabled</Tag>
          ) : data.thinkingEnabled === false ? (
            <Tag color="gray">disabled</Tag>
          ) : (
            <Tag color="gray">not set</Tag>
          )}
        </ConfigRow>

        <ConfigRow label="Autocompact Threshold">
          <Tag color={env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE ? 'accent' : 'gray'}>
            {env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE ? `${env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE}%` : 'default (80%)'}
          </Tag>
        </ConfigRow>

        <ConfigRow label="Max Thinking Tokens">
          <Tag color={env.MAX_THINKING_TOKENS ? 'accent' : 'gray'}>
            {env.MAX_THINKING_TOKENS || 'default'}
          </Tag>
        </ConfigRow>

        <ConfigRow label="Max Context Tokens">
          <Tag color={env.CLAUDE_CODE_MAX_CONTEXT_TOKENS ? 'accent' : 'gray'}>
            {env.CLAUDE_CODE_MAX_CONTEXT_TOKENS || 'default (model limit)'}
          </Tag>
        </ConfigRow>

        <ConfigRow label="Prompt Caching">
          {env.DISABLE_PROMPT_CACHING ? (
            <Tag color="red">disabled</Tag>
          ) : (
            <Tag color="green">enabled</Tag>
          )}
        </ConfigRow>

        <ConfigRow label="Auto-compaction">
          {env.DISABLE_COMPACT ? (
            <Tag color="red">disabled</Tag>
          ) : (
            <Tag color="green">enabled</Tag>
          )}
        </ConfigRow>
      </div>

      <div className="json-view" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Tips</h3>
        {TIPS.map((tip, i) => (
          <div key={i} style={{
            padding: '10px 14px', marginBottom: 8,
            background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{tip.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip.desc}</div>
          </div>
        ))}
      </div>

      <PromptCard title="Optimize context settings" description="Ask Claude Code to recommend optimal settings for your workflow." prompt={CONTEXT_PROMPT} />
    </div>
  );
}

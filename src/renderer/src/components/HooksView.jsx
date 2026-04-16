import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const HOOKS_PROMPT = `Review all my Claude Code hooks across ~/.claude/settings.json, ~/.claude/settings.local.json, and my repo .claude/settings.json files. For each hook: check if it's still useful, if the command works correctly, and if there are automation opportunities I'm missing. Suggest new hooks for events I'm not using, especially PreToolUse guards, PostToolUse formatters, and Stop verification hooks.`;

const ALL_EVENTS = [
  'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'UserPromptSubmit',
  'PermissionRequest', 'PermissionDenied', 'Stop', 'StopFailure',
  'SessionStart', 'SessionEnd', 'Setup',
  'SubagentStart', 'SubagentStop',
  'PreCompact', 'PostCompact',
  'FileChanged', 'CwdChanged',
  'TaskCreated', 'TaskCompleted',
  'WorktreeCreate', 'WorktreeRemove',
  'Notification', 'InstructionsLoaded', 'ConfigChange',
  'Elicitation', 'ElicitationResult', 'TeammateIdle',
];

function SourceBadge({ source }) {
  const styles = {
    global:         { fg: 'var(--accent-light)',     bg: 'var(--accent-soft)' },
    'global-local': { fg: 'var(--warning)',          bg: 'var(--warning-soft)' },
    repo:           { fg: 'var(--accent-secondary)', bg: 'var(--accent-soft)' },
    'repo-local':   { fg: '#7c3aed',                 bg: 'rgba(124,58,237,0.08)' },
  };
  const s = styles[source] || { fg: 'var(--text-tertiary)', bg: 'var(--border-light)' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px',
      background: s.bg, color: s.fg, borderRadius: 0,
    }}>
      {source}
    </span>
  );
}

function HookCard({ hookGroup, source }) {
  const hooks = hookGroup.hooks || [hookGroup];
  const matcher = hookGroup.matcher;

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <SourceBadge source={source.source} />
        {source.repoName && (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{source.repoName}</span>
        )}
        {matcher && (
          <span style={{
            fontSize: 11, color: 'var(--text-secondary)',
            background: 'var(--border-light)', padding: '2px 7px', borderRadius: 0,
          }}>
            matcher: {matcher.tool_name || matcher.file_paths?.join(', ') || JSON.stringify(matcher)}
          </span>
        )}
      </div>
      {hooks.map((hook, i) => (
        <div key={i} style={{
          padding: '8px 12px', background: 'var(--bg)',
          borderRadius: 'var(--radius-sm)', marginBottom: i < hooks.length - 1 ? 6 : 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '1px 6px',
              background: 'var(--border-light)', color: 'var(--text-secondary)', borderRadius: 0,
            }}>
              {hook.type || 'command'}
            </span>
            {hook.timeout && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{hook.timeout}ms</span>
            )}
            {hook.async && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>async</span>
            )}
          </div>
          {hook.command && (
            <code style={{ fontSize: 12, color: 'var(--text)', wordBreak: 'break-all' }}>
              {hook.command}
            </code>
          )}
          {hook.statusMessage && (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Status: {hook.statusMessage}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HooksView() {
  const hooks = useApi('/hooks');
  const [search, setSearch] = useState('');

  if (hooks.loading) return <div className="loading">Loading</div>;
  if (hooks.error) return <div className="loading">Failed to load hooks</div>;

  const data = hooks.data || { sources: [], allEvents: [], totalHooks: 0 };
  const { sources, allEvents, totalHooks } = data;

  if (!totalHooks) {
    return (
      <div>
        <div className="section-header">
          <h1>Hooks</h1>
          <p>No hooks configured</p>
        </div>
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u21BB'}</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No hooks found</div>
          <div style={{ fontSize: 13, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Hooks are automations that run on specific events like PreToolUse, PostToolUse, Stop, and more.
            Configure them in <code>settings.json</code> under the <code>hooks</code> key.
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {ALL_EVENTS.slice(0, 12).map(e => (
              <span key={e} style={{
                fontSize: 11, padding: '2px 8px',
                background: 'var(--border-light)', color: 'var(--text-tertiary)', borderRadius: 0,
              }}>
                {e}
              </span>
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '2px 0' }}>
              +{ALL_EVENTS.length - 12} more
            </span>
          </div>
        </div>
        <PromptCard title="Set up hooks" description="Ask Claude Code to configure automation hooks." prompt={HOOKS_PROMPT} />
      </div>
    );
  }

  const q = search.toLowerCase();
  const filteredEvents = allEvents.filter(event => {
    if (q && !event.toLowerCase().includes(q)) {
      const hasMatchingHook = sources.some(s => {
        const groups = s.hooks[event];
        if (!Array.isArray(groups)) return false;
        return groups.some(g => {
          const hks = g.hooks || [g];
          return hks.some(h => h.command?.toLowerCase().includes(q));
        });
      });
      if (!hasMatchingHook) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="section-header">
        <h1>Hooks</h1>
        <p>{totalHooks} hook{totalHooks !== 1 ? 's' : ''} across {allEvents.length} event{allEvents.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by event or command..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search hooks"
        />
      </div>

      {filteredEvents.map(event => {
        const hookEntries = sources
          .filter(s => s.hooks[event])
          .flatMap(s => (s.hooks[event] || []).map(g => ({ group: g, source: s })));

        if (!hookEntries.length) return null;

        return (
          <div key={event} style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: 'var(--text)',
              }}>
                {event}
              </span>
              <span style={{
                fontSize: 11, color: 'var(--text-tertiary)',
                background: 'var(--border-light)', padding: '1px 7px', borderRadius: 0,
              }}>
                {hookEntries.length}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            </div>
            {hookEntries.map((entry, i) => (
              <HookCard key={i} hookGroup={entry.group} source={entry.source} />
            ))}
          </div>
        );
      })}

      <PromptCard title="Review your hooks" description="Ask Claude Code to audit your hooks and suggest new automations." prompt={HOOKS_PROMPT} />
    </div>
  );
}

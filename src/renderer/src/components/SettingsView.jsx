import { useState } from 'react';
import { useApi } from '../hooks/useApi';

// ─── Known built-in tools ────────────────────────────────────────────────────

const BUILTIN_TOOLS = [
  { name: 'Bash',         desc: 'Run shell commands. The most powerful — and most dangerous — tool.' },
  { name: 'Read',         desc: 'Read the contents of files on your filesystem.' },
  { name: 'Write',        desc: 'Create new files or fully overwrite existing ones.' },
  { name: 'Edit',         desc: 'Make targeted string replacements in existing files.' },
  { name: 'MultiEdit',    desc: 'Apply multiple edits to a single file in one operation.' },
  { name: 'Glob',         desc: 'Find files by name pattern (e.g. **/*.ts).' },
  { name: 'Grep',         desc: 'Search file contents using regex.' },
  { name: 'LS',           desc: 'List files and directories at a given path.' },
  { name: 'WebFetch',     desc: 'Fetch the contents of a URL — docs, APIs, pages.' },
  { name: 'WebSearch',    desc: 'Search the web and return results.' },
  { name: 'Task',         desc: 'Spawn a subagent to handle complex parallel or isolated tasks.' },
  { name: 'Agent',        desc: 'Launch a specialized agent with its own tool access.' },
  { name: 'TodoWrite',    desc: 'Create and manage a task list within a session.' },
  { name: 'NotebookRead', desc: 'Read Jupyter notebook cells and their outputs.' },
  { name: 'NotebookEdit', desc: 'Edit cells in a Jupyter notebook.' },
];

// ─── Permission matching ─────────────────────────────────────────────────────

function matchesPattern(toolName, pattern) {
  // mcp tool: check prefix wildcard e.g. mcp__server__*
  if (toolName.startsWith('mcp__') || pattern.includes('__')) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      return toolName.startsWith(prefix)
    }
    return toolName === pattern
  }
  // Extract base tool name from pattern like "Bash(*)" or "Bash(git *)"
  const base = pattern.replace(/\(.*\)$/, '')
  return base === toolName || pattern === toolName
}

function getStatus(toolName, allow, deny) {
  if (deny?.some(p => matchesPattern(toolName, p))) return 'denied'
  if (allow?.some(p => matchesPattern(toolName, p))) {
    // Find the matching pattern to show scope
    const match = allow.find(p => matchesPattern(toolName, p))
    const scope = match?.match(/\((.+)\)/)?.[1] || null
    return { status: 'allowed', scope }
  }
  return { status: 'default' }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const STATUS_STYLES = {
  allowed: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', badge: '#059669', badgeBg: 'rgba(16,185,129,0.12)', label: 'Allowed' },
  denied:  { bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.2)',  badge: '#dc2626', badgeBg: 'rgba(239,68,68,0.1)',  label: 'Denied' },
  default: { bg: 'var(--bg)',             border: 'var(--border)',         badge: '#9ca3af', badgeBg: 'var(--border-light)', label: 'Prompts you' },
};

const TOGGLE_OPTIONS = [
  { value: 'allowed', label: 'Allow',   activeColor: '#059669', activeBg: 'rgba(16,185,129,0.85)' },
  { value: 'default', label: 'Default', activeColor: '#6b7280', activeBg: 'rgba(107,114,128,0.75)' },
  { value: 'denied',  label: 'Deny',    activeColor: '#dc2626', activeBg: 'rgba(239,68,68,0.85)'  },
];

function PermissionToggle({ status, onChange }) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 100, overflow: 'hidden', flexShrink: 0, alignSelf: 'center' }}>
      {TOGGLE_OPTIONS.map((opt, i) => {
        const active = status === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '4px 11px',
              fontSize: 11,
              fontWeight: 600,
              border: 'none',
              borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer',
              background: active ? opt.activeBg : 'transparent',
              color: active ? '#fff' : 'var(--text-tertiary)',
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ToolRow({ name, desc, allow, deny, onToggle }) {
  const result = getStatus(name, allow, deny)
  const s = typeof result === 'string' ? { status: result } : result
  const style = STATUS_STYLES[s.status]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            {name}
          </span>
          {s.scope && s.scope !== '*' && (
            <span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--border-light)', padding: '1px 7px', borderRadius: 100 }}>
              {s.scope}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <PermissionToggle status={s.status} onChange={newStatus => onToggle(name, newStatus)} />
    </div>
  );
}

function McpServerRow({ serverKey, info, allow, deny }) {
  const toolPrefix = `mcp__${serverKey}__`
  const wildcardPattern = `${toolPrefix}*`
  const isAllowed = allow?.some(p => p === wildcardPattern || (p.endsWith('*') && wildcardPattern.startsWith(p.slice(0, -1))))
  const isDenied = deny?.some(p => p === wildcardPattern || (p.endsWith('*') && wildcardPattern.startsWith(p.slice(0, -1))))
  const s = isDenied ? 'denied' : isAllowed ? 'allowed' : 'default'
  const style = STATUS_STYLES[s]

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 14px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            {info.plugin}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--border-light)', padding: '1px 7px', borderRadius: 100 }}>
            {info.registry}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontFamily: "'SF Mono','Fira Code',monospace" }}>
          mcp__{serverKey}__*
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: style.badge, background: style.badgeBg, padding: '3px 9px', borderRadius: 100, flexShrink: 0, marginTop: 2 }}>
        {style.label}
      </span>
    </div>
  );
}

function Tag({ children, color = 'accent' }) {
  const styles = {
    accent: { background: 'rgba(139,92,246,0.1)', color: '#7c3aed' },
    green:  { background: 'rgba(16,185,129,0.1)', color: '#059669' },
    red:    { background: 'rgba(239,68,68,0.1)',  color: '#dc2626' },
    gray:   { background: 'var(--border-light)',   color: 'var(--text-tertiary)' },
  };
  return (
    <span style={{ ...styles[color], fontSize: 11.5, fontWeight: 500, padding: '3px 9px', borderRadius: 100, fontFamily: "'SF Mono','Fira Code',monospace" }}>
      {children}
    </span>
  );
}

function StructuredRow({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ width: 160, flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', paddingTop: 2 }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
    </div>
  );
}

function StructuredSettings({ settings }) {
  if (!settings) return null;
  const rows = [];

  if (settings.model) {
    rows.push(
      <StructuredRow key="model" label="Model">
        <Tag color="accent">{settings.model}</Tag>
      </StructuredRow>
    );
  }

  const hooks = settings?.hooks || {};
  const hookEvents = Object.keys(hooks);
  if (hookEvents.length > 0) {
    rows.push(
      <StructuredRow key="hooks" label="Hooks">
        {hookEvents.map(event => {
          const count = Array.isArray(hooks[event]) ? hooks[event].length : 0;
          return <Tag key={event} color="gray">{event} ({count})</Tag>;
        })}
      </StructuredRow>
    );
  }

  if (settings.cleanupPeriodDays !== undefined) {
    rows.push(
      <StructuredRow key="cleanup" label="Cleanup Period">
        <Tag color="gray">{settings.cleanupPeriodDays} days</Tag>
      </StructuredRow>
    );
  }

  if (settings.apiKeyHelper) {
    rows.push(
      <StructuredRow key="apikey" label="API Key Helper">
        <Tag color="gray">{settings.apiKeyHelper}</Tag>
      </StructuredRow>
    );
  }

  if (settings.includeCoAuthoredBy !== undefined) {
    rows.push(
      <StructuredRow key="coauthor" label="Co-Authored By">
        <Tag color={settings.includeCoAuthoredBy ? 'green' : 'gray'}>
          {settings.includeCoAuthoredBy ? 'enabled' : 'disabled'}
        </Tag>
      </StructuredRow>
    );
  }

  if (rows.length === 0) return null;

  return (
    <div className="json-view" style={{ marginBottom: 0 }}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 4 }}>
        <h3 style={{ marginBottom: 0 }}>Settings</h3>
      </div>
      {rows}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const ACTION_MAP = { allowed: 'allow', denied: 'deny', default: 'default' };

export default function SettingsView() {
  const settings = useApi('/settings');
  const plugins = useApi('/plugins');
  const perms = useApi('/permissions');
  const [localPerms, setLocalPerms] = useState(null);

  const loading = settings.loading || plugins.loading || perms.loading;
  if (loading) return <div className="loading">Loading</div>;

  const globalSettings = settings.data?.global;
  const localSettings = settings.data?.local;
  const dangerMode = globalSettings?.skipDangerousModePermissionPrompt || localSettings?.skipDangerousModePermissionPrompt
    || globalSettings?.dangerouslySkipPermissions || localSettings?.dangerouslySkipPermissions;

  // Read allow/deny directly from settings (already fetched) — don't depend on perms endpoint for these
  const fetchedAllow = [
    ...(globalSettings?.permissions?.allow || []),
    ...(localSettings?.permissions?.allow || []),
  ];
  const fetchedDeny = [
    ...(globalSettings?.permissions?.deny || []),
    ...(localSettings?.permissions?.deny || []),
  ];
  // Use local state after first toggle; fall back to fetched values
  const allow = localPerms?.allow ?? fetchedAllow;
  const deny = localPerms?.deny ?? fetchedDeny;
  const mcpServers = perms.data?.mcpServers || {};

  async function handleToggle(toolName, newStatus) {
    const baseAllow = localPerms?.allow ?? fetchedAllow;
    const baseDeny = localPerms?.deny ?? fetchedDeny;
    const nextAllow = baseAllow.filter(p => p.replace(/\(.*\)$/, '') !== toolName);
    const nextDeny = baseDeny.filter(p => p.replace(/\(.*\)$/, '') !== toolName);
    if (newStatus === 'allowed') nextAllow.push(`${toolName}(*)`);
    else if (newStatus === 'denied') nextDeny.push(toolName);
    setLocalPerms({ allow: nextAllow, deny: nextDeny });
    await window.api.invoke('/api/settings/permissions/update', { tool: toolName, action: ACTION_MAP[newStatus] });
  }

  return (
    <div>
      <div className="section-header">
        <h1>Settings</h1>
        <p>Global Claude Code configuration</p>
      </div>

      {dangerMode && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(217,119,87,0.15))',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 'var(--radius)',
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 13.5, fontWeight: 600, color: 'var(--text)',
        }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          dangerouslySkipPermissions is on. Yay, you're awesome.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {globalSettings && <StructuredSettings settings={globalSettings} />}

        {/* Permission matrix — built-in tools */}
        <div className="json-view">
          <h3 style={{ marginBottom: 4 }}>Built-in Tools</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Every tool Claude Code can use. Status is derived from your allow/deny lists — anything not listed will prompt you at runtime.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {BUILTIN_TOOLS.map(t => (
              <ToolRow key={t.name} name={t.name} desc={t.desc} allow={allow} deny={deny} onToggle={handleToggle} />
            ))}
          </div>
        </div>

        {/* MCP servers */}
        {Object.keys(mcpServers).length > 0 && (
          <div className="json-view">
            <h3 style={{ marginBottom: 4 }}>MCP Servers</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Installed plugins that provide MCP tools. Permission covers all tools from that server (<code>mcp__server__*</code>).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(mcpServers).map(([key, info]) => (
                <McpServerRow key={key} serverKey={key} info={info} allow={allow} deny={deny} />
              ))}
            </div>
          </div>
        )}

        {/* Plugins */}
        {plugins.data?.installed?.plugins && (() => {
          const entries = Object.entries(plugins.data.installed.plugins);
          if (!entries.length) return null;
          return (
            <div className="json-view">
              <h3 style={{ marginBottom: 12 }}>Plugins</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entries.map(([key, installs]) => {
                  const [name, registry] = key.split('@');
                  const info = installs?.[0] || {};
                  const date = info.installedAt ? new Date(info.installedAt).toLocaleDateString() : null;
                  return (
                    <div key={key} style={{
                      background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)',
                      borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--border-light)', padding: '1px 7px', borderRadius: 100 }}>{registry}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
                          {info.version && info.version !== 'unknown' && <span>v{info.version}</span>}
                          {date && <span>Installed {date}</span>}
                          {info.scope && <span>{info.scope}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {globalSettings && (
          <div className="json-view">
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, userSelect: 'none' }}>settings.json (raw)</summary>
              <pre style={{ marginTop: 12 }}>{JSON.stringify(globalSettings, null, 2)}</pre>
            </details>
          </div>
        )}
        {localSettings && (
          <div className="json-view">
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, userSelect: 'none' }}>settings.local.json (raw)</summary>
              <pre style={{ marginTop: 12 }}>{JSON.stringify(localSettings, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

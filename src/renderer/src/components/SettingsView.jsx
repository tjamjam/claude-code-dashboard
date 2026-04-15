import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

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
  if (toolName.startsWith('mcp__') || pattern.includes('__')) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      return toolName.startsWith(prefix)
    }
    return toolName === pattern
  }
  const base = pattern.replace(/\(.*\)$/, '')
  return base === toolName || pattern === toolName
}

function getStatus(toolName, allow, deny) {
  if (deny?.some(p => matchesPattern(toolName, p))) return 'denied'
  if (allow?.some(p => matchesPattern(toolName, p))) {
    const match = allow.find(p => matchesPattern(toolName, p))
    const scope = match?.match(/\((.+)\)/)?.[1] || null
    return { status: 'allowed', scope }
  }
  return { status: 'default' }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const STATUS_LABELS = { allowed: 'Allowed', denied: 'Denied', default: 'Prompts you' };
const STATUS_CLASSES = { allowed: 'status-allowed', denied: 'status-denied', default: 'status-default' };

function ToolRow({ name, desc, allow, deny }) {
  const result = getStatus(name, allow, deny)
  const s = typeof result === 'string' ? { status: result } : result
  return (
    <div className={STATUS_CLASSES[s.status]} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            {name}
          </span>
          {s.scope && s.scope !== '*' && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--border-light)', padding: '1px 7px', borderRadius: 100 }}>
              {s.scope}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <span className="status-badge" style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, flexShrink: 0 }}>
        {STATUS_LABELS[s.status]}
      </span>
    </div>
  );
}

function McpServerRow({ serverKey, info, allow, deny }) {
  const toolPrefix = `mcp__${serverKey}__`
  const wildcardPattern = `${toolPrefix}*`
  const isAllowed = allow?.some(p => p === wildcardPattern || (p.endsWith('*') && wildcardPattern.startsWith(p.slice(0, -1))))
  const isDenied = deny?.some(p => p === wildcardPattern || (p.endsWith('*') && wildcardPattern.startsWith(p.slice(0, -1))))
  const s = isDenied ? 'denied' : isAllowed ? 'allowed' : 'default'

  return (
    <div className={STATUS_CLASSES[s]} style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 14px',
      borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            {info.plugin}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--border-light)', padding: '1px 7px', borderRadius: 100 }}>
            {info.registry}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
          mcp__{serverKey}__*
        </div>
      </div>
      <span className="status-badge" style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, flexShrink: 0, marginTop: 2 }}>
        {STATUS_LABELS[s]}
      </span>
    </div>
  );
}

const TAG_CLASSES = { accent: 'tag-accent', green: 'tag-green', red: 'tag-red', gray: 'tag-gray' };

function Tag({ children, color = 'accent' }) {
  return (
    <span className={TAG_CLASSES[color] || 'tag-accent'} style={{ fontSize: 11.5, fontWeight: 500, padding: '3px 9px', borderRadius: 100 }}>
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

// ─── Prompt for changing permissions ─────────────────────────────────────────

const PERMISSIONS_PROMPT = `Review my current Claude Code permissions in ~/.claude/settings.json. Show me what's currently allowed and denied, then ask which tools I'd like to change. Update the permissions.allow and permissions.deny arrays in settings.json based on my answers.`;

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsView() {
  const settings = useApi('/settings');
  const plugins = useApi('/plugins');
  const perms = useApi('/permissions');

  const loading = settings.loading || plugins.loading || perms.loading;
  if (loading) return <div className="loading">Loading</div>;
  if (settings.error || plugins.error || perms.error) return <div className="loading">Failed to load settings</div>;

  const globalSettings = settings.data?.global;
  const localSettings = settings.data?.local;
  const skipPrompt = globalSettings?.skipDangerousModePermissionPrompt || localSettings?.skipDangerousModePermissionPrompt;

  const allow = [
    ...(globalSettings?.permissions?.allow || []),
    ...(localSettings?.permissions?.allow || []),
  ];
  const deny = [
    ...(globalSettings?.permissions?.deny || []),
    ...(localSettings?.permissions?.deny || []),
  ];
  const mcpServers = perms.data?.mcpServers || {};

  return (
    <div>
      <div className="section-header">
        <h1>Settings</h1>
        <p>Global Claude Code configuration</p>
      </div>

      {skipPrompt && (
        <div style={{
          background: 'rgba(217,119,6,0.08)',
          border: '1px solid rgba(217,119,6,0.2)',
          borderRadius: 'var(--radius)',
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 13, color: 'var(--text)',
        }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <div>
            <span style={{ fontWeight: 600 }}>skipDangerousModePermissionPrompt</span> is on.
            <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>
              Sessions launched with <code style={{ fontSize: 12 }}>--dangerously-skip-permissions</code> won't show the safety confirmation.
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {globalSettings && <StructuredSettings settings={globalSettings} />}

        {/* Permission matrix — built-in tools */}
        <div className="json-view">
          <h3 style={{ marginBottom: 4 }}>Built-in Tools</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Current permission status for each tool. Use the prompt below to modify these in a Claude Code session.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {BUILTIN_TOOLS.map(t => (
              <ToolRow key={t.name} name={t.name} desc={t.desc} allow={allow} deny={deny} />
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
                    <div key={key} className="plugin-card" style={{
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

        <PromptCard
          title="Change permissions"
          description="Copy this prompt into a Claude Code session to update your tool permissions."
          prompt={PERMISSIONS_PROMPT}
        />

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

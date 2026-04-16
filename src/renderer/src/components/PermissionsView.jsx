import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const PERMISSIONS_PROMPT = `Audit my Claude Code permissions across all settings files (global, local, and per-repo). Show the full effective permission set: what's allowed, denied, and what still prompts. Check if I have any overly broad permissions (like Bash(*)) that should be scoped more tightly, and if I'm missing permissions for tools I use frequently. Also review my sandbox configuration if present.`;

const BUILTIN_TOOLS = [
  { name: 'Bash', desc: 'Run shell commands' },
  { name: 'Read', desc: 'Read file contents' },
  { name: 'Write', desc: 'Create or overwrite files' },
  { name: 'Edit', desc: 'Targeted string replacements' },
  { name: 'MultiEdit', desc: 'Multiple edits in one file' },
  { name: 'Glob', desc: 'Find files by pattern' },
  { name: 'Grep', desc: 'Search file contents' },
  { name: 'LS', desc: 'List directory contents' },
  { name: 'WebFetch', desc: 'Fetch URL contents' },
  { name: 'WebSearch', desc: 'Search the web' },
  { name: 'Task', desc: 'Spawn a subagent' },
  { name: 'Agent', desc: 'Launch a specialized agent' },
  { name: 'TodoWrite', desc: 'Manage a task list' },
  { name: 'NotebookRead', desc: 'Read Jupyter notebooks' },
  { name: 'NotebookEdit', desc: 'Edit notebook cells' },
];

const STATUS_LABELS = { allowed: 'Allowed', denied: 'Denied', default: 'Prompts you' };
const STATUS_CLASSES = { allowed: 'status-allowed', denied: 'status-denied', default: 'status-default' };

function getStatus(toolName, allow, deny) {
  if (deny?.some(p => {
    const base = p.replace(/\(.*\)$/, '');
    return base === toolName || p === toolName;
  })) return { status: 'denied' };
  const match = allow?.find(p => {
    const base = p.replace(/\(.*\)$/, '');
    return base === toolName || p === toolName;
  });
  if (match) {
    const scope = match.match(/\((.+)\)/)?.[1] || null;
    return { status: 'allowed', scope };
  }
  return { status: 'default' };
}

function ToolRow({ name, desc, allow, deny }) {
  const s = getStatus(name, allow, deny);
  return (
    <div className={STATUS_CLASSES[s.status]} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 14px', borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{name}</span>
          {s.scope && s.scope !== '*' && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--border-light)', padding: '1px 7px', borderRadius: 0 }}>{s.scope}</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</div>
      </div>
      <span className="status-badge" style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 0, flexShrink: 0 }}>
        {STATUS_LABELS[s.status]}
      </span>
    </div>
  );
}

function LayerCard({ layer }) {
  const allow = layer.permissions?.allow || [];
  const deny = layer.permissions?.deny || [];
  const hasContent = allow.length > 0 || deny.length > 0 || layer.sandbox || layer.skipDangerousMode;
  if (!hasContent) return null;

  return (
    <div className="json-view" style={{ marginBottom: 12 }}>
      <details>
        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, userSelect: 'none' }}>
          {layer.label}
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8, fontWeight: 400 }}>
            {allow.length} allow, {deny.length} deny
          </span>
        </summary>
        <div style={{ marginTop: 12 }}>
          {allow.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Allow</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {allow.map((p, i) => (
                  <code key={i} style={{ fontSize: 12, padding: '3px 8px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: 0 }}>{p}</code>
                ))}
              </div>
            </div>
          )}
          {deny.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Deny</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {deny.map((p, i) => (
                  <code key={i} style={{ fontSize: 12, padding: '3px 8px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 0 }}>{p}</code>
                ))}
              </div>
            </div>
          )}
          {layer.skipDangerousMode && (
            <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>skipDangerousModePermissionPrompt is enabled</div>
          )}
        </div>
      </details>
    </div>
  );
}

function SandboxSection({ layers }) {
  const sandboxLayers = layers.filter(l => l.sandbox);
  if (!sandboxLayers.length) return null;

  return (
    <div className="json-view" style={{ marginTop: 20 }}>
      <h3 style={{ marginBottom: 12 }}>Sandbox Configuration</h3>
      {sandboxLayers.map((layer, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{layer.label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', width: 140 }}>Enabled</span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 0,
                color: layer.sandbox.enabled ? 'var(--success)' : 'var(--text-tertiary)',
                background: layer.sandbox.enabled ? 'var(--success-soft)' : 'var(--border-light)',
              }}>
                {layer.sandbox.enabled ? 'Yes' : 'No'}
              </span>
            </div>
            {layer.sandbox.excludedCommands?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', width: 140, flexShrink: 0 }}>Excluded commands</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {layer.sandbox.excludedCommands.map((cmd, j) => (
                    <code key={j} style={{ fontSize: 12, padding: '2px 6px', background: 'var(--border-light)', borderRadius: 0 }}>{cmd}</code>
                  ))}
                </div>
              </div>
            )}
            {layer.sandbox.network && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', width: 140, flexShrink: 0 }}>Network</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {layer.sandbox.network.allowedDomains?.join(', ') || 'no domains'}
                  {layer.sandbox.network.allowLocalBinding !== undefined && `, local binding: ${layer.sandbox.network.allowLocalBinding}`}
                </span>
              </div>
            )}
            {layer.sandbox.filesystem && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', width: 140, flexShrink: 0 }}>Filesystem</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {layer.sandbox.filesystem.denyRead?.length ? `deny read: ${layer.sandbox.filesystem.denyRead.join(', ')}` : ''}
                  {layer.sandbox.filesystem.denyWrite?.length ? ` deny write: ${layer.sandbox.filesystem.denyWrite.join(', ')}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PermissionsView() {
  const perms = useApi('/permissions-full');
  const [search, setSearch] = useState('');

  if (perms.loading) return <div className="loading">Loading</div>;
  if (perms.error) return <div className="loading">Failed to load permissions</div>;

  const data = perms.data || { layers: [], effectiveAllow: [], effectiveDeny: [], hasSandbox: false, hasSkipDangerous: false };
  const q = search.toLowerCase();

  const filteredTools = BUILTIN_TOOLS.filter(t =>
    !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
  );

  return (
    <div>
      <div className="section-header">
        <h1>Permissions</h1>
        <p>{data.layers.length} settings source{data.layers.length !== 1 ? 's' : ''} with permissions</p>
      </div>

      {data.hasSkipDangerous && (
        <div style={{
          background: 'var(--warning-soft)', border: '1px solid rgba(217,119,6,0.2)',
          borderRadius: 'var(--radius)', padding: '14px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text)',
        }}>
          <span style={{ fontSize: 18 }}>{'\u26A0'}</span>
          <div>
            <span style={{ fontWeight: 600 }}>skipDangerousModePermissionPrompt</span> is on.
            <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>
              The safety confirmation is suppressed when launching with <code style={{ fontSize: 12 }}>--dangerously-skip-permissions</code>.
            </span>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search permissions"
        />
      </div>

      <div className="json-view" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 4 }}>Effective Permissions</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Merged from all {data.layers.length} settings source{data.layers.length !== 1 ? 's' : ''}.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filteredTools.map(t => (
            <ToolRow key={t.name} name={t.name} desc={t.desc} allow={data.effectiveAllow} deny={data.effectiveDeny} />
          ))}
        </div>
      </div>

      {data.layers.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Permission Layers</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Higher layers override lower ones. Deny rules always take precedence over allow.
          </p>
          {data.layers.map((layer, i) => (
            <LayerCard key={i} layer={layer} />
          ))}
        </div>
      )}

      <SandboxSection layers={data.layers} />

      <PromptCard title="Audit your permissions" description="Ask Claude Code to review and optimize your permission configuration." prompt={PERMISSIONS_PROMPT} />
    </div>
  );
}

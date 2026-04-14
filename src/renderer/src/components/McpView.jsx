import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const MCP_PROMPT = `Review my installed MCP servers and their configurations. Check which ones are actively connected, whether their permissions are correctly scoped, and if there are useful MCP servers I'm missing. Suggest any configuration improvements.`;

const STATUS_LABELS = { allowed: 'Allowed', denied: 'Denied', default: 'Prompts you' };
const STATUS_CLASSES = { allowed: 'status-allowed', denied: 'status-denied', default: 'status-default' };

function getServerPermission(serverKey, allow, deny) {
  const wildcard = `mcp__${serverKey}__*`;
  const isDenied = deny?.some(p => p === wildcard || (p.endsWith('*') && wildcard.startsWith(p.slice(0, -1))));
  const isAllowed = allow?.some(p => p === wildcard || (p.endsWith('*') && wildcard.startsWith(p.slice(0, -1))));
  return isDenied ? 'denied' : isAllowed ? 'allowed' : 'default';
}

function ServerCard({ serverKey, info, status }) {
  const config = info.config || {};
  const isRemote = config.type === 'http' || config.url;
  const connectionType = isRemote ? 'HTTP' : 'Local';

  return (
    <div className={STATUS_CLASSES[status]} style={{
      borderRadius: 'var(--radius)',
      padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: "'SF Mono','Fira Code',monospace",
            fontSize: 14, fontWeight: 700, color: 'var(--text)',
          }}>
            {info.plugin}
          </span>
          <span style={{
            fontSize: 11, color: 'var(--text-tertiary)',
            background: 'var(--border-light)',
            padding: '2px 8px', borderRadius: 100,
          }}>
            {info.registry}
          </span>
        </div>
        <span className="status-badge" style={{
          fontSize: 11, fontWeight: 600,
          padding: '3px 10px', borderRadius: 100,
        }}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', width: 80 }}>Type</span>
          <span className={isRemote ? 'accent-badge' : ''} style={{
            fontSize: 11.5, fontFamily: "'SF Mono','Fira Code',monospace",
            color: isRemote ? undefined : 'var(--text-secondary)',
            background: isRemote ? undefined : 'var(--border-light)',
            padding: '2px 8px', borderRadius: 4,
          }}>
            {connectionType}
          </span>
        </div>

        {isRemote && config.url && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', width: 80 }}>URL</span>
            <span style={{
              fontSize: 11.5, fontFamily: "'SF Mono','Fira Code',monospace",
              color: 'var(--text-secondary)',
            }}>
              {config.url}
            </span>
          </div>
        )}

        {!isRemote && config.command && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', width: 80 }}>Command</span>
            <span style={{
              fontSize: 11.5, fontFamily: "'SF Mono','Fira Code',monospace",
              color: 'var(--text-secondary)',
            }}>
              {config.command} {(config.args || []).join(' ')}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', width: 80 }}>Prefix</span>
          <span style={{
            fontSize: 11.5, fontFamily: "'SF Mono','Fira Code',monospace",
            color: 'var(--text-tertiary)',
          }}>
            mcp__{serverKey}__*
          </span>
        </div>
      </div>

      {config.note && (
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: '1px solid var(--border-light)',
          fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55,
        }}>
          {config.note}
        </div>
      )}
    </div>
  );
}

export default function McpView() {
  const perms = useApi('/permissions');
  const settings = useApi('/settings');

  const loading = perms.loading || settings.loading;
  if (loading) return <div className="loading">Loading</div>;
  if (perms.error || settings.error) return <div className="loading">Failed to load MCP servers</div>;

  const mcpServers = perms.data?.mcpServers || {};
  const entries = Object.entries(mcpServers);

  const globalSettings = settings.data?.global;
  const localSettings = settings.data?.local;
  const allow = [
    ...(globalSettings?.permissions?.allow || []),
    ...(localSettings?.permissions?.allow || []),
  ];
  const deny = [
    ...(globalSettings?.permissions?.deny || []),
    ...(localSettings?.permissions?.deny || []),
  ];

  return (
    <div>
      <div className="section-header">
        <h1>MCP Servers</h1>
        <p>{entries.length} server{entries.length !== 1 ? 's' : ''} installed</p>
      </div>

      {entries.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map(([key, info]) => (
            <ServerCard
              key={key}
              serverKey={key}
              info={info}
              status={getServerPermission(key, allow, deny)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 12 }}>&#x1F50C;</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No MCP servers installed</div>
          <div style={{ fontSize: 13, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            MCP servers extend Claude Code with external tools — Playwright for browser automation,
            Slack for messaging, databases, and more. Install plugins with <code>/install-plugin</code>.
          </div>
        </div>
      )}

      <PromptCard
        title="Review your MCP setup"
        description="Ask Claude Code to check your MCP servers, their permissions, and suggest useful ones you might be missing."
        prompt={MCP_PROMPT}
      />
    </div>
  );
}

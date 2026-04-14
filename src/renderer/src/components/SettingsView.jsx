import { useApi } from '../hooks/useApi';

function Tag({ children, color = 'accent' }) {
  const styles = {
    accent: { background: 'rgba(139,92,246,0.1)', color: '#7c3aed' },
    green:  { background: 'rgba(16,185,129,0.1)', color: '#059669' },
    red:    { background: 'rgba(239,68,68,0.1)',  color: '#dc2626' },
    gray:   { background: 'var(--border-light)',   color: 'var(--text-tertiary)' },
  };
  return (
    <span style={{
      ...styles[color],
      fontSize: 11.5,
      fontWeight: 500,
      padding: '3px 9px',
      borderRadius: 100,
      fontFamily: "'SF Mono', 'Fira Code', monospace",
    }}>
      {children}
    </span>
  );
}

function StructuredRow({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ width: 160, flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', paddingTop: 2 }}>
        {label}
      </div>
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {children}
      </div>
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

  const allowed = settings?.permissions?.allow || [];
  if (allowed.length > 0) {
    rows.push(
      <StructuredRow key="allow" label="Allowed Tools">
        {allowed.map(t => <Tag key={t} color="green">{t}</Tag>)}
      </StructuredRow>
    );
  }

  const denied = settings?.permissions?.deny || [];
  if (denied.length > 0) {
    rows.push(
      <StructuredRow key="deny" label="Denied Tools">
        {denied.map(t => <Tag key={t} color="red">{t}</Tag>)}
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

  if (settings.dangerouslySkipPermissions) {
    rows.push(
      <StructuredRow key="skip" label="Skip Permissions">
        <Tag color="red">dangerouslySkipPermissions</Tag>
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

export default function SettingsView() {
  const settings = useApi('/settings');
  const plugins = useApi('/plugins');

  const loading = settings.loading || plugins.loading;
  if (loading) return <div className="loading">Loading</div>;

  const globalSettings = settings.data?.global;
  const localSettings = settings.data?.local;

  return (
    <div>
      <div className="section-header">
        <h1>Settings</h1>
        <p>Global Claude Code configuration</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Structured view of global settings */}
        {globalSettings && <StructuredSettings settings={globalSettings} />}

        {/* Plugins structured */}
        {plugins.data?.installed && (() => {
          const installed = plugins.data.installed;
          const pluginList = Array.isArray(installed)
            ? installed
            : Object.entries(installed).map(([k, v]) => ({ name: k, ...v }));
          if (!pluginList.length) return null;
          return (
            <div className="json-view">
              <h3>Plugins</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {pluginList.map((p, i) => (
                  <Tag key={i} color={p.enabled === false ? 'gray' : 'accent'}>
                    {p.name || p}
                  </Tag>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Raw JSON — collapsed by default feel via details */}
        {globalSettings && (
          <div className="json-view">
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, userSelect: 'none' }}>
                settings.json (raw)
              </summary>
              <pre style={{ marginTop: 12 }}>{JSON.stringify(globalSettings, null, 2)}</pre>
            </details>
          </div>
        )}

        {localSettings && (
          <div className="json-view">
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, userSelect: 'none' }}>
                settings.local.json (raw)
              </summary>
              <pre style={{ marginTop: 12 }}>{JSON.stringify(localSettings, null, 2)}</pre>
            </details>
          </div>
        )}

        {plugins.data?.config && (
          <div className="json-view">
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, userSelect: 'none' }}>
                Plugin config (raw)
              </summary>
              <pre style={{ marginTop: 12 }}>{JSON.stringify(plugins.data.config, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

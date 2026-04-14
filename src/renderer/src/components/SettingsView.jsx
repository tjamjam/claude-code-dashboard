import { useApi } from '../hooks/useApi';

export default function SettingsView() {
  const settings = useApi('/settings');
  const claudeMd = useApi('/claude-md');
  const plugins = useApi('/plugins');

  const loading = settings.loading || claudeMd.loading || plugins.loading;
  if (loading) return <div className="loading">Loading</div>;

  return (
    <div>
      <div className="section-header">
        <h1>Settings</h1>
        <p>Global Claude Code configuration</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {settings.data?.global && (
          <div className="json-view">
            <h3>settings.json</h3>
            <pre>{JSON.stringify(settings.data.global, null, 2)}</pre>
          </div>
        )}

        {settings.data?.local && (
          <div className="json-view">
            <h3>settings.local.json</h3>
            <pre>{JSON.stringify(settings.data.local, null, 2)}</pre>
          </div>
        )}

        {claudeMd.data?.global && (
          <div className="json-view">
            <h3>Global CLAUDE.md</h3>
            <pre>{claudeMd.data.global}</pre>
          </div>
        )}

        {plugins.data?.installed && (
          <div className="json-view">
            <h3>Plugins</h3>
            <pre>{JSON.stringify(plugins.data.installed, null, 2)}</pre>
          </div>
        )}

        {plugins.data?.config && (
          <div className="json-view">
            <h3>Plugin Config</h3>
            <pre>{JSON.stringify(plugins.data.config, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

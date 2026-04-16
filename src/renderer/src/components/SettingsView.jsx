import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const SETTINGS_PROMPT = `Review my Claude Code settings in ~/.claude/settings.json and ~/.claude/settings.local.json. Check for any misconfigured or outdated values. Suggest improvements based on best practices.`;

// Keys that are surfaced by other dedicated views
const COVERED_KEYS = new Set([
  'model', 'hooks', 'permissions', 'env', 'sandbox',
  'skipDangerousModePermissionPrompt', 'dangerouslySkipPermissions',
  'enabledPlugins', 'extraKnownMarketplaces',
  'effortLevel', 'alwaysThinkingEnabled',
]);

function filterUncovered(obj) {
  if (!obj) return null;
  const filtered = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!COVERED_KEYS.has(k)) filtered[k] = v;
  }
  return Object.keys(filtered).length ? filtered : null;
}

function Tag({ children, color = 'accent' }) {
  const colors = {
    accent: 'tag-accent',
    green: 'tag-green',
    gray: 'tag-gray',
  };
  return (
    <span className={colors[color] || 'tag-accent'} style={{ fontSize: 11.5, fontWeight: 500, padding: '3px 9px', borderRadius: 0 }}>
      {children}
    </span>
  );
}

function SettingRow({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ width: 160, flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', paddingTop: 2 }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
    </div>
  );
}

export default function SettingsView() {
  const settings = useApi('/settings');

  if (settings.loading) return <div className="loading">Loading</div>;
  if (settings.error) return <div className="loading">Failed to load settings</div>;

  const global = settings.data?.global;
  const local = settings.data?.local;

  // Settings not covered by other views
  const hasCleanup = global?.cleanupPeriodDays !== undefined;
  const hasApiKey = !!global?.apiKeyHelper;
  const hasCoAuthor = global?.includeCoAuthoredBy !== undefined;
  const hasAttribution = !!global?.attribution;
  const hasOutputStyle = !!global?.outputStyle;
  const hasLanguage = !!global?.language;
  const hasDefaultShell = !!global?.defaultShell;
  const hasStatusLine = !!global?.statusLine;
  const hasRows = hasCleanup || hasApiKey || hasCoAuthor || hasAttribution || hasOutputStyle || hasLanguage || hasDefaultShell || hasStatusLine;

  const globalUncovered = filterUncovered(global);
  const localUncovered = filterUncovered(local);

  return (
    <div>
      <div className="section-header">
        <h1>Settings</h1>
        <p>Global Claude Code configuration</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {hasRows && (
          <div className="json-view" style={{ marginBottom: 0 }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 4 }}>
              <h3 style={{ marginBottom: 0 }}>General</h3>
            </div>

            {hasCleanup && (
              <SettingRow label="Cleanup Period">
                <Tag color="gray">{global.cleanupPeriodDays} days</Tag>
              </SettingRow>
            )}

            {hasApiKey && (
              <SettingRow label="API Key Helper">
                <Tag color="gray">{global.apiKeyHelper}</Tag>
              </SettingRow>
            )}

            {hasCoAuthor && (
              <SettingRow label="Co-Authored By">
                <Tag color={global.includeCoAuthoredBy ? 'green' : 'gray'}>
                  {global.includeCoAuthoredBy ? 'enabled' : 'disabled'}
                </Tag>
              </SettingRow>
            )}

            {hasAttribution && (
              <SettingRow label="Attribution">
                {global.attribution.commit && (
                  <Tag color="gray">commit: {global.attribution.commit}</Tag>
                )}
                {global.attribution.pr && (
                  <Tag color="gray">PR: {global.attribution.pr}</Tag>
                )}
              </SettingRow>
            )}

            {hasOutputStyle && (
              <SettingRow label="Output Style">
                <Tag color="gray">{global.outputStyle}</Tag>
              </SettingRow>
            )}

            {hasLanguage && (
              <SettingRow label="Language">
                <Tag color="gray">{global.language}</Tag>
              </SettingRow>
            )}

            {hasDefaultShell && (
              <SettingRow label="Default Shell">
                <Tag color="gray">{global.defaultShell}</Tag>
              </SettingRow>
            )}

            {hasStatusLine && (
              <SettingRow label="Status Line">
                <Tag color="gray">{typeof global.statusLine === 'object' ? global.statusLine.command || JSON.stringify(global.statusLine) : global.statusLine}</Tag>
              </SettingRow>
            )}
          </div>
        )}

        <PromptCard
          title="Update settings"
          description="Copy this prompt into a Claude Code session to review and update your settings."
          prompt={SETTINGS_PROMPT}
        />

        {globalUncovered && (
          <div className="json-view">
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, userSelect: 'none' }}>settings.json (other keys)</summary>
              <pre style={{ marginTop: 12 }}>{JSON.stringify(globalUncovered, null, 2)}</pre>
            </details>
          </div>
        )}
        {localUncovered && (
          <div className="json-view">
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, userSelect: 'none' }}>settings.local.json (other keys)</summary>
              <pre style={{ marginTop: 12 }}>{JSON.stringify(localUncovered, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

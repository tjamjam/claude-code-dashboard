import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { isSensitive } from '../utils/sensitive';
import PromptCard from './PromptCard';
import { SectionDivider } from './RepoItemsSection';

const ENV_PROMPT = `Review my Claude Code environment variables across all settings files. Check if there are important env vars I should set, like CLAUDE_AUTOCOMPACT_PCT_OVERRIDE for context management, MAX_THINKING_TOKENS for thinking budget, or project-specific variables. Also check for any sensitive values that should be in settings.local.json instead of settings.json.`;

const WELL_KNOWN_VARS = [
  { name: 'CLAUDE_AUTOCOMPACT_PCT_OVERRIDE', desc: 'Context usage percentage that triggers auto-compaction (default: 80)' },
  { name: 'MAX_THINKING_TOKENS', desc: 'Maximum tokens for extended thinking budget' },
  { name: 'ANTHROPIC_MODEL', desc: 'Override the default model for all sessions' },
  { name: 'DISABLE_PROMPT_CACHING', desc: 'Disable prompt caching (increases cost)' },
  { name: 'CLAUDE_CODE_MAX_OUTPUT_TOKENS', desc: 'Maximum output tokens per response' },
  { name: 'API_TIMEOUT_MS', desc: 'API request timeout in milliseconds' },
  { name: 'CLAUDE_CODE_DEBUG_LOGS_DIR', desc: 'Directory for debug log output' },
  { name: 'CLAUDE_CODE_DEBUG_LOG_LEVEL', desc: 'Debug log verbosity level' },
  { name: 'DISABLE_TELEMETRY', desc: 'Disable usage telemetry' },
  { name: 'CLAUDE_CODE_USE_BEDROCK', desc: 'Route requests through AWS Bedrock' },
  { name: 'CLAUDE_CODE_USE_VERTEX', desc: 'Route requests through Google Vertex AI' },
  { name: 'CLAUDE_CODE_USE_FOUNDRY', desc: 'Route requests through Anthropic Foundry' },
];

function EnvRow({ name, value }) {
  const masked = isSensitive(name);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 14px', background: 'var(--bg)',
      borderRadius: 'var(--radius-sm)', marginBottom: 4,
    }}>
      <code style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', minWidth: 240 }}>{name}</code>
      <code style={{ fontSize: 12, color: masked ? 'var(--text-tertiary)' : 'var(--text-secondary)', flex: 1 }}>
        {masked ? '***' : value}
      </code>
    </div>
  );
}

function EnvSection({ label, env }) {
  if (!env || !Object.keys(env).length) return null;
  const entries = Object.entries(env);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</div>
      {entries.map(([k, v]) => <EnvRow key={k} name={k} value={String(v)} />)}
    </div>
  );
}

export default function EnvVarsView() {
  const envVars = useApi('/env-vars');
  const [search, setSearch] = useState('');

  if (envVars.loading) return <div className="loading">Loading</div>;
  if (envVars.error) return <div className="loading">Failed to load environment variables</div>;

  const data = envVars.data || { global: null, globalLocal: null, repos: [], totalVars: 0 };
  const q = search.toLowerCase();

  // Collect all set var names for reference section
  const setVars = new Set([
    ...Object.keys(data.global || {}),
    ...Object.keys(data.globalLocal || {}),
    ...data.repos.flatMap(r => [...Object.keys(r.env || {}), ...Object.keys(r.envLocal || {})]),
  ]);

  // Filter helper
  function filterEnv(env) {
    if (!env || !q) return env;
    const filtered = {};
    for (const [k, v] of Object.entries(env)) {
      if (k.toLowerCase().includes(q)) filtered[k] = v;
    }
    return Object.keys(filtered).length ? filtered : null;
  }

  const filteredGlobal = filterEnv(data.global);
  const filteredGlobalLocal = filterEnv(data.globalLocal);
  const filteredRepos = data.repos.map(r => ({
    ...r,
    env: filterEnv(r.env),
    envLocal: filterEnv(r.envLocal),
  })).filter(r => r.env || r.envLocal);

  const hasAny = filteredGlobal || filteredGlobalLocal || filteredRepos.length > 0;

  return (
    <div>
      <div className="section-header">
        <h1>Environment Variables</h1>
        <p>{data.totalVars} variable{data.totalVars !== 1 ? 's' : ''} configured</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search variables..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search environment variables"
        />
      </div>

      {hasAny ? (
        <div style={{ marginBottom: 20 }}>
          {(filteredGlobal || filteredGlobalLocal) && (
            <>
              <SectionDivider label="Global" />
              <EnvSection label="settings.json" env={filteredGlobal} />
              <EnvSection label="settings.local.json" env={filteredGlobalLocal} />
            </>
          )}
          {filteredRepos.length > 0 && (
            <>
              <SectionDivider label="In Repos" />
              {filteredRepos.map(r => (
                <div key={r.name} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{r.name}</div>
                  <EnvSection label="settings.json" env={r.env} />
                  <EnvSection label="settings.local.json" env={r.envLocal} />
                </div>
              ))}
            </>
          )}
        </div>
      ) : !q ? (
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u2261'}</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No environment variables configured</div>
          <div style={{ fontSize: 13, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Set environment variables in the <code>env</code> key of your <code>settings.json</code> to
            configure Claude Code behavior like autocompact thresholds, thinking tokens, and API routing.
          </div>
        </div>
      ) : null}

      <div className="json-view" style={{ marginTop: 20 }}>
        <details>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, userSelect: 'none' }}>
            Well-known Claude Code environment variables
          </summary>
          <div style={{ marginTop: 12 }}>
            {WELL_KNOWN_VARS.map(v => (
              <div key={v.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '6px 0', borderBottom: '1px solid var(--border-light)',
              }}>
                <code style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', minWidth: 280 }}>{v.name}</code>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{v.desc}</span>
                {setVars.has(v.name) ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', padding: '1px 6px', background: 'var(--success-soft)', borderRadius: 0 }}>set</span>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '1px 6px', background: 'var(--border-light)', borderRadius: 0 }}>default</span>
                )}
              </div>
            ))}
          </div>
        </details>
      </div>

      <PromptCard title="Optimize your env vars" description="Ask Claude Code to review and recommend environment variables." prompt={ENV_PROMPT} />
    </div>
  );
}

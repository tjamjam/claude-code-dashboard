import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';
import { SectionDivider } from './RepoItemsSection';

const PLUGINS_PROMPT = `Review my installed Claude Code plugins and their configuration. Check which plugins are enabled vs just installed, if any are outdated or have newer versions available, and if there are useful plugins from my marketplaces that I haven't installed yet. Also check if any of my enabled plugins have been blocklisted.`;

function PluginCard({ name, registry, installs, isEnabled, isBlocked }) {
  const info = installs?.[0] || {};
  const date = info.installedAt ? new Date(info.installedAt).toLocaleDateString() : null;
  const updated = info.lastUpdated ? new Date(info.lastUpdated).toLocaleDateString() : null;

  return (
    <div className="card" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <h3 style={{ margin: 0 }}>{name}</h3>
        <span style={{
          fontSize: 11, color: 'var(--text-tertiary)',
          background: 'var(--border-light)', padding: '1px 7px', borderRadius: 0,
        }}>
          {registry}
        </span>
      </div>
      <div className="card-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {isEnabled ? (
          <span className="badge" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>enabled</span>
        ) : (
          <span className="badge muted">disabled</span>
        )}
        {isBlocked && (
          <span className="badge" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>blocklisted</span>
        )}
        {info.scope && <span className="badge muted">{info.scope}</span>}
        {info.version && info.version !== 'unknown' && <span className="badge muted">v{info.version}</span>}
        {date && <span className="badge muted">installed {date}</span>}
        {updated && updated !== date && <span className="badge muted">updated {updated}</span>}
      </div>
    </div>
  );
}

function MarketplaceCard({ name, source, isExtra }) {
  const repo = source?.source?.repo || source?.repo || null;
  const type = source?.source?.source || source?.source || 'unknown';

  return (
    <div className="card" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <h3 style={{ margin: 0 }}>{name}</h3>
        {isExtra && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 6px',
            background: 'rgba(45,86,210,0.08)', color: 'var(--accent-secondary)', borderRadius: 0,
          }}>
            custom
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        {type}{repo ? `: ${repo}` : ''}
      </div>
    </div>
  );
}

export default function PluginsView() {
  const plugins = useApi('/plugins-full');
  const [search, setSearch] = useState('');

  if (plugins.loading) return <div className="loading">Loading</div>;
  if (plugins.error) return <div className="loading">Failed to load plugins</div>;

  const data = plugins.data || { installed: {}, enabled: {}, blocklist: { plugins: [] }, marketplaces: {}, extraMarketplaces: {}, totalInstalled: 0 };
  const q = search.toLowerCase();

  const blockedKeys = new Set((data.blocklist.plugins || []).map(b => b.plugin));

  const pluginEntries = Object.entries(data.installed)
    .filter(([key]) => !q || key.toLowerCase().includes(q))
    .map(([key, installs]) => {
      const [name, registry] = key.split('@');
      return { key, name, registry, installs, isEnabled: data.enabled[key] !== false, isBlocked: blockedKeys.has(key) };
    });

  const allMarketplaces = {
    ...Object.fromEntries(Object.entries(data.marketplaces).map(([k, v]) => [k, { ...v, isExtra: false }])),
    ...Object.fromEntries(Object.entries(data.extraMarketplaces).map(([k, v]) => [k, { ...v, isExtra: true }])),
  };
  const marketplaceEntries = Object.entries(allMarketplaces)
    .filter(([name]) => !q || name.toLowerCase().includes(q));

  const blockedEntries = (data.blocklist.plugins || []).filter(b => !q || b.plugin?.toLowerCase().includes(q));

  return (
    <div>
      <div className="section-header">
        <h1>Plugins & Marketplaces</h1>
        <p>{data.totalInstalled} plugin{data.totalInstalled !== 1 ? 's' : ''} installed</p>
      </div>

      {data.totalInstalled === 0 && marketplaceEntries.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u29C9'}</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No plugins installed</div>
          <div style={{ fontSize: 13, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Plugins bundle skills, agents, hooks, and MCP servers into installable packages.
            Install them with <code>claude plugin install name@marketplace</code>.
          </div>
        </div>
      ) : (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search plugins or marketplaces..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search plugins"
            />
          </div>

          {pluginEntries.length > 0 && (
            <>
              <SectionDivider label="Installed Plugins" />
              <div className="card-grid">
                {pluginEntries.map(p => (
                  <PluginCard key={p.key} {...p} />
                ))}
              </div>
            </>
          )}

          {marketplaceEntries.length > 0 && (
            <>
              <SectionDivider label="Marketplaces" />
              <div className="card-grid">
                {marketplaceEntries.map(([name, source]) => (
                  <MarketplaceCard key={name} name={name} source={source} isExtra={source.isExtra} />
                ))}
              </div>
            </>
          )}

          {blockedEntries.length > 0 && (
            <>
              <SectionDivider label="Blocklist" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {blockedEntries.map((b, i) => (
                  <div key={i} style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>{b.plugin}</div>
                    {b.text && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.text}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <PromptCard title="Review your plugins" description="Ask Claude Code to audit your plugins and suggest new ones." prompt={PLUGINS_PROMPT} />
    </div>
  );
}

// Shared component: renders a "── In Repos ──" section grouping items by repo.
// Also exports SectionDivider so parent views can label their "Global" section.

export function SectionDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--text-tertiary)',
        flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
    </div>
  );
}

// Props:
//   repos      — array from /api/repos
//   getItems   — (repo) => items[]  e.g. repo => repo.skills
//   renderCard — (item, repo) => JSX  (must include key prop)
//   search     — string for filtering by name/description/content
export default function RepoItemsSection({ repos, getItems, renderCard, search }) {
  const q = search?.toLowerCase() || '';

  const grouped = (repos || [])
    .map(repo => ({
      repo,
      items: (getItems(repo) || []).filter(item =>
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q)
      ),
    }))
    .filter(({ items }) => items.length > 0);

  if (!grouped.length) return null;

  return (
    <>
      <SectionDivider label="In Repos" />
      {grouped.map(({ repo, items }) => (
        <div key={repo.name} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text)',
              fontFamily: "'SF Mono','Fira Code',monospace",
            }}>
              {repo.name}
            </span>
            <span style={{
              fontSize: 11, color: 'var(--text-tertiary)',
              background: 'var(--border-light)',
              padding: '1px 7px', borderRadius: 100,
            }}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="card-grid">
            {items.map(item => renderCard(item, repo))}
          </div>
        </div>
      ))}
    </>
  );
}

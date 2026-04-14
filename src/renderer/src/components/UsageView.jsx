import { useApi } from '../hooks/useApi';

export default function UsageView() {
  const { data, loading, error } = useApi('/usage');

  if (loading) return <div className="loading">Loading</div>;
  if (error) return <div className="loading">Failed to load usage data</div>;

  return (
    <div>
      <div className="section-header">
        <h1>Self-Improvement</h1>
        <p>
          {data?.dateFrom && data?.dateTo
            ? `${data.dateFrom} → ${data.dateTo} · ${data.totalSessions} sessions · ${data.totalCommits} commits`
            : 'Run /insights in a Claude Code session to generate your report'}
        </p>
      </div>

      {data?.reportHtml ? (
        <iframe
          srcDoc={data.reportHtml}
          style={{
            width: '100%',
            height: 'calc(100vh - 160px)',
            border: 'none',
            borderRadius: 'var(--radius)',
          }}
          sandbox="allow-scripts"
        />
      ) : (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '48px 32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>No insights report yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Run <code>/insights</code> in any Claude Code session to generate a personalized report —
            interaction patterns, friction analysis, CLAUDE.md recommendations, and more.
          </div>
        </div>
      )}
    </div>
  );
}

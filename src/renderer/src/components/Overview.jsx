import { useApi } from '../hooks/useApi';

const STAT_MAP = [
  { key: 'skills', label: 'Skills', section: 'skills' },
  { key: 'agents', label: 'Agents', section: 'agents' },
  { key: 'teams', label: 'Teams', section: 'teams' },
  { key: 'plans', label: 'Plans', section: 'plans' },
  { key: 'commands', label: 'Commands', section: 'commands' },
  { key: 'projectsWithMemory', label: 'Projects with Memory', section: 'memory' },
];

export default function Overview() {
  const { data, loading } = useApi('/overview');

  if (loading) return <div className="loading">Loading</div>;

  return (
    <div>
      <div className="section-header">
        <h1>Overview</h1>
        <p>Your Claude Code configuration at a glance</p>
      </div>
      <div className="stat-grid">
        {STAT_MAP.map(({ key, label }) => (
          <div key={key} className="stat-card">
            <div className="stat-number">{data?.[key] ?? 0}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import OctopusArt from './OctopusArt';

export default function Sidebar({ sections, active, onSelect, onAbout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand" onClick={onAbout} style={{ cursor: 'pointer' }} title="About Claude Code Dashboard">
        <div className="sidebar-octopus"><OctopusArt width={64} /></div>
        <h1>Claude Dashboard</h1>
        <span>Configuration viewer</span>
      </div>
      <nav aria-label="Main navigation">
        <ul className="sidebar-nav">
          {Object.entries(sections).map(([key, entry]) => {
            if (entry.divider) {
              return (
                <li key={key} className="sidebar-divider" aria-hidden="true">
                  <span>{entry.label}</span>
                </li>
              );
            }
            return (
              <li key={key}>
                <button
                  className={active === key ? 'active' : ''}
                  onClick={() => onSelect(key)}
                  aria-current={active === key ? 'page' : undefined}
                >
                  <span className="icon" aria-hidden="true">{entry.icon}</span>
                  {entry.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

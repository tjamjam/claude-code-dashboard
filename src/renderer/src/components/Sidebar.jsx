export default function Sidebar({ sections, active, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Claude Dashboard</h1>
        <span>Configuration viewer</span>
      </div>
      <nav aria-label="Main navigation">
        <ul className="sidebar-nav">
          {Object.entries(sections).map(([key, { label, icon }]) => (
            <li key={key}>
              <button
                className={active === key ? 'active' : ''}
                onClick={() => onSelect(key)}
                aria-current={active === key ? 'page' : undefined}
              >
                <span className="icon" aria-hidden="true">{icon}</span>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

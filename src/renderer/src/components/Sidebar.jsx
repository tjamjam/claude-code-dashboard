export default function Sidebar({ sections, active, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Claude Dashboard</h1>
        <span>Configuration viewer</span>
      </div>
      <ul className="sidebar-nav">
        {Object.entries(sections).map(([key, { label, icon }]) => (
          <li key={key}>
            <button
              className={active === key ? 'active' : ''}
              onClick={() => onSelect(key)}
            >
              <span className="icon">{icon}</span>
              {label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

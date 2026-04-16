import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';

const TASKS_PROMPT = `Analyze my Claude Code task history in ~/.claude/tasks/. Summarize the patterns: what types of tasks get created, which ones complete successfully vs get abandoned, and whether the task decomposition is effective. Suggest how I could use the Task tool more effectively.`;

const STATUS_STYLES = {
  completed: { fg: 'var(--success)', bg: 'var(--success-soft)' },
  in_progress: { fg: 'var(--accent-light)', bg: 'var(--accent-soft)' },
  pending: { fg: 'var(--text-tertiary)', bg: 'var(--border-light)' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px',
      background: s.bg, color: s.fg, borderRadius: 0,
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function TasksView() {
  const tasks = useApi('/tasks');
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  if (tasks.loading) return <div className="loading">Loading</div>;
  if (tasks.error) return <div className="loading">Failed to load tasks</div>;

  const data = tasks.data || { groups: [], totalSubtasks: 0, statusCounts: {} };
  const { groups, totalSubtasks, statusCounts } = data;

  if (!groups.length) {
    return (
      <div>
        <div className="section-header">
          <h1>Tasks</h1>
          <p>No tasks found</p>
        </div>
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u2611'}</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No task history</div>
          <div style={{ fontSize: 13, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Tasks are created by Claude Code's subagent system to track complex, multi-step work.
            They appear here once sessions use the Task tool.
          </div>
        </div>
        <PromptCard title="Learn about tasks" description="Ask Claude Code about the Task tool." prompt={TASKS_PROMPT} />
      </div>
    );
  }

  const q = search.toLowerCase();
  const filteredGroups = groups.filter(g =>
    !q || g.subtasks.some(s =>
      s.subject?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    )
  );

  return (
    <div>
      <div className="section-header">
        <h1>Tasks</h1>
        <p>{groups.length} task group{groups.length !== 1 ? 's' : ''}, {totalSubtasks} subtask{totalSubtasks !== 1 ? 's' : ''}</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {statusCounts.completed > 0 && (
          <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
            {statusCounts.completed} completed
          </span>
        )}
        {statusCounts.in_progress > 0 && (
          <span style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 600 }}>
            {statusCounts.in_progress} in progress
          </span>
        )}
        {statusCounts.pending > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>
            {statusCounts.pending} pending
          </span>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search tasks"
        />
      </div>

      {filteredGroups.map(group => (
        <div key={group.id} className="project-group">
          <div
            className="project-header"
            onClick={() => setExpanded(expanded === group.id ? null : group.id)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(expanded === group.id ? null : group.id); } }}
            role="button"
            tabIndex={0}
          >
            <h3 style={{ fontSize: 13 }}>{group.id.slice(0, 8)}...</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge">{group.subtasks.length} subtask{group.subtasks.length !== 1 ? 's' : ''}</span>
              <span>{expanded === group.id ? '\u25B2' : '\u25BC'}</span>
            </div>
          </div>
          {expanded === group.id && (
            <div className="project-body">
              {group.subtasks.map(st => (
                <div key={st.id} style={{
                  padding: '10px 14px', marginBottom: 6,
                  background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{st.subject}</span>
                    <StatusBadge status={st.status} />
                  </div>
                  {st.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{st.description}</div>
                  )}
                  {(st.blocks?.length > 0 || st.blockedBy?.length > 0) && (
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {st.blocks?.length > 0 && <span>Blocks: {st.blocks.join(', ')} </span>}
                      {st.blockedBy?.length > 0 && <span>Blocked by: {st.blockedBy.join(', ')}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <PromptCard title="Analyze task patterns" description="Ask Claude Code to review your task history." prompt={TASKS_PROMPT} />
    </div>
  );
}

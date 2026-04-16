import { Link } from 'react-router-dom';
import type { useTaskStore } from '../store';
import { USERS } from '../data';

type Store = ReturnType<typeof useTaskStore>;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const PRESENCE: Record<string, { dot: string; label: string }> = {
  'Alice Chen': { dot: 'presence-online', label: 'Online · Reviewing PR #482' },
  'Bob Martinez': { dot: 'presence-online', label: 'Online · Dashboard' },
  'Carol Wu': { dot: 'presence-away', label: 'Away · Since 14:02' },
  'Dan Osei': { dot: 'presence-offline', label: 'Offline · Last active 2h ago' },
};

const ACTIVITY = [
  { author: 'Alice Chen', verb: 'moved', target: 'Design new landing page', meta: '→ In Review', when: '2 min ago' },
  { author: 'Bob Martinez', verb: 'commented on', target: 'Fix authentication timeout bug', meta: '"Reproduced on staging"', when: '14 min ago' },
  { author: 'Dan Osei', verb: 'closed', target: 'Optimize database queries', meta: 'Shipped in v2.1.4', when: '1 h ago' },
  { author: 'Carol Wu', verb: 'uploaded attachment to', target: 'Design new landing page', meta: 'final-mockup.png', when: '2 h ago' },
];

export default function Dashboard({ stats, tasks }: { stats: Store['stats']; tasks: Store['tasks'] }) {
  const urgent = tasks.filter((t) => t.priority === 'high' && t.status !== 'done');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="page-kicker">Overview · Today</span>
          <h2 className="page-title">Good morning, Chris</h2>
          <p className="page-subtitle">
            Four tickets need your attention, two are blocking the v2.0 release. Your
            team is live in three channels.
          </p>
        </div>
        <Link to="/tasks/new" className="btn btn-primary" data-tour="action-create">
          + Create Task
        </Link>
      </div>

      <div className="stats-grid" data-tour="stats-section">
        <div className="stat-card" data-tour="stat-total">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card" data-tour="stat-open">
          <div className="stat-value">{stats.open}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card" data-tour="stat-in-progress">
          <div className="stat-value">{stats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card" data-tour="stat-review">
          <div className="stat-value">{stats.review}</div>
          <div className="stat-label">In Review</div>
        </div>
        <div className="stat-card" data-tour="stat-done">
          <div className="stat-value">{stats.done}</div>
          <div className="stat-label">Done</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card" data-tour="quick-actions">
          <h3 className="section-title">Quick Actions</h3>
          <div className="action-row">
            <Link to="/tasks/new" className="btn btn-primary">
              + Create Task
            </Link>
            <Link to="/tasks" className="btn" data-tour="action-view-all">
              View All Tasks
            </Link>
            <button className="btn" data-tour="action-my-tasks">
              My Tasks ({stats.inProgress + stats.review})
            </button>
          </div>
        </div>

        <div className="card" data-tour="team-roster">
          <h3 className="section-title">Team Roster</h3>
          <ul className="roster-list">
            {USERS.map((user) => {
              const presence = PRESENCE[user] ?? { dot: 'presence-offline', label: 'Offline' };
              return (
                <li key={user} className="roster-row">
                  <span className="assignee-avatar" aria-hidden="true">{initials(user)}</span>
                  <div className="roster-copy">
                    <span className="roster-name">{user}</span>
                    <span className="roster-status">{presence.label}</span>
                  </div>
                  <span className={`presence-dot ${presence.dot}`} aria-hidden="true" />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="dashboard-grid">
        {urgent.length > 0 && (
          <div className="card" data-tour="urgent-section">
            <h3 className="section-title section-title-danger">
              Urgent Tasks
              <span className="section-count">{urgent.length}</span>
            </h3>
            {urgent.map((task) => (
              <div key={task.id} className="urgent-task-row">
                <Link to={`/tasks/${task.id}`} className="urgent-task-link">
                  {task.title}
                </Link>
                <span className="badge badge-high">{task.priority}</span>
              </div>
            ))}
          </div>
        )}

        <div className="card" data-tour="activity-feed">
          <h3 className="section-title">Live Activity</h3>
          <ul className="activity-list">
            {ACTIVITY.map((event, i) => (
              <li key={i} className="activity-row">
                <span className="assignee-avatar assignee-avatar-sm" aria-hidden="true">
                  {initials(event.author)}
                </span>
                <div className="activity-copy">
                  <div className="activity-line">
                    <strong>{event.author}</strong> {event.verb}{' '}
                    <span className="activity-target">{event.target}</span>
                  </div>
                  <div className="activity-meta">
                    <span>{event.meta}</span>
                    <span className="activity-dot">·</span>
                    <span>{event.when}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

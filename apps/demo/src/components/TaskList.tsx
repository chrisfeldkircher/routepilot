import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Task } from '../data';
import { demoState, DEMO_ID } from '../tour/demoState';

const STATUS_CLASS: Record<Task['status'], string> = {
  open: 'badge-open',
  'in-progress': 'badge-progress',
  review: 'badge-review',
  done: 'badge-done',
};

const PRIORITY_CLASS: Record<Task['priority'], string> = {
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
};

const statusLabel = (s: Task['status']) => (s === 'in-progress' ? 'In Progress' : s);

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

function Assignee({ name }: { name: string | null }) {
  if (!name) {
    return <span className="assignee-cell assignee-unassigned">Unassigned</span>;
  }
  return (
    <span className="assignee-cell">
      <span className="assignee-avatar" aria-hidden="true">{initials(name)}</span>
      <span>{name}</span>
    </span>
  );
}

export default function TaskList({ tasks }: { tasks: Task[] }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('demo-tour:state-changed', handler);
    return () => window.removeEventListener('demo-tour:state-changed', handler);
  }, []);

  const merged = useMemo<Task[]>(() => {
    if (!demoState.isActive) return tasks;
    const demoTask = demoState.getTask();
    const base = tasks.filter((t) => t.id !== DEMO_ID);
    return [demoTask, ...base];
  }, [tasks]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="page-kicker">Workstream</span>
          <h2 className="page-title">All Tasks</h2>
          <p className="page-subtitle">
            Every ticket across the team. Filter, prioritize, and jump into work
            without losing your place.
          </p>
        </div>
        <Link to="/tasks/new" className="btn btn-primary" data-tour="list-create-btn">
          + New Task
        </Link>
      </div>

      <div className="card card-table" data-tour="task-list-table">
        <div className="task-table">
          <div className="task-table-head">
            <div>Title</div>
            <div data-tour="col-status">Status</div>
            <div data-tour="col-priority">Priority</div>
            <div data-tour="col-assignee">Assignee</div>
          </div>
          {merged.map((task) => (
            <Link
              key={task.id}
              to={`/tasks/${task.id}`}
              className="task-table-link"
              data-tour={`task-row-${task.id}`}
            >
              <div className="task-table-title">{task.title}</div>
              <div>
                <span className={`badge ${STATUS_CLASS[task.status]}`}>{statusLabel(task.status)}</span>
              </div>
              <div>
                <span className={`badge ${PRIORITY_CLASS[task.priority]}`}>{task.priority}</span>
              </div>
              <div
                className={
                  task.assignee
                    ? 'task-table-assignee'
                    : 'task-table-assignee-muted'
                }
              >
                <Assignee name={task.assignee} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import { NavLink } from 'react-router-dom';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link nav-link-active' : 'nav-link';

export default function Header() {
  return (
    <header className="app-header">
      <div className="brand-lockup" data-tour="app-logo">
        <span className="brand-mark" aria-hidden="true">TF</span>
        <div className="brand-copy">
          <h1>TaskFlow</h1>
          <span>Operations console</span>
        </div>
      </div>
      <nav>
        <NavLink to="/" end className={navLinkClass} data-tour="nav-dashboard">
          Dashboard
        </NavLink>
        <NavLink to="/tasks" className={navLinkClass} data-tour="nav-tasks">
          Tasks
        </NavLink>
        <NavLink to="/tasks/new" className={navLinkClass} data-tour="nav-create">
          + New Task
        </NavLink>
        <span
          className="nav-link nav-notification-pill"
          data-tour="nav-notifications"
          role="button"
          tabIndex={0}
        >
          Notifications
          <span className="nav-notification-count">3</span>
        </span>
      </nav>
    </header>
  );
}

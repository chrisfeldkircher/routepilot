import { NavLink, useLocation } from 'react-router-dom';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link nav-link-active' : 'nav-link';

function TaskFlowNav() {
  return (
    <>
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
    </>
  );
}

function ParcelRelayNav() {
  return (
    <>
      <div className="brand-lockup brand-lockup-parcel" data-tour="app-logo">
        <span className="brand-mark brand-mark-parcel" aria-hidden="true">PR</span>
        <div className="brand-copy">
          <h1>ParcelRelay</h1>
          <span>Same-day courier · demo</span>
        </div>
      </div>
      <nav>
        <NavLink to="/pickup" className={navLinkClass}>
          Schedule
        </NavLink>
        <span className="nav-link" role="button" tabIndex={0}>
          Track
        </span>
        <span className="nav-link" role="button" tabIndex={0}>
          Rates
        </span>
        <span className="nav-link nav-notification-pill" role="button" tabIndex={0}>
          Help
          <span className="nav-notification-count">4</span>
        </span>
      </nav>
    </>
  );
}

function DataBridgeNav() {
  return (
    <>
      <div className="brand-lockup brand-lockup-databridge" data-tour="app-logo">
        <span className="brand-mark brand-mark-databridge" aria-hidden="true">DB</span>
        <div className="brand-copy">
          <h1>DataBridge</h1>
          <span>Import pipeline · demo</span>
        </div>
      </div>
      <nav>
        <NavLink to="/import" className={navLinkClass}>
          Imports
        </NavLink>
        <span className="nav-link" role="button" tabIndex={0}>
          Schemas
        </span>
        <span className="nav-link" role="button" tabIndex={0}>
          Logs
        </span>
        <span className="nav-link" role="button" tabIndex={0}>
          Settings
        </span>
      </nav>
    </>
  );
}

function PulseNav() {
  return (
    <>
      <div className="brand-lockup brand-lockup-pulse" data-tour="app-logo">
        <span className="brand-mark brand-mark-pulse" aria-hidden="true">PU</span>
        <div className="brand-copy">
          <h1>Pulse</h1>
          <span>Project tracker · demo</span>
        </div>
      </div>
      <nav>
        <span className="nav-link" role="button" tabIndex={0}>
          Board
        </span>
        <span className="nav-link" role="button" tabIndex={0}>
          Backlog
        </span>
        <span className="nav-link" role="button" tabIndex={0}>
          Sprints
        </span>
        <NavLink to="/settings" className={navLinkClass}>
          Settings
        </NavLink>
      </nav>
    </>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const isParcelRelay = pathname.startsWith('/pickup');
  const isDataBridge = pathname.startsWith('/import');
  const isPulse = pathname.startsWith('/settings');

  const headerClass = isPulse
    ? 'app-header app-header-pulse'
    : isDataBridge
      ? 'app-header app-header-databridge'
      : isParcelRelay
        ? 'app-header app-header-parcel'
        : 'app-header';

  const nav = isPulse
    ? <PulseNav />
    : isDataBridge
      ? <DataBridgeNav />
      : isParcelRelay
        ? <ParcelRelayNav />
        : <TaskFlowNav />;

  return <header className={headerClass}>{nav}</header>;
}

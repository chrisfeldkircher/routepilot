import { useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  GuidedTourProvider,
  GuidedTourOverlay,
  useGuidedTourActions,
  useGuidedTourState,
} from '@routepilot/core';
import type { TourNavigationAdapter, TourDefinition } from '@routepilot/core';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import CreateTask from './components/CreateTask';
import PickupPage from './pickup/PickupPage';
import ImportPage from './import/ImportPage';
import SettingsPage from './settings/SettingsPage';
import { useTaskStore } from './store';
import { demoTour } from './tour/demoTour';
import { pickupFaqTour } from './pickup/pickupTour';
import { errorRecoveryTour } from './import/importTour';
import { interactiveDocsTour } from './settings/settingsTour';

const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

const DEMO_TOUR_FINAL_STEP_ID = 'complete';
const PICKUP_TOUR_FINAL_STEP_ID = 'faq-outro';
const IMPORT_TOUR_FINAL_STEP_ID = 'recovery-outro';

const DOCS_TOUR_FINAL_STEP_ID = 'docs-outro';

const TOUR_FINAL_STEPS: Record<string, string> = {
  [demoTour.id]: DEMO_TOUR_FINAL_STEP_ID,
  [pickupFaqTour.id]: PICKUP_TOUR_FINAL_STEP_ID,
  [errorRecoveryTour.id]: IMPORT_TOUR_FINAL_STEP_ID,
  [interactiveDocsTour.id]: DOCS_TOUR_FINAL_STEP_ID,
};

const resolveScenarioTour = (search: string, pathname: string): TourDefinition => {
  const params = new URLSearchParams(search);
  if (params.get('scenario') === 'faq') return pickupFaqTour;
  if (params.get('scenario') === 'error-recovery') return errorRecoveryTour;
  if (params.get('scenario') === 'interactive-docs') return interactiveDocsTour;
  if (pathname.startsWith('/pickup')) return pickupFaqTour;
  if (pathname.startsWith('/import')) return errorRecoveryTour;
  if (pathname.startsWith('/settings')) return interactiveDocsTour;
  return demoTour;
};

function TourController() {
  const actions = useGuidedTourActions();
  const state = useGuidedTourState();
  const location = useLocation();
  const autoStartedRef = useRef(false);
  const previousStatusRef = useRef(state.status);
  const lastNodeIdRef = useRef<string | null>(null);
  const activeTourRef = useRef<TourDefinition | null>(null);
  const isRunning = state.status === 'running' || state.status === 'preparing';

  const scenarioTour = useMemo(
    () => resolveScenarioTour(location.search, location.pathname),
    [location.search, location.pathname],
  );

  useEffect(() => {
    if (!isInIframe || autoStartedRef.current || isRunning) return;
    // In the FAQ scenario, let the page render first so the user can see the
    // page-level FAQ cards (hub + deep-links). Each card launches the tour
    // itself via startWithDefinition(..., { startNodeId }).
    if (scenarioTour.id === pickupFaqTour.id) return;
    autoStartedRef.current = true;
    activeTourRef.current = scenarioTour;
    void actions.startWithDefinition(scenarioTour, {
      startNodeId: scenarioTour.steps[0]?.id,
    });
  }, [actions, isRunning, scenarioTour]);

  useEffect(() => {
    if (state.nodeId) lastNodeIdRef.current = state.nodeId;
  }, [state.nodeId]);

  useEffect(() => {
    if (!state.tourId) return;
    if (state.tourId === pickupFaqTour.id) activeTourRef.current = pickupFaqTour;
    else if (state.tourId === errorRecoveryTour.id) activeTourRef.current = errorRecoveryTour;
    else if (state.tourId === interactiveDocsTour.id) activeTourRef.current = interactiveDocsTour;
    else if (state.tourId === demoTour.id) activeTourRef.current = demoTour;
  }, [state.tourId]);

  useEffect(() => {
    const prev = previousStatusRef.current;
    const current = state.status;
    previousStatusRef.current = current;

    const wasActive = prev === 'running' || prev === 'preparing';
    const isTerminal = current === 'idle' || current === 'completed' || current === 'error';
    if (!wasActive || !isTerminal) return;
    if (!isInIframe || window.parent === window) return;

    const activeTour = activeTourRef.current;
    const finalStepId = activeTour ? (TOUR_FINAL_STEPS[activeTour.id] ?? DEMO_TOUR_FINAL_STEP_ID) : DEMO_TOUR_FINAL_STEP_ID;
    const reachedFinish = lastNodeIdRef.current === finalStepId;
    const status = current === 'completed' || reachedFinish ? 'completed' : 'aborted';
    lastNodeIdRef.current = null;

    // FAQ scenario: "Back to FAQ" / Skip should leave the iframe alive so the
    // user lands back on the page-level FAQ picker and can choose another
    // question. Only close the iframe when they actually finish the tour.
    if (activeTour?.id === pickupFaqTour.id && status === 'aborted') return;

    window.parent.postMessage(
      { type: 'routepilot:tour-finished', status },
      window.location.origin
    );
  }, [state.status]);

  if (isInIframe || isRunning) return null;

  return (
    <button
      className="tour-start-btn"
      onClick={() => {
        activeTourRef.current = scenarioTour;
        void actions.startWithDefinition(scenarioTour, {
          startNodeId: scenarioTour.steps[0]?.id,
        });
      }}
    >
      Start Tour
    </button>
  );
}

function AppContent() {
  const store = useTaskStore();

  return (
    <>
      <Header />
      <TourController />
      <GuidedTourOverlay />
      <Routes>
        <Route path="/" element={<Dashboard stats={store.stats} tasks={store.tasks} />} />
        <Route path="/tasks" element={<TaskList tasks={store.tasks} />} />
        <Route path="/tasks/new" element={<CreateTask addTask={store.addTask} />} />
        <Route path="/tasks/:id" element={
          <TaskDetail
            getTask={store.getTask}
            updateTask={store.updateTask}
            addComment={store.addComment}
          />
        } />
        <Route path="/pickup" element={<PickupPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const navAdapter = useMemo<TourNavigationAdapter>(() => ({
    getPath: () => location.pathname,
    navigate: (path, opts) => navigate(path, { replace: opts?.replace }),
  }), [navigate, location.pathname]);

  const tours = useMemo(() => [demoTour, pickupFaqTour, errorRecoveryTour, interactiveDocsTour], []);

  return (
    <GuidedTourProvider
      tours={tours}
      location={location.pathname}
      navigation={navAdapter}
    >
      <AppContent />
    </GuidedTourProvider>
  );
}

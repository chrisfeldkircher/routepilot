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
import { useTaskStore } from './store';
import { demoTour } from './tour/demoTour';
import { pickupFaqTour } from './pickup/pickupTour';

const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

const DEMO_TOUR_FINAL_STEP_ID = 'complete';
const PICKUP_TOUR_FINAL_STEP_ID = 'faq-outro';

const resolveScenarioTour = (search: string, pathname: string): TourDefinition => {
  const params = new URLSearchParams(search);
  if (params.get('scenario') === 'faq') return pickupFaqTour;
  if (pathname.startsWith('/pickup')) return pickupFaqTour;
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
    autoStartedRef.current = true;
    activeTourRef.current = scenarioTour;
    void actions.startWithDefinition(scenarioTour);
  }, [actions, isRunning, scenarioTour]);

  useEffect(() => {
    if (state.nodeId) lastNodeIdRef.current = state.nodeId;
  }, [state.nodeId]);

  useEffect(() => {
    const prev = previousStatusRef.current;
    const current = state.status;
    previousStatusRef.current = current;

    const wasActive = prev === 'running' || prev === 'preparing';
    const isTerminal = current === 'idle' || current === 'completed' || current === 'error';
    if (!wasActive || !isTerminal) return;
    if (!isInIframe || window.parent === window) return;

    const activeTour = activeTourRef.current;
    const finalStepId =
      activeTour?.id === pickupFaqTour.id ? PICKUP_TOUR_FINAL_STEP_ID : DEMO_TOUR_FINAL_STEP_ID;
    const reachedFinish = lastNodeIdRef.current === finalStepId;
    const status = current === 'completed' || reachedFinish ? 'completed' : 'aborted';
    window.parent.postMessage(
      { type: 'routepilot:tour-finished', status },
      window.location.origin
    );
    lastNodeIdRef.current = null;
  }, [state.status]);

  if (isInIframe || isRunning) return null;

  return (
    <button
      className="tour-start-btn"
      onClick={() => {
        activeTourRef.current = scenarioTour;
        void actions.startWithDefinition(scenarioTour);
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

  const tours = useMemo(() => [demoTour, pickupFaqTour], []);

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

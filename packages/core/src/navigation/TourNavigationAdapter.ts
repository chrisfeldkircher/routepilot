/**
 * Framework-agnostic navigation adapter for the guided tour engine.
 *
 * Implementations bridge the tour engine to a specific router (React Router,
 * Vue Router, plain History API, etc.). The tour engine never touches
 * `window.history` or `window.location` directly — all routing flows through
 * this adapter.
 */
export interface TourNavigationAdapter {
  /** Return the current pathname (normalized, no trailing slash). */
  getPath(): string;

  /**
   * Navigate to `path`.
   *
   * Implementations should use the framework's own navigation primitive
   * (e.g. `navigate()` from React Router) so that router state stays in sync.
   */
  navigate(path: string, options?: { replace?: boolean }): void | Promise<void>;
}

/**
 * How the tour engine should handle route mismatches for a step.
 *
 * - `navigate` — automatically navigate to the step's primary path via the
 *                adapter when entering the step or when the user somehow ends
 *                up on an unallowed path. This is the default.
 * - `guard`    — block clicks and navigation that would leave the allowed path
 *                set, but do NOT auto-navigate. The step's `onEnter` or a prior
 *                step is expected to have navigated to the correct route already.
 *                Use this when you want to lock the user to the current page
 *                without forcing a redirect on entry.
 * - `pause`    — if the user leaves the allowed path set, pause the step and
 *                (optionally) show a "return to tour" prompt. Does not block
 *                navigation. (Future-friendly; not fully enforced by the engine.)
 */
export type RouteMode = 'navigate' | 'guard' | 'pause';

export interface RoutePolicy {
  /** Primary path (first entry) and any additional allowed paths. */
  paths: string[];
  /** How to react to a route mismatch. Defaults to `'navigate'`. */
  mode: RouteMode;
}

/** Normalize a pathname by stripping trailing slashes (except for `/`). */
export const normalizePath = (value: string): string => {
  if (!value) return value;
  if (value.length > 1 && value.endsWith('/')) {
    return value.replace(/\/+$/, '');
  }
  return value;
};

/**
 * Centralized route guard for the guided tour.
 *
 * Holds the current step's route policy and a set of runtime-allowed paths
 * (populated when a user clicks a `clickSelector` that targets a link).
 *
 * The overlay (UI layer) is the sole consumer — it checks `isPathAllowed()`
 * on every render/location change and calls `enforcePrimary()` when needed.
 * The state machine never patches browser APIs.
 */
export class TourRouteGuard {
  private policy: RoutePolicy | null = null;
  private runtimeAllowedPaths = new Set<string>();
  private adapter: TourNavigationAdapter | null = null;

  /**
   * Whether the user has been on an allowed path at least once since the
   * current policy was set. Used by `guard` mode to distinguish "step entered
   * on wrong route" (don't redirect — let onEnter handle navigation) from
   * "user drifted away after settling" (redirect back).
   */
  private settled = false;

  // ── Adapter management ──────────────────────────────────────────────

  /** Bind a navigation adapter. Call once from the UI layer (e.g. GuidedTourProvider). */
  setAdapter(adapter: TourNavigationAdapter): void {
    this.adapter = adapter;
  }

  getAdapter(): TourNavigationAdapter | null {
    return this.adapter;
  }

  // ── Policy lifecycle ────────────────────────────────────────────────

  /**
   * Called by the state machine (or overlay) when entering a new step.
   * Replaces the previous policy and clears runtime-allowed paths.
   */
  setPolicy(policy: RoutePolicy | null): void {
    this.policy = policy;
    this.runtimeAllowedPaths.clear();
    this.settled = false;
  }

  getPolicy(): RoutePolicy | null {
    return this.policy;
  }

  /** Clear policy and runtime state (e.g. on tour stop / complete). */
  clear(): void {
    this.policy = null;
    this.runtimeAllowedPaths.clear();
    this.settled = false;
  }

  // ── Runtime allowed paths ───────────────────────────────────────────

  /**
   * Dynamically allow an additional path for the current step.
   * Used when a `clickSelector` targets a link whose destination is not in the
   * step's declared route set.
   */
  allowPath(path: string): void {
    this.runtimeAllowedPaths.add(normalizePath(path));
  }

  getRuntimeAllowedPaths(): ReadonlySet<string> {
    return this.runtimeAllowedPaths;
  }

  // ── Query ───────────────────────────────────────────────────────────

  /** The step's primary path (first entry), or `null` if no policy. */
  getPrimaryPath(): string | null {
    if (!this.policy || this.policy.paths.length === 0) return null;
    return this.policy.paths[0];
  }

  /**
   * Check whether `path` is allowed under the current policy.
   * Also marks the guard as "settled" if the path is allowed — meaning the
   * user has been on a valid path at least once since the policy was set.
   */
  isPathAllowed(path: string): boolean {
    if (!this.policy) return true; // no policy → everything is allowed
    const normalized = normalizePath(path);
    const allowed =
      this.policy.paths.includes(normalized) ||
      this.runtimeAllowedPaths.has(normalized);
    if (allowed) {
      this.settled = true;
    }
    return allowed;
  }

  /**
   * Whether the user has been on an allowed path at least once since the
   * current policy was set. In `guard` mode this distinguishes "step entered
   * on the wrong route" from "user drifted away after settling".
   */
  hasSettled(): boolean {
    return this.settled;
  }

  /** The active route mode, or `null` if no policy is set. */
  getMode(): RouteMode | null {
    return this.policy?.mode ?? null;
  }

  // ── Enforcement ─────────────────────────────────────────────────────

  /**
   * Navigate to the step's primary path using the adapter.
   * Only acts when the current path is not already allowed.
   * Returns `true` if navigation was triggered.
   */
  async enforcePrimary(): Promise<boolean> {
    if (!this.adapter || !this.policy) return false;
    const current = normalizePath(this.adapter.getPath());
    if (this.isPathAllowed(current)) return false;

    const primary = this.getPrimaryPath();
    if (!primary) return false;

    await this.adapter.navigate(primary, { replace: true });
    return true;
  }
}

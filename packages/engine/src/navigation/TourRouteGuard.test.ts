import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TourRouteGuard, normalizePath, type TourNavigationAdapter } from './TourNavigationAdapter';

const createMockAdapter = (initialPath = '/'): TourNavigationAdapter & { currentPath: string } => {
  const adapter = {
    currentPath: initialPath,
    getPath() {
      return adapter.currentPath;
    },
    navigate: vi.fn((path: string) => {
      adapter.currentPath = path;
    }),
  };
  return adapter;
};

describe('normalizePath', () => {
  it('strips trailing slashes', () => {
    expect(normalizePath('/tickets/')).toBe('/tickets');
    expect(normalizePath('/tickets///')).toBe('/tickets');
  });

  it('preserves root path', () => {
    expect(normalizePath('/')).toBe('/');
  });

  it('returns empty string unchanged', () => {
    expect(normalizePath('')).toBe('');
  });

  it('preserves paths without trailing slash', () => {
    expect(normalizePath('/tickets/9001')).toBe('/tickets/9001');
  });
});

describe('TourRouteGuard', () => {
  let guard: TourRouteGuard;
  let adapter: ReturnType<typeof createMockAdapter>;

  beforeEach(() => {
    guard = new TourRouteGuard();
    adapter = createMockAdapter('/');
    guard.setAdapter(adapter);
  });

  describe('policy lifecycle', () => {
    it('allows everything when no policy is set', () => {
      expect(guard.isPathAllowed('/anything')).toBe(true);
      expect(guard.isPathAllowed('/tickets/9001')).toBe(true);
    });

    it('restricts paths when policy is set', () => {
      guard.setPolicy({ paths: ['/tickets/9001'], mode: 'navigate' });
      expect(guard.isPathAllowed('/tickets/9001')).toBe(true);
      expect(guard.isPathAllowed('/tickets/9002')).toBe(false);
      expect(guard.isPathAllowed('/')).toBe(false);
    });

    it('supports multiple allowed paths', () => {
      guard.setPolicy({ paths: ['/tickets/9001', '/tickets/9002'], mode: 'navigate' });
      expect(guard.isPathAllowed('/tickets/9001')).toBe(true);
      expect(guard.isPathAllowed('/tickets/9002')).toBe(true);
      expect(guard.isPathAllowed('/tickets/9003')).toBe(false);
    });

    it('clears policy and runtime state', () => {
      guard.setPolicy({ paths: ['/tickets/9001'], mode: 'navigate' });
      guard.allowPath('/extra');
      guard.clear();

      expect(guard.getPolicy()).toBeNull();
      expect(guard.isPathAllowed('/tickets/9001')).toBe(true); // no policy = allow all
      expect(guard.isPathAllowed('/extra')).toBe(true);
    });

    it('resets runtime allowed paths when policy changes', () => {
      guard.setPolicy({ paths: ['/a'], mode: 'navigate' });
      guard.allowPath('/extra');
      expect(guard.isPathAllowed('/extra')).toBe(true);

      guard.setPolicy({ paths: ['/b'], mode: 'navigate' });
      expect(guard.isPathAllowed('/extra')).toBe(false); // runtime paths cleared
    });
  });

  describe('runtime allowed paths', () => {
    it('dynamically allows additional paths', () => {
      guard.setPolicy({ paths: ['/tickets/9001'], mode: 'navigate' });
      expect(guard.isPathAllowed('/tickets/9002')).toBe(false);

      guard.allowPath('/tickets/9002');
      expect(guard.isPathAllowed('/tickets/9002')).toBe(true);
    });

    it('normalizes paths when allowing', () => {
      guard.setPolicy({ paths: ['/tickets/9001'], mode: 'navigate' });
      guard.allowPath('/tickets/9002/');
      expect(guard.isPathAllowed('/tickets/9002')).toBe(true);
    });
  });

  describe('settled semantics', () => {
    it('starts unsettled', () => {
      guard.setPolicy({ paths: ['/tickets/9001'], mode: 'guard' });
      expect(guard.hasSettled()).toBe(false);
    });

    it('becomes settled when user is on an allowed path', () => {
      guard.setPolicy({ paths: ['/tickets/9001'], mode: 'guard' });
      guard.isPathAllowed('/tickets/9001'); // triggers settled
      expect(guard.hasSettled()).toBe(true);
    });

    it('does not settle on disallowed paths', () => {
      guard.setPolicy({ paths: ['/tickets/9001'], mode: 'guard' });
      guard.isPathAllowed('/wrong-path');
      expect(guard.hasSettled()).toBe(false);
    });

    it('resets settled on new policy', () => {
      guard.setPolicy({ paths: ['/a'], mode: 'guard' });
      guard.isPathAllowed('/a');
      expect(guard.hasSettled()).toBe(true);

      guard.setPolicy({ paths: ['/b'], mode: 'guard' });
      expect(guard.hasSettled()).toBe(false);
    });

    it('resets settled on clear', () => {
      guard.setPolicy({ paths: ['/a'], mode: 'guard' });
      guard.isPathAllowed('/a');
      guard.clear();
      expect(guard.hasSettled()).toBe(false);
    });
  });

  describe('route modes', () => {
    it('reports the active mode', () => {
      expect(guard.getMode()).toBeNull();

      guard.setPolicy({ paths: ['/a'], mode: 'navigate' });
      expect(guard.getMode()).toBe('navigate');

      guard.setPolicy({ paths: ['/a'], mode: 'guard' });
      expect(guard.getMode()).toBe('guard');

      guard.setPolicy({ paths: ['/a'], mode: 'pause' });
      expect(guard.getMode()).toBe('pause');
    });
  });

  describe('enforcePrimary', () => {
    it('navigates to primary path when current path is disallowed', async () => {
      adapter.currentPath = '/wrong';
      guard.setPolicy({ paths: ['/tickets/9001'], mode: 'navigate' });

      const navigated = await guard.enforcePrimary();
      expect(navigated).toBe(true);
      expect(adapter.navigate).toHaveBeenCalledWith('/tickets/9001', { replace: true });
    });

    it('does not navigate when already on allowed path', async () => {
      adapter.currentPath = '/tickets/9001';
      guard.setPolicy({ paths: ['/tickets/9001'], mode: 'navigate' });

      // Need to mark as checked so isPathAllowed returns true
      const navigated = await guard.enforcePrimary();
      expect(navigated).toBe(false);
      expect(adapter.navigate).not.toHaveBeenCalled();
    });

    it('does not navigate when no policy is set', async () => {
      const navigated = await guard.enforcePrimary();
      expect(navigated).toBe(false);
    });

    it('does not navigate when no adapter is set', async () => {
      const orphanGuard = new TourRouteGuard();
      orphanGuard.setPolicy({ paths: ['/a'], mode: 'navigate' });

      const navigated = await orphanGuard.enforcePrimary();
      expect(navigated).toBe(false);
    });

    it('returns primary path correctly', () => {
      guard.setPolicy({ paths: ['/first', '/second'], mode: 'navigate' });
      expect(guard.getPrimaryPath()).toBe('/first');
    });

    it('returns null primary path when no policy', () => {
      expect(guard.getPrimaryPath()).toBeNull();
    });
  });
});

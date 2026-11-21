/**
 * Persisted WorkspaceOS settings (theme, wallpaper, rain, dev mode).
 *
 * SSR-safety: the `persist` middleware is configured with `skipHydration: true`
 * so the store renders with deterministic defaults on the server and during the
 * first client render — eliminating hydration mismatches. Rehydration from
 * localStorage happens explicitly on the client via `useOSStoreHydration`.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEffect } from 'react';
import { type OSSettings, type Theme } from '@/types/os';

interface OSActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setWallpaper: (wallpaperId: string) => void;
  setRainEnabled: (enabled: boolean) => void;
  toggleRain: () => void;
  setDevMode: (enabled: boolean) => void;
}

const DEFAULT_SETTINGS: OSSettings = {
  theme: 'night',
  wallpaperId: 'aurora',
  rainEnabled: true,
  devMode: false,
};

export const useOSStore = create<OSSettings & OSActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'night' ? 'day' : 'night' })),
      setWallpaper: (wallpaperId) => set({ wallpaperId }),
      setRainEnabled: (rainEnabled) => set({ rainEnabled }),
      toggleRain: () => set((state) => ({ rainEnabled: !state.rainEnabled })),
      setDevMode: (devMode) => set({ devMode }),
    }),
    {
      name: 'workspace-os-settings',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Only persist data, never actions.
      partialize: (state): OSSettings => ({
        theme: state.theme,
        wallpaperId: state.wallpaperId,
        rainEnabled: state.rainEnabled,
        devMode: state.devMode,
      }),
    },
  ),
);

/**
 * Rehydrates the persisted OS settings on the client exactly once.
 * Mount this near the app root (see `providers.tsx`).
 */
export function useOSStoreHydration(): void {
  useEffect(() => {
    void useOSStore.persist.rehydrate();
  }, []);
}

'use client';

/**
 * The monitor's operating system, as DOM.
 *
 * While the experience is in `os_active`, this lays the terminal exactly over
 * the monitor's glass: the scene reports the screen's projected rectangle
 * (`monitorRect`) the moment the camera lands, and the terminal is positioned
 * and sized to it — so you are using the monitor *in* the room, bezel and wall
 * still visible around it, with real text, real selection and real focus.
 *
 * The type scales with the screen (container query units), so the terminal
 * looks the same on a laptop and a 4K display.
 *
 * Two cases fall back to a full-viewport sheet: devices with no 3D room (the
 * low-power path, where the terminal *is* the experience) and screens too
 * narrow for the in-room monitor to be usable.
 */
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useExperienceStore } from '@/stores/experienceStore';
import { Terminal } from './terminal/Terminal';

/** Below this projected width the in-room monitor is too small to type in. */
const MIN_IN_ROOM_WIDTH = 560;

export function MonitorOS({ hasRoom }: { hasRoom: boolean }) {
  const active = useExperienceStore((s) => s.phase === 'os_active');
  const rect = useExperienceStore((s) => s.monitorRect);
  const panelOpen = useExperienceStore((s) => s.activePanel !== null);

  // Esc leaves the monitor — unless a panel is open over it (the panel closes
  // first; see `PanelShell`).
  useEffect(() => {
    if (!active || !hasRoom || panelOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') useExperienceStore.getState().exitMonitor();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, hasRoom, panelOpen]);

  const inRoom = hasRoom && rect !== null && rect.width >= MIN_IN_ROOM_WIDTH;
  const ready = active && (!hasRoom || rect !== null);

  return (
    <AnimatePresence>
      {ready && (
        <motion.div
          key="monitor-os"
          role="application"
          aria-label="WorkspaceOS terminal"
          className="fixed z-30 overflow-hidden"
          style={
            inRoom
              ? {
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                  containerType: 'inline-size',
                  borderRadius: 2,
                }
              : {
                  inset: hasRoom ? 12 : 0,
                  containerType: 'inline-size',
                  borderRadius: hasRoom ? 12 : 0,
                  boxShadow: hasRoom ? '0 30px 80px rgba(0,0,0,0.6)' : undefined,
                }
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <div
            className="relative h-full w-full"
            style={{ fontSize: 'clamp(11px, 1.58cqw, 19px)' }}
          >
            <Terminal canExit={hasRoom} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

/**
 * The interface layer: everything DOM that sits over the room and is not the
 * monitor's OS — the HUD and dock, the cursor's hover label, the intro title
 * card, the first-visit guide, toasts, and the panels the room's objects open (résumé, gallery,
 * and the phone).
 *
 * It knows nothing about three.js and never imports from `features/scene` or
 * `features/os`; it reads and writes `experienceStore` only.
 */
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useExperienceStore } from '@/stores/experienceStore';
import { Hud } from './hud/Hud';
import { HoverLabel } from './hud/HoverLabel';
import { IntroTitle } from './hud/IntroTitle';
import { Toast } from './hud/Toast';
import { Guide } from './guide/Guide';
import { ResumePanel } from './panels/ResumePanel';
import { GalleryPanel } from './panels/GalleryPanel';
import { PhonePanel } from './panels/PhonePanel';
import { CertificatesPanel } from './panels/CertificatesPanel';

interface InterfaceRootProps {
  /** False on the low-power path: there is no room, so no HUD over it. */
  hasRoom: boolean;
}

export function InterfaceRoot({ hasRoom }: InterfaceRootProps) {
  const activePanel = useExperienceStore((s) => s.activePanel);

  return (
    <MotionConfig reducedMotion="user">
      {hasRoom && (
        <>
          <IntroTitle />
          <Hud />
          <HoverLabel />
          <Guide />
        </>
      )}
      <Toast />
      <AnimatePresence>
        {activePanel === 'resume' && <ResumePanel key="resume" />}
        {activePanel === 'gallery' && <GalleryPanel key="gallery" />}
        {activePanel === 'contact' && <PhonePanel key="contact" />}
        {activePanel === 'certificates' && <CertificatesPanel key="certificates" />}
      </AnimatePresence>
    </MotionConfig>
  );
}

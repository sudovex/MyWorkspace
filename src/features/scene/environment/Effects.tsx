'use client';

/**
 * Post-processing, all merged into a single full-screen pass after bloom:
 *  - **Bloom** on the things that actually emit light (screen, neon, lamp
 *    bulb, LED strips, beacons — authored above 1.0 with `toneMapped={false}`
 *    so only they cross the threshold).
 *  - A light **grade** (a touch of contrast and saturation) so the warm/cool
 *    split reads on dull displays.
 *  - A gentle **vignette**.
 *  - ~2% **grain** — not as a look, but as dither: it breaks up the banding
 *    that dark gradients (the walls, the bloom falloff) show on 8-bit panels.
 *  - Filmic **tone mapping**.
 *
 * Deliberately no chromatic aberration, lens flare or depth of field
 * (`DESIGN_PHILOSOPHY.md` §3.4).
 */
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

interface EffectsProps {
  multisampling: number;
}

export function Effects({ multisampling }: EffectsProps) {
  return (
    <EffectComposer multisampling={multisampling} enableNormalPass={false}>
      <Bloom
        mipmapBlur
        intensity={0.7}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.2}
        radius={0.74}
      />
      <HueSaturation saturation={0.12} />
      <BrightnessContrast brightness={0.01} contrast={0.07} />
      <Vignette offset={0.26} darkness={0.66} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.045} />
    </EffectComposer>
  );
}

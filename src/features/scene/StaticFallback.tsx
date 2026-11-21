'use client';

/**
 * The backdrop for devices that cannot run the WebGL room. No one is locked
 * out: on this path the terminal opens full-screen on top of this (see
 * `features/os/MonitorOS.tsx`) and the résumé, gallery and contact panels all
 * work from it. This component only paints what sits behind them.
 */
import { siteConfig } from '@/config/site';

export function StaticFallback() {
  const { developer, osName } = siteConfig;
  return (
    <div className="bg-background relative grid h-full w-full place-items-center overflow-hidden px-6">
      <div
        aria-hidden
        className="bg-primary/25 absolute top-1/3 left-1/2 size-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
      />
      <div className="relative text-center">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.25em] uppercase">
          {osName} v{siteConfig.osVersion}
        </p>
        <h1 className="text-foreground mt-4 text-4xl font-semibold tracking-tight">
          {developer.name}
        </h1>
        <p className="text-primary mt-1">{developer.role}</p>
      </div>
    </div>
  );
}

'use client';

/**
 * Certificates — what the framed certificate on the wall opens.
 *
 * Every certification laid out as what it is: a sheet of paper with a border,
 * an issuer, a seal and a credential number. They are dealt onto the panel
 * one after another; each one is a link to the issuer's verification page.
 * Content comes from `content/resume.ts`.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Award } from 'lucide-react';
import { certifications, profile } from '@/content';
import { PanelShell } from './PanelShell';

/** Wax-seal colour per issuer, so the wall of paper isn't monotone. */
const SEAL: Record<string, string> = {
  HackerRank: '#1f9d55',
  Udemy: '#8b3fd6',
  CodeChef: '#8a5a2b',
  GUVI: '#1f8a4c',
};
const DEFAULT_SEAL = '#b8923a';

export function CertificatesPanel() {
  const reducedMotion = useReducedMotion();

  return (
    <PanelShell
      label="Certificates"
      className="h-full max-w-[70rem] lg:h-[min(50rem,100%)]"
    >
      <div className="quiet-scroll min-h-0 flex-1 overflow-y-auto p-6 sm:p-9">
        <header className="flex flex-wrap items-end justify-between gap-4 pr-10">
          <div>
            <p className="text-warm font-mono text-[11px] tracking-[0.28em] uppercase">
              Certificates
            </p>
            <h2 className="mt-2.5 text-[clamp(2rem,4vw,3rem)] leading-none font-semibold tracking-[-0.04em]">
              On paper.
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">
              Everything with a credential number attached. Each one opens the
              issuer&rsquo;s own verification page.
            </p>
          </div>
          <p className="text-muted-foreground font-mono text-xs tabular-nums">
            {String(certifications.length).padStart(2, '0')} certificates
          </p>
        </header>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {certifications.map((cert, i) => {
            const seal = SEAL[cert.issuer] ?? DEFAULT_SEAL;
            return (
              <motion.li
                key={cert.id}
                initial={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 44, scale: 0.88, rotate: i % 2 ? 4 : -4 }
                }
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 190,
                  damping: 21,
                  delay: 0.36 + i * 0.08,
                }}
              >
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group focus-visible:ring-primary relative block h-full rounded-md bg-[#f4efe4] p-2.5 text-[#211c18] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.7)] transition-transform duration-300 outline-none hover:-translate-y-1.5 hover:rotate-[-0.6deg] focus-visible:ring-2"
                >
                  {/* the printed border */}
                  <div className="relative flex h-full flex-col rounded-[3px] border-[1.5px] border-[#b8923a] p-5 outline outline-1 outline-offset-[3px] outline-[#b8923a]/45">
                    <p className="font-mono text-[10px] font-semibold tracking-[0.3em] text-[#a23a22] uppercase">
                      {cert.issuer}
                    </p>
                    <p className="mt-1 font-serif text-[11px] tracking-[0.2em] text-[#211c18]/55 uppercase">
                      Certificate of achievement
                    </p>
                    <h3 className="mt-4 font-serif text-[1.4rem] leading-[1.15] font-semibold tracking-[-0.01em]">
                      {cert.name}
                    </h3>
                    <p className="mt-1.5 font-serif text-sm text-[#211c18]/60 italic">
                      awarded to {profile.name}
                    </p>
                    <p className="mt-4 flex-1 text-[13px] leading-relaxed text-[#211c18]/75">
                      {cert.description}
                    </p>

                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        {cert.credentialId && (
                          <>
                            <p className="font-mono text-[9px] tracking-[0.2em] text-[#211c18]/45 uppercase">
                              Credential ID
                            </p>
                            <p className="truncate font-mono text-[11px] text-[#211c18]/80">
                              {cert.credentialId}
                            </p>
                          </>
                        )}
                        <p className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#a23a22]">
                          Verify
                          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </p>
                      </div>
                      {/* the seal */}
                      <span
                        className="grid size-14 shrink-0 place-items-center rounded-full text-white shadow-[inset_0_-3px_6px_rgba(0,0,0,0.3),0_3px_8px_rgba(0,0,0,0.3)] transition-transform duration-500 group-hover:rotate-12"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${seal} 70%, white), ${seal} 60%)`,
                        }}
                      >
                        <Award className="size-6" strokeWidth={1.8} />
                      </span>
                    </div>
                  </div>
                </a>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </PanelShell>
  );
}

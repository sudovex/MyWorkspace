'use client';

/**
 * The résumé — opened by the desk calendar (lands on the career timeline), a
 * book on the shelf (lands on the summary), the notebook (lands on projects),
 * or the terminal's `resume`.
 *
 * A two-column folio: a fixed identity rail with a section index on the left,
 * a scrolling document on the right. Nothing appears all at once — the
 * timeline draws itself downward, entries slide in as they enter view, the
 * headline numbers count up, skill chips land one by one. All content comes
 * from `src/content/`; this file is presentation only.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Award,
  Briefcase,
  Download,
  FolderGit2,
  GraduationCap,
  Mail,
  MapPin,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import {
  certifications,
  education,
  experience,
  profile,
  projects,
  skills,
  type ExperienceEntry,
} from '@/content';
import { useExperienceStore } from '@/stores/experienceStore';
import { type ResumeSectionId } from '@/types/experience';
import { cn } from '@/lib/utils';
import { PanelShell } from './PanelShell';

const SECTIONS: readonly { id: ResumeSectionId; label: string; icon: LucideIcon }[] = [
  { id: 'summary', label: 'Summary', icon: Sparkles },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'certifications', label: 'Certifications', icon: Award },
];

const EASE = [0.16, 1, 0.3, 1] as const;

/* -------------------------------- pieces -------------------------------- */

/** Fades/slides its children in the first time they scroll into view. */
function Reveal({
  children,
  delay = 0,
  x = 0,
  y = 22,
  className,
}: {
  children: ReactNode;
  delay?: number;
  x?: number;
  y?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** A number that counts up from zero when it first becomes visible. */
function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.3,
      ease: 'easeOut',
      onUpdate: (latest) => setShown(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value, reducedMotion]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown}
      {suffix}
    </span>
  );
}

function SectionHeading({ index, title }: { index: number; title: string }) {
  return (
    <Reveal className="mb-7 flex items-baseline gap-4">
      <span className="text-primary font-mono text-xs tracking-[0.2em]">
        {String(index + 1).padStart(2, '0')}
      </span>
      <h3 className="text-[1.65rem] font-semibold tracking-[-0.025em]">{title}</h3>
      <motion.span
        aria-hidden
        className="from-border h-px flex-1 origin-left bg-gradient-to-r to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
      />
    </Reveal>
  );
}

function Chip({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'warm';
}) {
  return (
    <span
      className={cn(
        'rounded-full border px-2.5 py-1 font-mono text-[11px] leading-none',
        tone === 'warm'
          ? 'border-warm/30 bg-warm/10 text-warm'
          : 'border-border bg-secondary/50 text-secondary-foreground',
      )}
    >
      {children}
    </span>
  );
}

/** A tear-off calendar tile — the timeline's date marker. */
function DateTile({ entry }: { entry: ExperienceEntry }) {
  const [month, year] = entry.start.split(' ');
  return (
    <div className="border-border w-[4.6rem] shrink-0 overflow-hidden rounded-lg border bg-[#f4efe4] text-center shadow-lg shadow-black/30">
      <div className="bg-[#c4452f] py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#fff6ea] uppercase">
        {month}
      </div>
      <div className="py-1.5 text-lg leading-none font-bold tracking-tight text-[#211c18]">
        {year}
      </div>
    </div>
  );
}

function TimelineItem({ entry, index }: { entry: ExperienceEntry; index: number }) {
  const current = entry.end === 'Present';
  return (
    <li className="relative pb-10 pl-10 last:pb-0">
      {/* node on the rail */}
      <motion.span
        aria-hidden
        className={cn(
          'absolute top-1.5 left-0 grid size-[23px] place-items-center rounded-full border-2',
          current ? 'border-warm bg-warm/20' : 'border-primary bg-card',
        )}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{
          type: 'spring',
          stiffness: 320,
          damping: 18,
          delay: 0.1 + index * 0.12,
        }}
      >
        {current && (
          <span className="bg-warm absolute size-full animate-ping rounded-full opacity-40" />
        )}
        <span className={cn('size-2 rounded-full', current ? 'bg-warm' : 'bg-primary')} />
      </motion.span>

      <Reveal x={26} y={0} delay={0.12 + index * 0.12}>
        <article className="border-border bg-secondary/25 hover:border-primary/40 rounded-xl border p-5 transition-colors">
          <header className="flex items-start gap-4">
            <DateTile entry={entry} />
            <div className="min-w-0 flex-1">
              <h4 className="text-lg leading-tight font-semibold">{entry.title}</h4>
              <p className="text-primary mt-0.5 text-sm font-medium">{entry.company}</p>
              <p className="text-muted-foreground mt-1 font-mono text-[11px]">
                {entry.start} — {entry.end} · {entry.location}
              </p>
            </div>
            {current && (
              <span className="border-warm/40 text-warm hidden rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase sm:block">
                now
              </span>
            )}
          </header>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            {entry.summary}
          </p>
          <ul className="mt-3 space-y-2">
            {entry.bullets.map((bullet, i) => (
              <motion.li
                key={bullet}
                className="flex gap-3 text-sm leading-relaxed"
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.3 + i * 0.08, ease: EASE }}
              >
                <span className="bg-primary/70 mt-[0.55em] size-1.5 shrink-0 rounded-full" />
                <span>{bullet}</span>
              </motion.li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        </article>
      </Reveal>
    </li>
  );
}

/* --------------------------------- panel -------------------------------- */

export function ResumePanel() {
  const initialSection = useExperienceStore((s) => s.panelSection) ?? 'summary';
  const openPanel = useExperienceStore((s) => s.openPanel);
  const [active, setActive] = useState<ResumeSectionId>(initialSection);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<ResumeSectionId, HTMLElement | null>>>({});
  /** While a click-scroll is in flight, the scrollspy must not fight it. */
  const lockUntil = useRef(0);

  const scrollTo = (id: ResumeSectionId, smooth = true) => {
    const container = scrollRef.current;
    const section = sectionRefs.current[id];
    if (!container || !section) return;
    lockUntil.current = performance.now() + (smooth ? 900 : 0);
    setActive(id);
    container.scrollTo({
      top: section.offsetTop - 28,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // Deep link: land on the section the room object asked for.
  useEffect(() => {
    if (initialSection !== 'summary') scrollTo(initialSection, false);
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scrollspy.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      if (performance.now() < lockUntil.current) return;
      const probe = container.scrollTop + container.clientHeight * 0.3;
      let current: ResumeSectionId = 'summary';
      for (const { id } of SECTIONS) {
        const el = sectionRefs.current[id];
        if (el && el.offsetTop <= probe) current = id;
      }
      // At the very bottom the last section wins even if it is short.
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 4) {
        current = SECTIONS[SECTIONS.length - 1]?.id ?? current;
      }
      setActive(current);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const register = (id: ResumeSectionId) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <PanelShell label="Résumé" className="h-full max-w-[74rem] lg:h-[min(52rem,100%)]">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* ------------------------------ rail ------------------------------ */}
        <aside className="border-border relative shrink-0 border-b p-6 lg:w-[19rem] lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-8">
          <div
            aria-hidden
            className="bg-primary/20 pointer-events-none absolute -top-24 -left-24 size-64 rounded-full blur-3xl"
          />
          <div className="relative flex items-center gap-4 lg:block">
            {/* monogram with a slow orbiting ring */}
            <div className="relative size-16 shrink-0 lg:size-20">
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0 55%, var(--warm) 80%, var(--primary) 100%)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
              />
              <div className="bg-card absolute inset-[3px] grid place-items-center rounded-full">
                <span className="text-xl font-semibold tracking-tight lg:text-2xl">
                  {profile.initials}
                </span>
              </div>
            </div>
            <div className="min-w-0 lg:mt-5">
              <h2 className="text-2xl leading-tight font-semibold tracking-[-0.03em] lg:text-[1.75rem]">
                {profile.name}
              </h2>
              <p className="text-primary mt-1 text-sm font-medium">
                {profile.role} · {profile.company}
              </p>
            </div>
          </div>

          <p className="text-muted-foreground relative mt-4 hidden font-mono text-[11px] leading-relaxed lg:block">
            {profile.tagline}
          </p>

          <dl className="relative mt-5 hidden space-y-2 text-sm lg:block">
            <div className="text-muted-foreground flex items-center gap-2.5">
              <MapPin className="size-3.5 shrink-0" />
              <dd>{profile.location}</dd>
            </div>
            <div className="text-muted-foreground flex items-center gap-2.5">
              <span className="relative ml-[3px] flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <dd className="ml-[3px]">{profile.availability}</dd>
            </div>
          </dl>

          <div className="relative mt-5 flex gap-2 lg:mt-6">
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-primary text-primary-foreground flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-[filter] hover:brightness-110"
            >
              <Download className="size-4" />
              PDF
            </a>
            <button
              type="button"
              onClick={() => openPanel('contact')}
              className="border-border hover:bg-accent flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
            >
              <Mail className="size-4" />
              Contact
            </button>
          </div>

          {/* section index */}
          <nav aria-label="Résumé sections" className="relative mt-5 lg:mt-8">
            <ul className="quiet-scroll -mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-0">
              {SECTIONS.map(({ id, label, icon: Icon }, i) => {
                const isActive = active === id;
                return (
                  <li key={id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => scrollTo(id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="resume-nav-active"
                          className="bg-accent border-primary/30 absolute inset-0 rounded-lg border"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative hidden font-mono text-[10px] opacity-60 lg:inline">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <Icon className="relative size-3.5" />
                      <span className="relative">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* ---------------------------- document ---------------------------- */}
        <div
          ref={scrollRef}
          className="quiet-scroll relative min-h-0 flex-1 overflow-y-auto scroll-smooth px-6 py-8 sm:px-10 lg:py-10"
        >
          {/* summary */}
          <section ref={register('summary')} aria-label="Summary">
            <Reveal>
              <p className="text-primary font-mono text-[11px] tracking-[0.28em] uppercase">
                Résumé
              </p>
              <h3 className="mt-3 max-w-2xl text-[clamp(1.7rem,3.2vw,2.6rem)] leading-[1.08] font-semibold tracking-[-0.035em]">
                I build the part of the product that decides{' '}
                <span className="text-warm">who gets in.</span>
              </h3>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-muted-foreground mt-5 max-w-2xl leading-relaxed">
                {profile.summary}
              </p>
            </Reveal>
            <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {profile.stats.map((stat, i) => (
                <Reveal key={stat.label} delay={0.15 + i * 0.08}>
                  <div className="border-border bg-secondary/25 h-full rounded-xl border p-4">
                    <dd className="text-[2rem] leading-none font-semibold tracking-[-0.04em]">
                      <CountUp value={stat.value} suffix={stat.suffix} />
                    </dd>
                    <dt className="text-muted-foreground mt-2 text-xs leading-snug">
                      {stat.label}
                    </dt>
                  </div>
                </Reveal>
              ))}
            </dl>
          </section>

          {/* experience */}
          <section ref={register('experience')} aria-label="Experience" className="pt-16">
            <SectionHeading index={1} title="Experience" />
            <ol className="relative">
              {/* the rail draws itself downward */}
              <motion.span
                aria-hidden
                className="from-warm via-primary to-primary/0 absolute top-2 bottom-0 left-[11px] w-px origin-top bg-gradient-to-b"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 1.4, ease: EASE }}
              />
              {experience.map((entry, i) => (
                <TimelineItem key={entry.id} entry={entry} index={i} />
              ))}
            </ol>
          </section>

          {/* projects */}
          <section ref={register('projects')} aria-label="Projects" className="pt-16">
            <SectionHeading index={2} title="Projects" />
            <div className="grid gap-4 xl:grid-cols-3">
              {projects.map((project, i) => (
                <Reveal key={project.id} delay={i * 0.1} className="h-full">
                  <article className="group border-border bg-secondary/25 hover:border-primary/40 relative flex h-full flex-col overflow-hidden rounded-xl border p-5 transition-colors">
                    <span
                      aria-hidden
                      className="from-primary to-warm absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:scale-x-100"
                    />
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="text-lg font-semibold">{project.name}</h4>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-warm mt-0.5 font-mono text-[11px]">
                      {project.blurb}
                    </p>
                    <p className="text-muted-foreground mt-3 flex-1 text-sm leading-relaxed">
                      {project.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {project.stack.map((tech) => (
                        <Chip key={tech}>{tech}</Chip>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                      {project.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                        >
                          {link.label}
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      ))}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* skills */}
          <section ref={register('skills')} aria-label="Skills" className="pt-16">
            <SectionHeading index={3} title="Skills" />
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {skills.map((group, g) => (
                <Reveal key={group.id} delay={g * 0.06}>
                  <h4 className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
                    {group.label}
                  </h4>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item, i) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, scale: 0.6, y: 8 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 22,
                          delay: 0.15 + g * 0.05 + i * 0.045,
                        }}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-sm',
                          group.id === 'identity'
                            ? 'border-warm/35 bg-warm/10 text-warm'
                            : 'border-border bg-secondary/40',
                        )}
                      >
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </section>

          {/* education */}
          <section ref={register('education')} aria-label="Education" className="pt-16">
            <SectionHeading index={4} title="Education" />
            <div className="grid gap-4 md:grid-cols-2">
              {education.map((entry, i) => (
                <Reveal key={entry.id} delay={i * 0.1} className="h-full">
                  <article className="border-border bg-secondary/25 h-full rounded-xl border p-5">
                    <p className="text-warm font-mono text-[11px]">{entry.period}</p>
                    <h4 className="mt-2 text-base leading-snug font-semibold">
                      {entry.degree}
                    </h4>
                    <p className="text-muted-foreground mt-1.5 text-sm">{entry.school}</p>
                    <p className="text-muted-foreground/80 mt-0.5 font-mono text-[11px]">
                      {entry.location}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {entry.focus.map((topic) => (
                        <Chip key={topic}>{topic}</Chip>
                      ))}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* certifications */}
          <section
            ref={register('certifications')}
            aria-label="Certifications"
            className="pt-16"
          >
            <SectionHeading index={5} title="Certifications" />
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {certifications.map((cert, i) => (
                <Reveal key={cert.id} delay={i * 0.05} y={14}>
                  <li>
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group border-border bg-secondary/25 hover:border-primary/40 flex items-center gap-3.5 rounded-xl border px-4 py-3 transition-colors"
                    >
                      <Award className="text-warm size-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {cert.name}
                        </span>
                        <span className="text-muted-foreground block font-mono text-[11px]">
                          {cert.issuer}
                        </span>
                      </span>
                      <ArrowUpRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
                    </a>
                  </li>
                </Reveal>
              ))}
            </ul>

            <Reveal delay={0.1}>
              <div className="border-primary/25 from-primary/15 mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border bg-gradient-to-br to-transparent p-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-lg font-semibold tracking-tight">
                    That&rsquo;s the short version.
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    The long one is better over a call.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openPanel('contact')}
                  className="bg-primary text-primary-foreground flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-[filter] hover:brightness-110"
                >
                  Get in touch
                  <ArrowUpRight className="size-4" />
                </button>
              </div>
            </Reveal>
          </section>
        </div>
      </div>
    </PanelShell>
  );
}

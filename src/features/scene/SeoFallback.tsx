import {
  certifications,
  education,
  experience,
  profile,
  projects,
  skills,
} from '@/content';

/**
 * Visually-hidden, server-rendered content for search engines and assistive
 * technology. WebGL is invisible to crawlers and screen readers, so the
 * portfolio's substance — the same typed content the résumé panel and the
 * terminal render — is mirrored here as plain semantic HTML.
 */
export function SeoFallback() {
  return (
    <div className="sr-only">
      <h1>
        {profile.name} — {profile.role}
      </h1>
      <p>{profile.summary}</p>
      <p>
        {profile.location}. {profile.availability}.
      </p>

      <h2>Experience</h2>
      {experience.map((job) => (
        <section key={job.id}>
          <h3>
            {job.title}, {job.company} ({job.start} – {job.end})
          </h3>
          <ul>
            {job.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </section>
      ))}

      <h2>Projects</h2>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            {project.name} — {project.description} ({project.stack.join(', ')})
          </li>
        ))}
      </ul>

      <h2>Skills</h2>
      <ul>
        {skills.map((group) => (
          <li key={group.id}>
            {group.label}: {group.items.join(', ')}
          </li>
        ))}
      </ul>

      <h2>Education</h2>
      <ul>
        {education.map((entry) => (
          <li key={entry.id}>
            {entry.degree}, {entry.school} ({entry.period})
          </li>
        ))}
      </ul>

      <h2>Certifications</h2>
      <ul>
        {certifications.map((cert) => (
          <li key={cert.id}>
            {cert.name} — {cert.issuer}
          </li>
        ))}
      </ul>

      <nav aria-label="Primary">
        <ul>
          <li>
            <a href={profile.links.github.url}>GitHub</a>
          </li>
          <li>
            <a href={profile.links.linkedin.url}>LinkedIn</a>
          </li>
          <li>
            <a href={profile.links.instagram.url}>Instagram</a>
          </li>
          <li>
            <a href={profile.links.whatsapp.url}>WhatsApp</a>
          </li>
          <li>
            <a href={profile.links.email.url}>Email</a>
          </li>
          <li>
            <a href={profile.resumeUrl}>Résumé (PDF)</a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

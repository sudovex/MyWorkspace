/**
 * The résumé as typed data. Rendered by the animated résumé panel (calendar /
 * bookshelf / notebook in the room), printed by the terminal (`resume`,
 * `experience`, `projects`, …) and mirrored into the SEO fallback.
 *
 * Experience bullets describe the role — responsibilities, in Shubham's own
 * framing — rather than individual pieces of work; the `summary` line above
 * them carries the domain (identity / SSO / SDKs) so that specific signal is
 * not lost. Add a quantified highlight to a role if one becomes available.
 */
export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  start: string;
  end: string;
  /** Short label for the calendar-style timeline rail. */
  period: string;
  summary: string;
  bullets: readonly string[];
  tags: readonly string[];
}

export const experience: readonly ExperienceEntry[] = [
  {
    id: 'miniorange-se',
    title: 'Software Engineer',
    company: 'miniOrange Security',
    location: 'Pune, India',
    start: 'Feb 2025',
    end: 'Present',
    period: '2025 — now',
    summary:
      'Backend and security-oriented engineering on an identity and access ' +
      'management platform — single sign-on (OAuth 2.0, OpenID Connect, SAML) ' +
      'and SDKs in several languages.',
    bullets: [
      'Develop and enhance production-grade product features based on business and customer requirements.',
      'Build, maintain and integrate backend services, REST APIs and frontend components.',
      'Investigate and resolve production issues, software defects and customer-reported bugs.',
      'Validate new features and fixes through functional and regression testing.',
      'Deliver customer-specific customizations and support on-premise deployments, service configuration and releases.',
      'Collaborate with cross-functional teams on requirements, code reviews and testing to keep the product reliable, performant and secure.',
    ],
    tags: ['OAuth 2.0', 'OIDC', 'SAML', 'SSO', 'Java', 'Node.js', 'PHP', 'SDKs'],
  },
  {
    id: 'miniorange-intern',
    title: 'Software Engineer Intern',
    company: 'miniOrange Security',
    location: 'Pune, India',
    start: 'Aug 2024',
    end: 'Jan 2025',
    period: '2024',
    summary: 'Six-month internship that converted into a full-time engineering role.',
    bullets: [
      'Assisted in developing product features and fixing defects across backend services and web front ends.',
      'Tested and validated features and bug fixes ahead of release.',
      'Supported troubleshooting of customer-reported issues alongside senior engineers.',
      'Learned the product’s authentication stack: OAuth 2.0, OpenID Connect, SAML and SSO configuration.',
    ],
    tags: ['Authentication', 'REST APIs', 'JavaScript', 'Java'],
  },
];

export interface ProjectEntry {
  id: string;
  name: string;
  blurb: string;
  description: string;
  stack: readonly string[];
  links: readonly { label: string; url: string }[];
}

export const projects: readonly ProjectEntry[] = [
  {
    id: 'fixmycode',
    name: 'FixMyCode',
    blurb: 'AI code editor',
    description:
      'A lightweight in-browser code editor paired with AI-powered code ' +
      'transformation through the OpenAI API — paste, fix, refactor.',
    stack: ['React', 'JavaScript', 'Firebase', 'OpenAI API'],
    links: [
      { label: 'Live', url: 'https://fixmycode.netlify.app/' },
      { label: 'Source', url: 'https://github.com/sudovex/fix_my_code' },
      { label: 'Demo', url: 'https://www.youtube.com/watch?v=znxQCv4sGuA' },
    ],
  },
  {
    id: 'easy-navigate',
    name: 'Easy Navigate',
    blurb: 'Voice navigation',
    description:
      'A hands-free app for exploring places while driving — discover nearby ' +
      'attractions by voice command, without taking your eyes off the road.',
    stack: ['React', 'Node.js', 'Express.js', 'MongoDB'],
    links: [
      { label: 'Live', url: 'https://highway-alerts.netlify.app/' },
      { label: 'Source', url: 'https://github.com/sudovex/Highway-Alerts' },
    ],
  },
  {
    id: 'web-messenger',
    name: 'Web Messenger',
    blurb: 'Hosted chat platform',
    description:
      'A hosted web messenger used by 50+ registered users, built responsive ' +
      'from the start so it works the same on any device.',
    stack: ['PHP', 'JavaScript', 'HTML', 'CSS'],
    links: [{ label: 'Live', url: 'https://lets-chat-webmessenger.000webhostapp.com/' }],
  },
];

export interface SkillGroup {
  id: string;
  label: string;
  items: readonly string[];
}

export const skills: readonly SkillGroup[] = [
  {
    id: 'identity',
    label: 'Identity & security',
    items: ['OAuth 2.0', 'OpenID Connect', 'SAML', 'SSO', 'IAM'],
  },
  {
    id: 'backend',
    label: 'Backend',
    items: ['Java', 'Node.js', 'Express.js', 'PHP', 'Python', 'REST APIs'],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    items: ['React', 'Next.js', 'JavaScript', 'HTML', 'CSS'],
  },
  {
    id: 'data',
    label: 'Data',
    items: ['PostgreSQL', 'MongoDB', 'SQL', 'Redis', 'Firebase'],
  },
  {
    id: 'platform',
    label: 'Cloud & tooling',
    items: ['AWS', 'Docker', 'OpenAI API', 'Composer', 'npm', 'Maven', 'JitPack'],
  },
];

export interface EducationEntry {
  id: string;
  degree: string;
  school: string;
  location: string;
  period: string;
  focus: readonly string[];
}

export const education: readonly EducationEntry[] = [
  {
    id: 'mca',
    degree: 'Master of Computer Application (M.C.A.)',
    school: 'MES Institute of Management & Career Courses (IMCC), SPPU',
    location: 'Pune, Maharashtra',
    period: '2022 — 2024',
    focus: ['Advanced Web Development', 'Cloud Computing', 'Software Architecture'],
  },
  {
    id: 'bcs',
    degree: 'Bachelor of Computer Science',
    school: "Deccan Education Society's Willingdon College",
    location: 'Sangli, Maharashtra',
    period: '2019 — 2022',
    focus: ['Data Structures', 'Operating Systems', 'Database Management'],
  },
];

export interface CertificationEntry {
  id: string;
  issuer: string;
  name: string;
  description: string;
  /** The credential / certificate ID as printed by the issuer, if any. */
  credentialId?: string;
  url: string;
}

export const certifications: readonly CertificationEntry[] = [
  {
    id: 'hr-java-gold',
    issuer: 'HackerRank',
    name: 'Java — 5-Star Gold Badge',
    description:
      'Five-star gold badge in Java, demonstrating advanced proficiency in Java problem-solving and algorithms.',
    credentialId: '@shubhammali929',
    url: 'https://www.hackerrank.com/profile/shubhammali929',
  },
  {
    id: 'udemy-security',
    issuer: 'Udemy',
    name: 'Ethical Hacking and Cybersecurity',
    description:
      'Ethical hacking techniques, cybersecurity fundamentals and penetration testing methodologies.',
    credentialId: 'UC-b01608d3-ee10-467e-9746-be55c99e6a5c',
    url: 'https://www.udemy.com/certificate/UC-b01608d3-ee10-467e-9746-be55c99e6a5c/',
  },
  {
    id: 'hr-java',
    issuer: 'HackerRank',
    name: 'Java Certification',
    description:
      'Verified proficiency in core Java concepts, object-oriented design and language fundamentals.',
    credentialId: 'a98571bb6275',
    url: 'https://www.hackerrank.com/certificates/a98571bb6275',
  },
  {
    id: 'cc-problem-solving',
    issuer: 'CodeChef',
    name: 'Problem Solving (Intermediate)',
    description:
      'Intermediate-level algorithmic problem solving, data structures and optimisation techniques.',
    credentialId: '8b97995',
    url: 'https://www.codechef.com/certificates/public/8b97995',
  },
  {
    id: 'cc-sql',
    issuer: 'CodeChef',
    name: 'SQL (Basics & Intermediate)',
    description: 'SQL fundamentals through intermediate database management and queries.',
    url: 'https://www.codechef.com/certificates/public/8b97995',
  },
  {
    id: 'guvi-python',
    issuer: 'GUVI',
    name: 'Python Programming',
    description:
      'Python programming fundamentals — syntax, data structures and problem solving.',
    credentialId: 'H06b40zx92819fu0P6',
    url: 'https://www.guvi.in/share-certificate/H06b40zx92819fu0P6',
  },
];

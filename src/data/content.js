// All portfolio content lives here so it can be edited without touching components.
//
// PLACEHOLDERS: any value set to `null` is information Justine has not supplied yet.
// The UI either omits it or shows a clearly marked, non-clickable placeholder.
// Replace `null` with the real value when it is confirmed — never with a guess.

export const profile = {
  name: 'Justine Pelgone',
  role: 'Developer & UI/UX Designer',
  intro:
    "I'm a Computer Science student passionate about frontend development and user-centered design.",
  // The hero portrait: a cut-out image with a transparent background, in /public.
  // To replace it, swap the file (PNG or WebP) and update the pixel size below so
  // the page can reserve the right space. Set to null to show the placeholder.
  portrait: { src: '/portrait.png', width: 600, height: 600 },
  // The pixel-art avatar on the back of the portrait when it flips: head, neck,
  // shoulders and jacket, framed like the photo. Every expression shares one
  // identical head and body (only the eyes, brows and mouth differ), so swapping
  // them never shifts the picture.
  // `width` and `height` are the sprite's true size in its own pixels; it is drawn
  // at whole multiples of that. Set to null to leave the portrait as a plain photo.
  // (From assets-source/pixel-character-sheet.jpg: busts #11, #1, #10 and #9; every
  // sprite from that sheet is in assets-source/sprites.)
  pixelPortrait: {
    width: 32,
    height: 36,
    faces: {
      neutral: '/sprites/portrait-neutral.png',
      smileTeeth: '/sprites/portrait-smile-teeth.png',
      smile: '/sprites/portrait-smile.png',
      wink: '/sprites/portrait-wink.png',
    },
  },
  facts: [
    { label: 'Education', value: 'BS Computer Science' },
    { label: 'Institution', value: 'University of Caloocan City' },
    { label: 'Focus', value: 'Frontend Development & UI/UX Design' },
  ],
};

// The single source for contact details. Everything that shows or links to them
// (sidebar, mobile menu, GitHub section) reads from here.
export const contactLinks = {
  email: 'pelgone.justineandriebscs2024@gmail.com',
  facebook: 'https://www.facebook.com/Baekjuhyeonie',
  facebookHandle: 'Baekjuhyeonie',
  github: 'https://github.com/juhyeonie',
  githubHandle: 'juhyeonie',
};

// Page sections, in the order they appear. This one list drives the navigation,
// the order sections render in, and their numbers: each numbered section's number
// is its position here (Home, the unnumbered intro, is position 0), so reordering
// this array can never leave the numbering out of step.
const sectionList = [
  { id: 'home', label: 'Home' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'stack', label: 'Tech Stack' },
  { id: 'github', label: 'GitHub Activity' },
];

export const sections = sectionList.map((section, index) => ({
  ...section,
  number: index === 0 ? null : String(index).padStart(2, '0'),
}));

// Shown in the Projects showcase, in this order. To add a project, add an entry
// here; the showcase lays out however many there are.
export const projects = [
  {
    id: 'things-unsaid',
    name: 'Things Unsaid',
    // Small labels shown at the top of the project card (category, status).
    // Only state what is known: this one is live at the URL below.
    labels: ['Letter-sharing platform', 'Live'],
    // TODO(Justine): confirm the project year.
    year: null,
    description:
      'A little space for the feelings we never knew how to say. Where unspoken words finally find a home.',
    role: 'UI/UX design and frontend development',
    technologies: ['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Supabase', 'PostgreSQL'],
    // The primary visual. A video takes precedence over `image` when both are set.
    // `poster` is the still shown before the video plays.
    video: {
      src: '/videos/things-unsaid.mp4',
      poster: '/videos/things-unsaid.jpg',
      width: 1280,
      height: 720,
    },
    image: null,
    liveUrl: 'https://thingsunsaid.vercel.app/',
    sourceUrl: 'https://github.com/juhyeonie/things-unsaid',
  },
  {
    id: 'employee-onboarding-system',
    name: 'Employee Onboarding System',
    labels: ['Onboarding system', 'Academic project'],
    // TODO(Justine): confirm the project year.
    year: null,
    description:
      'Developed as an academic project for Premiere Medical and Cardiovascular Laboratory Inc.',
    role: 'Project management and frontend development',
    technologies: ['React', 'Vite', 'Tailwind CSS', 'Supabase', 'MongoDB'],
    video: {
      src: '/videos/employee-onboarding-system.mp4',
      poster: '/videos/employee-onboarding-system.jpg',
      width: 1280,
      height: 720,
    },
    image: null,
    // No public live deployment; that link stays hidden while this is null.
    liveUrl: null,
    sourceUrl: 'https://github.com/Buklod-Visionaries/Onboarding-Management-and-Tracking-System',
  },
];

// Graphic design work: the pubmats, shown in the stacked carousel in this order.
// `src` is the full-size image (opened in the preview), `thumb` a smaller copy for
// the carousel, and `width`/`height` its true size, so its proportions are kept and
// its space reserved before it loads. `title` names it in the preview; `alt`
// describes it for screen readers.
const pubmat = (slug, title, alt) => ({
  src: `/pubmats/${slug}.webp`,
  thumb: `/pubmats/thumbs/${slug}.webp`,
  width: 2000,
  height: 2000,
  title,
  alt,
});

export const pubmats = [
  pubmat(
    'csd-fair-26-day-1',
    "CSD Fair '26 — Day 1",
    "CSD Fair '26 Day 1 pubmat: oversized DAY 1 lettering over a red-toned fantasy battlefield.",
  ),
  pubmat(
    'arcade-of-secrets',
    'Arcade of Secrets',
    'Arcade of Secrets pubmat styled as a verification puzzle reading "Pick your fighter!" over an arcade cabinet.',
  ),
  pubmat(
    'registration-open',
    'Registration Is Now Open!',
    'Esports registration pubmat: four game characters in red-tinted vertical panels above the words "Registration is now open!"',
  ),
  pubmat(
    'design-the-next-jersey',
    'Design the Next Jersey',
    'Design the Next Jersey pubmat: a red jersey between glowing white headline text on a dark background.',
  ),
  pubmat(
    'world-reboot-3rd-place',
    'World:REBOOT — 3rd Place, Gear Up NCR',
    'Pubmat announcing World:REBOOT as 3rd place in the Gear Up NCR Esport Game Dev Challenge, in pixel-style lettering.',
  ),
  pubmat(
    'valentines-status',
    "What's Your Status? — Valentine's Day Edition",
    "Valentine's Day pubmat on a pink calendar, matching social media reactions to relationship statuses.",
  ),
  pubmat(
    'tryout-results',
    'Tryout Results Are Out!',
    'Tryout results announcement in a notification-style card over a phone lock screen and sports balls.',
  ),
  pubmat(
    'technology-in-education',
    'Technology in Education',
    'Technology in Education illustration: a student reading a glowing book, surrounded by app icons.',
  ),
];

// Experience entries, in display order (they are numbered by position).
// `organization` and `context` form the secondary line under the role title.
// `label` is the small tag beside the number: it says what kind of experience this
// is, so an academic project is never mistaken for employment. No dates are shown
// unless `period` is set; none are confirmed yet.
export const experience = [
  {
    title: 'Project Manager & Frontend Developer',
    organization: 'Buklod Visionaries',
    context: 'System Fundamentals',
    label: 'Academic project',
    period: null,
    details: [
      { term: 'Project', text: 'Employee Onboarding System' },
      { term: 'Responsibilities', text: 'Project management and frontend development' },
    ],
  },
  {
    title: 'Lead Frontend Developer',
    organization: 'Hiraya',
    context: 'Software Engineering 1 & 2',
    label: 'Academic project',
    period: null,
    details: [{ term: 'Responsibilities', text: 'Leading frontend development' }],
  },
  {
    title: 'Creative Committee Head',
    organization: 'Computer Science Council',
    context: null,
    label: 'Student council',
    // Known to be a current role; the start date is not confirmed.
    period: 'Present',
    details: [
      {
        term: 'Responsibilities',
        text: 'Leading creative initiatives and tasks, coordinating with committee members, creating and overseeing visual materials, and supporting council events and activities',
      },
    ],
  },
];

export const techStack = [
  {
    category: 'Frontend',
    items: ['HTML', 'CSS', 'JavaScript', 'React', 'Vite', 'Tailwind CSS'],
  },
  { category: 'Backend', items: ['Node.js', 'Express.js'] },
  { category: 'Database', items: ['Supabase', 'PostgreSQL', 'MongoDB'] },
  { category: 'Design', items: ['Figma', 'Canva', 'Adobe Photoshop'] },
  { category: 'Tools', items: ['Git', 'GitHub', 'VS Code', 'Claude', 'Gemini'] },
];

// There is no standalone Contact section: contact lives in the sidebar (and the
// mobile menu), so the details are not repeated on the page.
export const contact = {
  // Shown above the email address at the bottom of the desktop sidebar.
  sidebarNote: 'For inquiries or collaborations, feel free to reach out.',
};

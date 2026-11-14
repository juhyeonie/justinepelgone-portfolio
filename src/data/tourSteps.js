// Guided tour steps, in order. Voice: friendly, casual, lowercase.
//
// `id` names the step. `target` is the section it belongs to: unless told
// otherwise, the guide scrolls there and points at the element marked
// `data-tour-anchor="<target>"` (the section's heading). Several steps can share
// a section; when the tour resumes after a pause it carries on from the step it
// was on if the visitor is still in that section.
//
// Optional fields:
//   clearance     How far below its target (px) the chat bubble may reach. Section
//                 headings have a divider and a gap beneath them; the hero does not.
//   anchor        Point at this element instead of the section heading.
//   scrollTarget  Scroll this element to the middle of the screen instead of
//                 scrolling to the top of the section.
//   requires      Skip the step if this element is not on the page (a part of the
//                 Projects section the visitor has filtered out).
//   beats         A small walkthrough the cursor performs once the message has been
//                 typed: it moves to each `anchor` in turn, waits until it has
//                 actually arrived, presses the element if `press` is set (a real
//                 click, so the page's own controls do the work), then rests there
//                 for `hold` ms. The step ends after the last beat.
//                   settle  After pressing, wait until this element (the slider)
//                           has finished moving before resting: every transition
//                           inside it done, and any scrolling stopped.
//                   unless  Leave the beat out if this element is already the one
//                           in front (marked data-active): no needless press.
//   anchors       Point at several elements in turn instead of one (each marked
//                 `data-tour-anchor="<name>"`), highlighting the one being pointed at.
//   isFixed       The target is not part of the scrolling page (it lives in the
//                 sidebar or the mobile menu), so the page is not scrolled for it.
//   opensMenu     On small screens the target sits inside the navigation menu, which
//                 the tour opens for this step so it never points at something hidden.

// The name shown on the cursor's chat bubble, like a collaborator's name in Figma.
export const guideName = 'justine';

export const DEFAULT_CLEARANCE = 24;

export const tourSteps = [
  { id: 'home', target: 'home', message: "hey! i'm justine. let me show you around.", clearance: 4 },
  // The two development projects, one at a time, pointing at each card's title.
  {
    id: 'development',
    target: 'projects',
    requires: 'project-things-unsaid',
    message: "here are some things i've built!",
    // Press the showcase's Next button to bring each project to the front, then
    // point at it. If Things Unsaid is already in front, the first press is left
    // out rather than spent on showing the other project first.
    beats: [
      {
        anchor: 'project-next',
        press: true,
        settle: 'project-showcase',
        unless: 'project-things-unsaid',
        hold: 300,
      },
      { anchor: 'project-things-unsaid', hold: 2200 },
      { anchor: 'project-next', press: true, settle: 'project-showcase', hold: 300 },
      { anchor: 'project-employee-onboarding-system', hold: 2400 },
    ],
  },
  {
    id: 'design',
    target: 'projects',
    anchor: 'design-work',
    scrollTarget: 'pubmat-showcase',
    requires: 'design-work',
    message: 'i also enjoy creating visual designs!',
  },
  // The cursor presses the carousel's own Next button twice, pausing on each
  // pubmat it brings forward.
  {
    id: 'pubmats',
    target: 'projects',
    scrollTarget: 'pubmat-showcase',
    requires: 'pubmat-showcase',
    message: "here are some of the pubmats i've worked on.",
    beats: [
      { anchor: 'pubmat-next', press: true, settle: 'pubmat-showcase', hold: 2200 },
      { anchor: 'pubmat-next', press: true, settle: 'pubmat-showcase', hold: 2400 },
    ],
  },
  {
    id: 'experience',
    target: 'experience',
    message:
      "here are some of the roles i've taken on, from managing projects to leading frontend development.",
  },
  { id: 'stack', target: 'stack', message: 'here are the tools i usually work with.' },
  { id: 'github', target: 'github', message: "and this is where my code lives on github." },
  // The sign-off: the three social links, in the sidebar on desktop and in the
  // menu on small screens.
  {
    id: 'socials',
    target: 'socials',
    anchors: ['social-facebook', 'social-github', 'social-email'],
    isFixed: true,
    opensMenu: true,
    clearance: 8,
    message:
      "that's everything! you can find my socials here if you'd like to connect. thanks for stopping by!",
  },
];

const BASE_DURATION = 5000;
const COMFORTABLE_LENGTH = 45; // characters readable within the base duration
const EXTRA_PER_CHARACTER = 55; // ms added for each character beyond that

// Each message stays up ~5s; longer messages get proportionally more time.
export function getStepDuration(step) {
  const extraCharacters = Math.max(0, step.message.length - COMFORTABLE_LENGTH);
  return BASE_DURATION + extraCharacters * EXTRA_PER_CHARACTER;
}

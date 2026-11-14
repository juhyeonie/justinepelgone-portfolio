export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Height of the sticky top bar (0 on desktop, where the sidebar is used instead).
export function getHeaderOffset() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--header-offset');
  return parseFloat(value) || 0;
}

export function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;

  const top =
    id === 'home' ? 0 : element.getBoundingClientRect().top + window.scrollY - getHeaderOffset();

  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

// The element marked `data-tour-anchor="<name>"` that is actually on screen.
// The same link can exist twice (in the desktop sidebar and in the mobile menu);
// only one of the two is displayed at any screen size, and a closed menu's copy is
// not visible either. Returns null if there is nothing visible to point at.
export function findVisibleTourAnchor(name) {
  for (const element of document.querySelectorAll(`[data-tour-anchor="${name}"]`)) {
    const isRendered = element.getClientRects().length > 0;
    if (isRendered && getComputedStyle(element).visibility === 'visible') return element;
  }
  return null;
}

// Brings a tour step's target into view. A section is scrolled to; a fixed target
// (in the sidebar) only needs its own container scrolled, on a short screen.
export function scrollToTourStep(step) {
  // A step about one part of a section (the pubmat carousel) centres that part.
  if (step.scrollTarget) {
    const element = findVisibleTourAnchor(step.scrollTarget);
    if (element) {
      element.scrollIntoView({
        block: 'center',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
      return;
    }
  }

  if (!step.isFixed) {
    scrollToSection(step.target);
    return;
  }

  // Centre it in its container where there is room to, so the cursor and bubble
  // are not working against the edge of the screen. (For a group, the middle
  // element stands in for the whole group.)
  const names = step.anchors ?? [step.target];
  const anchor = findVisibleTourAnchor(names[Math.floor(names.length / 2)]);
  anchor?.scrollIntoView({
    block: 'center',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

const ANCHOR_HEADROOM = 64; // space above the anchor for the guide's bubble
const ANCHOR_FOOTROOM = 160; // keeps the anchor clear of the docked mobile bubble

// Whether the element marked `data-tour-anchor="<name>"` is on the page at all
// (not inside something hidden, such as a filtered-out group of projects).
export function isTourAnchorRendered(name) {
  const element = document.querySelector(`[data-tour-anchor="${name}"]`);
  return Boolean(element && element.getClientRects().length > 0);
}

// Whether the element the tour guide points at for this section is comfortably on
// screen, i.e. the cursor can rest on it without being pushed to a viewport edge.
export function isTourAnchorInView(id) {
  const anchor = document.querySelector(`[data-tour-anchor="${id}"]`);
  if (!anchor) return false;

  const rect = anchor.getBoundingClientRect();
  return (
    rect.top >= getHeaderOffset() + ANCHOR_HEADROOM &&
    rect.bottom <= window.innerHeight - ANCHOR_FOOTROOM
  );
}

// The section the visitor is currently reading: the last one whose top edge has
// passed a line roughly a third of the way down the viewport.
export function getSectionInView(ids) {
  const atPageBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  if (atPageBottom) return ids[ids.length - 1];

  const readingLine = window.innerHeight * 0.35;
  let current = ids[0];

  for (const id of ids) {
    const element = document.getElementById(id);
    if (element && element.getBoundingClientRect().top <= readingLine) current = id;
  }

  return current;
}

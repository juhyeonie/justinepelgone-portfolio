import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../utils/scroll';

// "Near the bottom": the end of the page is within one screen height below the
// bottom of the screen. "Near the top": less than half a screen scrolled. Both are
// in screen heights, so they hold on any size of screen and length of page.
const BOTTOM_ZONE = 1;
const TOP_ZONE = 0.5;

function isNearBottom() {
  const screen = window.innerHeight;
  const y = window.scrollY;
  const end = document.documentElement.scrollHeight;
  return y > screen * TOP_ZONE && y + screen >= end - screen * BOTTOM_ZONE;
}

// A round floating button, bottom-right, that takes the page back to the top. It
// appears once the visitor is near the end of the page and is hidden near the top.
//
// Hidden, it is also `invisible` (after its fade-out), so it cannot be focused or
// clicked and screen readers skip it. While the guided tour runs (`isSuppressed`)
// it stays hidden too: the tour is moving the page itself, and its bubble and
// pointer use the screen's corners. The mobile menu (z-35) and the image preview
// (a modal dialog) both cover it.
export default function BackToTop({ isSuppressed = false }) {
  const [isNear, setIsNear] = useState(false);

  // Measured at most once a frame, on scroll and whenever the screen or the page's
  // height changes (images and the contribution graph loading).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setIsNear(isNearBottom());
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.body);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resizeObserver.disconnect();
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    // Keyboard focus moves to the top as well, so the next Tab continues from there
    // instead of from a button that is about to disappear.
    document.getElementById('home-heading')?.focus({ preventScroll: true });
  };

  const isShown = isNear && !isSuppressed;

  return (
    <button
      type="button"
      className="invisible fixed right-[max(var(--gutter),env(safe-area-inset-right))] bottom-[calc(var(--gutter)+env(safe-area-inset-bottom,0px))] z-30 grid size-10 translate-y-2 scale-92 place-items-center rounded-full border border-border bg-bg text-fg opacity-0 [box-shadow:var(--card-shadow)] [transition:opacity_var(--duration)_var(--ease-out),translate_var(--duration)_var(--ease-out),scale_var(--duration-fast)_var(--ease-out),background-color_var(--duration-fast)_var(--ease-out),border-color_var(--duration-fast)_var(--ease-out),visibility_0s_linear_var(--duration)] data-shown:visible data-shown:translate-y-0 data-shown:scale-100 data-shown:opacity-100 data-shown:delay-0 pointer-hover:border-border-strong pointer-hover:bg-surface-strong data-shown:pointer-hover:-translate-y-0.5 touch:size-11"
      onClick={handleClick}
      aria-label="Back to top"
      data-shown={isShown || undefined}
    >
      <ArrowUp size={18} strokeWidth={1.75} aria-hidden="true" focusable="false" />
    </button>
  );
}

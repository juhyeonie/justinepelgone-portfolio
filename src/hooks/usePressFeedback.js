import { useEffect } from 'react';

// One press animation for everything clickable on the site: links, buttons, nav
// items, cards, icons. Pressing sinks the element in a little; letting go
// returns it smoothly. Like the interface sounds (useInterfaceSounds.js), it is
// one listener on the document rather than code in every component, so nothing
// can drift out of step.
//
// - The press scales by an amount tied to the element's size, so small and large
//   elements sink by about the same distance (--press-travel), but never below
//   --press-scale. Timing and easing come from --duration-press,
//   --duration-release and --ease-press in index.css.
// - It uses the Web Animations API on the `scale` property, on top of whatever
//   scale the element already has. It never fights the element's own
//   transitions (hover lifts use `translate`; card stacks use `transform`).
// - Mouse, touch and pen press with the pointer; keyboard users get the same
//   press while Enter (or Space, on buttons) is held.
// - Opting out: data-press="off" on the element or an ancestor. A transparent
//   overlay control (a card's click target) uses data-press="parent" to press the
//   nearest [data-press-surface] instead of itself.
// - Reduced motion: no animation. The states stay visible through color, focus
//   rings and aria-current, so nothing depends on the motion.

const PRESSABLE =
  'a[href], button:not(:disabled), [role="button"], [role="tab"], summary, label[for], [data-press]:not([data-press="off"])';

function readTokens() {
  const style = getComputedStyle(document.documentElement);
  const seconds = (name, fallback) => {
    const value = style.getPropertyValue(name).trim();
    if (!value) return fallback;
    return value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000;
  };

  return {
    minScale: parseFloat(style.getPropertyValue('--press-scale')) || 0.96,
    travel: parseFloat(style.getPropertyValue('--press-travel')) || 6,
    pressMs: seconds('--duration-press', 100),
    releaseMs: seconds('--duration-release', 320),
    easing: style.getPropertyValue('--ease-press').trim() || 'ease-out',
    releaseEasing: style.getPropertyValue('--ease-out').trim() || 'ease-out',
  };
}

// The element that visibly moves for a press on `target`, or null.
function getSurface(target) {
  if (!(target instanceof Element)) return null;
  const control = target.closest(PRESSABLE);
  if (!control || control.closest('[data-press="off"]')) return null;
  if (control.dataset.press === 'parent') return control.closest('[data-press-surface]');
  return control;
}

// The element's own scale, as one number (it is always uniform on this site).
function getBaseScale(element) {
  const value = getComputedStyle(element).scale;
  return value === 'none' ? 1 : parseFloat(value) || 1;
}

export function usePressFeedback() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let tokens = readTokens();
    // The element currently held down, with its running animation.
    let pressed = null;

    const release = () => {
      if (!pressed) return;
      const { element, animation, base } = pressed;
      pressed = null;

      // From wherever the press-in got to, back to the element's own scale.
      const current = getComputedStyle(element).scale;
      const back = element.animate(
        [{ scale: current === 'none' ? '1' : current }, { scale: String(base) }],
        { duration: tokens.releaseMs, easing: tokens.releaseEasing },
      );
      animation.cancel();
      back.onfinish = () => back.cancel();
    };

    const press = (element) => {
      if (reducedMotion.matches || !element.isConnected) return;
      release();

      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      if (!size) return;

      const base = getBaseScale(element);
      const amount = Math.max(tokens.minScale, 1 - tokens.travel / size);
      const animation = element.animate(
        [{ scale: String(base) }, { scale: String(base * amount) }],
        { duration: tokens.pressMs, easing: tokens.easing, fill: 'forwards' },
      );
      pressed = { element, animation, base };
    };

    const handlePointerDown = (event) => {
      // Primary button only (or a touch / pen contact).
      if (event.button !== 0) return;
      const surface = getSurface(event.target);
      if (surface) press(surface);
    };

    const handleKeyDown = (event) => {
      if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
      const surface = getSurface(event.target);
      if (!surface) return;
      // Space activates buttons, not links.
      if (event.key === ' ' && event.target.closest('a[href]')) return;
      press(surface);
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Enter' || event.key === ' ') release();
    };

    // The theme or screen size can change the tokens (they are plain CSS).
    const refreshTokens = () => {
      tokens = readTokens();
    };

    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('blur', release);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', refreshTokens);

    return () => {
      release();
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', refreshTokens);
    };
  }, []);
}

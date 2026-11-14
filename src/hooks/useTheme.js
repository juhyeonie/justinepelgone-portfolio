import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { prefersReducedMotion } from '../utils/scroll';
import { readStorage, writeStorage } from '../utils/storage';

// Appearance has three settings: "light", "dark", or "system" (follow the device).
// The setting is what gets saved; the theme actually applied to the page
// (`data-theme` on <html>) is always "light" or "dark".
//
// The inline script in index.html applies the saved setting before first paint
// using the same storage key and the same rules as here.
//
// Changing theme is animated in one of two ways:
//   - Circular reveal: the new theme expands in a circle from the control that was
//     pressed. Uses the View Transitions API, which animates between two snapshots
//     of the whole page, so every element changes together by construction.
//   - Cross-fade: every color eases to its new value at once. Used where the API
//     is unavailable and when the device (not a click) triggers the change.
// With reduced motion, the theme simply changes.

const STORAGE_KEY = 'jp-portfolio-theme';
const DEFAULT_PREFERENCE = 'light'; // the site's default until a visitor chooses
const PREFERENCES = ['system', 'light', 'dark'];
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';
const CROSS_FADE_MS = 400; // matches --duration-theme in styles/index.css
const REVEAL_MS = 480;
const REVEAL_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

function readPreference() {
  const saved = readStorage(STORAGE_KEY);
  return PREFERENCES.includes(saved) ? saved : DEFAULT_PREFERENCE;
}

function resolveTheme(preference) {
  if (preference !== 'system') return preference;
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? 'dark' : 'light';
}

export function useTheme() {
  const [preference, setPreferenceState] = useState(readPreference);
  const crossFadeTimer = useRef(null);

  useEffect(() => () => clearTimeout(crossFadeTimer.current), []);

  // Fallback animation: ease every color to its new value together.
  const crossFadeTo = useCallback((theme) => {
    const root = document.documentElement;
    if (root.dataset.theme === theme) return;

    root.classList.add('theme-switching');
    root.dataset.theme = theme;
    clearTimeout(crossFadeTimer.current);
    crossFadeTimer.current = setTimeout(
      () => root.classList.remove('theme-switching'),
      CROSS_FADE_MS,
    );
  }, []);

  // While set to "system", follow the device if it switches (e.g. at sunset).
  useEffect(() => {
    if (preference !== 'system') return undefined;

    const mediaQuery = window.matchMedia(SYSTEM_DARK_QUERY);
    const handleChange = () => crossFadeTo(resolveTheme('system'));

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preference, crossFadeTo]);

  // `origin` is the viewport point the reveal grows from: the centre of the
  // control that was pressed. Without one, the change cross-fades.
  const setPreference = useCallback(
    (nextPreference, origin) => {
      const root = document.documentElement;
      const nextTheme = resolveTheme(nextPreference);
      const isThemeChanging = root.dataset.theme !== nextTheme;

      writeStorage(STORAGE_KEY, nextPreference);

      const canReveal =
        isThemeChanging && origin && document.startViewTransition && !prefersReducedMotion();

      if (!canReveal) {
        setPreferenceState(nextPreference);
        crossFadeTo(nextTheme);
        return;
      }

      // The API snapshots the page, runs this callback, then snapshots it again.
      // flushSync makes React commit inside the callback, so the control's new
      // selected state is part of the incoming snapshot.
      const transition = document.startViewTransition(() => {
        flushSync(() => setPreferenceState(nextPreference));
        root.dataset.theme = nextTheme;
      });

      // Grow a circle from the origin until it reaches the farthest corner.
      const radius = Math.hypot(
        Math.max(origin.x, window.innerWidth - origin.x),
        Math.max(origin.y, window.innerHeight - origin.y),
      );

      transition.ready
        .then(() => {
          root.animate(
            {
              clipPath: [
                `circle(0px at ${origin.x}px ${origin.y}px)`,
                `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
              ],
            },
            {
              duration: REVEAL_MS,
              easing: REVEAL_EASING,
              pseudoElement: '::view-transition-new(root)',
            },
          );
        })
        // The browser skipped the transition (e.g. the tab is in the background).
        // The theme has still been applied; there is just nothing to animate.
        .catch(() => {});
    },
    [crossFadeTo],
  );

  return { preference, setPreference };
}

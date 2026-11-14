import { useEffect, useState } from 'react';

const FONT_WAIT_LIMIT_MS = 1500; // never hold the page behind slow fonts

// Dismisses the intro screen from index.html once the app has rendered and the web
// fonts are ready, and reports when the page is fully revealed.
//
// The intro is told as soon as the page is ready. On the first visit of a session
// it holds itself for a minimum time (see index.html) and tells us how long until
// it is gone. `isReady` turns true only once the intro has fully left, so anything
// that should start on a visible page (the guided tour) does not begin behind it.
export function useAppReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let revealTimer;

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const waitLimit = new Promise((resolve) => setTimeout(resolve, FONT_WAIT_LIMIT_MS));

    // A font that fails to load must not block the page either.
    Promise.race([fontsReady.catch(() => {}), waitLimit]).then(() => {
      if (isCancelled) return;

      // window.__intro is defined by the inline script in index.html.
      const exitDuration = window.__intro?.dismiss() ?? 0;
      revealTimer = setTimeout(() => setIsReady(true), exitDuration);
    });

    return () => {
      isCancelled = true;
      clearTimeout(revealTimer);
    };
  }, []);

  return isReady;
}

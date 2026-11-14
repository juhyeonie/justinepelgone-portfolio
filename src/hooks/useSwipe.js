import { useRef } from 'react';

// A horizontal swipe on a touch screen or with a pen (a mouse uses the buttons
// instead). Spread `handlers` onto the element that takes the gesture.
//
// `onSwipe` receives +1 for a swipe to the left (show the next item) and -1 for
// a swipe to the right. `didSwipe` stays true from the end of a swipe until the
// next touch, so a click fired by the same gesture can be ignored.
export function useSwipe(onSwipe, minDistance) {
  const start = useRef(null);
  const didSwipe = useRef(false);

  const handlers = {
    onPointerDown(event) {
      didSwipe.current = false;
      start.current = event.pointerType === 'mouse' ? null : event.clientX;
    },
    onPointerUp(event) {
      if (start.current === null) return;
      const distance = event.clientX - start.current;
      start.current = null;
      if (Math.abs(distance) < minDistance) return;

      didSwipe.current = true;
      onSwipe(distance < 0 ? 1 : -1);
    },
    onPointerCancel() {
      start.current = null;
    },
  };

  return { handlers, didSwipe };
}

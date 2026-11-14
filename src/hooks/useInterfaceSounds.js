import { useCallback, useEffect, useState } from 'react';
import { isAudioReady, playSound, setSoundsEnabled, unlockAudio } from '../utils/hoverSound';
import { readStorage, writeStorage } from '../utils/storage';

// Interface sounds: a short, quiet sound when the mouse pointer moves onto
// something interactive, chosen by what kind of element it is (see hoverSound.js).
// One listener on the document covers every element on the page, present and
// future; no component needs hover-sound code of its own.
//
// Sounds are on by default; a visitor who turns them off is remembered. (Browsers
// still hold all audio back until the visitor's first click, tap or key press.)

const STORAGE_KEY = 'jp-portfolio-sounds';

// Anything a visitor can point at and use. Disabled buttons are excluded, and
// elements inside an `inert` region (a project card that is not in front) cannot
// be hovered at all.
//   data-sound        names the sound outright ("tick", "pop", "blip", "bubble"),
//                     or "none" for an element that makes its own (the portrait)
//   data-hover-sound  opts in an element that reacts to hover without being a
//                     control (the Tech Stack logo tiles)
const INTERACTIVE_SELECTOR =
  '[data-sound], a[href], button:not(:disabled), [role="button"], summary, [data-hover-sound]';

// Controls that show only an icon (the others name their sound with data-sound:
// "blip" for icon controls, "tick" for navigation links).
const ICON_SELECTOR = '.icon-button, [data-hover-sound]';

// How long an entered element's sound waits for the movement that confirms it
// (see handlePointerMove). A real move delivers both events at the same moment.
const MOVE_CONFIRM_MS = 50;

// The interactions browsers accept as permission to play audio. Any one of them,
// anywhere on the page, on any element, is enough.
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'keydown', 'touchstart', 'touchend', 'click'];

function getSoundName(element) {
  if (element.dataset.sound) return element.dataset.sound;
  if (element.matches(ICON_SELECTOR)) return 'blip';
  return 'pop';
}

export function useInterfaceSounds() {
  const [isEnabled, setIsEnabled] = useState(() => readStorage(STORAGE_KEY) !== 'off');

  useEffect(() => {
    setSoundsEnabled(isEnabled);
    if (!isEnabled) return undefined;

    // The interactive element the pointer is currently over, so a sound plays once
    // on the way in and not again while the pointer moves around inside it.
    let current = null;
    // The sound for the element just entered, waiting for proof that the pointer
    // actually moved there (see handlePointerMove).
    let pendingSound = null;
    let pendingSince = 0;

    const handlePointerOver = (event) => {
      const interactive =
        event.target instanceof Element ? event.target.closest(INTERACTIVE_SELECTOR) : null;
      if (interactive === current) return;

      const previous = current;
      current = interactive;
      pendingSound = null;

      // Mouse only: touch has no hover, and keyboard focus never fires this event.
      if (!interactive || event.pointerType !== 'mouse') return;

      // Coming back out of a control nested inside this element (a link inside a
      // project card): the element was already announced on the way in.
      if (previous && interactive.contains(previous)) return;

      const name = getSoundName(interactive);
      if (name !== 'none') {
        pendingSound = name;
        pendingSince = performance.now();
      }
    };

    // Entering an element is not enough on its own: content scrolling under a
    // still pointer moves elements under it too, and that must stay silent. A real
    // move of the mouse fires pointermove (with movement) straight after the
    // pointerover, so the sound plays then, without a noticeable delay. Scrolling
    // produces no such movement, so its hover changes never make a sound, not even
    // when the mouse moves again later.
    const handlePointerMove = (event) => {
      if (!pendingSound || event.pointerType !== 'mouse') return;
      if (!event.movementX && !event.movementY) return;
      if (performance.now() - pendingSince <= MOVE_CONFIRM_MS) playSound(pendingSound);
      pendingSound = null;
    };

    // Browsers block audio until the visitor has genuinely interacted with the
    // page. Every real press, tap or key, wherever it lands, tries to start the
    // audio, and the listeners remove themselves once it is running.
    //
    // They listen in the capture phase, on the window, so they run before any
    // component's own handler and cannot be cut off by one that stops the event.
    const captureOptions = { capture: true, passive: true };

    const stopListeningForUnlock = () => {
      UNLOCK_EVENTS.forEach((name) =>
        window.removeEventListener(name, handleInteraction, captureOptions),
      );
    };

    function handleInteraction(event) {
      if (!event.isTrusted) return; // scripted events do not count as a user gesture
      unlockAudio().then(() => {
        if (isAudioReady()) stopListeningForUnlock();
      });
    }

    document.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    if (!isAudioReady()) {
      UNLOCK_EVENTS.forEach((name) =>
        window.addEventListener(name, handleInteraction, captureOptions),
      );
    }

    return () => {
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointermove', handlePointerMove);
      stopListeningForUnlock();
    };
  }, [isEnabled]);

  const toggle = useCallback(() => {
    setIsEnabled((wasEnabled) => {
      const nextEnabled = !wasEnabled;
      writeStorage(STORAGE_KEY, nextEnabled ? 'on' : 'off');
      return nextEnabled;
    });
  }, []);

  return { isEnabled, toggle };
}

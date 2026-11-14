import { useEffect, useRef, useState } from 'react';
import { DEFAULT_CLEARANCE, guideName } from '../data/tourSteps';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useViewportWidth } from '../hooks/useViewportWidth';
import { findVisibleTourAnchor, getHeaderOffset, prefersReducedMotion } from '../utils/scroll';
import { PointerIcon } from './Icons';
import TourMessage from './TourMessage';

// Purely visual: renders the Figma-style collaborator cursor and its chat bubble
// for the current step. All tour state lives in useTour.
//
// Positioning model
// -----------------
// The guide is a zero-size box whose origin is the cursor's visible tip (see
// PointerIcon). Each frame it is translated to the step's target point, so the tip
// rests exactly on the target. The cursor is never offset to make room for the
// bubble; the bubble is what moves:
//
// Desktop: the bubble prefers Figma's spot, below and to the right of the pointer.
// If hanging there would cover the content under the heading, it slides up
// alongside the pointer until its bottom edge is within the step's `clearance`.
// If there is no room to the right at all, it sits above the target instead.
// Touch / small screens: the bubble docks to the bottom-left of the screen and the
// pointer, with a small pulse, marks the target.
//
// The bubble has no fixed size: it grows with the message as it is typed (see
// TourMessage), up to `maxBubbleWidth`. Its position is derived from its current
// size on every frame, so the two never drift apart.
//
// Beats
// -----
// A step with `beats` (see tourSteps.js) is a short walkthrough, run from the same
// frame loop so movement, presses and the page stay in step: once the message is
// typed, the cursor goes to each beat's element, and only when it has actually
// arrived does it press it (a real click, so the page's own control responds,
// with its own transition) and rest there. While the tour is paused nothing
// advances, and the time already spent resting is kept. When the last beat is done
// the guide tells the tour, which moves on.

const COMPACT_QUERY = '(max-width: 1023px), (pointer: coarse)';
const FOLLOW_TIME_MS = 160; // smoothing constant for pointer travel

// Entrance: when a tour starts, the cursor travels in from beyond the right edge of
// the viewport instead of appearing in place.
const ENTRANCE_MS = 1400;
const ENTRANCE_START_BEYOND_EDGE = 56; // px past the right edge, fully out of view
const ENTRANCE_START_DROP = 72; // px below its target, so it arrives moving up and left
const ENTRANCE_MESSAGE_AT = 0.72; // progress at which the first message may start typing

// Exit: when the tour completes, the cursor leaves the way it came, gliding off the
// right edge and fading as it goes. Skipping just fades everything out quickly.
const LEAVE_MS = 1000; // matches the layer's data-exit='leave' fade (below)
const DISMISS_MS = 200; // matches its data-exit='dismiss' fade
const LEAVE_BEYOND_EDGE = 80; // px past the right edge
const LEAVE_RISE = 56; // px it climbs on the way out

// Starts gently and gathers pace: a departure, the mirror of the entrance.
function easeInCubic(progress) {
  return progress ** 3;
}

// Starts fast and slows steadily into the target; it cannot overshoot.
function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3;
}
const SETTLE_DISTANCE = 0.1; // px; closer than this, snap onto the goal exactly
const EDGE_MARGIN = 12;
const BUBBLE_OFFSET_X = 20; // preferred bubble position relative to the tip,
const BUBBLE_OFFSET_Y = 18; // clear of the 18px arrowhead
const DESKTOP_POINTER_SIZE = 20;
const COMPACT_POINTER_SIZE = 18;
const BUBBLE_ABOVE_OVERHANG = 12; // when above the target: how far it extends past the tip,
const BUBBLE_ABOVE_GAP = 6; // its distance from the target's top edge,
const BUBBLE_ABOVE_TOP_MARGIN = 8; // and from the top of the viewport
const DESKTOP_BUBBLE_MAX_WIDTH = 288; // the bubble grows with its text up to this,
const DOCKED_BUBBLE_MAX_WIDTH = 400; // then wraps onto more lines
const DOCKED_BUBBLE_INSET = 16; // must match the docked bubble's left-4 and bottom inset
const DOCKED_BUBBLE_GAP = 64; // keeps the compact pointer above the docked bubble
const DOCKED_BUBBLE_LIFT = 14; // docked bubble's gap above a fixed target it must not cover
const SUB_TARGET_MS = 2200; // time spent on each element of a multi-anchor step
const GROUP_SIDE_GAP = 12; // bubble's distance from the widest element of such a group
const ARRIVAL_DISTANCE = 1.5; // px; this close to its goal, the cursor has arrived
const MAX_TRAVEL_MS = 2500; // give up waiting to arrive (e.g. the goal is off screen)
const MISSING_ANCHOR_MS = 1500; // a beat whose element never appears is passed over
const PRESS_MS = 150; // the pointer's press, before the click lands
const SETTLE_MIN_MS = 60; // lets the slider start moving before checking it
const SETTLE_STILL_MS = 120; // scrolling counts as stopped after this long still
const SETTLE_MAX_MS = 2000; // never wait longer than this for a slider to settle

// Whether a slider has finished moving after a press: no transition or animation
// still running inside it, and (for the scrolling row on phones) its scroll
// position unchanged for a moment. `watch` keeps the last position and when it
// last changed.
function isSettled(container, watch, time) {
  const isAnimating = container
    .getAnimations({ subtree: true })
    .some(
      (animation) =>
        animation.playState === 'running' &&
        animation.effect?.getTiming().iterations !== Infinity,
    );
  if (isAnimating) return false;

  const scroller = container.querySelector('.showcase-stage') ?? container;
  const position = scroller.scrollLeft;
  if (watch.position !== position) {
    watch.position = position;
    watch.changedAt = time;
    return false;
  }
  return time - watch.changedAt >= SETTLE_STILL_MS;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

// Eases `current` toward `goal` and lands on it exactly, so nothing is left
// drifting a fraction of a pixel off target.
function follow(current, goal, blend) {
  if (!current || blend >= 1) return goal;

  const next = {
    x: current.x + (goal.x - current.x) * blend,
    y: current.y + (goal.y - current.y) * blend,
  };
  const isSettled =
    Math.abs(goal.x - next.x) < SETTLE_DISTANCE && Math.abs(goal.y - next.y) < SETTLE_DISTANCE;
  return isSettled ? goal : next;
}

// The point the cursor's tip rests on: the end of the target's text, vertically
// centred, like a cursor that has just come to rest on a word. The arrowhead
// extends down and to the right of its tip, so it never covers the text itself.
function getTargetPoint(anchorRect) {
  return { x: anchorRect.right, y: anchorRect.top + anchorRect.height / 2 };
}

// A zero-width box at (x, y) with the given height, standing in for an element's
// rect so that getTargetPoint lands exactly on that point.
function pointBox(x, y, height) {
  return { left: x, right: x, top: y - height / 2, bottom: y + height / 2, width: 0, height };
}

// Where a beat points within its element.
//
// A control that gets pressed: its centre, where a real click would go.
// Anything else (a project card): the end of its title (the element marked
// `data-tour-point`), on the first line. If part of the title is covered (a card
// tucked behind the one in front), the cursor rests on the furthest-right part of
// it that can be seen, so it always points at the card itself.
function getBeatBox(element, isPress) {
  const rect = element.getBoundingClientRect();
  if (isPress) return pointBox(rect.left + rect.width / 2, rect.top + rect.height / 2, rect.height);

  const textElement = element.querySelector('[data-tour-point]') ?? element;
  const range = document.createRange();
  range.selectNodeContents(textElement);
  const line = range.getClientRects()[0] ?? textElement.getBoundingClientRect();
  const y = line.top + line.height / 2;

  for (let x = line.right - 1; x > line.left; x -= 10) {
    const hit = document.elementFromPoint(x, y);
    if (hit && element.contains(hit)) return pointBox(x, y, line.height);
  }
  return pointBox(line.right, y, line.height);
}

// The space a docked chat bubble takes at the bottom of the screen (with room
// for the pointer above it), published as --tour-dock-reserve. The page's
// scroll-padding-bottom reads it (see index.css), so every scroll the tour makes
// (scrollIntoView, and the step scrolls in utils/scroll.js) keeps what it
// brings into view clear of the bubble, the way scroll-padding-top keeps it
// clear of the top bar.
const DOCK_RESERVE_PROPERTY = '--tour-dock-reserve';

function setDockReserve(px) {
  const root = document.documentElement.style;
  const value = `${Math.round(px)}px`;
  if (!px) root.removeProperty(DOCK_RESERVE_PROPERTY);
  else if (root.getPropertyValue(DOCK_RESERVE_PROPERTY) !== value) {
    root.setProperty(DOCK_RESERVE_PROPERTY, value);
  }
}

// The height of the screen left for content: below the top bar, above the
// docked bubble.
function getViewingHeight() {
  const reserve = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom) || 0;
  return window.innerHeight - getHeaderOffset() - reserve;
}

// The slider a beat's element belongs to (its cards and its buttons together).
function getSlider(element) {
  return element.closest('[data-tour-anchor$="-showcase"]');
}

// Whether a press on a slider's button can be shown with the slider's front item
// on screen at the same time. When it can't (a short landscape phone), the cursor
// stays on that item and presses the button from there, rather than scrolling
// the page away to the button and back.
function canShowWithSlider(element) {
  const slider = getSlider(element);
  if (!slider) return true;
  const active = slider.querySelector('[data-position="active"], [data-active]');
  const box = active?.getBoundingClientRect() ?? element.getBoundingClientRect();
  const button = element.getBoundingClientRect();
  return Math.max(box.bottom, button.bottom) - Math.min(box.top, button.top) <= getViewingHeight();
}

// Brings a beat's element into view before the cursor heads for it, so it never
// points at (or presses) something off screen, with as little page movement as
// possible:
// - sideways: a project card further along the swipeable row on phones (scrolling
//   the row is how the row itself changes project, so it stays in step);
// - up or down: the whole slider (its cards and its buttons) is framed at once,
//   if it fits on screen, so moving between a card and the Next button never
//   scrolls the page back and forth. Otherwise just the element itself.
// Both are the nearest scroll that shows it whole, clear of the top bar and the
// docked bubble (scroll-padding).
function revealElement(element) {
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
  const rect = element.getBoundingClientRect();

  if (rect.left < 0 || rect.right > window.innerWidth) {
    element.scrollIntoView({ inline: 'center', block: 'nearest', behavior });
    return;
  }

  const slider = getSlider(element);
  const fitsWhole = slider && slider.getBoundingClientRect().height <= getViewingHeight();
  (fitsWhole ? slider : element).scrollIntoView({ block: 'nearest', inline: 'nearest', behavior });
}

export default function TourGuide({
  status,
  step: activeStep,
  stepKey,
  isMessageShown,
  onSkip,
  onMessageStarted,
  onMessageShown,
  onBeatsDone,
}) {
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const pointerRef = useRef(null);
  const bubbleRef = useRef(null);
  const clickRef = useRef(null);
  // Read by the frame loop, which outlives renders: whether the tour is paused,
  // whether the message has been typed, and whom to tell when the beats are done.
  const liveState = useRef({});
  liveState.current = { status, isMessageShown, onBeatsDone };
  // Progress through the current step's beats, kept apart from the frame loop so
  // a resize (which restarts the loop) does not replay a beat.
  const beatProgress = useRef(null);
  // Last drawn tip position, in page coordinates. It survives step changes so
  // travel starts from where the cursor already is.
  const tipPosition = useRef(null);
  // The entrance in progress, if any: { startTime, from, hasReleasedMessage }.
  const entrance = useRef(null);
  // True while the cursor is still on its way in; typing waits for it.
  const [isEntering, setIsEntering] = useState(false);

  // When the tour ends its step goes away at once, but the guide stays on screen a
  // moment longer to play its exit, still showing the last step it was on.
  const lastStep = useRef(null);
  if (activeStep) lastStep.current = activeStep;
  const [hasExited, setHasExited] = useState(true);
  const step = activeStep ?? (hasExited ? null : lastStep.current);

  // The bubble's reserved space goes with the guide.
  useEffect(() => () => setDockReserve(0), []);

  // How it is going: 'leave' (the tour completed: glide away), 'dismiss' (skipped,
  // or reduced motion: a quick fade), or null while the tour is running.
  let exitMode = null;
  if (!activeStep && step) {
    exitMode = status === 'completed' && !prefersReducedMotion() ? 'leave' : 'dismiss';
  }

  useEffect(() => {
    if (activeStep) {
      setHasExited(false);
      return undefined;
    }
    if (!exitMode) return undefined;

    const timer = setTimeout(
      () => {
        lastStep.current = null;
        setHasExited(true);
      },
      exitMode === 'leave' ? LEAVE_MS : DISMISS_MS,
    );
    return () => clearTimeout(timer);
  }, [activeStep, exitMode]);

  // The widest the bubble may get. It never exceeds the viewport.
  const viewportWidth = useViewportWidth();
  const maxBubbleWidth = isCompact
    ? Math.min(DOCKED_BUBBLE_MAX_WIDTH, viewportWidth - DOCKED_BUBBLE_INSET * 2)
    : Math.min(DESKTOP_BUBBLE_MAX_WIDTH, viewportWidth - EDGE_MARGIN * 2);

  const target = step?.target;
  const clearance = step?.clearance ?? DEFAULT_CLEARANCE;
  // The element(s) this step points at, as a string so the effect below only
  // restarts when they actually change.
  const beats = activeStep?.beats ?? null;
  const anchorNames = (
    beats?.map((beat) => beat.anchor) ??
    step?.anchors ??
    (target ? [step.anchor ?? target] : [])
  ).join('|');
  const isGroupStep = Boolean(step?.anchors);
  const hasOwnAnchor = Boolean(step?.anchor);
  const isFixedStep = Boolean(step?.isFixed);

  // Track the current step's target every frame, so the cursor stays on it through
  // scrolling and resizing. Writes transforms directly; no React re-renders.
  useEffect(() => {
    if (!target) {
      tipPosition.current = null;
      entrance.current = null;
      setIsEntering(false);
      setDockReserve(0);
      return undefined;
    }

    // The tour is over: stop tracking the target. If it completed, glide the cursor
    // (and the bubble attached to it) off the right edge; CSS fades it meanwhile.
    if (exitMode) {
      entrance.current = null;
      setDockReserve(0);
      const pointer = pointerRef.current;
      const start = tipPosition.current;
      if (exitMode !== 'leave' || !pointer || !start) return undefined;

      const from = { x: start.x - window.scrollX, y: start.y - window.scrollY };
      const to = { x: viewportWidth + LEAVE_BEYOND_EDGE, y: from.y - LEAVE_RISE };
      const startedAt = performance.now();
      let exitFrame = 0;

      const glide = (time) => {
        const eased = easeInCubic(Math.min(1, (time - startedAt) / LEAVE_MS));
        const x = from.x + (to.x - from.x) * eased;
        const y = from.y + (to.y - from.y) * eased;
        pointer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        tipPosition.current = { x: x + window.scrollX, y: y + window.scrollY };
        if (eased < 1) exitFrame = requestAnimationFrame(glide);
      };

      exitFrame = requestAnimationFrame(glide);
      return () => cancelAnimationFrame(exitFrame);
    }

    const isReducedMotion = prefersReducedMotion();

    // No previous position means the guide has just appeared: play the entrance.
    // (With reduced motion it simply appears on its target.)
    if (!tipPosition.current && !entrance.current && !isReducedMotion) {
      entrance.current = { startTime: null, from: null, hasReleasedMessage: false };
      setIsEntering(true);
    }
    const pointerSize = isCompact ? COMPACT_POINTER_SIZE : DESKTOP_POINTER_SIZE;
    let frame = 0;
    let previousTime = performance.now();
    let previousScroll = { x: window.scrollX, y: window.scrollY };
    const names = anchorNames.split('|');
    const stepStartedAt = performance.now();
    let highlighted = null;

    // A group step marks the element currently pointed at, so CSS can highlight it.
    const setHighlight = (element) => {
      if (highlighted === element) return;
      highlighted?.removeAttribute('data-tour-highlight');
      element?.setAttribute('data-tour-highlight', '');
      highlighted = element;
    };

    if (beats && (!beatProgress.current || beatProgress.current.key !== stepKey)) {
      beatProgress.current = {
        key: stepKey,
        index: 0,
        phase: 'waiting', // then travel, (press,) hold, and the next beat's travel
        since: 0,
        pausedAt: null,
        hasRevealed: false,
        isDone: false,
      };
    }

    const setPressing = (isPressing) => {
      const pointer = pointerRef.current;
      if (!pointer) return;
      if (!isPressing) {
        pointer.removeAttribute('data-pressing');
        return;
      }
      pointer.setAttribute('data-pressing', '');
      // Restart the ring's animation, even on a second press in a row.
      const ring = clickRef.current;
      if (ring) {
        ring.classList.remove('is-clicking');
        ring.getBoundingClientRect(); // forces a reflow between the two
        ring.classList.add('is-clicking');
      }
    };

    // Moves the beats along. Returns the element the cursor should point at.
    const runBeats = (time, hasArrived) => {
      const run = beatProgress.current;
      const live = liveState.current;

      // Paused: hold everything, and shift the clock on resuming so the time
      // already spent on the current phase still counts.
      if (live.status === 'paused') {
        run.pausedAt ??= time;
      } else if (run.pausedAt !== null) {
        run.since += time - run.pausedAt;
        run.pausedAt = null;
      }

      let beat = beats[run.index];
      // A press that is not needed (its project is already in front) is left out,
      // before the cursor sets off for it.
      while (
        (run.phase === 'waiting' || (run.phase === 'travel' && !run.hasRevealed)) &&
        beat.unless &&
        findVisibleTourAnchor(beat.unless)?.hasAttribute('data-active') &&
        run.index < beats.length - 1
      ) {
        run.index += 1;
        beat = beats[run.index];
      }
      const element = findVisibleTourAnchor(beat.anchor);
      if (run.pausedAt !== null || run.isDone) return element;

      // The cursor waits on the first element while the message is typed.
      if (run.phase === 'waiting') {
        if (!live.isMessageShown) return element;
        run.phase = 'travel';
        run.since = time;
      }

      const elapsed = time - run.since;
      const nextBeat = () => {
        run.phase = 'travel';
        run.since = time;
        run.hasRevealed = false;
        run.isRemotePress = false;
        if (run.index < beats.length - 1) {
          run.index += 1;
        } else {
          run.isDone = true;
          live.onBeatsDone?.();
        }
      };

      if (!element) {
        if (elapsed > MISSING_ANCHOR_MS) nextBeat();
        return null;
      }

      if (run.phase === 'travel') {
        if (!run.hasRevealed) {
          run.hasRevealed = true;
          run.isRemotePress = Boolean(beat.press) && !canShowWithSlider(element);
          // A remote press scrolls nothing: the cursor stays where it is.
          if (!run.isRemotePress) revealElement(element);
        }
        if (hasArrived || elapsed > MAX_TRAVEL_MS) {
          run.phase = beat.press ? 'press' : 'hold';
          run.since = time;
          if (beat.press) setPressing(true);
        }
      } else if (run.phase === 'press') {
        if (elapsed >= PRESS_MS) {
          setPressing(false);
          element.click();
          run.phase = beat.settle ? 'settle' : 'hold';
          run.since = time;
          run.watch = { position: null, changedAt: time };
        }
      } else if (run.phase === 'settle') {
        // Wait for the slider to finish its move, however long it takes, so the
        // cursor never sets off while cards are still travelling.
        const slider = findVisibleTourAnchor(beat.settle);
        const isDone =
          !slider ||
          elapsed > SETTLE_MAX_MS ||
          (elapsed >= SETTLE_MIN_MS && isSettled(slider, run.watch, time));
        if (isDone) {
          run.phase = 'hold';
          run.since = time;
        }
      } else if (elapsed >= beat.hold) {
        nextBeat();
      }

      // A remote press points at the slider's front item instead of the button.
      if (run.isRemotePress) {
        return getSlider(element)?.querySelector('[data-position="active"], [data-active]') ?? element;
      }
      return element;
    };

    // Whether the cursor had reached its goal on the last frame (for the beats).
    let hasArrived = false;

    const tick = (time) => {
      const pointer = pointerRef.current;

      let anchor;
      let anchorBox = null;
      if (beats) {
        anchor = runBeats(time, hasArrived);
        const beat = beats[beatProgress.current.index];
        if (anchor) anchorBox = getBeatBox(anchor, beat.press && !beatProgress.current.isRemotePress);
        setHighlight(anchor);
      } else {
        // A group step visits its elements one after another and rests on the last.
        const visit = Math.min(
          names.length - 1,
          Math.floor((time - stepStartedAt) / SUB_TARGET_MS),
        );
        anchor = findVisibleTourAnchor(names[Math.max(0, visit)]);
        if (isGroupStep) setHighlight(anchor);
        // A step pointing at a label inside a section (not its heading): the end
        // of the label's text, however wide its box is.
        if (anchor && hasOwnAnchor) anchorBox = getBeatBox(anchor, false);
      }

      // Nothing visible to point at (e.g. the menu holding it is still opening):
      // hold position rather than point at something hidden.
      if (pointer && anchor) {
        const anchorRect = anchorBox ?? anchor.getBoundingClientRect();
        // For a group, the box around all of its visible elements.
        const groupRects = isGroupStep
          ? names.map((name) => findVisibleTourAnchor(name)?.getBoundingClientRect()).filter(Boolean)
          : [anchorRect];
        const groupRight = Math.max(...groupRects.map((rect) => rect.right));
        const groupTop = Math.min(...groupRects.map((rect) => rect.top));
        const bubble = bubbleRef.current;
        // Fractional sizes (not the rounded offsetWidth/Height), so the bubble's
        // position tracks its size exactly while its height is easing.
        const bubbleRect = bubble?.getBoundingClientRect();
        const bubbleWidth = bubbleRect?.width ?? 0;
        const bubbleHeight = bubbleRect?.height ?? 0;
        const viewportHeight = window.innerHeight;
        const topLimit = getHeaderOffset() + EDGE_MARGIN;
        // The docked bubble normally sits at the bottom of the screen, so the
        // pointer is kept above it. For a fixed target near the bottom (the social
        // links in the open menu) it is the bubble that moves up instead.
        const isBubbleLifted = isCompact && isFixedStep;
        const bottomLimit =
          isCompact && !isBubbleLifted
            ? viewportHeight - bubbleHeight - DOCKED_BUBBLE_GAP
            : viewportHeight - pointerSize - EDGE_MARGIN;

        if (bubble && isCompact) {
          bubble.style.bottom = isBubbleLifted
            ? `${(viewportHeight - groupTop + DOCKED_BUBBLE_LIFT).toFixed(1)}px`
            : '';
        }
        // What the docked bubble covers, for the tour's own scrolling (see
        // setDockReserve): the bubble, the pointer's room above it and a margin.
        setDockReserve(
          isCompact && !isBubbleLifted ? viewportHeight - bottomLimit + EDGE_MARGIN : 0,
        );
        const blend = isReducedMotion ? 1 : 1 - Math.exp(-(time - previousTime) / FOLLOW_TIME_MS);

        // While the target is on screen these clamps do nothing and the tip sits
        // exactly on it. They only apply when the visitor has scrolled the target
        // away (tour paused), to keep the guide and its Skip button reachable.
        const targetPoint = getTargetPoint(anchorRect);
        const tipGoal = {
          x: clamp(targetPoint.x, EDGE_MARGIN, viewportWidth - pointerSize - EDGE_MARGIN),
          y: clamp(targetPoint.y, topLimit, bottomLimit),
        };

        // Travel is eased in page coordinates, not viewport coordinates: like a
        // cursor on a canvas, the pointer moves with the page as it scrolls, so
        // scrolling never makes it trail behind or drift off its target.
        const scroll = { x: window.scrollX, y: window.scrollY };

        // The exception is a target that is off screen: the tip is then pinned to
        // a viewport edge, so it is carried along with the viewport instead.
        const isPinned = tipGoal.x !== targetPoint.x || tipGoal.y !== targetPoint.y;
        if (isPinned && tipPosition.current) {
          tipPosition.current = {
            x: tipPosition.current.x + scroll.x - previousScroll.x,
            y: tipPosition.current.y + scroll.y - previousScroll.y,
          };
        }
        previousScroll = scroll;

        let tip;

        if (entrance.current) {
          // Entrance: a timed glide in viewport space, from off the right edge to
          // wherever the target is this frame (it may still be scrolling into place).
          const run = entrance.current;
          run.startTime ??= time;
          run.from ??= {
            x: viewportWidth + ENTRANCE_START_BEYOND_EDGE,
            y: tipGoal.y + ENTRANCE_START_DROP,
          };

          const progress = Math.min(1, (time - run.startTime) / ENTRANCE_MS);
          const eased = easeOutCubic(progress);
          tip = {
            x: run.from.x + (tipGoal.x - run.from.x) * eased,
            y: run.from.y + (tipGoal.y - run.from.y) * eased,
          };
          tipPosition.current = { x: tip.x + scroll.x, y: tip.y + scroll.y };

          // Let the message start typing as the cursor settles, so the two land together.
          if (!run.hasReleasedMessage && progress >= ENTRANCE_MESSAGE_AT) {
            run.hasReleasedMessage = true;
            setIsEntering(false);
          }
          if (progress >= 1) entrance.current = null;
        } else {
          tipPosition.current = follow(
            tipPosition.current,
            { x: tipGoal.x + scroll.x, y: tipGoal.y + scroll.y },
            blend,
          );
          tip = {
            x: tipPosition.current.x - scroll.x,
            y: tipPosition.current.y - scroll.y,
          };
        }
        pointer.style.transform = `translate3d(${tip.x.toFixed(2)}px, ${tip.y.toFixed(2)}px, 0)`;
        pointer.style.visibility = 'visible';
        hasArrived =
          !entrance.current &&
          Math.abs(tip.x - targetPoint.x) < ARRIVAL_DISTANCE &&
          Math.abs(tip.y - targetPoint.y) < ARRIVAL_DISTANCE;

        if (bubble && !isCompact) {
          // How far below the tip the bubble may reach before covering content.
          const reachBelowTip = anchorRect.height / 2 + clearance;

          // The offset is recomputed from the bubble's current size every frame and
          // applied directly (no easing), so the bubble stays locked to the pointer
          // while typing resizes it. When the bubble is held up by `reachBelowTip`,
          // its bottom edge is the fixed one: new lines push it upward, away from
          // the content.
          //
          // Which side the bubble goes on is decided from where the tip is headed and
          // the bubble's maximum width, not from their current values, so it cannot
          // change sides during the entrance or halfway through a message.
          const fitsOnRight =
            tipGoal.x + BUBBLE_OFFSET_X + maxBubbleWidth <= viewportWidth - EDGE_MARGIN;

          let offset;
          let corner;

          if (fitsOnRight) {
            offset = {
              // Clear of the arrowhead, and of every element in a group, so the
              // bubble never sits over a link the cursor is not on right now.
              x: Math.max(BUBBLE_OFFSET_X, groupRight + GROUP_SIDE_GAP - tip.x),
              y: clamp(
                Math.min(BUBBLE_OFFSET_Y, reachBelowTip - bubbleHeight),
                topLimit - tip.y,
                viewportHeight - EDGE_MARGIN - bubbleHeight - tip.y,
              ),
            };
            // Square off the left corner nearest the tip: the top one when the
            // bubble hangs below the pointer, the bottom one when it sits beside it.
            corner = offset.y >= 0 ? 'top' : 'bottom';
          } else {
            // No room to the right (a wide target, like the name in the hero, on a
            // narrower screen): sit above the target instead, ending just past the
            // tip. The bubble then grows leftward and upward as it is typed.
            offset = {
              x: Math.max(BUBBLE_ABOVE_OVERHANG - bubbleWidth, EDGE_MARGIN - tip.x),
              y: clamp(
                -anchorRect.height / 2 - BUBBLE_ABOVE_GAP - bubbleHeight,
                getHeaderOffset() + BUBBLE_ABOVE_TOP_MARGIN - tip.y,
                viewportHeight - EDGE_MARGIN - bubbleHeight - tip.y,
              ),
            };
            corner = 'bottom-right';
          }

          bubble.style.transform = `translate3d(${offset.x.toFixed(2)}px, ${offset.y.toFixed(2)}px, 0)`;
          if (bubble.dataset.corner !== corner) bubble.dataset.corner = corner;
        }
      }

      previousTime = time;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      setHighlight(null);
      setPressing(false);
    };
  }, [
    target,
    stepKey,
    beats,
    hasOwnAnchor,
    exitMode,
    anchorNames,
    isGroupStep,
    isFixedStep,
    clearance,
    isCompact,
    viewportWidth,
    maxBubbleWidth,
  ]);

  if (!step) return null;

  const isPaused = status === 'paused';

  // The chat bubble: the same solid color as the pointer, like Figma's cursor
  // chat. It is sized by its content, widening as the message is typed up to
  // maxBubbleWidth (set inline), then growing taller.
  // - Desktop: attached to the pointer. The frame loop sets its offset from the
  //   tip and marks which corner is nearest the tip; that corner is squared off.
  // - Touch / small screens: docked to the bottom-left of the viewport, growing
  //   to the right and upward.
  // - Paused (while the visitor explores): shrunk to a small "paused · skip" pill
  //   that stays out of the way of what they are reading.
  const bubbleLayout = isCompact
    ? `absolute bottom-[calc(16px+env(safe-area-inset-bottom,0px))] left-4 animate-tour-in px-4 ${isPaused ? 'py-1' : 'pt-3 pb-2.5'}`
    : `absolute top-0 left-0 px-3.5 will-change-transform data-[corner=bottom]:rounded-bl-[3px] data-[corner=bottom-right]:rounded-br-[3px] data-[corner=top]:rounded-tl-[3px] ${isPaused ? 'py-1' : 'pt-1.75 pb-1.5'}`;

  const bubble = (
    <div
      ref={bubbleRef}
      className={`w-max max-w-[272px] rounded-2xl bg-(--tour-bg) text-(--tour-fg) [box-shadow:var(--tour-shadow)] ${bubbleLayout} ${isPaused ? 'opacity-92' : ''}`}
      style={{ maxWidth: maxBubbleWidth }}
    >
      <p
        className={`text-micro leading-[1.5] font-semibold text-(--tour-muted) ${isPaused ? 'hidden' : ''}`}
        aria-hidden="true"
      >
        {guideName}
      </p>
      {/* Screen readers get each message once, in full; the typed copy is visual only. */}
      <span className="sr-only" role="status" aria-live="polite">
        {step.message}
      </span>
      <TourMessage
        key={step.id}
        message={step.message}
        maxBubbleWidth={maxBubbleWidth}
        isPaused={isPaused || isEntering}
        className={`${isCompact ? 'text-sm' : 'text-[0.8125rem]'} ${isPaused ? 'hidden' : ''}`}
        onStarted={onMessageStarted}
        onShown={onMessageShown}
      />
      {/* Left-aligned, so Skip stays put while the bubble widens. */}
      <div
        className={`flex items-center justify-start gap-3.5 font-mono text-micro tracking-[0.06em] uppercase ${isPaused ? '' : 'mt-1'}`}
      >
        {isPaused && <span className="text-(--tour-muted)">paused</span>}
        {/* The only part of the guide that takes input (docked: a larger touch
            target), and not even that while it is leaving. */}
        <button
          type="button"
          className={`pointer-events-auto pl-0 text-(--tour-muted) [text-transform:inherit] underline decoration-[color:color-mix(in_srgb,var(--tour-fg)_35%,transparent)] underline-offset-3 transition-[color] duration-(--duration-fast) ease-out hover:text-(--tour-fg) focus-visible:outline-(color:--tour-fg) in-data-exit:pointer-events-none ${isCompact ? 'py-2 pr-4' : 'py-1 pr-2'}`}
          onClick={onSkip}
          data-tour-ui=""
        >
          Skip<span className="sr-only"> the guided tour</span>
        </button>
      </div>
    </div>
  );

  // The layer never intercepts input: only Skip is clickable, so the guide cannot
  // block content or navigation. While the mobile menu or the image preview is
  // open (data-tour-hold), the tour is on hold and steps out of the way.
  //
  // Exit: 'leave' when the tour completed, as the cursor glides off to the right;
  // the whole guide fades out over the second half of the trip. 'dismiss' when it
  // was skipped: a quick fade where it is.
  return (
    <div
      className="pointer-events-none fixed inset-0 z-60 data-[exit=dismiss]:opacity-0 data-[exit=dismiss]:transition-opacity data-[exit=dismiss]:duration-180 data-[exit=dismiss]:ease-out data-[exit=leave]:opacity-0 data-[exit=leave]:transition-opacity data-[exit=leave]:delay-400 data-[exit=leave]:duration-550 data-[exit=leave]:ease-[ease-in] [html:has([data-tour-hold])_&]:invisible"
      data-compact={isCompact || undefined}
      data-status={status}
      data-exit={exitMode ?? undefined}
    >
      {/* Zero-size, its origin the pointer's tip; hidden until the frame loop
          knows its first position. On small screens the marker would float over
          the content being read, so it steps aside while the tour is paused. */}
      <div
        ref={pointerRef}
        className={`invisible absolute top-0 left-0 size-0 animate-tour-in will-change-transform ${isCompact ? 'transition-opacity duration-(--duration) ease-out' : ''} ${isCompact && isPaused ? 'opacity-0' : ''}`}
      >
        {isCompact && (
          <span
            className="absolute -top-2.75 -left-2.75 size-5.5 animate-tour-pulse rounded-full border border-fg motion-reduce:animate-none motion-reduce:opacity-50"
            aria-hidden="true"
          />
        )}
        {/* A thin ring that spreads from the tip as a press lands (is-clicking). */}
        <span
          ref={clickRef}
          className="absolute -top-3 -left-3 size-6 rounded-full border-[1.5px] border-fg opacity-0 [&.is-clicking]:animate-tour-click motion-reduce:[&.is-clicking]:animate-none"
          aria-hidden="true"
        />
        <PointerIcon size={isCompact ? COMPACT_POINTER_SIZE : DESKTOP_POINTER_SIZE} />
        {!isCompact && bubble}
      </div>
      {isCompact && bubble}
    </div>
  );
}

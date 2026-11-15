import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { getStepDuration, tourSteps } from '../data/tourSteps';
import { useMediaQuery } from './useMediaQuery';
import {
  getSectionInView,
  isTourAnchorInView,
  isTourAnchorRendered,
  scrollToSection,
  scrollToTourStep,
} from '../utils/scroll';

// Tour state machine:
//
//   idle ──start──▶ running ◀──resume── paused
//                     │  └────pause──────▶ │
//                     ├─ last step done ─▶ completed
//                     └─ skip (also from paused) ─▶ skipped
//
// `start` is allowed from any state (it is how Replay works) and bumps `runId`.
//
// Each step has two phases. First the message is typed out (TourMessage reports
// its first character via `messageStarted` and the whole message via
// `messageShown`); only then does the step's reading time start counting.
// `isMessageStarted` and `isMessageShown` track where a step is.
//
// A step with `beats` (see tourSteps.js) has no reading timer: the guide performs
// its beats after the message is typed and reports when the last one is done
// (`finishBeats`), so the cursor, the page and the next message never drift apart.

// The guide is a cursor that points, hovers and clicks, so it only runs where the
// visitor has a pointer like it: a mouse or trackpad that can hover. This asks
// about every input, not just the primary one, so a touch laptop or a tablet with
// a trackpad attached qualifies, while a touch-only phone or tablet does not
// (whatever its screen width). Where it does not match, the tour never starts and
// none of its parts are rendered (see App.jsx and TourButton.jsx).
export const TOUR_DEVICE_QUERY = '(any-hover: hover) and (any-pointer: fine)';

const SETTLE_DELAY_MS = 2500; // quiet time after the last interaction before resuming
const MIN_REMAINING_MS = 1500; // a resumed message stays readable for at least this long
const MODIFIER_KEYS = ['Shift', 'Control', 'Alt', 'Meta'];
const TARGET_IDS = [...new Set(tourSteps.map((step) => step.target))];

// The first step that belongs to a section.
function getFirstStepIndex(sectionId) {
  return tourSteps.findIndex((step) => step.target === sectionId);
}

const initialState = {
  status: 'idle',
  stepIndex: 0,
  runId: 0,
  isMessageStarted: false,
  isMessageShown: false,
};

function tourReducer(state, action) {
  const isActive = state.status === 'running' || state.status === 'paused';
  // Whether a report from TourMessage belongs to this run and this step.
  const isCurrentStep = action.runId === state.runId && action.stepIndex === state.stepIndex;

  switch (action.type) {
    case 'start':
      return {
        status: 'running',
        stepIndex: 0,
        runId: state.runId + 1,
        isMessageStarted: false,
        isMessageShown: false,
      };
    case 'pause':
      return state.status === 'running' ? { ...state, status: 'paused' } : state;
    case 'resume': {
      if (state.status !== 'paused') return state;
      // A step whose target is fixed on screen (the social links) does not depend
      // on where the page is scrolled, so it is never swapped for a section step.
      const stepIndex = tourSteps[state.stepIndex].isFixed
        ? state.stepIndex
        : (action.stepIndex ?? state.stepIndex);
      const isSameStep = stepIndex === state.stepIndex;
      // A different step means a new message, which has to be typed first.
      return {
        ...state,
        status: 'running',
        stepIndex,
        isMessageStarted: isSameStep && state.isMessageStarted,
        isMessageShown: isSameStep && state.isMessageShown,
      };
    }
    // Both ignore a report that belongs to an earlier step or an earlier run.
    case 'messageStarted':
      return isActive && isCurrentStep ? { ...state, isMessageStarted: true } : state;
    case 'messageShown':
      return isActive && isCurrentStep ? { ...state, isMessageShown: true } : state;
    case 'next':
      if (state.status !== 'running' || !state.isMessageShown) return state;
      // A report from the guide that belongs to an earlier step or run.
      if (action.runId !== undefined && !isCurrentStep) return state;
      return state.stepIndex >= tourSteps.length - 1
        ? { ...state, status: 'completed' }
        : {
            ...state,
            stepIndex: state.stepIndex + 1,
            isMessageStarted: false,
            isMessageShown: false,
          };
    // Passes over a step whose content is not on the page, before it is shown.
    case 'passStep':
      if (state.status !== 'running' || !isCurrentStep) return state;
      return state.stepIndex >= tourSteps.length - 1
        ? { ...state, status: 'completed' }
        : {
            ...state,
            stepIndex: state.stepIndex + 1,
            isMessageStarted: false,
            isMessageShown: false,
          };
    case 'skip':
      return isActive ? { ...state, status: 'skipped' } : state;
    default:
      return state;
  }
}

export function useTour({ isEnabled }) {
  const [state, dispatch] = useReducer(tourReducer, initialState);
  const isSupported = useMediaQuery(TOUR_DEVICE_QUERY);
  // Whether a tour has started since this page was loaded. It only decides whether
  // the button reads "Take a tour" or "Replay tour"; nothing about the tour is
  // remembered between visits.
  const [hasSeenTour, setHasSeenTour] = useState(false);

  const settleTimer = useRef(null);
  const remainingMs = useRef(0);
  const timedStepKey = useRef('');
  const shouldSkipScroll = useRef(false);
  const hasAutoStarted = useRef(false);

  const { status, stepIndex, runId, isMessageStarted, isMessageShown } = state;

  // The current step, readable from timers without re-creating them.
  const currentStepIndex = useRef(stepIndex);
  currentStepIndex.current = stepIndex;
  const isActive = status === 'running' || status === 'paused';

  // Every visit: start automatically once the page is ready, for new and returning
  // visitors alike, on a device that supports the guide. The guard makes this
  // decision exactly once per page load, so nothing a visitor does afterwards
  // (navigating between sections, skipping, finishing, plugging in a mouse) can
  // start it again on its own; from then on only Replay does.
  useEffect(() => {
    if (!isEnabled || hasAutoStarted.current) return;
    hasAutoStarted.current = true;
    if (isSupported) dispatch({ type: 'start' });
  }, [isEnabled, isSupported]);

  // The device stops supporting the guide mid-tour (a tablet's trackpad was
  // detached): end it, which also removes its listeners and timers below.
  useEffect(() => {
    if (!isSupported) dispatch({ type: 'skip' });
  }, [isSupported]);

  useEffect(() => {
    if (status !== 'idle') setHasSeenTour(true);
  }, [status]);

  // Step timing. On entering a step the page scrolls to its section straight away,
  // but the reading timer only starts once the message has been fully typed.
  // At most one timer exists at a time; the cleanup clears it and banks the unused
  // time, so pause → resume continues the same message.
  useEffect(() => {
    if (status !== 'running') return undefined;

    const step = tourSteps[stepIndex];
    const stepKey = `${runId}:${stepIndex}`;

    if (timedStepKey.current !== stepKey) {
      // Its content has been filtered out of the page (the visitor chose to show
      // only one kind of project): there is nothing to show, so move on.
      if (step.requires && !isTourAnchorRendered(step.requires)) {
        dispatch({ type: 'passStep', runId, stepIndex });
        return undefined;
      }

      timedStepKey.current = stepKey;
      remainingMs.current = getStepDuration(step);
      // `shouldSkipScroll` protects the page's scroll position after the visitor has
      // moved it. A fixed step never scrolls the page (only its own container, the
      // sidebar), so it is always brought into position.
      if (!shouldSkipScroll.current || step.isFixed) scrollToTourStep(step);
    }
    shouldSkipScroll.current = false;

    if (!isMessageShown) return undefined; // still typing
    if (step.beats) return undefined; // the guide says when its beats are done

    const startedAt = performance.now();
    const timer = setTimeout(() => dispatch({ type: 'next' }), remainingMs.current);

    return () => {
      clearTimeout(timer);
      const elapsed = performance.now() - startedAt;
      remainingMs.current = Math.max(MIN_REMAINING_MS, remainingMs.current - elapsed);
    };
  }, [status, stepIndex, runId, isMessageShown]);

  // Pause while the visitor interacts, then resume once things settle. Only real
  // input events are observed (not `scroll`), so the tour's own scrolling never
  // pauses it.
  useEffect(() => {
    if (!isActive) return undefined;

    const scheduleResume = () => {
      clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => {
        // An open overlay (the mobile menu) marks itself with data-tour-hold:
        // stay paused until it closes.
        if (document.querySelector('[data-tour-hold]')) {
          scheduleResume();
          return;
        }

        // On a fixed step there is no section to re-sync with: just carry on.
        if (tourSteps[currentStepIndex.current].isFixed) {
          shouldSkipScroll.current = true;
          dispatch({ type: 'resume' });
          return;
        }

        // Continue from the section the visitor ended up on instead of pulling
        // them back to the section the guide was on.
        const sectionInView = getSectionInView(TARGET_IDS);
        const currentStep = tourSteps[currentStepIndex.current];

        // Still in the same section: carry on with the same step, from where it
        // was, rather than starting the section over. Its content is brought back
        // into view only if the visitor scrolled it away.
        if (currentStep.target === sectionInView) {
          const focus = currentStep.scrollTarget ?? currentStep.anchor ?? currentStep.target;
          if (!isTourAnchorInView(focus)) scrollToTourStep(currentStep);
          shouldSkipScroll.current = true;
          dispatch({ type: 'resume' });
          return;
        }

        // The guide points at that section's heading. If the visitor stopped
        // somewhere the heading is not visible, bring it into view; otherwise
        // leave the page exactly where they left it.
        if (!isTourAnchorInView(sectionInView)) scrollToSection(sectionInView);
        shouldSkipScroll.current = true;
        dispatch({ type: 'resume', stepIndex: getFirstStepIndex(sectionInView) });
      }, SETTLE_DELAY_MS);
    };

    const handleInteraction = (event) => {
      const isTourControl =
        event.target instanceof Element && event.target.closest('[data-tour-ui]');
      if (isTourControl) return;

      if (event.type === 'keydown') {
        if (event.key === 'Escape') {
          dispatch({ type: 'skip' });
          return;
        }
        if (MODIFIER_KEYS.includes(event.key)) return;
      }

      dispatch({ type: 'pause' });
      scheduleResume();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(settleTimer.current);
        dispatch({ type: 'pause' });
      } else {
        scheduleResume();
      }
    };

    const eventNames = ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'keydown'];
    eventNames.forEach((name) =>
      window.addEventListener(name, handleInteraction, { passive: true }),
    );
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(settleTimer.current);
      eventNames.forEach((name) => window.removeEventListener(name, handleInteraction));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);

  const start = useCallback(() => {
    if (!isSupported) return;
    clearTimeout(settleTimer.current);
    dispatch({ type: 'start' });
  }, [isSupported]);

  const skip = useCallback(() => dispatch({ type: 'skip' }), []);

  // Called by the guide when the current message starts typing, and when it has
  // finished.
  const markMessageStarted = useCallback(
    () => dispatch({ type: 'messageStarted', runId, stepIndex }),
    [runId, stepIndex],
  );
  const markMessageShown = useCallback(
    () => dispatch({ type: 'messageShown', runId, stepIndex }),
    [runId, stepIndex],
  );
  // Called by the guide when it has performed the last of the step's beats.
  const finishBeats = useCallback(
    () => dispatch({ type: 'next', runId, stepIndex }),
    [runId, stepIndex],
  );

  // Where the opening greeting is, for the hero portrait that the guide is
  // introducing: 'greeting' from its first typed character, 'greeted' once it is
  // fully on screen, and null at any other time (another step, or no tour).
  let greetingCue = null;
  if (isActive && stepIndex === 0) {
    if (isMessageShown) greetingCue = 'greeted';
    else if (isMessageStarted) greetingCue = 'greeting';
  }

  return {
    status,
    isActive,
    // Whether this device can run the guide at all (see TOUR_DEVICE_QUERY).
    isSupported,
    hasSeenTour,
    step: isActive ? tourSteps[stepIndex] : null,
    // Identifies this showing of the step, so the guide restarts its beats when
    // the same step is replayed.
    stepKey: `${runId}:${stepIndex}`,
    isMessageShown,
    greetingCue,
    start,
    skip,
    markMessageStarted,
    markMessageShown,
    finishBeats,
  };
}

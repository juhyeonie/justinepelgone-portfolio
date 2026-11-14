import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../utils/scroll';
import { wrapText } from '../utils/wrapText';

// Types a guide message out character by character with a blinking caret, then
// reports that the whole message is on screen.
//
// The bubble grows with the text, like a collaborator typing in Figma's cursor
// chat: it widens as each character lands, and once a line reaches the bubble's
// maximum width the text continues on a new line and the bubble gets taller.
// The message's final line breaks are worked out before typing starts and each
// line is rendered unwrapped, so the browser never re-flows text mid-word.
//
// Mount one instance per message (give it a `key`): remounting is what resets the
// animation, so a previous message's timer can never leak into the next one.

const START_DELAY_MS = 350; // lets the cursor arrive before the first character
const CHARACTER_DELAY_MS = 26;
const SENTENCE_PAUSE_MS = 240; // after . ! ?
const CLAUSE_PAUSE_MS = 120; // after ,
const MEASURE_TOLERANCE = 1; // px; absorbs sub-pixel differences in text measuring

function getDelayBeforeNextCharacter(message, typedCount) {
  if (typedCount === 0) return START_DELAY_MS;

  const previousCharacter = message[typedCount - 1];
  if ('.!?'.includes(previousCharacter)) return SENTENCE_PAUSE_MS;
  if (previousCharacter === ',') return CLAUSE_PAUSE_MS;
  return CHARACTER_DELAY_MS;
}

// The part of each line typed so far. Lines not yet started are left out, except
// the first, which is always present to hold the caret before typing begins.
function getTypedLines(lines, typedCount) {
  const typedLines = [];
  let lineStart = 0;

  for (const line of lines) {
    const typedInLine = Math.min(line.length, typedCount - lineStart);
    if (typedInLine <= 0 && typedLines.length > 0) break;

    typedLines.push(line.slice(0, Math.max(0, typedInLine)));
    lineStart += line.length + 1; // + the space the line break replaced
  }

  return typedLines;
}

export default function TourMessage({
  message,
  maxBubbleWidth,
  isPaused,
  className = '',
  onStarted,
  onShown,
}) {
  const elementRef = useRef(null);
  const [lines, setLines] = useState(null);
  const [fontsReady, setFontsReady] = useState(() => document.fonts?.status !== 'loading');

  // With reduced motion the message simply appears in full.
  const [typedCount, setTypedCount] = useState(() =>
    prefersReducedMotion() ? message.length : 0,
  );
  const isComplete = typedCount >= message.length;

  // Work out where the finished message wraps inside a bubble at its maximum width.
  // Runs before paint, and again if the limit changes or the web font arrives late.
  useLayoutEffect(() => {
    const element = elementRef.current;
    const bubbleStyle = getComputedStyle(element.parentElement);
    const textStyle = getComputedStyle(element);
    const maxTextWidth =
      maxBubbleWidth -
      parseFloat(bubbleStyle.paddingLeft) -
      parseFloat(bubbleStyle.paddingRight) -
      MEASURE_TOLERANCE;
    const font = `${textStyle.fontStyle} ${textStyle.fontWeight} ${textStyle.fontSize} ${textStyle.fontFamily}`;

    setLines(wrapText(message, maxTextWidth, font));
  }, [message, maxBubbleWidth, fontsReady]);

  useEffect(() => {
    if (fontsReady) return undefined;

    let isMounted = true;
    document.fonts.ready.then(() => isMounted && setFontsReady(true));
    return () => {
      isMounted = false;
    };
  }, [fontsReady]);

  // Exactly one pending timer at a time: each run schedules a single character and
  // its cleanup cancels it, so pausing, resuming, or unmounting cannot double up.
  useEffect(() => {
    if (isPaused || isComplete) return undefined;

    const timer = setTimeout(
      () => setTypedCount((count) => count + 1),
      getDelayBeforeNextCharacter(message, typedCount),
    );
    return () => clearTimeout(timer);
  }, [message, typedCount, isPaused, isComplete]);

  // The first character is on screen (with reduced motion, the whole message).
  const hasStarted = typedCount > 0;
  useEffect(() => {
    if (hasStarted) onStarted?.();
  }, [hasStarted, onStarted]);

  useEffect(() => {
    if (isComplete) onShown();
  }, [isComplete, onShown]);

  const typedLines = getTypedLines(lines ?? [message], typedCount);

  return (
    <p
      ref={elementRef}
      // Its height follows the number of lines typed so far and is eased, so a
      // new line opens up smoothly instead of snapping the bubble taller.
      className={`h-[calc(var(--tour-line-count,1)*var(--tour-line-height)*1em)] overflow-y-clip leading-(--tour-line-height) font-medium transition-[height] duration-140 ease-out [--tour-line-height:1.45] ${className}`}
      style={{ '--tour-line-count': typedLines.length }}
      aria-hidden="true"
    >
      {typedLines.map((text, index) => (
        // Lines are only ever appended, so the index is a stable key.
        // Never wrapped by the browser: each line's break was decided up front.
        // `pre` also counts a just-typed space, so growth stays even.
        <span key={index} className="block whitespace-pre">
          {text}
          {!isComplete && index === typedLines.length - 1 && (
            // Typing caret. Zero net width (the margin cancels the border), so it
            // never adds to the bubble's size.
            <span className="-mr-[1.5px] inline-block h-[1.05em] w-0 animate-tour-caret border-l-[1.5px] border-current align-text-bottom" />
          )}
        </span>
      ))}
    </p>
  );
}

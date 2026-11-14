import { useEffect, useRef, useState } from 'react';
import { playSound } from '../utils/hoverSound';

// The hero portrait as a two-sided card: the photo on the front, a head-and-
// shoulders pixel-art avatar on the back.
//
// What turns it:
// - Mouse: hovering flips it to the avatar; leaving flips it back.
// - Click, tap, Enter or Space: toggles the side on purpose. A side chosen this way
//   stays put after the pointer leaves. Touch has no hover, so tapping is the only
//   way to flip there.
// - The guided tour: while its first greeting is on screen (`tourCue`), the avatar
//   is shown, so the cursor is introducing the person in the picture. When the tour
//   moves on, is skipped or ends, the card goes back to the photo, unless the
//   visitor has picked a side themselves.
//
// Expressions. Every expression is drawn on one identical head and body, so a
// change never shifts the picture. The avatar is neutral while it is turned away.
// Each time it is revealed it shows the next expression in a fixed order
// (teeth smile → closed smile → wink), and the tour's greeting always restarts
// that order with the teeth smile. A wink is a beat, not a pose: it relaxes into the closed smile.
// Nothing changes on a timer of its own: every change follows something the
// visitor or the tour did.
//
// It is one <button>, so it is reachable and operable from the keyboard, and it
// announces which side is showing. The flip itself is a CSS transition (see its classes below).

const REVEAL_SEQUENCE = ['smileTeeth', 'smile', 'wink'];
const EXPRESSION_DELAY_MS = 260; // the card is mostly round by then
const WINK_HOLD_MS = 700; // then the wink relaxes into the closed smile
const RESET_AFTER_HIDE_MS = 450; // back to neutral once the card has turned away

export default function FlipPortrait({ name, photo, avatar, tourCue = null }) {
  const [isHovering, setIsHovering] = useState(false);
  // A side the visitor picked by clicking: 'pixel', 'photo', or null (no choice,
  // so hover and the tour decide).
  const [chosenSide, setChosenSide] = useState(null);
  const [expression, setExpression] = useState('neutral');
  const revealCount = useRef(0);
  const faceTimer = useRef(null);

  const isIntroducing = tourCue !== null;
  const isShownByTour = !chosenSide && !isHovering && isIntroducing;
  const showsPixel = chosenSide ? chosenSide === 'pixel' : isHovering || isIntroducing;

  // Read by the effects below without making them re-run.
  const revealedByTour = useRef(false);
  revealedByTour.current = isShownByTour;

  // One pending face change at a time: each new one replaces the last, so quick
  // back-and-forth never leaves a stale expression behind.
  const changeFace = (face, delay = 0) => {
    clearTimeout(faceTimer.current);
    const show = () => {
      setExpression(face);
      if (face === 'wink') {
        faceTimer.current = setTimeout(() => setExpression('smile'), WINK_HOLD_MS);
      }
    };
    if (delay > 0) faceTimer.current = setTimeout(show, delay);
    else show();
  };

  useEffect(() => () => clearTimeout(faceTimer.current), []);

  // The expression follows the card.
  useEffect(() => {
    if (!showsPixel) {
      changeFace('neutral', RESET_AFTER_HIDE_MS);
      return;
    }
    // The greeting always opens the sequence with the teeth smile, however many
    // reveals came before, so the next one is the closed smile.
    if (revealedByTour.current) revealCount.current = 0;
    // A small pixel sound as the card starts to turn, once per reveal. Only for a
    // reveal the visitor caused; the tour's greeting turns it silently.
    else playSound('pixel');
    const face = REVEAL_SEQUENCE[revealCount.current % REVEAL_SEQUENCE.length];
    revealCount.current += 1;
    changeFace(face, EXPRESSION_DELAY_MS);
    // changeFace only touches refs and state setters, so it is not a dependency.
  }, [showsPixel]);

  // When the greeting has finished typing, the avatar winks at the visitor.
  useEffect(() => {
    if (tourCue === 'greeted' && revealedByTour.current) changeFace('wink');
  }, [tourCue]);

  const handlePointerEnter = (event) => {
    if (event.pointerType === 'mouse') setIsHovering(true);
  };

  const handlePointerLeave = (event) => {
    if (event.pointerType !== 'mouse') return;
    setIsHovering(false);
    // "Back to the photo" is where the card rests anyway, so that choice is done
    // with; hover can flip it again next time. A pinned avatar stays pinned.
    setChosenSide((side) => (side === 'photo' ? null : side));
  };

  const handleClick = () => {
    if (!showsPixel) setChosenSide('pixel');
    // Going back to the photo needs remembering while something else would show
    // the avatar again straight away: the pointer still over the card, or the tour.
    else setChosenSide(isHovering || isIntroducing ? 'photo' : null);
  };

  return (
    <button
      type="button"
      className="block w-full cursor-pointer rounded-lg perspective-[900px]"
      // Its sound is the pixel sound on reveal (above), not a hover sound.
      data-sound="none"
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
      data-flipped={showsPixel || undefined}
      aria-pressed={showsPixel}
      aria-label={
        showsPixel
          ? `Pixel art avatar of ${name}. Activate to show the photo.`
          : `Portrait of ${name}. Activate to show the pixel art avatar.`
      }
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      <span className="relative block size-full transition-transform duration-600 ease-[cubic-bezier(0.3,0.7,0.2,1)] transform-3d in-data-flipped:rotate-y-180">
        <span className="absolute inset-0 grid place-items-center backface-hidden">
          <img
            className="h-auto w-full [filter:var(--figure-shadow)] dark:[filter:var(--figure-outline)]"
            src={photo.src}
            alt=""
            width={photo.width}
            height={photo.height}
            decoding="async"
          />
        </span>

        {/* All expressions are stacked in the same spot and only the current one is
            shown, so a change is instant and nothing has to load mid-flip. They are
            drawn at whole multiples of their own pixels, never smoothed, so every pixel
            stays a crisp, equal square. The multiple (--sprite-scale) is the largest
            whole number at which the avatar still fits the portrait box, so it grows
            with the photo: each step is 36px of box width. */}
        <span
          className="absolute inset-0 grid rotate-y-180 items-end justify-items-center [--sprite-scale:5] backface-hidden @max-[179px]:[--sprite-scale:4] @min-[216px]:[--sprite-scale:6] @min-[252px]:[--sprite-scale:7] @min-[288px]:[--sprite-scale:8] @min-[324px]:[--sprite-scale:9] @min-[360px]:[--sprite-scale:10]"
          style={{ '--sprite-width': avatar.width, '--sprite-height': avatar.height }}
        >
          {Object.entries(avatar.faces).map(([faceName, src]) => (
            <img
              key={faceName}
              className="invisible col-start-1 row-start-1 h-[calc(var(--sprite-height)*var(--sprite-scale)*1px)] w-[calc(var(--sprite-width)*var(--sprite-scale)*1px)] max-w-none [filter:var(--figure-shadow)] [image-rendering:pixelated] data-active:visible dark:[filter:var(--figure-outline)]"
              data-face={faceName}
              data-active={faceName === expression || undefined}
              src={src}
              alt=""
              width={avatar.width}
              height={avatar.height}
              decoding="async"
            />
          ))}
        </span>
      </span>
    </button>
  );
}

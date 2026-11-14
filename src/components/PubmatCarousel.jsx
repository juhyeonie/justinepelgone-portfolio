import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import { getStackOffset, getStackPosition } from '../utils/stack';
import { iconProps } from './Icons';
import Lightbox from './Lightbox';

// The pubmats as an overlapping stack, like the Projects showcase: the active one
// front and centre, its neighbours tucked behind it on either side, slightly
// tilted. Only the artwork is shown, with no captions or counts.
//
// - Move: the arrow buttons, the Left/Right arrow keys, clicking a side image, or
//   swiping on a touch screen.
// - Clicking the image in front opens it in the full-size preview. Moving through
//   the preview moves the stack with it, so closing it leaves that image in front.
//
// Each image keeps its own proportions and is shown whole.

const SWIPE_DISTANCE = 40; // px of horizontal travel that counts as a swipe

// Each image's place in the stack comes from --offset (set inline) and
// data-position, as in the Projects showcase (see ProjectCard): the slide and the
// hover lift are timed apart, z-index switches partway through the move, the
// shadow fades on its own layer, and a hidden image stays visible until it has
// faded out. The stage's variables set how far a side image slides out, its tilt
// and its size; on phones the image in front takes most of the width and its
// neighbours just peek out at the edges, a cue to swipe.
const cardClass =
  '[translate:0_var(--pubmat-lift)] [transform:translateX(calc(var(--offset)*var(--pubmat-shift)))_rotate(calc(var(--offset)*var(--pubmat-tilt)))_scale(var(--pubmat-scale))] will-change-transform [--pubmat-lift:0px] [--pubmat-scale:1] [transition:transform_var(--duration-slide)_var(--ease-slide),opacity_var(--duration-slide)_var(--ease-slide),translate_var(--duration-hover)_var(--ease-out),z-index_0s_linear_0.15s,visibility_0s_linear_0s] after:pointer-events-none after:absolute after:-inset-px after:-z-1 after:rounded-[inherit] after:opacity-0 after:[box-shadow:var(--card-shadow)] after:transition-opacity after:duration-(--duration-slide) after:ease-slide data-[position=active]:z-3 data-[position=active]:cursor-zoom-in data-[position=active]:after:opacity-100 data-[position=hidden]:pointer-events-none data-[position=hidden]:invisible data-[position=hidden]:z-1 data-[position=hidden]:opacity-0 data-[position=hidden]:[transition-delay:0s,0s,0s,0s,var(--duration-slide)] data-[position=hidden]:[--pubmat-scale:0.74] data-[position=side]:z-2 data-[position=side]:opacity-60 data-[position=side]:[--pubmat-scale:var(--pubmat-side-scale)] data-[position=side]:focus-visible:opacity-85 data-[position=side]:pointer-hover:opacity-85 data-[position=side]:pointer-hover:[transition-duration:var(--duration-slide),var(--duration-hover),var(--duration-hover),0s,0s] data-[position=side]:pointer-hover:[--pubmat-lift:-4px]';

export default function PubmatCarousel({ pubmats }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(null);

  const count = pubmats.length;
  const goTo = (index) => setActiveIndex((index + count) % count);
  const swipe = useSwipe((step) => goTo(activeIndex + step), SWIPE_DISTANCE);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
    else if (event.key === 'ArrowRight') goTo(activeIndex + 1);
    else return;
    event.preventDefault();
  };

  const handleCardClick = (index) => {
    if (swipe.didSwipe.current) return; // the tap that ends a swipe is not a click
    if (index === activeIndex) setPreviewIndex(index);
    else goTo(index);
  };

  const showInPreview = (index) => {
    setPreviewIndex(index);
    setActiveIndex(index);
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Graphic design work"
      onKeyDown={handleKeyDown}
      data-tour-anchor="pubmat-showcase"
    >
      <div
        className="grid touch-pan-y justify-items-center pt-7 pb-4 select-none [--pubmat-shift:46%] [--pubmat-side-scale:0.84] [--pubmat-tilt:5deg] max-sm:-mx-(--gutter) max-sm:overflow-x-clip max-sm:pt-5 max-sm:pb-2 max-sm:[--pubmat-shift:30%] max-sm:[--pubmat-side-scale:0.86] max-sm:[--pubmat-tilt:4deg]"
        {...swipe.handlers}
      >
        {pubmats.map((pubmat, index) => {
          const offset = getStackOffset(index, activeIndex, count);
          const position = getStackPosition(offset);

          return (
            <button
              key={pubmat.src}
              type="button"
              className={`relative col-start-1 row-start-1 w-[min(380px,54%)] rounded-card border border-border bg-surface max-md:w-[min(340px,58%)] max-sm:w-[76%] ${cardClass}`}
              data-position={position}
              // Images further back wait behind the side ones, so they slide in from
              // there and never stick out past the edge of the page.
              style={{
                '--offset': Math.max(-1, Math.min(1, offset)),
                aspectRatio: `${pubmat.width} / ${pubmat.height}`,
              }}
              onClick={() => handleCardClick(index)}
              // Images further back are out of sight: not focusable or announced.
              tabIndex={position === 'hidden' ? -1 : undefined}
              aria-hidden={position === 'hidden' || undefined}
              aria-label={
                position === 'active' ? `View larger: ${pubmat.title}` : `Show ${pubmat.title}`
              }
            >
              <img
                className="pointer-events-none size-full rounded-[calc(var(--radius-card)-1px)] object-contain"
                src={pubmat.thumb}
                alt=""
                width={pubmat.width}
                height={pubmat.height}
                decoding="async"
                draggable="false"
              />
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex justify-center gap-2.5 max-sm:mt-3.5">
        <button
          type="button"
          className="icon-button"
          onClick={() => goTo(activeIndex - 1)}
          aria-label="Previous pubmat"
        >
          <ArrowLeft {...iconProps} />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Next pubmat"
          // The tour guide presses this to show a few more pubmats.
          data-tour-anchor="pubmat-next"
        >
          <ArrowRight {...iconProps} />
        </button>
      </div>

      {/* For screen readers: which pubmat is in front, and what it shows. */}
      <p className="sr-only" aria-live="polite">
        {pubmats[activeIndex].alt}
      </p>

      <Lightbox
        items={pubmats}
        index={previewIndex}
        onIndexChange={showInPreview}
        onClose={() => setPreviewIndex(null)}
        label="Graphic design preview"
      />
    </div>
  );
}

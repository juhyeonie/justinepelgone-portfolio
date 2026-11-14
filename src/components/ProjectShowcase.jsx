import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { prefersReducedMotion } from '../utils/scroll';
import { getStackOffset, getStackPosition } from '../utils/stack';
import { iconProps } from './Icons';
import ProjectCard from './ProjectCard';

// The Projects showcase. One component, two presentations of the same cards:
//
// Stack (tablet and up): the active card sits front and centre with its
// neighbours tucked behind it, tilted to either side. Clicking a neighbour, the
// arrow buttons, or the arrow keys bring another project forward.
// Swipe (phones): the cards sit in a horizontally scrolling, snapping row. The
// active project is whichever card is centred; the arrow buttons scroll to it.
//
// It works for any number of projects; nothing here is specific to the current set.

const SWIPE_QUERY = '(max-width: 699px)';

// Stack (tablet and up): every card shares one grid cell (see ProjectCard). The
// variables set how far a side card slides out (relative to its own width), its
// tilt and its size; tablets get less overlap and tilt. Padding leaves room for
// the tilted corners and the shadow.
const stackStageClass =
  'grid justify-items-center pt-5 pb-3 [--card-shift:30%] [--card-side-scale:0.86] [--card-tilt:4deg] max-md:[--card-shift:26%] max-md:[--card-tilt:3deg]';

// Swipe (phones): a row that bleeds to the screen edges. Each card is wide
// enough to read comfortably, narrow enough that the next one peeks in.
// `relative`: each card's offsetLeft is measured from here.
const swipeStageClass =
  'relative -mx-(--gutter) flex snap-x snap-mandatory scroll-px-(--gutter) [scrollbar-width:none] gap-3 overflow-x-auto px-(--gutter) pt-1 pb-3 [-webkit-overflow-scrolling:touch] *:flex-[0_0_88%] *:snap-center [&::-webkit-scrollbar]:hidden';

export default function ProjectShowcase({ projects }) {
  const isSwipe = useMediaQuery(SWIPE_QUERY);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef(null);

  const count = projects.length;
  const activeProject = projects[activeIndex];

  const scrollToCard = useCallback((index, behavior) => {
    const track = trackRef.current;
    const card = track?.children[index];
    if (!card) return;

    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
      behavior: behavior ?? (prefersReducedMotion() ? 'auto' : 'smooth'),
    });
  }, []);

  // In the stack, selecting a project is a state change and CSS animates the
  // cards. In the swipe row, it is a scroll, and the scroll position is what
  // decides the active project (see the effect below).
  const goTo = useCallback(
    (index) => {
      const nextIndex = (index + count) % count;
      if (isSwipe) scrollToCard(nextIndex);
      else setActiveIndex(nextIndex);
    },
    [count, isSwipe, scrollToCard],
  );

  // Swipe row: keep the active project in step with whichever card is centred.
  useEffect(() => {
    const track = trackRef.current;
    if (!isSwipe || !track) return undefined;

    let frame = 0;

    const updateActiveCard = () => {
      frame = 0;
      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      Array.from(track.children).forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - trackCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      setActiveIndex(nearestIndex);
    };

    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateActiveCard);
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener('scroll', handleScroll);
    };
  }, [isSwipe]);

  // Entering the swipe layout (e.g. rotating a tablet): start on the project that
  // was already active rather than snapping back to the first.
  useEffect(() => {
    if (isSwipe) scrollToCard(activeIndex, 'auto');
    // Deliberately not re-run when `activeIndex` changes: after the layout switch,
    // scrolling is what drives `activeIndex`, not the other way round.
  }, [isSwipe, scrollToCard]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
    else if (event.key === 'ArrowRight') goTo(activeIndex + 1);
    else return;

    event.preventDefault();
  };

  return (
    <div
      className={isSwipe ? 'showcase--swipe' : 'showcase--stack'}
      role="group"
      aria-roledescription="carousel"
      aria-label="Projects"
      onKeyDown={handleKeyDown}
      data-reveal=""
      data-tour-anchor="project-showcase"
    >
      <div ref={trackRef} className={`showcase-stage ${isSwipe ? swipeStageClass : stackStageClass}`}>
        {projects.map((project, index) => {
          const offset = getStackOffset(index, activeIndex, count);

          return (
            <ProjectCard
              key={project.id}
              project={project}
              number={index + 1}
              total={count}
              position={isSwipe ? undefined : getStackPosition(offset)}
              offset={isSwipe ? 0 : offset}
              isActive={index === activeIndex}
              onSelect={() => goTo(index)}
            />
          );
        })}
      </div>

      {count > 1 && (
        <div className={`flex items-center justify-center gap-4.5 ${isSwipe ? 'mt-4' : 'mt-7'}`}>
          <button
            type="button"
            className="icon-button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous project"
          >
            <ArrowLeft {...iconProps} />
          </button>

          <p className="min-w-14 text-center mono-label" aria-live="polite">
            <span className="sr-only">Showing project </span>
            {String(activeIndex + 1).padStart(2, '0')}
            <span aria-hidden="true"> / </span>
            <span className="sr-only"> of </span>
            {String(count).padStart(2, '0')}
            <span className="sr-only">: {activeProject.name}</span>
          </p>

          <button
            type="button"
            className="icon-button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next project"
            // The tour guide presses this to bring each project forward.
            data-tour-anchor="project-next"
          >
            <ArrowRight {...iconProps} />
          </button>
        </div>
      )}
    </div>
  );
}

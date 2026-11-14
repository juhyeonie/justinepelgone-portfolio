import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import { iconProps } from './Icons';

// A full-screen preview of one image from a set, built on the native <dialog>:
// opened with showModal(), it keeps keyboard focus inside, closes on Escape, and
// returns focus to whatever opened it.
//
// - Close: the close button, Escape, or a click on the dimmed area around the image.
// - Move through the set: the arrow buttons, the Left/Right arrow keys, or a
//   horizontal swipe on touch screens.
//
// `items` are { src, width, height, title, alt }. `index` is the item shown, or
// null when the preview is closed.

const SWIPE_DISTANCE = 48; // px of horizontal travel that counts as a swipe

// Close, previous and next: outlined in white, since the preview is always dark.
const controlClass =
  'grid size-10 place-items-center rounded-lg border border-[rgba(255,255,255,0.22)] text-white transition-[background-color,border-color] duration-(--duration-fast) ease-out hover:border-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.1)] focus-visible:outline-white';

export default function Lightbox({ items, index, onIndexChange, onClose, label }) {
  const dialogRef = useRef(null);
  const isOpen = index !== null;
  const item = isOpen ? items[index] : null;
  const count = items.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();

    // The page behind must not scroll while the preview is up.
    document.documentElement.classList.toggle('has-lightbox', isOpen);
    return () => document.documentElement.classList.remove('has-lightbox');
  }, [isOpen]);

  const show = (nextIndex) => onIndexChange((nextIndex + count) % count);
  const swipe = useSwipe((step) => {
    if (count > 1) show(index + step);
  }, SWIPE_DISTANCE);

  const handleKeyDown = (event) => {
    if (count < 2) return;
    if (event.key === 'ArrowLeft') show(index - 1);
    else if (event.key === 'ArrowRight') show(index + 1);
    else return;
    event.preventDefault();
  };

  // A click that lands on the dialog itself (not the image or a control) is a
  // click on the dimmed area around them. The tap that ends a swipe is not.
  const handleClick = (event) => {
    if (swipe.didSwipe.current) return;
    if (event.target === event.currentTarget || event.target.matches('.lightbox-stage')) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-0 size-full max-h-none max-w-none border-0 bg-transparent p-0 text-white backdrop:bg-[rgba(8,8,10,0.96)] open:grid open:animate-lightbox-in open:grid-rows-[auto_minmax(0,1fr)_auto]"
      aria-label={label}
      // Silent itself; only its buttons have hover sounds.
      data-sound="none"
      // Keeps the guided tour paused while the preview is open.
      data-tour-hold={isOpen || undefined}
      // Escape closes the dialog natively; keep React's state in step.
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...swipe.handlers}
    >
      {item && (
        <>
          <div className="flex items-center gap-4 pt-3.5 pr-4 pb-2.5 pl-6">
            <p className="min-w-0 flex-1 text-sm font-medium">{item.title}</p>
            <p className="mono-label text-[rgba(255,255,255,0.65)]" aria-live="polite">
              {String(index + 1).padStart(2, '0')}
              <span aria-hidden="true"> / </span>
              <span className="sr-only"> of </span>
              {String(count).padStart(2, '0')}
            </p>
            <button
              type="button"
              className={controlClass}
              data-sound="blip"
              onClick={onClose}
              aria-label="Close preview"
              autoFocus
            >
              <X {...iconProps} size={18} />
            </button>
          </div>

          <div className="lightbox-stage flex min-h-0 cursor-zoom-out items-center justify-center px-4 pb-4">
            <img
              key={item.src}
              className="h-auto max-h-full w-auto max-w-full cursor-default rounded-media"
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              decoding="async"
            />
          </div>

          {count > 1 && (
            <div className="flex justify-center gap-2.5 px-4 pb-5">
              <button
                type="button"
                className={controlClass}
                data-sound="blip"
                onClick={() => show(index - 1)}
                aria-label="Previous image"
              >
                <ArrowLeft {...iconProps} size={18} />
              </button>
              <button
                type="button"
                className={controlClass}
                data-sound="blip"
                onClick={() => show(index + 1)}
                aria-label="Next image"
              >
                <ArrowRight {...iconProps} size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </dialog>
  );
}

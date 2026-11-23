import NumberFlow from '@number-flow/react';
import { useId, useRef } from 'react';
import { useTotalLove } from '../hooks/useTotalLove';

// Total Love: a 💗 button visitors can tap to send some love, and the total sent
// by everyone so far, kept on the server (api/love.js; see useTotalLove).
//
// Tapping: the button presses in like every other control (usePressFeedback),
// the 💗 swells a little and a 💗 floats up from it and fades. The count only
// changes when the server answers, to the total it returns; NumberFlow then
// rolls the digits that changed. Until then the hearts on their way show as
// "+n". Reduced motion: no swell or float, and NumberFlow (which follows the
// same setting) swaps the number without rolling.

const HEART = '💗';
const MAX_FLOATS = 6;

const notices = {
  loading: 'Loading…',
  unavailable: 'Unavailable right now',
  sent: 'Received, thank you',
  limit: 'That’s plenty for now, thank you',
  error: 'Couldn’t send, try again',
};

export default function TotalLove() {
  const { status, count, pending, notice, sendLove } = useTotalLove();
  const emojiRef = useRef(null);
  const floatLayerRef = useRef(null);
  const countId = useId();
  const isReady = status === 'ready';

  const celebrate = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    emojiRef.current?.animate([{ scale: 1 }, { scale: 1.28 }, { scale: 1 }], {
      duration: 420,
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    });

    const layer = floatLayerRef.current;
    if (!layer || layer.childElementCount >= MAX_FLOATS) return;
    const float = document.createElement('span');
    float.textContent = HEART;
    float.className = 'absolute top-1/2 left-1/2 -mt-2.5 -ml-2.5 size-5 text-center text-base leading-5';
    layer.append(float);
    const drift = (Math.random() - 0.5) * 18;
    float
      .animate(
        [
          { opacity: 0, transform: 'translate(0, 0) scale(0.7)' },
          { opacity: 1, transform: `translate(${drift * 0.2}px, -10px) scale(1)`, offset: 0.18 },
          { opacity: 0, transform: `translate(${drift}px, -52px) scale(1.05)` },
        ],
        { duration: 1000, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
      )
      .finished.catch(() => {})
      .finally(() => float.remove());
  };

  const handleClick = () => {
    if (sendLove()) celebrate();
  };

  const message = notice ? notices[notice] : status === 'ready' ? null : notices[status === 'idle' ? 'loading' : status];

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-none">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-[10px] border border-border bg-bg transition-[border-color,background-color] duration-(--duration-fast) ease-out disabled:cursor-default disabled:opacity-60 pointer-hover:border-border-strong pointer-hover:bg-surface-strong"
          aria-label="Send love"
          aria-describedby={countId}
          disabled={!isReady}
          data-sound="tick"
          onClick={handleClick}
        >
          <span ref={emojiRef} className="text-lg leading-none select-none" aria-hidden="true">
            {HEART}
          </span>
        </button>
        {/* Floating hearts rise from here; they never take clicks. */}
        <span ref={floatLayerRef} className="pointer-events-none absolute inset-0 select-none" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-micro tracking-[0.08em] whitespace-nowrap text-muted uppercase">Total Love</p>
        <p id={countId} className="flex min-w-0 items-baseline gap-1.5 text-sm leading-5 font-semibold tabular-nums">
          <span className="sr-only">Total love: </span>
          {count === null ? (
            <span>—</span>
          ) : (
            // Animates whenever the server's total changes (en grouping: 1,234).
            <NumberFlow value={count} locales="en" format={{ useGrouping: true }} />
          )}
          {pending > 0 && (
            <span className="text-xs font-medium text-muted" aria-hidden="true">
              +{pending}
            </span>
          )}
        </p>
        <p className="min-h-4 truncate text-[0.6875rem] leading-4 text-muted" role="status" aria-live="polite">
          {message}
        </p>
      </div>
    </div>
  );
}

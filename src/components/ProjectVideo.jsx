import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../utils/scroll';

const controlIconProps = { size: 14, strokeWidth: 1.75, 'aria-hidden': true, focusable: false };

// Compact square icon buttons over the video's corner.
const controlClass =
  'grid size-7 place-items-center rounded-sm border border-border bg-bg text-fg transition-[background-color,border-color,scale] duration-(--duration-fast) ease-out hover:border-border-strong hover:bg-surface-strong active:scale-94';

// A project's promotional video. It plays muted and looped while its card is the
// active one and on screen, and pauses otherwise. Visitors can pause it or turn
// the sound on; with reduced motion enabled it never starts on its own.
export default function ProjectVideo({ video, label, isActive = true, className = '' }) {
  const videoRef = useRef(null);
  const isInView = useRef(false);
  const isActiveRef = useRef(isActive);
  const wasPausedByVisitor = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Bring playback in line with the current state: off screen or not the active
  // card means paused; otherwise play, unless the visitor paused it themselves.
  const syncPlayback = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;

    if (!isInView.current || !isActiveRef.current) {
      element.pause();
    } else if (!wasPausedByVisitor.current && !prefersReducedMotion()) {
      // Autoplay can be refused by the browser; the Play button still works.
      element.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    isActiveRef.current = isActive;
    syncPlayback();
  }, [isActive, syncPlayback]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInView.current = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.35 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [syncPlayback]);

  const togglePlayback = () => {
    const element = videoRef.current;
    if (element.paused) {
      wasPausedByVisitor.current = false;
      element.play().catch(() => {});
    } else {
      wasPausedByVisitor.current = true;
      element.pause();
    }
  };

  const toggleSound = () => {
    const element = videoRef.current;
    element.muted = !element.muted;
    setIsMuted(element.muted);
  };

  // The playback button shows the action available (pause while playing, play
  // while paused). The volume button shows the current state: a speaker when the
  // sound is on, a crossed-out speaker when muted.
  const playbackLabel = isPlaying ? 'Pause' : 'Play';
  const soundLabel = isMuted ? 'Unmute' : 'Mute';

  return (
    <>
      <video
        ref={videoRef}
        className={`size-full object-cover ${className}`}
        src={video.src}
        poster={video.poster}
        width={video.width}
        height={video.height}
        aria-label={label}
        muted
        loop
        playsInline
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {/* Icon buttons. Each is labelled with the action it performs (also shown as
          its tooltip), since an icon alone says nothing to a screen reader. */}
      <div className="absolute right-2.5 bottom-2.5 flex gap-1.5">
        <button
          type="button"
          className={controlClass}
          data-sound="blip"
          onClick={togglePlayback}
          aria-label={playbackLabel}
          title={playbackLabel}
        >
          {isPlaying ? <Pause {...controlIconProps} /> : <Play {...controlIconProps} />}
        </button>
        <button
          type="button"
          className={controlClass}
          data-sound="blip"
          onClick={toggleSound}
          aria-label={soundLabel}
          title={soundLabel}
        >
          {isMuted ? <VolumeX {...controlIconProps} /> : <Volume2 {...controlIconProps} />}
        </button>
      </div>
    </>
  );
}

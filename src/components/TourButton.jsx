import { MousePointer2, RotateCcw } from 'lucide-react';

// Entry point for starting or replaying the guided tour.
//
// While the tour is running, Skip is the only tour control on screen, so this
// button is hidden. It keeps its place in the layout while hidden, so the groups
// around it do not shift when a tour starts or ends.
export default function TourButton({ tour, onStart }) {
  const Icon = tour.hasSeenTour ? RotateCcw : MousePointer2;

  const handleClick = () => {
    onStart?.();
    tour.start();
  };

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-border py-1.5 pr-3 pl-2.5 text-xs font-medium transition-[background-color,border-color] duration-(--duration-fast) ease-out hover:border-border-strong hover:bg-surface-strong disabled:invisible"
      onClick={handleClick}
      disabled={tour.isActive}
      aria-hidden={tour.isActive || undefined}
    >
      <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
      {tour.hasSeenTour ? 'Replay tour' : 'Take a tour'}
    </button>
  );
}

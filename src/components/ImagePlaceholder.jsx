// A clearly marked stand-in for an image that has not been supplied yet.
// It reserves the final aspect ratio so swapping in the real image causes no layout shift.
export default function ImagePlaceholder({ label, hint, className = '' }) {
  return (
    <div className={`relative grid size-full place-items-center bg-surface ${className}`} role="img" aria-label={`${label} (placeholder)`}>
      <svg className="absolute inset-0 size-full stroke-border stroke-1" aria-hidden="true" preserveAspectRatio="none">
        <line x1="0" y1="0" x2="100%" y2="100%" />
        <line x1="100%" y1="0" x2="0" y2="100%" />
      </svg>
      <span className="relative grid justify-items-center gap-0.5 bg-surface px-3 py-2 text-center">
        <span className="mono-label">Placeholder</span>
        {hint && <span className="mono-label">{hint}</span>}
      </span>
    </div>
  );
}

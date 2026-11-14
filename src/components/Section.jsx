import { sections } from '../data/content';

// A numbered page section: "01  Projects ─────────── [action]".
// The heading doubles as the anchor the tour guide points at.
export default function Section({ id, action, children }) {
  const { label, number } = sections.find((section) => section.id === id);

  return (
    <section id={id} className="pt-(--section-space) last:pb-(--section-space)" aria-labelledby={`${id}-heading`}>
      <header className="mb-8 flex items-baseline justify-between gap-4 border-b border-border pb-3.5" data-reveal="">
        <div className="flex items-baseline gap-3.5">
          <span className="font-mono text-xs text-muted" aria-hidden="true">
            {number}
          </span>
          <h2
            id={`${id}-heading`}
            className="text-lg leading-[1.3] font-semibold tracking-[-0.015em]"
            data-tour-anchor={id}
          >
            {label}
          </h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

import { sections } from '../data/content';
import { iconProps, sectionIcons } from './Icons';

// A page section: "[icon]  Projects ─────────── [action]", with the same icon
// as the section's entry in the sidebar.
// The heading doubles as the anchor the tour guide points at.
export default function Section({ id, action, children }) {
  const { label } = sections.find((section) => section.id === id);
  const Icon = sectionIcons[id];

  return (
    <section id={id} className="pt-(--section-space) last:pb-(--section-space)" aria-labelledby={`${id}-heading`}>
      <header className="mb-8 flex items-baseline justify-between gap-4 border-b border-border pb-3.5" data-reveal="">
        <div className="flex items-center gap-3">
          {Icon && <Icon {...iconProps} className="flex-none text-muted" />}
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

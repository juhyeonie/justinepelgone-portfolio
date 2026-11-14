import { sections } from '../data/content';

export default function SectionNav({ activeId, onNavigate }) {
  return (
    <nav aria-label="Sections">
      <ul className="grid gap-0.5">
        {sections.map((section) => {
          const isActive = section.id === activeId;

          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`relative block py-1.5 text-sm font-medium [transition:color_var(--duration-fast)_var(--ease-out),padding-left_var(--duration)_var(--ease-out)] before:absolute before:top-1/2 before:left-0 before:h-px before:w-3 before:origin-left before:bg-fg before:transition-transform before:duration-(--duration) before:ease-out ${isActive ? 'pl-5 text-fg before:scale-x-100' : 'text-muted before:scale-x-0 hover:text-fg'}`}
                aria-current={isActive ? 'location' : undefined}
                data-sound="tick"
                onClick={onNavigate}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

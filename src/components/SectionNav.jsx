import { Activity, BriefcaseBusiness, FolderOpen, House, Layers } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { sections } from '../data/content';
import { iconProps } from './Icons';

const sectionIcons = {
  home: House,
  projects: FolderOpen,
  experience: BriefcaseBusiness,
  stack: Layers,
  github: Activity,
};

// One row of the sidebar and the mobile menu (sections and social links alike):
// an icon, a label, and an optional detail on the right. `isLarge`: the mobile
// menu's 44px rows (40px on very short screens, so the menu fits).
export function getNavRowClass(isLarge = false) {
  return `relative flex items-center gap-3 rounded-[10px] px-2.5 font-medium transition-[color,background-color] duration-(--duration-fast) ease-out ${isLarge ? 'h-11 text-base [@media(max-height:620px)]:h-10' : 'h-9 text-sm'}`;
}

// A small mono heading over a group of rows.
export function NavLabel({ children }) {
  return (
    <p className="mb-1.5 px-2.5 font-mono text-micro tracking-[0.08em] text-muted uppercase">
      {children}
    </p>
  );
}

// The sections, each with its icon. The active section sits on a
// raised pill that glides from row to row as the visitor scrolls; it is placed
// directly (no React state), so scrolling never re-renders the list for it.
export default function SectionNav({ activeId, onNavigate, isLarge = false }) {
  const listRef = useRef(null);
  const pillRef = useRef(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    const pill = pillRef.current;

    const place = () => {
      const row = list.querySelector('[aria-current]');
      pill.style.opacity = row ? '1' : '0';
      if (!row) return;
      pill.style.transform = `translateY(${row.offsetTop}px)`;
      pill.style.height = `${row.offsetHeight}px`;
    };

    place();
    // The first placement is instant; from then on the pill glides.
    const frame = requestAnimationFrame(() => {
      pill.dataset.ready = '';
    });
    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(list);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [activeId]);

  return (
    <nav aria-label="Sections">
      <ul ref={listRef} className="relative grid gap-0.5">
        <li
          ref={pillRef}
          className="pointer-events-none absolute inset-x-0 top-0 rounded-[10px] border border-border bg-bg opacity-0 shadow-[0_1px_2px_rgb(0_0_0/0.05)] data-ready:transition-[transform,height,opacity] data-ready:duration-(--duration) data-ready:ease-slide"
          aria-hidden="true"
        />
        {sections.map((section) => {
          const isActive = section.id === activeId;
          const Icon = sectionIcons[section.id];

          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`${getNavRowClass(isLarge)} ${isActive ? 'text-fg' : 'text-muted pointer-hover:bg-surface-strong pointer-hover:text-fg'}`}
                aria-current={isActive ? 'location' : undefined}
                data-sound="tick"
                onClick={onNavigate}
              >
                {Icon && <Icon {...iconProps} />}
                <span className="min-w-0 flex-1 truncate">{section.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

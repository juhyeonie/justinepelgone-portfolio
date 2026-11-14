import Section from '../components/Section';
import { techStack } from '../data/content';
import { techLogos } from '../data/techLogos';

// One technology, as a small tile holding its logo. The name is not shown beside
// it, so it is provided three ways: read out for screen readers, and shown in a
// small label on hover, on keyboard focus, and on tap (which is why the tile can
// take focus).
function TechTile({ name }) {
  const logo = techLogos[name];

  return (
    <li
      className="relative grid size-11 place-items-center rounded-[10px] border border-border bg-surface font-mono text-sm text-fg [transition:translate_var(--duration)_var(--ease-out),border-color_var(--duration-fast)_var(--ease-out),background-color_var(--duration-fast)_var(--ease-out)] after:pointer-events-none after:absolute after:bottom-[calc(100%+8px)] after:left-1/2 after:z-2 after:-translate-x-1/2 after:translate-y-0.75 after:rounded-sm after:bg-fg after:px-2 after:py-0.75 after:font-mono after:text-micro after:leading-[1.5] after:tracking-[0.04em] after:whitespace-nowrap after:text-bg after:opacity-0 after:transition-[opacity,translate] after:duration-(--duration-fast) after:ease-out after:content-[attr(data-label)] hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-strong hover:after:translate-y-0 hover:after:opacity-100 focus:after:translate-y-0 focus:after:opacity-100 focus-visible:-translate-y-0.5 focus-visible:border-border-strong focus-visible:bg-surface-strong max-sm:size-10"
      // The name label above the tile on hover and focus reads data-label.
      tabIndex={0} data-label={name} data-hover-sound="">
      {logo ? (
        <svg
          className="size-5.5 fill-current max-sm:size-5"
          viewBox={logo.viewBox}
          aria-hidden="true"
          focusable="false"
        >
          {logo.paths.map((path) => (
            <path key={path.slice(0, 24)} d={path} fillRule={logo.fillRule} />
          ))}
        </svg>
      ) : (
        // No logo on file for this name: show its initial rather than an empty tile.
        <span aria-hidden="true">{name[0]}</span>
      )}
      <span className="sr-only">{name}</span>
    </li>
  );
}

// Each category is a labelled row of logo tiles.
export default function TechStack() {
  return (
    <Section id="stack">
      <dl className="grid">
        {techStack.map((group) => (
          <div
            key={group.category}
            className="grid grid-cols-[148px_minmax(0,1fr)] items-center gap-6 border-b border-border py-4 first:pt-0 max-sm:grid-cols-1 max-sm:gap-2.5"
            data-reveal=""
          >
            <dt className="mono-label">{group.category}</dt>
            <dd>
              <ul className="flex flex-wrap gap-2.5 max-sm:gap-2">
                {group.items.map((item) => (
                  <TechTile key={item} name={item} />
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

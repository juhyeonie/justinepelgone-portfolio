import Section from '../components/Section';
import { experience } from '../data/content';

// A numbered list of roles. Each entry: a subtle number and a tag saying what kind
// of experience it is, then the role title (the prominent element), the
// organization and academic subject as a secondary line, and a few plain facts.
export default function Experience() {
  return (
    <Section id="experience">
      <ol>
        {experience.map((entry, index) => (
          <li
            key={entry.title}
            className="grid grid-cols-[148px_minmax(0,1fr)] gap-6 border-b border-border py-6 first:pt-0 max-sm:grid-cols-1 max-sm:gap-2.5"
            data-reveal=""
          >
            <div className="grid content-start gap-1.5 pt-1.25 max-sm:flex max-sm:flex-wrap max-sm:items-baseline max-sm:gap-x-3.5 max-sm:gap-y-1.5 max-sm:pt-0">
              <span className="font-mono text-xs leading-[1.4]" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="mono-label">{entry.label}</span>
              {entry.period && <span className="mono-label">{entry.period}</span>}
            </div>

            <div>
              <h3 className="text-lg leading-[1.3] font-semibold tracking-[-0.015em]">{entry.title}</h3>
              <p className="mt-0.5 text-sm text-muted">
                {entry.organization}
                {entry.context && (
                  <>
                    <span aria-hidden="true"> — </span>
                    <span className="sr-only">, </span>
                    {entry.context}
                  </>
                )}
              </p>

              <dl className="mt-4 grid gap-2 text-sm">
                {entry.details.map((detail) => (
                  <div
                    key={detail.term}
                    className="grid grid-cols-[132px_minmax(0,1fr)] items-baseline gap-3 max-sm:grid-cols-1 max-sm:gap-0.5"
                  >
                    <dt className="mono-label">{detail.term}</dt>
                    <dd>{detail.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

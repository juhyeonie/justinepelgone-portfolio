import { useEffect, useRef, useState } from 'react';
import ExternalArrow from '../components/ExternalArrow';
import Section from '../components/Section';
import { contactLinks } from '../data/content';

// Contribution data comes from a public, read-only mirror of GitHub's contribution
// calendar (the same source used by react-github-calendar). Nothing is fabricated:
// if the request fails, the section falls back to a plain link to the profile.
const CONTRIBUTIONS_URL = `https://github-contributions-api.jogruber.de/v4/${contactLinks.githubHandle}?y=last`;
const REQUEST_TIMEOUT_MS = 8000;

// One day in the graph (and in its legend), shaded by activity level 0–4.
const cellClass =
  'size-2.5 rounded-xs bg-graph-0 data-[level=1]:bg-graph-1 data-[level=2]:bg-graph-2 data-[level=3]:bg-graph-3 data-[level=4]:bg-graph-4';

// Shown in the graph's place while it loads, or if it can't be loaded.
const fallbackClass =
  'grid min-h-33 place-content-center justify-items-center gap-2 border border-border bg-surface p-5 text-center text-sm';

function useContributions() {
  const [state, setState] = useState({ status: 'loading', days: [], total: null });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    fetch(CONTRIBUTIONS_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.contributions) || data.contributions.length === 0) {
          throw new Error('Unexpected response shape');
        }
        if (!isMounted) return;
        const total = Number.isFinite(data.total?.lastYear) ? data.total.lastYear : null;
        setState({ status: 'ready', days: data.contributions, total });
      })
      .catch(() => {
        // Network failure, bad response, or timeout: show the fallback link.
        if (isMounted) setState({ status: 'error', days: [], total: null });
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return state;
}

function ContributionGraph({ days, total }) {
  const scrollerRef = useRef(null);

  // On narrow screens the graph scrolls inside its own box; start at the most recent weeks.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }, [days]);

  // Pad the first column so each row is a fixed weekday (Sunday first).
  const leadingBlanks = new Date(`${days[0].date}T00:00:00`).getDay();
  const summary =
    total === null
      ? 'GitHub contribution graph for the last year'
      : `GitHub contribution graph: ${total.toLocaleString()} contributions in the last year`;

  return (
    <figure>
      <div
        ref={scrollerRef}
        className="[scrollbar-width:thin] overflow-x-auto pb-1"
        role="img"
        aria-label={summary}
        tabIndex={0}
      >
        <div
          className="grid w-max auto-cols-[10px] grid-flow-col grid-rows-[repeat(7,10px)] gap-0.75"
          aria-hidden="true"
        >
          {Array.from({ length: leadingBlanks }, (_, index) => (
            <span key={`blank-${index}`} />
          ))}
          {days.map((day) => (
            <span
              key={day.date}
              className={cellClass}
              data-level={day.level}
              title={`${day.count} on ${day.date}`}
            />
          ))}
        </div>
      </div>

      <figcaption className="mt-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mono-label">
        <span>
          {total === null ? 'Last year' : `${total.toLocaleString()} contributions in the last year`}
        </span>
        <span className="inline-flex items-center gap-0.75" aria-hidden="true">
          Less
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={`${cellClass} first-of-type:ml-1.25 last-of-type:mr-1.25`}
              data-level={level}
            />
          ))}
          More
        </span>
      </figcaption>
    </figure>
  );
}

export default function GitHubActivity() {
  const { status, days, total } = useContributions();

  const profileLink = (
    <a
      className="font-mono text-xs whitespace-nowrap text-muted underline decoration-border-strong decoration-1 underline-offset-4 transition-[color] duration-(--duration-fast) ease-out hover:text-fg hover:decoration-fg"
      href={contactLinks.github} target="_blank" rel="noreferrer">
      @{contactLinks.githubHandle}
      <ExternalArrow />
    </a>
  );

  return (
    <Section id="github" action={profileLink}>
      <div className="min-h-33" data-reveal="">
        {status === 'ready' && <ContributionGraph days={days} total={total} />}

        {status === 'loading' && (
          <div className={fallbackClass} role="status">
            <span className="mono-label">Loading contribution graph…</span>
          </div>
        )}

        {status === 'error' && (
          <div className={fallbackClass}>
            <p className="text-muted">The contribution graph couldn&apos;t be loaded right now.</p>
            <a className="link" href={contactLinks.github} target="_blank" rel="noreferrer">
              View activity on GitHub
              <ExternalArrow />
            </a>
          </div>
        )}
      </div>
    </Section>
  );
}

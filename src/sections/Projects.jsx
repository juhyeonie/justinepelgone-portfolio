import { useState } from 'react';
import ProjectShowcase from '../components/ProjectShowcase';
import PubmatCarousel from '../components/PubmatCarousel';
import Section from '../components/Section';
import { projects, pubmats } from '../data/content';

// Development projects and the graphic design carousel, under one heading, with a
// filter to show either or both.
//
// Both groups stay mounted and the filter only hides one, so switching back and
// forth keeps the showcase on the project it was on, and the fade-in on scroll
// (which watches elements present when the page loads) still applies to both.

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'development', label: 'Development' },
  { id: 'design', label: 'Graphic Design' },
];

export default function Projects() {
  const [filter, setFilter] = useState('all');
  const showsDevelopment = filter !== 'design';
  const showsDesign = filter !== 'development';
  const showsBoth = showsDevelopment && showsDesign;

  return (
    <Section id="projects">
      <div
        className="mb-7 inline-flex flex-wrap gap-0.5 rounded-lg border border-border p-0.5"
        role="group" aria-label="Filter projects" data-reveal="">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="rounded-[5px] px-3 py-1.25 text-sm font-medium text-muted transition-[background-color,color] duration-(--duration-fast) ease-out hover:text-fg aria-pressed:bg-fg aria-pressed:text-bg"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div hidden={!showsDevelopment}>
        {showsBoth && <h3 className="mb-4 mono-label">Development</h3>}
        <ProjectShowcase projects={projects} />
      </div>

      <div className={showsBoth ? 'mt-14' : undefined} hidden={!showsDesign}>
        {showsBoth && (
          <h3 className="mb-4 mono-label" data-tour-anchor="design-work">
            Graphic Design
          </h3>
        )}
        <div data-reveal="">
          <PubmatCarousel pubmats={pubmats} />
        </div>
      </div>
    </Section>
  );
}

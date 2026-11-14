import FlipPortrait from '../components/FlipPortrait';
import ImagePlaceholder from '../components/ImagePlaceholder';
import { profile } from '../data/content';

// Hero. Type hierarchy, largest to quietest: name, professional title, intro.
// `greetingCue` comes from the guided tour (see useTour): while the guide's first
// greeting is on screen, the portrait shows the pixel avatar.
export default function Home({ greetingCue = null }) {
  const { portrait, pixelPortrait } = profile;

  return (
    <section id="home" className="pt-24 max-sm:pt-10 sm:max-lg:pt-16" aria-labelledby="home-heading">
      <div
        className="grid grid-cols-[184px_minmax(0,1fr)] items-center gap-11 max-lg:grid-cols-1 max-sm:gap-7 sm:max-lg:gap-8"
        data-reveal=""
      >
        {portrait && pixelPortrait ? (
          <div className="@container max-sm:w-[min(100%,360px)] sm:max-lg:w-[300px]">
            <FlipPortrait
              name={profile.name}
              photo={portrait}
              avatar={pixelPortrait}
              tourCue={greetingCue}
            />
          </div>
        ) : portrait ? (
          <div className="@container max-sm:w-[min(100%,360px)] sm:max-lg:w-[300px]">
            <img
              className="h-auto w-full dark:[filter:var(--figure-outline)]"
              src={portrait.src}
              alt={`Portrait of ${profile.name}`}
              width={portrait.width}
              height={portrait.height}
              decoding="async"
            />
          </div>
        ) : (
          <div className="@container aspect-square overflow-hidden border border-border max-sm:w-[min(100%,360px)] sm:max-lg:w-[300px]">
            <ImagePlaceholder label={`Portrait of ${profile.name}`} hint="Portrait" />
          </div>
        )}

        <div>
          <h1 id="home-heading" className="text-hero leading-[1.08] font-bold tracking-[-0.035em]">
            {/* The span hugs the text, so the tour's cursor rests on the end of the
                name rather than the end of the full-width heading box. */}
            <span data-tour-anchor="home">{profile.name}</span>
          </h1>
          <p className="mt-2 text-hero-title leading-[1.25] font-medium tracking-[-0.02em]">{profile.role}</p>
          <p className="mt-4 max-w-[46ch] text-muted">{profile.intro}</p>
        </div>
      </div>

      <dl
        className="mt-14 grid grid-cols-3 border-y border-border max-sm:mt-10 max-sm:grid-cols-1"
        data-reveal=""
      >
        {profile.facts.map((fact) => (
          <div
            key={fact.label}
            className="grid content-start gap-1.5 border-l border-border px-5 py-4.5 first:border-l-0 first:pl-0 max-sm:grid-cols-[104px_1fr] max-sm:items-baseline max-sm:border-t max-sm:border-l-0 max-sm:px-0 max-sm:py-3.5 max-sm:first:border-t-0"
          >
            <dt className="mono-label">{fact.label}</dt>
            <dd className="text-sm leading-[1.45] font-medium">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

import ExternalArrow from './ExternalArrow';
import ImagePlaceholder from './ImagePlaceholder';
import ProjectVideo from './ProjectVideo';

function ProjectAction({ href, children }) {
  // Actions are only rendered for confirmed, real URLs.
  if (!href) return null;

  return (
    <a className="link" href={href} target="_blank" rel="noreferrer">
      {children}
      <ExternalArrow />
    </a>
  );
}

// The screenshot or video eases into a gentle zoom while the card is hovered, if
// the card can be zoomed into (the project in front, or any card in the phone
// row). The media box clips it, so nothing around it moves.
const mediaClass = 'transition-transform duration-600 ease-slide';
const zoomClass = 'group-pointer-hover/card:scale-[1.025]';

// In the stack (tablet and up), every card shares one grid cell, and its place
// comes from --offset (set inline: its signed distance from the active card) and
// data-position. The slide (position, tilt, size) and the hover lift are separate
// properties with their own timing: lifting a card never re-times a slide under
// way, and the slide never makes the lift sluggish. Everything about a slide
// shares one duration and curve; z-index switches partway through, as the cards
// pass each other, and a hidden card stays visible until it has faded out.
//
// The shadow is on its own layer (::after) and fades with opacity, which is cheap
// to animate; animating box-shadow repaints the whole card on every frame.
//
// - active: in front, with the shadow.
// - side: a smaller preview, lifted a little on hover or while the tour points
//   at it.
// - hidden: further back, tucked out of sight behind the active card.
const stackCardClass =
  'col-start-1 row-start-1 w-[min(480px,68%)] [translate:0_var(--card-lift)] [transform:translateX(calc(var(--offset)*var(--card-shift)))_rotate(calc(var(--offset)*var(--card-tilt)))_scale(var(--card-scale))] will-change-transform [--card-lift:0px] [--card-scale:1] [transition:transform_var(--duration-slide)_var(--ease-slide),opacity_var(--duration-slide)_var(--ease-slide),background-color_var(--duration-slide)_var(--ease-slide),translate_var(--duration-hover)_var(--ease-out),border-color_var(--duration-hover)_var(--ease-out),z-index_0s_linear_0.15s,visibility_0s_linear_0s] after:pointer-events-none after:absolute after:inset-0 after:-z-1 after:rounded-[inherit] after:opacity-0 after:[box-shadow:var(--card-shadow)] after:transition-opacity after:duration-(--duration-slide) after:ease-slide data-[position=active]:z-3 data-[position=active]:after:opacity-100 data-[position=hidden]:pointer-events-none data-[position=hidden]:invisible data-[position=hidden]:z-1 data-[position=hidden]:opacity-0 data-[position=hidden]:[transition-delay:0s,0s,0s,0s,0s,0s,var(--duration-slide)] data-[position=hidden]:[--card-scale:0.78] data-[position=side]:z-2 data-[position=side]:bg-surface data-[position=side]:[--card-scale:var(--card-side-scale)] data-[position=side]:data-tour-highlight:border-border-strong data-[position=side]:data-tour-highlight:[--card-lift:-4px] max-md:w-[min(440px,70%)] data-[position=side]:pointer-hover:border-border-strong data-[position=side]:pointer-hover:[--card-lift:-4px]';

// A side card's contents are a quiet preview, until hovered (which brightens it
// quickly), focused, or pointed at by the tour.
const sideContentClass =
  'opacity-45 group-focus-within/card:opacity-70 group-data-tour-highlight/card:opacity-70 group-pointer-hover/card:opacity-70 group-pointer-hover/card:duration-(--duration-hover)';

function ProjectMedia({ project, isActive, canZoom }) {
  const { name, video, image } = project;
  const style = video ? { aspectRatio: `${video.width} / ${video.height}` } : undefined;

  return (
    <div
      className="relative aspect-[16/10] overflow-hidden rounded-media border border-border bg-surface"
      style={style}
    >
      {video ? (
        <ProjectVideo
          video={video}
          label={`Promotional video for ${name}`}
          isActive={isActive}
          className={`${mediaClass} ${canZoom ? zoomClass : ''}`}
        />
      ) : image ? (
        <img
          className={`size-full object-cover ${mediaClass} ${canZoom ? zoomClass : ''}`}
          src={image.src}
          alt={`Screenshot of ${name}`}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <ImagePlaceholder
          className={mediaClass}
          label={`Screenshot of ${name}`}
          hint="Project screenshot"
        />
      )}
    </div>
  );
}

// One project, as a card in the showcase.
//
// `position` is where the card sits in the stack: "active" (front and centre),
// "side" (tucked behind, clickable to bring forward), or "hidden" (further back,
// out of sight). `offset` is its signed distance from the active card and drives
// the card's transform (see stackCardClass). When `position` is omitted the card is a plain,
// fully interactive card (the mobile swipe layout).
export default function ProjectCard({
  project,
  number,
  total,
  position,
  offset = 0,
  isActive,
  onSelect,
}) {
  const { name, labels, year, description, role, technologies, liveUrl, sourceUrl } = project;
  const isInteractive = !position || position === 'active';
  const hasActions = Boolean(liveUrl || sourceUrl);

  return (
    <article
      className={`group/card relative flex rounded-card border border-border bg-bg ${position ? stackCardClass : ''}`}
      data-sound="bubble"
      // The tour guide visits each card in turn, pointing at its title.
      data-tour-anchor={`project-${project.id}`}
      // Which project is in front, in either layout (the tour checks it).
      data-active={isActive || undefined}
      data-position={position}
      style={{ '--offset': offset }}
      aria-label={`${name}, project ${number} of ${total}`}
      aria-hidden={position === 'hidden' || undefined}
    >
      {/* Cards behind the active one are previews: their contents are inert, so
          links and video controls can't be reached until the card is in front. */}
      <div
        className={`flex min-w-0 flex-1 flex-col gap-3.5 p-5 transition-opacity duration-(--duration-slide) ease-slide in-[.showcase--swipe]:p-4 max-md:in-[.showcase--stack]:gap-3 max-md:in-[.showcase--stack]:p-4 ${position === 'side' ? sideContentClass : ''}`}
        inert={!isInteractive}
      >
        <div className="flex items-start justify-between gap-3">
          <ul className="flex flex-wrap gap-1.5" aria-label="Project details">
            {labels?.map((label) => (
              <li key={label} className="tag">
                {label}
              </li>
            ))}
            {year && <li className="tag">{year}</li>}
          </ul>
          <span className="pt-1.25 mono-label" aria-hidden="true">
            {String(number).padStart(2, '0')}
          </span>
        </div>

        <h3
          className="text-xl leading-[1.25] font-semibold tracking-[-0.02em] in-[.showcase--swipe]:text-lg max-md:in-[.showcase--stack]:text-lg"
          data-tour-point=""
        >{name}</h3>
        <p className="text-sm text-muted">{description}</p>

        <ProjectMedia project={project} isActive={isActive} canZoom={isInteractive} />

        {role && (
          <p className="flex items-baseline gap-3 text-sm">
            <span className="mono-label">Role</span>
            {role}
          </p>
        )}

        <ul className="flex flex-wrap gap-1.5" aria-label={`Technologies used in ${name}`}>
          {technologies.map((technology) => (
            <li key={technology} className="tag">
              {technology}
            </li>
          ))}
        </ul>

        {hasActions && (
          <div className="mt-auto flex flex-wrap gap-x-5.5 gap-y-2 pt-1 text-sm font-medium">
            <ProjectAction href={liveUrl}>View Live Project</ProjectAction>
            <ProjectAction href={sourceUrl}>GitHub</ProjectAction>
          </div>
        )}
      </div>

      {position === 'side' && (
        <button
          type="button"
          className="absolute inset-0 cursor-pointer rounded-[inherit] focus-visible:rounded-card focus-visible:outline-offset-2"
          // It covers the whole card, so it sounds like the card.
          data-sound="bubble"
          onClick={onSelect}
          aria-label={`Show project ${number}: ${name}`}
        />
      )}
    </article>
  );
}

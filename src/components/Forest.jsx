// The halftone forest: the page's background, fixed to the bottom of the window
// while everything else scrolls over it. It is the image itself, unchanged and
// never animated. It never takes clicks, and screen readers skip it.
//
// Sizing: never stretched; the height always follows the image's own 3:1
// proportions. On desktop it is the whole image at the full window width.
// Below 1024px the full width would make the trees tiny, so it is drawn wider
// than the window and centred (1.6x below the site's md breakpoint, 861px;
// 1.3x from there to 1024px), trimming a
// little from each side. Its height is capped at half the window (150svh of
// width), so on a phone held sideways it stays at the full window width.
//
// It is a fixed element rather than `background-attachment: fixed`, which mobile
// browsers (iOS Safari in particular) ignore or render badly.
//
// Opacity: the image is shown faded (--forest-opacity) so text scrolling over
// its darkest trees stays readable.
//
// Dark theme: the image is black on white, so there it is inverted (white trees
// on black) and blended with `lighten`, letting its black merge into the page's
// near-black background instead of showing as a black band.
export default function Forest() {
  return (
    <img
      src="/forest-halftone.webp"
      alt=""
      width={2000}
      height={666}
      decoding="async"
      draggable={false}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-auto w-full opacity-(--forest-opacity) select-none max-lg:right-auto max-lg:left-1/2 max-lg:max-w-none max-lg:min-w-screen max-lg:-translate-x-1/2 max-md:w-[min(160vw,150svh)] md:max-lg:w-[min(130vw,150svh)] dark:mix-blend-lighten dark:invert"
    />
  );
}

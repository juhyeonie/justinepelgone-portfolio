// The halftone forest: the page's background, fixed to the bottom of the window
// while everything else scrolls over it. It is the image itself, unchanged and
// never animated. It never takes clicks, and screen readers skip it.
//
// Sizing: the whole image, never cropped or stretched: the full window width,
// with the height following from the image's own proportions.
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
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-auto w-full opacity-(--forest-opacity) select-none dark:mix-blend-lighten dark:invert"
    />
  );
}

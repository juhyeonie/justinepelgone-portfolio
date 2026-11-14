# Justine Pelgone — Portfolio

Personal portfolio of Justine Pelgone, Developer & UI/UX Designer.

- **Live site:** https://justine-pelgone.vercel.app
- **Repository:** https://github.com/juhyeonie/justinepelgone-portfolio

## Built with

- React and Vite
- Tailwind CSS v4
- lucide-react for icons

## Run it locally

```bash
git clone https://github.com/juhyeonie/justinepelgone-portfolio.git
cd justinepelgone-portfolio
npm install
npm run dev
```

To make a production build:

```bash
npm run build
```

## Styling

Components are styled with Tailwind CSS v4 utility classes in their markup.
Tailwind runs through its Vite plugin (`@tailwindcss/vite` in `vite.config.js`);
there is no `tailwind.config.js`, since v4 is configured in CSS.

Everything starts from [`src/styles/index.css`](src/styles/index.css):

- **Theme.** The design tokens are the Tailwind theme: Manrope and DM Mono, the type
  scale (`text-micro` … `text-hero`), card and media radii (`rounded-card`,
  `rounded-media`), easings (`ease-out`, `ease-slide`) and the breakpoints:
  `sm` 600px, `md` 861px, `lg` 1024px. The site is laid out desktop-first, so
  smaller screens use `max-sm:`, `max-md:` and `max-lg:`.
- **Colors.** The palette is monochrome only: `bg`, `fg`, `muted`, `surface`,
  `surface-strong`, `border`, `border-strong` and the contribution graph's
  `graph-0` … `graph-4` (as in `bg-surface` or `text-muted`). They read CSS
  variables set per theme, so they follow the light and dark themes on their
  own.
- **Variants.**
  - `dark:` follows the theme set on `<html data-theme>`, not the system setting.
  - `hover:` is plain `:hover`.
  - `pointer-hover:` only applies on devices that can hover, so the style doesn't
    stick after a tap.
  - `touch:` targets touch-only screens.
- **Shared utilities.** `mono-label`, `link`, `tag` and `icon-button` cover the
  text and control styles used across many components.

- **Animations.** `animate-lightbox-in` and the tour's `animate-tour-*` classes,
  with their keyframes.

`index.css` is the only stylesheet. Besides the setup above, it holds the few
things no single component owns:

- the light and dark palettes, and the spacing that changes with screen size
  (`--gutter`, `--section-space`, `--header-offset`)
- the motion durations (`--duration-fast` … `--duration-slide`)
- page-wide rules: focus rings, text selection, reveal-on-scroll, the
  theme-switch transitions and reduced motion
- the pixel character walking on the loading screen (its sprite is
  `assets-source/sprites/character-walk.png`)

Everything else, including the sliders' motion, the mobile menu and the guided
tour, is utility classes in the components.

The rest of the loading screen's styles stay inline in `index.html`, so it can
paint before the app's script loads.

## Deployment

The site is hosted on Vercel. Every push to `main` deploys automatically.

import { Menu, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { profile, sections } from '../data/content';
import SocialLinks from './SocialLinks';
import SoundToggle from './SoundToggle';
import ThemeSwitcher from './ThemeSwitcher';
import TourButton from './TourButton';

// Top bar and full-screen menu, shown below 1024px.
//
// The bar (name + menu button) stays fixed above everything, so the button that
// opened the menu is the button that closes it, in the same place. The menu is a
// full-viewport overlay beneath the bar. It is always in the DOM and switched
// with `data-open`, which lets its classes animate it both in and out; while closed it is
// `inert`, so nothing in it can be focused or clicked.

const DESKTOP_QUERY = '(min-width: 1024px)'; // the sidebar takes over from here

// Hamburger ⇄ close. Reduced motion: no turn, just the cross-fade.
const toggleIconClass =
  'absolute transition-[opacity,rotate,scale] duration-(--duration) ease-out motion-reduce:scale-none! motion-reduce:rotate-none! motion-reduce:delay-0!';

// Entrance: each block rises a little and fades in, one after another
// (--item-index is set inline). Exit: they simply fade with the overlay, with no
// stagger, so closing is quick. Reduced motion: no movement and no stagger.
const menuItemClass =
  'translate-y-2.5 opacity-0 transition-[opacity,translate] duration-200 ease-out in-data-[open=true]:translate-y-0 in-data-[open=true]:opacity-100 in-data-[open=true]:delay-[calc(60ms+var(--item-index,0)*35ms)] in-data-[open=true]:duration-450 motion-reduce:translate-none! motion-reduce:delay-0!';

export default function MobileNav({ activeId, themePreference, onThemeChange, sounds, tour }) {
  const [isOpen, setIsOpen] = useState(false);
  // True when the guided tour opened the menu (for its final step) rather than
  // the visitor. A menu the visitor opened puts the tour on hold; this one does not.
  const [wasOpenedByTour, setWasOpenedByTour] = useState(false);
  const menuButtonRef = useRef(null);
  const wasOpen = useRef(false);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  // The tour's final step points at the social links, which on small screens are
  // inside this menu. Open it for that step so the tour never points at a hidden
  // element. The tour only opens the menu; closing it is left to the visitor.
  const tourNeedsMenu = Boolean(tour.step?.opensMenu);
  const skipTour = tour.skip;

  useEffect(() => {
    if (!tourNeedsMenu || window.matchMedia(DESKTOP_QUERY).matches) return;
    setWasOpenedByTour(true);
    setIsOpen(true);
  }, [tourNeedsMenu]);

  // If the visitor closes the menu while the tour is pointing into it, there is
  // nothing left to point at: end the tour rather than aim at a hidden link.
  useEffect(() => {
    const hasJustClosed = wasOpen.current && !isOpen;
    wasOpen.current = isOpen;

    if (!hasJustClosed) return;
    setWasOpenedByTour(false);
    if (tourNeedsMenu) skipTour();
  }, [isOpen, tourNeedsMenu, skipTour]);

  // While the menu is open: lock background scrolling, take the page behind it
  // out of the tab order, and listen for Escape.
  useEffect(() => {
    if (!isOpen) return undefined;

    const root = document.documentElement;
    const background = document.querySelectorAll('[data-menu-background]');

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      // Escape closes the menu only; don't let it also skip a running tour.
      event.stopPropagation();
      setIsOpen(false);
      menuButtonRef.current?.focus();
    };

    root.classList.add('is-menu-open');
    background.forEach((element) => {
      element.inert = true;
    });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      root.classList.remove('is-menu-open');
      background.forEach((element) => {
        element.inert = false;
      });
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // If the window grows to desktop width while the menu is open, close it, so the
  // scroll lock can never be left behind with no visible way to release it.
  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY);
    const handleChange = () => mediaQuery.matches && setIsOpen(false);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <header className="hidden max-lg:block" data-open={isOpen}>
      <div className="fixed inset-x-0 top-0 z-40 flex h-(--header-offset) items-center justify-between border-b border-border bg-bg pr-[max(var(--gutter),env(safe-area-inset-right))] pl-[max(var(--gutter),env(safe-area-inset-left))] transition-[border-color] duration-(--duration) ease-out in-data-[open=true]:border-b-transparent">
        {/* The open menu shows the name itself, larger, so this copy steps aside
            (visibility also takes it out of the tab order, once it has faded). */}
        <a href="#home" className="text-sm font-semibold tracking-[-0.01em] [transition:opacity_var(--duration)_var(--ease-out),visibility_0s_linear_0s] in-data-[open=true]:invisible in-data-[open=true]:opacity-0 in-data-[open=true]:[transition-delay:0s,var(--duration)]" onClick={closeMenu}>
          {profile.name}
        </a>

        <button
          ref={menuButtonRef}
          type="button"
          className="icon-button"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsOpen((open) => !open)}
        >
          {/* Both icons are stacked and cross-fade with a quarter turn. */}
          <Menu className={`${toggleIconClass} in-data-[open=true]:scale-80 in-data-[open=true]:rotate-90 in-data-[open=true]:opacity-0`} size={18} strokeWidth={1.75} />
          <X className={`${toggleIconClass} scale-80 -rotate-90 opacity-0 in-data-[open=true]:scale-100 in-data-[open=true]:rotate-0 in-data-[open=true]:opacity-100`} size={18} strokeWidth={1.75} />
        </button>
      </div>

      <div
        id="mobile-menu"
        className="invisible fixed inset-0 z-35 overflow-y-auto overscroll-contain bg-bg opacity-0 [transition:opacity_0.25s_var(--ease-out),visibility_0s_linear_0.25s] in-data-[open=true]:visible in-data-[open=true]:opacity-100 in-data-[open=true]:delay-0"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!isOpen}
        data-tour-hold={isOpen && !wasOpenedByTour ? '' : undefined}
      >
        <div className="flex min-h-full flex-col gap-7 pt-[calc(var(--header-offset)+28px)] pr-[max(var(--gutter),env(safe-area-inset-right))] pb-[calc(24px+env(safe-area-inset-bottom))] pl-[max(var(--gutter),env(safe-area-inset-left))]">
          <div className={menuItemClass} style={{ '--item-index': 0 }}>
            <p className="text-xl leading-[1.25] font-semibold tracking-[-0.02em]">{profile.name}</p>
            <p className="mt-0.5 text-sm text-muted">{profile.role}</p>
          </div>

          <nav aria-label="Sections">
            <ul className="grid border-t border-border">
              {sections.map((section, index) => {
                const isActive = section.id === activeId;

                return (
                  <li
                    key={section.id}
                    className={menuItemClass}
                    style={{ '--item-index': index + 1 }}
                  >
                    <a
                      href={`#${section.id}`}
                      className={`flex items-baseline gap-4 border-b border-border py-3.25 text-lg font-medium tracking-[-0.01em] transition-[color] duration-(--duration-fast) ease-out ${isActive ? 'text-fg' : 'text-muted pointer-hover:text-fg'}`}
                      aria-current={isActive ? 'location' : undefined}
                      data-sound="tick"
                      onClick={closeMenu}
                    >
                      <span className="w-5 font-mono text-xs font-normal tracking-normal text-muted" aria-hidden="true">
                        {section.number}
                      </span>
                      {section.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div
            className={`${menuItemClass} mt-auto grid gap-4.5`}
            style={{ '--item-index': sections.length + 1 }}
          >
            <SocialLinks isRow />
            <div className="flex items-center justify-between gap-4 border-t border-border pt-4.5">
              <TourButton tour={tour} onStart={closeMenu} />
              <div className="inline-flex items-stretch gap-2">
                <ThemeSwitcher preference={themePreference} onChange={onThemeChange} isLarge />
                <SoundToggle sounds={sounds} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

import { Mail, Menu, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { contact, contactLinks, profile } from '../data/content';
import { iconProps } from './Icons';
import SectionNav, { NavLabel } from './SectionNav';
import SocialLinks from './SocialLinks';
import SoundToggle from './SoundToggle';
import ThemeSwitcher from './ThemeSwitcher';
import TotalLove from './TotalLove';
import TourButton from './TourButton';

// Navigation below 1024px, where the desktop sidebar is hidden: a menu button
// fixed in the top-left corner, opening the sidebar as a full-screen overlay.
//
// The overlay is the desktop sidebar adapted to a phone: the same pieces in the
// same order. Top: who this is, with the close button on the right. Middle
// (scrolls if the screen is short): Index, Elsewhere, and the tour. Foot, pinned:
// Total Love, appearance and sound, and the contact note. Rows are the larger
// touch size of the same components (`isLarge`).
//
// It is always in the DOM and switched with `data-open`, which lets its classes
// animate it both in and out; while closed it is `inert`, so nothing in it can be
// focused or clicked. It closes from the close button, a link, or Escape; tapping
// anywhere else inside it never closes it by accident.

const DESKTOP_QUERY = '(min-width: 1024px)';

// Entrance: each group rises a little and fades in, one after another
// (--item-index is set inline). Exit: they fade with the overlay, with no stagger,
// so closing is quick. Reduced motion: no movement and no stagger.
const menuItemClass =
  'translate-y-2.5 opacity-0 transition-[opacity,translate] duration-200 ease-out in-data-[open=true]:translate-y-0 in-data-[open=true]:opacity-100 in-data-[open=true]:delay-[calc(60ms+var(--item-index,0)*35ms)] in-data-[open=true]:duration-450 motion-reduce:translate-none! motion-reduce:delay-0!';

export default function MobileNav({ activeId, themePreference, onThemeChange, sounds, tour }) {
  const [isOpen, setIsOpen] = useState(false);
  // True when the guided tour opened the menu (for its final step) rather than
  // the visitor. A menu the visitor opened puts the tour on hold; this one does not.
  const [wasOpenedByTour, setWasOpenedByTour] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const wasOpen = useRef(false);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  // Closing from the close button or Escape: focus goes back to the menu button.
  const closeAndReturnFocus = useCallback(() => {
    setIsOpen(false);
    menuButtonRef.current?.focus();
  }, []);

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
  // out of the tab order, move focus into the menu, and listen for Escape.
  useEffect(() => {
    if (!isOpen) return undefined;

    const root = document.documentElement;
    const background = document.querySelectorAll('[data-menu-background]');

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      // Escape closes the menu only; don't let it also skip a running tour.
      event.stopPropagation();
      closeAndReturnFocus();
    };

    root.classList.add('is-menu-open');
    background.forEach((element) => {
      element.inert = true;
    });
    document.addEventListener('keydown', handleKeyDown);
    // The menu button is now covered by the overlay, so focus moves to the close
    // button (on the next frame, once the overlay is no longer inert). Not when
    // the tour opened the menu: it is only showing, not handing over control.
    const frame = wasOpenedByTour
      ? 0
      : requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));

    return () => {
      cancelAnimationFrame(frame);
      root.classList.remove('is-menu-open');
      background.forEach((element) => {
        element.inert = false;
      });
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, wasOpenedByTour, closeAndReturnFocus]);

  // If the window grows to desktop width while the menu is open, close it, so the
  // scroll lock can never be left behind with no visible way to release it.
  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY);
    const handleChange = () => mediaQuery.matches && setIsOpen(false);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const { email } = contactLinks;
  // Break the address before the "@" rather than mid-word if it has to wrap.
  const [emailName, emailDomain] = email.split('@');

  return (
    <header className="hidden max-lg:block" data-open={isOpen}>
      <button
        ref={menuButtonRef}
        type="button"
        className="fixed top-[max(12px,env(safe-area-inset-top))] left-[max(12px,env(safe-area-inset-left))] z-40 grid size-11 place-items-center rounded-xl border border-border bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[border-color,background-color] duration-(--duration-fast) ease-out pointer-hover:border-border-strong pointer-hover:bg-surface-strong"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label="Open menu"
        onClick={() => setIsOpen(true)}
      >
        <Menu size={18} strokeWidth={1.75} />
      </button>

      {/* The sidebar, full screen (100dvh where supported, so it also fills the
          space behind collapsing browser bars; 100vh otherwise). */}
      <div
        id="mobile-menu"
        className="invisible fixed inset-0 z-45 h-screen w-screen overflow-y-auto overscroll-contain bg-surface opacity-0 [transition:opacity_0.25s_var(--ease-out),visibility_0s_linear_0.25s] in-data-[open=true]:visible in-data-[open=true]:opacity-100 in-data-[open=true]:delay-0 supports-[height:100dvh]:h-dvh"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!isOpen}
        data-tour-hold={isOpen && !wasOpenedByTour ? '' : undefined}
      >
        <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
          {/* Top: who this is, and the close button. Stays in view if the menu scrolls. */}
          <div className="sticky top-0 z-1 flex items-start justify-between gap-4 bg-surface pt-[max(16px,env(safe-area-inset-top))] pr-3 pb-3 pl-5">
            <div className={`${menuItemClass} min-w-0 pt-2`} style={{ '--item-index': 0 }}>
              <a href="#home" className="text-[1.0625rem] font-semibold tracking-[-0.015em]" onClick={closeMenu}>
                {profile.name}
              </a>
              <p className="mt-0.5 text-sm text-muted">{profile.role}</p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              className="icon-button size-11 flex-none border-transparent"
              aria-label="Close menu"
              onClick={closeAndReturnFocus}
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>

          {/* Middle: the same groups as the sidebar. */}
          <div className="flex flex-1 flex-col gap-7 px-3 pt-3 pb-5">
            <div className={menuItemClass} style={{ '--item-index': 1 }}>
              <NavLabel>Index</NavLabel>
              <SectionNav activeId={activeId} onNavigate={closeMenu} isLarge />
            </div>

            <div className={menuItemClass} style={{ '--item-index': 2 }}>
              <NavLabel>Elsewhere</NavLabel>
              <SocialLinks isLarge />
            </div>

            {/* Only on devices with a precise pointer (see TOUR_DEVICE_QUERY). */}
            {tour.isSupported && (
              <div className={`${menuItemClass} mt-auto px-2.5`} style={{ '--item-index': 3 }}>
                <TourButton tour={tour} onStart={closeMenu} />
              </div>
            )}
          </div>

          {/* Foot, pinned to the bottom like the sidebar's (scrolls with the rest
              on a phone held sideways, where there is no room to pin it). */}
          <div className="sticky bottom-0 grid gap-3.5 border-t border-border bg-surface px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] short-landscape:static">
            <div className={menuItemClass} style={{ '--item-index': 4 }}>
              <TotalLove />
            </div>

            <div className={`${menuItemClass} inline-flex items-stretch gap-2`} style={{ '--item-index': 5 }}>
              <ThemeSwitcher preference={themePreference} onChange={onThemeChange} isLarge />
              {/* Sounds play on mouse hover only, so this hides itself on touch screens. */}
              <SoundToggle sounds={sounds} />
            </div>

            <div className={`${menuItemClass} grid min-w-0 gap-1.5`} style={{ '--item-index': 6 }}>
              <p className="text-sm leading-normal text-muted">{contact.sidebarNote}</p>
              <a
                className="flex min-w-0 items-start gap-2 text-sm leading-[1.45] font-medium underline decoration-transparent underline-offset-3 transition-[text-decoration-color] duration-(--duration-fast) ease-out hover:decoration-fg"
                href={`mailto:${email}`}
              >
                <Mail {...iconProps} className="mt-0.5 flex-none" />
                <span className="min-w-0 wrap-anywhere">
                  {emailName}
                  <wbr />@{emailDomain}
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

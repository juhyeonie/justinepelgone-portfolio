import { Mail } from 'lucide-react';
import { contact, contactLinks, profile } from '../data/content';
import { iconProps } from './Icons';
import SectionNav, { NavLabel } from './SectionNav';
import SocialLinks from './SocialLinks';
import SoundToggle from './SoundToggle';
import ThemeSwitcher from './ThemeSwitcher';
import TotalLove from './TotalLove';
import TourButton from './TourButton';

// Desktop only. Replaced by <MobileNav> below 1024px.
//
// A panel floating inset from the window's edges, over the fixed halftone
// forest. Top: who this is. Middle (scrolls on short windows): the
// section index and the links elsewhere. Foot, pinned: Total Love, appearance
// and sound, and the contact note.
export default function Sidebar({ activeId, themePreference, onThemeChange, sounds, tour }) {
  const { email } = contactLinks;
  // Break the address before the "@" rather than mid-word if it has to wrap.
  const [emailName, emailDomain] = email.split('@');

  return (
    <header className="fixed top-(--sidebar-inset) bottom-(--sidebar-inset) left-(--sidebar-inset) z-20 flex w-(--sidebar-panel) flex-col rounded-[18px] border border-border bg-surface max-lg:hidden">
      <div className="flex min-h-0 flex-1 [scrollbar-width:thin] flex-col gap-7 overflow-y-auto px-3 pt-5 pb-4">
        <div className="px-2.5">
          <a href="#home" className="text-[0.9375rem] font-semibold tracking-[-0.015em]">
            {profile.name}
          </a>
          <p className="mt-0.5 text-xs text-muted">{profile.role}</p>
        </div>

        <div>
          <NavLabel>Index</NavLabel>
          <SectionNav activeId={activeId} />
        </div>

        <div>
          <NavLabel>Elsewhere</NavLabel>
          <SocialLinks />
        </div>

        {tour.isSupported && (
          <div className="mt-auto px-2.5">
            <TourButton tour={tour} />
          </div>
        )}
      </div>

      <div className="grid gap-3.5 border-t border-border px-5 pt-4 pb-5">
        <TotalLove />

        <div className="inline-flex items-stretch gap-2">
          <ThemeSwitcher preference={themePreference} onChange={onThemeChange} />
          <SoundToggle sounds={sounds} />
        </div>

        <div className="grid min-w-0 gap-1.5">
          <p className="text-xs leading-[1.5] text-muted">{contact.sidebarNote}</p>
          <a
            className="flex min-w-0 items-start gap-2 text-[0.71875rem] leading-[1.45] font-medium underline decoration-transparent underline-offset-3 transition-[text-decoration-color] duration-(--duration-fast) ease-out hover:decoration-fg"
            href={`mailto:${email}`}
          >
            <Mail {...iconProps} className="mt-px flex-none" />
            <span className="min-w-0 wrap-anywhere">
              {emailName}
              <wbr />@{emailDomain}
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}

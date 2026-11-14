import { Mail } from 'lucide-react';
import { contact, contactLinks, profile } from '../data/content';
import { iconProps } from './Icons';
import SectionNav from './SectionNav';
import SocialLinks from './SocialLinks';
import SoundToggle from './SoundToggle';
import ThemeSwitcher from './ThemeSwitcher';
import TourButton from './TourButton';

// Desktop only. Replaced by <MobileNav> below 1024px.
//
// Top: identity and section navigation. Bottom (anchored to the foot of the
// sidebar): the tour button, social links, then appearance and contact, each
// group separated by a thin divider.
// Footer groups, separated by thin dividers.
const groupClass =
  'grid justify-items-start gap-4 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0';

export default function Sidebar({ activeId, themePreference, onThemeChange, sounds, tour }) {
  const { email } = contactLinks;
  // Break the address before the "@" rather than mid-word if it has to wrap.
  const [emailName, emailDomain] = email.split('@');

  return (
    <header className="fixed inset-y-0 left-0 z-20 flex w-(--sidebar-width) [scrollbar-width:thin] flex-col gap-10 overflow-y-auto border-r border-border bg-bg px-6 pt-10 pb-6 *:shrink-0 max-lg:hidden">
      <div>
        <a href="#home" className="text-sm font-semibold tracking-[-0.01em]">
          {profile.name}
        </a>
        <p className="mt-0.5 text-xs text-muted">{profile.role}</p>
      </div>

      <SectionNav activeId={activeId} />

      <div className="mt-auto">
        <div className={groupClass}>
          <TourButton tour={tour} />
        </div>

        <div className={groupClass}>
          <SocialLinks />
        </div>

        <div className={groupClass}>
          <div className="inline-flex items-stretch gap-2">
            <ThemeSwitcher preference={themePreference} onChange={onThemeChange} />
            <SoundToggle sounds={sounds} />
          </div>

          <div className="grid min-w-0 gap-2">
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
      </div>
    </header>
  );
}

import { ArrowUpRight, Mail } from 'lucide-react';
import { contactLinks } from '../data/content';
import { FacebookIcon, GithubIcon, iconProps } from './Icons';
import { getNavRowClass } from './SectionNav';

// Facebook, GitHub, and email, each with its icon. Facebook and GitHub open in a
// new tab (marked with a small arrow); email opens the visitor's mail app.
const items = [
  { label: 'Facebook', href: contactLinks.facebook, isExternal: true, Icon: FacebookIcon },
  { label: 'GitHub', href: contactLinks.github, isExternal: true, Icon: GithubIcon },
  {
    label: 'Email',
    href: contactLinks.email && `mailto:${contactLinks.email}`,
    isExternal: false,
    Icon: () => <Mail {...iconProps} />,
  },
].filter((item) => item.href);

// The same rows as the section navigation. `isLarge`: the mobile menu's size.
export default function SocialLinks({ isLarge = false }) {
  return (
    <ul className="grid gap-0.5">
      {items.map(({ label, href, isExternal, Icon }) => (
        <li key={label}>
          <a
            className={`${getNavRowClass(isLarge)} text-muted data-tour-highlight:bg-surface-strong data-tour-highlight:text-fg pointer-hover:bg-surface-strong pointer-hover:text-fg`}
            href={href}
            data-sound="tick"
            // The guided tour's last step points at each of these in turn.
            data-tour-anchor={`social-${label.toLowerCase()}`}
            {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            <Icon />
            <span className="flex-1">{label}</span>
            {isExternal && (
              <>
                <ArrowUpRight {...iconProps} size={14} />
                <span className="sr-only"> (opens in a new tab)</span>
              </>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

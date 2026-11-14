import { Mail } from 'lucide-react';
import { contactLinks } from '../data/content';
import { FacebookIcon, GithubIcon, iconProps } from './Icons';

// Facebook, GitHub, and email, each with its icon. Facebook and GitHub open in a
// new tab; email opens the visitor's mail app.
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

// `isRow`: laid out in a wrapping row (the mobile menu) instead of a column.
export default function SocialLinks({ isRow = false }) {
  return (
    <ul className={isRow ? 'flex flex-wrap gap-x-5.5 gap-y-1' : 'grid gap-0.5'}>
      {items.map(({ label, href, isExternal, Icon }) => (
        <li key={label}>
          <a
            className={`inline-flex items-center gap-2.5 text-sm font-medium text-muted underline decoration-transparent decoration-1 underline-offset-4 transition-[color] duration-(--duration-fast) ease-out hover:text-fg data-tour-highlight:text-fg data-tour-highlight:decoration-current ${isRow ? 'py-2' : 'py-1.25'}`}
            href={href}
            data-sound="tick"
            // The guided tour's last step points at each of these in turn.
            data-tour-anchor={`social-${label.toLowerCase()}`}
            {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            <Icon />
            {label}
            {isExternal && <span className="sr-only"> (opens in a new tab)</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

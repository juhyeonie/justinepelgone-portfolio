import { ArrowUpRight } from 'lucide-react';

// The small arrow that follows a link opening in a new tab.
export default function ExternalArrow() {
  return <ArrowUpRight className="ml-0.75 inline-block align-[-0.12em] transition-transform duration-(--duration-fast) ease-out in-[a:hover]:translate-x-px in-[a:hover]:-translate-y-px" size={14} strokeWidth={1.75} aria-hidden="true" />;
}

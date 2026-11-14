import { profile } from '../data/content';

export default function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-(--content-width) flex-wrap justify-between gap-x-6 gap-y-1 px-(--gutter) pt-7 pb-10 text-xs text-muted before:mb-6 before:h-px before:basis-full before:bg-border">
      <p>
        © {new Date().getFullYear()} {profile.name}
      </p>
    </footer>
  );
}

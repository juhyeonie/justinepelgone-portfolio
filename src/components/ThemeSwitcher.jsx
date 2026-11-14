import { Monitor, Moon, Sun } from 'lucide-react';
import { iconProps } from './Icons';

const options = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

// Appearance control: a compact segmented control for System / Light / Dark.
// `isLarge`: bigger touch targets (the mobile menu).
export default function ThemeSwitcher({ preference, onChange, isLarge = false }) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg border border-border p-0.5" role="group" aria-label="Appearance">
      {options.map(({ value, label, Icon }) => {
        const isSelected = value === preference;

        return (
          <button
            key={value}
            type="button"
            className={`grid place-items-center rounded-[5px] text-muted transition-[background-color,color] duration-(--duration-fast) ease-out hover:text-fg aria-pressed:bg-fg aria-pressed:text-bg ${isLarge ? 'h-8 w-10' : 'h-6.5 w-8'}`}
            data-sound="blip"
            aria-pressed={isSelected}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={(event) => {
              // The theme change reveals outward from the centre of this button.
              const rect = event.currentTarget.getBoundingClientRect();
              onChange(value, {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              });
            }}
          >
            <Icon {...iconProps} />
          </button>
        );
      })}
    </div>
  );
}

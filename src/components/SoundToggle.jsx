import { Volume2, VolumeX } from 'lucide-react';
import { playSound, unlockAudio } from '../utils/hoverSound';
import { iconProps } from './Icons';

// Turns the interface's hover sounds on or off. Sits beside the appearance control.
// Sounds start off; the choice is remembered (see useInterfaceSounds).
export default function SoundToggle({ sounds }) {
  const { isEnabled, toggle } = sounds;
  const label = isEnabled ? 'Turn interface sounds off' : 'Turn interface sounds on';

  const handleClick = () => {
    // Turning sounds on: this click is the interaction browsers require before
    // audio may play, so set it up now and play one pop as confirmation.
    if (!isEnabled) unlockAudio().then(() => playSound('pop', { force: true }));
    toggle();
  };

  return (
    <button
      type="button"
      className="grid w-9 place-items-center rounded-lg border border-border text-muted transition-[background-color,border-color,color] duration-(--duration-fast) ease-out hover:border-border-strong hover:text-fg aria-pressed:text-fg touch:hidden"
      data-sound="blip"
      onClick={handleClick}
      aria-pressed={isEnabled}
      aria-label={label}
      title={label}
    >
      {isEnabled ? <Volume2 {...iconProps} /> : <VolumeX {...iconProps} />}
    </button>
  );
}

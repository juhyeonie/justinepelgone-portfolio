// The interface's sounds, synthesized with the Web Audio API: there are no audio
// files to download or license, and one shared audio context serves every sound.
//
// Five sounds, each for one kind of element, all short and quiet:
//   tick   sidebar navigation: a soft, minimal tick
//   pop    buttons and links: a rounded pop, a little more present than the tick
//   blip   icon-only controls: a tiny, high blip, the quietest of all
//   bubble project cards: a soft, rounded bubble pop
//   pixel  the portrait turning to pixel art: two small square-wave notes
//
// Only one sound plays at a time: while one is still sounding, another request is
// dropped, so sounds never overlap or stack up. A sound with a `cooldown` also
// waits that long before it can play again, so sweeping back and forth across the
// same elements doesn't repeat it in quick succession.
//
// Browsers only allow audio after the visitor has interacted with the page (a
// click, tap, or key press; moving the mouse or scrolling does not count).
// `unlockAudio` is called from those interactions; before then, while sounds are
// turned off, or if audio is unavailable, `playSound` silently does nothing.

const GAP_AFTER_SOUND_MS = 40; // a breath between sounds, so quick moves don't chatter

// Each sound: its length in seconds and how to build it on the audio graph.
const SOUNDS = {
  tick: {
    length: 0.06,
    play: (start) => tone({ start, type: 'sine', from: 1150, to: 780, length: 0.06, peak: 0.022 }),
  },
  pop: {
    length: 0.09,
    play: (start) => tone({ start, type: 'sine', from: 640, to: 380, length: 0.09, peak: 0.04 }),
  },
  blip: {
    length: 0.035,
    play: (start) =>
      tone({ start, type: 'sine', from: 2300, to: 2050, length: 0.035, peak: 0.014 }),
  },
  // A real bubble pops with a quick upward chirp, then rings out: a sine that
  // rises from 520 to 900 Hz in its first 45 ms, faded in gently (12 ms) and out
  // over the rest, and low-passed so it stays round and warm rather than bright.
  bubble: {
    length: 0.14,
    cooldown: 0.3,
    play: (start) =>
      tone({
        start,
        type: 'sine',
        from: 520,
        to: 900,
        length: 0.14,
        glide: 0.045,
        attack: 0.012,
        peak: 0.032,
        lowpass: 2200,
      }),
  },
  pixel: {
    length: 0.13,
    play: (start) => {
      tone({ start, type: 'square', from: 880, to: 880, length: 0.055, peak: 0.012, lowpass: 2600 });
      tone({
        start: start + 0.065,
        type: 'square',
        from: 1320,
        to: 1320,
        length: 0.065,
        peak: 0.012,
        lowpass: 2600,
      });
    },
  },
};

let context = null;
let isEnabled = false;
let busyUntil = 0;
const lastPlayedAt = {}; // by sound name, for cooldowns

// Whether the visitor has turned interface sounds on (see useInterfaceSounds).
export function setSoundsEnabled(enabled) {
  isEnabled = enabled;
}

// Create (or wake) the audio context. Must be called from a user gesture.
// Returns a promise that settles once audio is ready to play (or has turned out
// to be unavailable); it never rejects.
export function unlockAudio() {
  try {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return Promise.resolve();

    context ??= new AudioContextClass();
    // A new context can take a moment to start; resume() resolves when it has.
    return context.state === 'running' ? Promise.resolve() : context.resume().catch(() => {});
  } catch {
    context = null; // audio unavailable: stay silent
    return Promise.resolve();
  }
}

// Whether a sound would actually be heard right now (ignoring the on/off setting).
export function isAudioReady() {
  return context?.state === 'running';
}

// Play one of the sounds above. `force` plays it even while sounds are off; it is
// only used for the confirmation when the visitor turns them on.
export function playSound(name, { force = false } = {}) {
  const sound = SOUNDS[name];
  if (!sound || (!isEnabled && !force) || !isAudioReady()) return;

  const nowMs = performance.now();
  if (nowMs < busyUntil) return;
  if (sound.cooldown && nowMs - (lastPlayedAt[name] ?? -Infinity) < sound.cooldown * 1000) return;
  busyUntil = nowMs + sound.length * 1000 + GAP_AFTER_SOUND_MS;
  lastPlayedAt[name] = nowMs;

  try {
    sound.play(context.currentTime);
  } catch {
    /* a failed sound is not worth interrupting anything for */
  }
}

// A single oscillator with a click-free envelope: faded in over `attack` seconds
// (5 ms unless set), then out exponentially, with an optional low-pass softening
// and an optional pitch glide that lasts `glide` seconds (the whole sound unless set).
function tone({ start, type, from, to, length, peak, lowpass, attack = 0.005, glide = length }) {
  const oscillator = context.createOscillator();
  const volume = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(to, start + glide);

  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(peak, start + attack);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + length);

  let output = oscillator.connect(volume);
  if (lowpass) {
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    output = output.connect(filter);
  }
  output.connect(context.destination);

  oscillator.start(start);
  oscillator.stop(start + length + 0.01);
}

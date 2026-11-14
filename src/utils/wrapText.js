let measureContext;

// Splits `text` into the lines it occupies when wrapped at `maxWidth` pixels in the
// given CSS font, breaking only at spaces (a word longer than the limit gets a line
// to itself). Knowing the final line breaks up front lets the typewriter start each
// word on the line it will end up on, so a half-typed word never jumps to the next
// line as it grows.
export function wrapText(text, maxWidth, font) {
  measureContext ??= document.createElement('canvas').getContext('2d');
  measureContext.font = font;

  const lines = [];
  let line = '';

  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;

    if (line && measureContext.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  lines.push(line);
  return lines;
}

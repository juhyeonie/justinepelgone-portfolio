// Layered stacks of cards (the project showcase and the pubmat carousel): every
// card shares one spot, and its place comes from its distance to the active one.

// A card's signed distance from the active one: 0 is active, -1 the card to its
// left, +1 the card to its right. With three or more cards the order wraps
// around, so the last card sits to the left of the first. With fewer there is
// nothing to wrap, and cards keep their natural left-to-right order.
export function getStackOffset(index, activeIndex, count) {
  const distance = index - activeIndex;
  if (count < 3) return distance;

  const half = Math.floor(count / 2);
  return ((distance + half + count) % count) - half;
}

// Where a card at that distance sits: in front, beside it, or out of sight.
export function getStackPosition(offset) {
  if (offset === 0) return 'active';
  return Math.abs(offset) === 1 ? 'side' : 'hidden';
}

/**
 * Reference-counted `document.body` cursor ownership for hover affordances.
 *
 * Several `InteractiveObject`s sit close together (keyboard, mug, and
 * notebook are all on the same desk), so a fast mouse move can fire the new
 * object's `pointerover` before the old object's `pointerout`, or vice
 * versa — plain `document.body.style.cursor = 'pointer' | 'auto'` from each
 * component independently would let whichever event fires *last* win,
 * occasionally leaving the cursor wrong for a frame. A count only resets the
 * cursor to `auto` when nothing at all is claiming it, so either firing
 * order ends in the correct state.
 */
let hoverCount = 0;

export function claimPointerCursor(): void {
  hoverCount += 1;
  document.body.style.cursor = 'pointer';
}

export function releasePointerCursor(): void {
  hoverCount = Math.max(0, hoverCount - 1);
  if (hoverCount === 0) document.body.style.cursor = 'auto';
}

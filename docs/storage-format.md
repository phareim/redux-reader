# Storage Format

## R2 Object Keys
- Raw: `users/{userId}/items/{savedId}/raw.html`
- Annotated: `users/{userId}/items/{savedId}/annotated.html`
- Optional: `users/{userId}/items/{savedId}/assets/{hash}` for images.

## Annotated HTML
- Store sanitized HTML with inline annotation markup only (v1).
- Highlight example:
  - `<mark data-anno-id="a1" data-anno-type="highlight">selected text</mark>`
- Comment example:
  - `<span data-anno-id="c1" data-anno-type="comment" data-anno-anchor="inline"></span>`
  - Optional inline comment rendering: `<aside data-anno-id="c1">Comment text</aside>`

## Annotation Anchor Object (D1)
- `anchor` JSON structure:
  - `selector`: CSS selector or XPath
  - `textQuote`: exact and prefix/suffix text
  - `range`: startOffset, endOffset
  - `hash`: stable hash of normalized text

## Versioning
- Each saved article has `version` in D1.
- Update uses optimistic locking on version.
- If conflict, client rehydrates and replays local changes.

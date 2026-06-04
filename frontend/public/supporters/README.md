# Supporter profile photos

Drop each supporter's profile image here, named after the entry in
`src/views/marketing/supporters-section.tsx` (`SUPPORTERS` / `ENTERPRISE`).

- File name: `<name>.png` (or `.jpg` / `.webp`) — e.g. `balarank.png`
- Recommended: square image, at least 128×128px (rendered in a circle)
- Then set `avatar: '/supporters/<name>.png'` on that supporter entry.

If no image is provided, the UI falls back to the first letter of the name.

## Pending

- `balarank.png` — Early Bird supporter. Currently shows the "B" initial
  fallback until a photo is added here.
- `top.png` — Early Bird supporter. Currently shows the "T" initial
  fallback until a photo is added here.

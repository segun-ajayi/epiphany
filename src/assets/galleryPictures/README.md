# Gallery Pictures

Drop any image file (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`, `.svg`)
into this folder. It will be auto-imported and rendered on the `/gallery` page
on the next build — no code changes required.

## Filename conventions

- **Order**: Prefix with a number to control display order, e.g. `01-easter.jpg`.
- **Caption / alt text**: The filename (minus the numeric prefix and extension)
  becomes the image's alt text. Use hyphens for spaces: `easter-sunrise.jpg`
  → "easter sunrise".
- **Category** (optional): Add `__Category` before the extension to group
  photos under a filter button, e.g. `05-baptism__Worship.jpg` →
  category "Worship". Photos without a category fall under "All".

## Examples

```
01-easter-sunrise__Worship.jpg
02-vbs-kids__Youth.jpg
03-food-pantry__Outreach.jpg
04-choir-rehearsal__Worship.png
```

# Design: Toolbox type

The page is a quiet tool, not a poster. One size is allowed to be large. Everything else steps down so the eye lands on the page title, then the drop zone, then the converted text.

Root size stays `16px`. Sizes below are `rem` so they stay tied to that.

## Scale

| Role | Size | Use |
| --- | --- | --- |
| Wordmark | `1.125rem` | “Toolbox”. Quieter than the page title. |
| Display | `1.75rem` | Page title only. The tool name. |
| Title | `1.375rem` | Drop-zone title. Smaller than the page title. |
| Reading | `1rem` | Converted preview body. Line height `1.65`. |
| Reading heading | `1.5rem` / `1.25rem` / `1.125rem` | Preview `h1` / `h2` / `h3`. |
| Body | `0.9375rem` | Description, file name, hint, buttons. Line height `1.55`. |
| Chrome | `0.8125rem` | Step number, Preview / Raw, copy note, raw Markdown. |

## Rules

- Do not give the drop-zone title the same size as the page title.
- A hint is quieter than the line above it. “Drag and drop or click to select” stays at body size.
- The converted preview is the reading column. It is `1rem`, not the small chrome size.
- Raw Markdown is monospace at chrome size so it is clearly source, and still large enough to read.
- Serif is only for the brand, the page title, the drop-zone title, card titles, and preview headings. Labels and buttons stay sans.

## Shell

The wordmark stays in the header and links back to the tool list. The page title is still the only display size. Navigation and the theme control use the chrome size. Tool cards use the drop-title size, smaller than the page title.

Light and dark use the same sizes. Dark swaps the paper colors for a warm dark palette: page, card, line, ink, and muted. It does not introduce a second scale.

## What this replaced

The drop title and the page title were both `28px`. The hint was `18px`, larger than the description at `14px`. Preview body was `15px` while headings jumped to `26px` and `22px` with no step between them.

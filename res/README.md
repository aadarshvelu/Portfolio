# Resume source

| File | What it is |
|---|---|
| `Aadarsh Resume.pdf` | The original PDF (read-only reference) |
| `resume.html` | Editable source — reproduces the original exactly |
| `fonts/` | Inter 4.001 (the exact font the original uses) |
| `build.mjs` | Renders `resume.html` to PDF with headless Chrome |
| `output/Aadarsh Resume.pdf` | Generated PDF |

## Edit and rebuild

1. Edit the text in `resume.html`. Open it in Chrome to preview while you edit.
2. Run:

   ```bash
   node build.mjs
   ```

   This writes `output/Aadarsh Resume.pdf`. You need Node 22+ and Google Chrome or Edge, and nothing else.

## Markup cheatsheet

- **Bullet with a bold lead-in:** `<li><b>Title:</b> text…</li>` inside `<ul class="dots">`
- **New job:** copy a whole `<div class="job">…</div>` block
- **Link:** `<a class="link" href="https://…">Text</a>`
- **Grey separator:** `<span class="sep">|</span>`
- **New project:** copy an `<li>` in `<ul class="projects">`, which has a `<p class="what">` line and a `<div class="tech">` line

Use `&amp;` for `&`.

# Delta Bridge marketing website

Static site: four pages (Home, Platform, Team, Contact), no build step.

- `index.html`, `platform.html`, `team.html`, `contact.html`: the pages
- `styles.css`, `site.js`: all styling and the small interactions (calculator, booking picker, menu)
- `assets/`: photography and app screens
- `vercel.json`: clean URLs (`/team` instead of `/team.html`)

## Before this goes on the real domain

- Replace every highlighted `[PLACEHOLDER]` (search the HTML for `class="tbc"`).
- Replace the stand-in photography and team portraits in `assets/` with real ones.
- Connect the forms (quote, booking, waitlist). They currently send nothing.
- Remove the staging banner (`<div class="staging">`) and the `noindex` robots tag from each page.

## Deploy

Import this repository in Vercel as a new project. Framework preset: Other. No build command, output directory is the repo root.

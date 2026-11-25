# Delta Bridge website

Static site (no build step) plus a small registration backend, deployed on Vercel.

## Pages
- `/` `/platform` `/team` `/contact` — marketing site
- `/register` — business registration, six steps, saved as people type
- `/admin` — team view of registrations (needs the admin key)

## One-time setup in Vercel (needed before registrations are stored)
1. Project → **Storage** → **Create** → **Blob**. Choose **Private** access. Connect it to this project (all environments).
   This adds `BLOB_READ_WRITE_TOKEN` for you.
2. Project → **Settings** → **Environment Variables** → add `ADMIN_KEY` with a long random value (12+ characters).
   This is the password for `/admin`. Keep it out of chat and email.
3. **Redeploy** so the functions pick both up.

Until step 1 is done the form still works in the browser but shows "Saved on this device", and sending an application
shows an error rather than pretending it went through.

## How it works
- `api/save.js` creates and updates a registration as the applicant types (once a valid email is entered).
- `api/load.js` returns a draft for the "carry on later" link (`/register?r=<id>`).
- `api/upload.js` stores documents (PDF, JPG, PNG, up to 4 MB each).
- `api/admin.js` lists registrations and serves documents to the team.
- Everything is kept in the private Blob store: `registrations/<id>.json` and `docs/<id>/…`.

## Before pointing a real domain at this
- Remove `<meta name="robots" content="noindex, nofollow">` from the pages when you want search engines in.
- Replace the stand-in team portraits and photos.
- Connect the quote, booking and waitlist forms on the marketing pages (they do not send yet).
- Replace the sample EUR and GBP rates in `site.js` with a live feed.
- Add a privacy notice page and link it from `/register`.
- Have the compliance and footer wording checked.

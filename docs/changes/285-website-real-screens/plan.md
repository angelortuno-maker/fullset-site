# Plan 285: the website shows the real app, store-style download buttons, no "beta" wording

From: the Architect's brief (#597 Oct 18 10:05 CT; `brief.md` here mirrors it), numbered by the Lead (10:04) · Status: draft (G3 wanted: the Architect or the Lead) · Branch: `change/285-website-real-screens` in fullset-site (Engineer 3), cut at main 967b04b
Architecture-impacting: no. Static pages, one new script, images. The app repo and the 2.0.0 build aren't touched.

## Files in scope
- `index.html`: (A) the hero's two frames and the coach section's frame become the real renders; (B) the hero and the bottom section get "Download for iPhone" (Apple logo) and "Download for Android" (Android logo); the header button says "Get the app"; (C) no beta, TestFlight or APK wording. The bottom title is "GET FULLSET", with the sub-line "Free to start · Pro trial included · Spanish and English", and the email block is "Tell me what's new".
- `store-links.js` (new): the one config, `APPLE_URL` (the current TestFlight link until the public link) and `ANDROID_URL` (the Play internal opt-in). It sets every `a[data-store]` button's `href`. With no JavaScript, the buttons go to `#get`.
- `styles.css`: the store button (logo plus two lines, `--ink` fill, the existing pill radius) and the third frame's slot.
- `coaches/index.html`, `support/index.html`, `privacy/index.html`, `terms/index.html`: the header button says "Get the app", and (C)'s wording goes from each page's own copy.
- `img/today.png`, `img/eat.png`, `img/progress.png` (new, EN), and `img/es/today.png`, `img/es/eat.png`, `img/es/progress.png` (new, ES): 390×844 @2x renders, 250 KB at most each. The placeholders `img/hero-today.png`, `img/hero-eat.png` and `img/coach.png` are deleted, with Angel's OK (CLAUDE.md: ask before deleting).
- `img/apple.svg`, `img/android.svg` (new): plain logos for the buttons. The official App Store and Google Play badges wait for the store release (the brand rules).
- `tools/screens/seed.spec.ts`, `tools/screens/playwright.config.ts`, `tools/screens/render.sh` (new): the demo seed and the render. They run the app's QA web export (`npm run qa:web`) from 3daf90e on the emulators, through the app's L2 harness, so the frames can be made again from any later build.
- `README.md`: the frames, the store links' config, and how to render.

Always allowed, not listed: `docs/changes/285-website-real-screens/**`.

## Not in this PR
- The `/es/` pages. The site has no Spanish page yet. MSG-5645 asks the Architect, and the default is that the ES frames and the ES copy table wait in this PR for the `/es/` pages.
- `firebase.json` and `waitlist.js`: unchanged (they're the app repo's tested fixtures). The email block keeps the waitlist form, with new wording only.

## Order of work
1. G3 on this plan.
2. The demo seed and the render, EN and ES (scratch first, then `tools/screens/`).
3. The images, compressed to 250 KB or less each.
4. `store-links.js`, the buttons, and the copy on every page.
5. Checks: no "beta", "TestFlight" or "APK" anywhere in the served pages (`grep -ri`); no request to another site; no sideways scroll at 320, 390, 768 and 1280.
6. The web walk at 390 and 1280, with screenshots on the PR. READY on #597. Angel deploys the PR to a preview channel (`hosting:channel:deploy`), says "site ok", then merges and deploys.

## Risks
- The links: `APPLE_URL` and `ANDROID_URL` aren't in any repo doc. Angel gives the two URLs, or they ship as `#get` until he does.
- The frames show a demo account ("Alex") with made-up workouts and meals, rendered from the web export. The tab bar and the fonts are the web's, which is close to the phone, but not the same.

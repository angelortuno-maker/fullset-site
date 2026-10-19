# Plan 285: the website shows the real app, store-style download buttons, no "beta" wording

From: the Architect's brief (#597 Oct 18 10:05 CT; `brief.md` here mirrors it), numbered by the Lead (10:04) · Status: approved (G3, the Architect, angel-log #597 Oct 18 20:45 CT, on this plan at 1e85a28: https://github.com/angelortuno-maker/angel-log/issues/597#issuecomment-6257818999; recorded per the Lead's 14:1x Oct 19) · Branch: `change/285-website-real-screens` in fullset-site (Engineer 3), cut at main 967b04b, with fullset-site#5's branch `site-fixes-1` merged in (the Lead, 11:01). #5 merged into `main` on Oct 18 (8b8a12f), and `main` is merged in; the PR's base is `main`
Architecture-impacting: no. Static pages, one new script, images. The app repo and the 2.0.0 build aren't touched.

## Files in scope
- `index.html`: (A) the hero's two frames and the coach section's frame become the real renders; (B) the hero and the bottom section get "Download for iPhone" (Apple logo) and "Download for Android" (Android logo); the header button says "Get the app"; (C) no beta, TestFlight or APK wording. The bottom title is "GET FULLSET", with the sub-line "Free to start · Pro trial included · Spanish and English", and the email block is "Tell me what's new".
- `store-links.js` (new): the one config, `APPLE_URL` (the current TestFlight link until the public link) and `ANDROID_URL` (the Play internal opt-in). It sets every `a[data-store]` button's `href`. With no JavaScript, the buttons go to `#get`.
- `styles.css`: the store button (logo plus two lines, `--ink` fill, the existing pill radius) and the third frame's slot.
- `coaches/index.html`, `support/index.html`, `privacy/index.html`, `terms/index.html`: the header button says "Get the app", and (C)'s wording goes from each page's own copy.
- `es/index.html`, `es/coaches/index.html`, `es/support/index.html`, `es/privacy/index.html`, `es/terms/index.html` (from #5): the ES mirror of every change above. The Spanish home page uses the ES frames, "Descargar para iPhone" and "Descargar para Android", and "Consigue la app" in the header. The new Spanish strings are listed in the PR for the Architect to correct.
- `img/today.png`, `img/eat.png`, `img/progress.png` (new, EN), and `img/es/today.png`, `img/es/eat.png`, `img/es/progress.png` (new, ES): 390×844 @2x renders, 250 KB at most each. The placeholders `img/hero-today.png`, `img/hero-eat.png` and `img/coach.png` are deleted: the Architect's 20:45 note (a), the real pictures replace them, and Angel's hour to say "no" on #597 passed with none.
- `img/coach.png`, `img/es/coach.png` (new, R3): the coach's client page, 390×844 @2x, 250 KB at most each.
- `img/apple.svg`, `img/android.svg` (new): plain logos for the buttons. The official App Store and Google Play badges wait for the store release (the brand rules).
- `tools/screens/seed.spec.ts`, `tools/screens/playwright.config.ts`, `tools/screens/render.sh` (new): the demo seed and the render. They run a production web export of the app from 3daf90e (`expo export --platform web` with only `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` set: the `--dev` QA export shows dev-only UI such as AI Scan) on the emulators, through the app's L2 harness, so the frames can be made again from any later build.
- `README.md`: the frames, the store links' config, and how to render.

Always allowed, not listed: `docs/changes/285-website-real-screens/**`.

## Not in this PR
- `action/` and `auth/action/`: untouched (#7's forwarder owns that path; #4 is the old action page).
- `firebase.json` and `waitlist.js`: unchanged (they're the app repo's tested fixtures). The email block keeps the waitlist form, with new wording only. Its promise stays the privacy page's (#5): one email when Fullset opens to everyone (MSG-5646 item 4).

## Order of work
1. G3 on this plan.
2. The demo seed and the render, EN and ES (scratch first, then `tools/screens/`).
3. The images, compressed to 250 KB or less each.
4. `store-links.js`, the buttons, and the copy on every page.
5. Checks: no "beta", "TestFlight" or "APK" anywhere in the served pages (`grep -ri`); no request to another site; no sideways scroll at 320, 390, 768 and 1280.
6. The web walk at 390 and 1280, with screenshots on the PR. READY on #597. Angel deploys the PR to a preview channel (`hosting:channel:deploy`), says "site ok", then merges and deploys.

## Changes during build
- The frames were rendered again on Oct 19 (same seed, same 3daf90e export): the web build clips the tab labels (no bottom inset), so the seed now adds an iPhone's 34 px inset under the tab bar before each frame. The app is unchanged.
- The hero shows Today and Eat; the coach section's frame is Progress (the brief's three screens).
- Support (EN and ES): the TestFlight feedback card becomes the app's own Me → Settings → Send feedback; the TestFlight-email and Android "install blocked" questions become one "Where do I get the app?" pointing at `#get`.
- Coaches (EN and ES): "Does my client need a paid account?" answers with the Architect's text from the walk (R1, #597 Oct 19 16:55 CT, https://github.com/angelortuno-maker/angel-log/issues/597#issuecomment-6277944845): "Your client installs Fullset and joins with your code. Coaching is part of Fullset Pro, with a free trial; a coach with 5 or more paying clients gets Pro free." The public promise matches the stores.
- `styles.css`: `.doc a` wraps, because the privacy pages' delete-account link (from #5) scrolled a 320 px screen sideways by 3 px (EN) and 28 px (ES). The privacy text is unchanged.
- The anchor `#join` becomes `#get` on every page.
- `walk/`: the web walk's screenshots (390 for every page, 1280 for both home pages).
- R2 (the Architect, #597 Oct 19 17:20 CT, from Angel's preview: https://github.com/angelortuno-maker/angel-log/issues/597#issuecomment-6278581730): every page's header gets a language switch left of "Get the app" / "Consigue la app". It says "Español" on EN pages and "English" on ES pages, and goes to the same page in the other language (the footer's link). It has `hreflang`, `lang` and an aria-label ("Cambiar a español" / "Switch to English"), and no flag. Under 400 px it shrinks to "ES" / "EN". `styles.css`: the switch (`.pill--secondary` at the nav size) and the `.nav__end` group under 1024 px.
- R3 (the Architect, #597 Oct 19 17:28 and 17:40 CT: https://github.com/angelortuno-maker/angel-log/issues/597#issuecomment-6278711204, https://github.com/angelortuno-maker/angel-log/issues/597#issuecomment-6278895921): the coach's client page ("Client · Alex": goals, this week with Tuesday to Saturday assigned, Assign a day) becomes the home page's Coach frame. New files `img/coach.png` and `img/es/coach.png` (390×844 @2x, dark, the same 3daf90e export, 250 KB at most). The hero shows three frames at 1024 px and up (Today, Eat, Coach) and two on phones (Today, Eat). The "For coaches" section's frame is the Coach screen. `img/progress.png` and `img/es/progress.png` stay in the repo but leave the home page: "Five tabs" has no frame slot. `tools/screens/seed.spec.ts` gains a second test, the coach's side (a coach linked to Alex sets the goals and assigns the week, then the client page in EN and ES).

## Risks
- The links (the Architect's 20:45 note (b)): `ANDROID_URL` = https://play.google.com/apps/internaltest/4701681073761031718 (launch/12). `APPLE_URL`: Angel hasn't posted a TestFlight link on #597, so it ships as `#get` until he does (one line in `store-links.js`).
- The frames show a demo account ("Alex") with made-up workouts and meals, rendered from the web export. The tab bar and the fonts are the web's, which is close to the phone, but not the same.

# Plan 311: the Android button goes back to #get until Play production

From: the Architect's correction (angel-log #597, 22:23 CT Oct 19): a closed-test or internal-test join link must not be on the site, since it only works for listed testers. Numbered and assigned by the Lead (22:23 CT, https://github.com/angelortuno-maker/angel-log/issues/597#issuecomment-6282594470) · Status: approved (G1 to G3: the Architect, 22:35 CT, as its own change; recorded by the Lead, https://github.com/angelortuno-maker/angel-log/issues/597#issuecomment-6282842355) · Branch: `change/311-android-link-off` in fullset-site (Engineer 3), cut at main 518ab6c · PR into `main`
Architecture-impacting: no. One config value.

## Files in scope
- `store-links.js`: `android: ''` instead of the Play internal-test opt-in, and its comment says why. `apple` stays `''` until release day (C7). With no link, every `a[data-store="android"]` keeps its `href="#get"`, by design (285).
- `README.md`: the "Store buttons" bullet says both links are empty until each store's public release.

Always allowed, not listed: `docs/changes/311-android-link-off/**`.

## Checks
1. No served file has `play.google.com`, `internaltest` or `testflight`: `grep -rn` with docs/ and tools/ left out, and the output pasted on the PR.
2. The Hosting emulator, with 285's walk script: on all ten pages at 390 px, every Android button's `href` ends in `#get`. The walk's 40 checks (10 pages × 4 widths) pass as before.

## Changes during build
None yet.

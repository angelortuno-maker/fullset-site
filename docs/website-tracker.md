# Fullset website — release tracker (thefullsetapp.com)

Owner: Angel. Kept by: **the Architect** (Project copy, updated at every check-in) and **Engineer 3** (repo copy in fullset-site, `docs/website-tracker.md`, updated with every merge).
Created: 2026-11-07 15:2x CT (Angel: "we should also have a document for the website updates like we do for the app, so we don't forget any add-ons or bug fixes").
Same rules as the app's `docs/ops/release-tracker.md`: every ask gets a row the same day; delivery = the site release it ships in; misses move forward with a reason. Site deploys are Angel's (preview channel → "site ok" → production).

## Sources of truth
- Design: `docs/design/website-spec.md` ("Changes since Oct 14" wins over the original text).
- Spanish copy: `docs/launch/site-es-copy.md`.
- Decisions: `decision-angel-to-all-site-hero-coach-phone-327-unpark-2026-11-03.md`, `brief-architect-to-lead-website-real-screens-store-buttons.md`, MSG-5711 (store links), MSG-5824 (real screens reshoot).

## Site release S1 — "finished site" (target: before Android goes public)
| # | Item | Asked | By | Status | Notes |
|---|---|---|---|---|---|
| W1 | Hero = three phones: Today, Eat, **Coach** (real renders) | Nov 3 | Angel | Open (fullset-site#16 was two phones) | MSG-5824 item 3 withdrawn |
| W2 | Real app screens in every phone frame (390×844 @2x, light, demo seed, EN + ES, ≤ 250 KB each); reshoot on every app version that changes a shown screen | Oct 18, again Nov 2 | Angel | Partly done (#16) | Guard rejects loading/empty frames |
| W3 | Store buttons: **official App Store badge** now (2.0.0 is public on the App Store); Android = **"Join the Android test"** → Play opt-in link until Play production, then the Google Play badge | Oct 18; updated Nov 7 | Angel | Open | Both URLs only in `store-links.js` (MSG-5711) |
| W4 | **Remove the "Tell me when it's public" waitlist form** (the app is public on iPhone) | Nov 7 | Angel | Decided | joinWaitlist/purgeInvites stay deployed until a cleanup change |
| W5 | No "beta" / "TestFlight" / "APK" anywhere; nav pill "Get the app"; bottom section GET FULLSET | Oct 18 | Angel | Check on the live site | `grep -ri "beta\|testflight\|apk"` returns nothing but the README |
| W6 | Four EN copy fixes (delete account wording; "Coach" label; coaching-is-Pro line; Android button wording) | Oct 15 | Architect | Check | site-es-copy.md "First: four fixes" |
| W7 | Spanish pages /es, /es/coaches, /es/terms per site-es-copy.md; language switch; hreflang | Oct 15 | Angel | Check | screen names follow the app's es.json |
| W8 | Feature lines for 2.1.0: **Snap meal** (AI photo, Pro) and **"menus from popular restaurants"** (generic wording on the site; no chain names in store metadata) | Nov 7 | Angel | Asked | ships with F25 |
| W9 | "Coach login" / "Acceso coaches" in the header + "Open the coach dashboard" on /coaches | Nov 3 | Angel | **Blocked until 327 is live** (no dead links) | |
| W10 | Lighthouse mobile ≥ 95 (perf, a11y, best practices, SEO); scores in the PR | Oct 14 | Architect | Check each PR | |
| W11 | Engineer 3 reports the **last approved design** vs what's live (asked Nov 7 15:1x) | Nov 7 | Angel | Waiting on Engineer 3 | then one plan for Angel's approval |

## Later
| # | Item | Asked | Notes |
|---|---|---|---|
| WL1 | Google Play badge replaces "Join the Android test" the day Play production opens | — | MSG-5711 |
| WL2 | Store-link swap and preview-channel steps written as a one-page runbook for Angel | Nov 7 | Architect |
| WL3 | Pricing page (when Pro pricing is final) | — | spec says "no pricing page" for now |

## Deploy log
- 2026-11-02: preview channel `site-2` deployed by Angel on `shots/5824-real-screens` (expires Nov 10 00:43Z). Angel's review Nov 3: "still not the latest version I asked for" (no coach login, no coach phone) → W1, W9.


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
| W1 | Hero = three phones: Today, Eat, **Coach** (real renders) | Nov 3 | Angel | **Three phones on main** (#16, 072433f). **This PR re-shoots the Coach phone: option A, the phone app's Coach → client page, 390×844 @2x, EN + ES, W2 guard** (MSG-6002 A; re-shot Nov 12 from app master bc97b543, MSG-6011 E, MSG-6026) | MSG-5824 item 3 withdrawn; the Coach phone also on /coaches |
| W2 | Real app screens in every phone frame (390×844 @2x, light, demo seed, EN + ES, ≤ 250 KB each); reshoot on every app version that changes a shown screen | Oct 18, again Nov 2 | Angel | **Done on `main`** (#16: Today, Eat, Progress from 2.0.3 build 32; 390 px srcset) | Guard rejects loading/empty frames |
| W3 | Store buttons: **official App Store badge** now (2.0.0 is public on the App Store); Android = **"Join the Android test"** → Play opt-in link until Play production, then the Google Play badge | Oct 18; updated Nov 7 | Angel | **Done as built** (#16): both buttons in the page, each hidden while its link is empty. `android` is set. **`apple` stays '' until each app is public to everyone; the Architect fills it then, and nobody asks Angel (MSG-5992)** | Both URLs only in `store-links.js` (MSG-5711) |
| W4 | **Remove the "Tell me when it's public" waitlist form** (the app is public on iPhone) | Nov 7 | Angel | **Done on `main`**: no page has a waitlist form | joinWaitlist/purgeInvites stay deployed until a cleanup change. `waitlist.js` and `coach-waitlist.js` stay in the repo, unused, until then; the privacy page keeps "The waitlist" while entries may exist |
| W5 | No "beta" / "TestFlight" / "APK" anywhere; nav pill "Get the app"; bottom section GET FULLSET | Oct 18 | Angel | **Done on `main`**: the grep over the pages finds nothing (web walk, angel-log #1445 6760133571) | `grep -ri "beta\|testflight\|apk"` returns nothing but the README |
| W6 | Four EN copy fixes (delete account wording; "Coach" label; coaching-is-Pro line; Android button wording) | Oct 15 | Architect | Check | site-es-copy.md "First: four fixes" |
| W7 | Spanish pages /es, /es/coaches, /es/terms per site-es-copy.md; language switch; hreflang | Oct 15 | Angel | Check | screen names follow the app's es.json |
| W8 | Feature lines for 2.1.0: **Snap meal** (AI photo, Pro) and **"menus from popular restaurants"** (generic wording on the site; no chain names in store metadata) | Nov 7 | Angel | Asked | ships with F25 |
| W9 | "Coach login" / "Acceso coaches" in the header + "Open the coach dashboard" on /coaches | Nov 3 | Angel | **On in this PR:** COACH_WEB_URL = 'https://fullset-coach.web.app'. The coach web is live in production and signs in (MSG-6008, MSG-6009; AC-430-3.1 done) | app.thefullsetapp.com replaces it when its DNS is set |
| W10 | Lighthouse mobile ≥ 95 (perf, a11y, best practices, SEO); scores in the PR | Oct 14 | Architect | Check each PR | |
| W11 | Engineer 3 reports the **last approved design** vs what's live (asked Nov 7 15:1x) | Nov 7 | Angel | **Answered by MSG-5951's S1 DECISION:** the base is the live site's three-phone layout, not the Nov 2 preview. `main` follows it; the live site is still the version from before #16 until the one deploy (MSG-5977) | the gap is the deploy, held on purpose |

## Later
| # | Item | Asked | Notes |
|---|---|---|---|
| WL1 | Google Play badge replaces "Join the Android test" the day Play production opens | — | MSG-5711 |
| WL2 | Store-link swap and preview-channel steps written as a one-page runbook for Angel | Nov 7 | Architect |
| WL3 | Pricing page (when Pro pricing is final) | — | spec says "no pricing page" for now |
| WL5 | Laptop-frame coach-web shot for the "For coaches" bands (a design change to those bands) | Nov 10 | MSG-6002 C: not in S1; its own row and Angel's look after the one deploy |

## Deploy log
- 2026-11-02: preview channel `site-2` deployed by Angel on `shots/5824-real-screens` (expires Nov 10 00:43Z). Angel's review Nov 3: "still not the latest version I asked for" (no coach login, no coach phone) → W1, W9.
- 2026-11-08: #16 (the MSG-5951 S1 commits: the Coach phone, the 2.0.3 re-shots, the badge and "Join the Android test", the waitlist form removed) merged into `main` (65733b2). **Undeployed on purpose.**
- 2026-11-09: Engineer 3's web walk of `main` at 375/430, EN/ES: no issues (angel-log #1445 6760133571; shots in angel-log `docs/comms/img/site-s1/`).
- 2026-11-10: the coach web is live at https://fullset-coach.web.app (430; MSG-6008, MSG-6009). The Coach phone was re-shot on Nov 12 from app master bc97b543 (option A, MSG-6002, MSG-6026) and this PR sets COACH_WEB_URL. Still undeployed: one combined preview → "site ok" → Angel deploys.
- **Deploy rule (MSG-5977):** one production deploy after all of these:
  - the coach web is styled (426, 429: done);
  - the coach web is on its production address with `COACH_WEB_URL` set (430, W9): done (this PR);
  - the Coach phone is re-shot (W1): done (this PR);
  - the badge stays hidden until Apple's link is filled when the app is public (MSG-5992).
  Then this one site PR, one combined preview → "site ok" → Angel deploys.


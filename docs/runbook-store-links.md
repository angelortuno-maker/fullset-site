# Runbook: preview a site change, and swap a store link (Angel)

WL2 (the Architect, Nov 7). One page for the two things that come back on every site release. **Who runs it:** Angel only; an Engineer never deploys. **Project:** `angel-log-48bac` (Fullset's own; never Moonmery's). The production deploy itself is the app repo's `docs/ops/website-deploy.md` ("The one command"); this page doesn't repeat it.

## 1. Preview a site PR (every change, before production)
On the Mac, in the deploy checkout, with the PR's branch and the head SHA its site-N block names. The Engineers post the block with the real values on #1522; the shape is always this:

```sh
git -C ~/Fullset/fullset-site-deploy fetch origin
git -C ~/Fullset/fullset-site-deploy checkout <branch>
git -C ~/Fullset/fullset-site-deploy pull --ff-only origin <branch>
git -C ~/Fullset/fullset-site-deploy rev-parse --short=8 HEAD      # must print <sha>
git -C ~/Fullset/fullset-site-deploy status --short                # must print nothing (clean tree)
cd ~/Fullset/fullset-site-deploy && npx -y firebase-tools hosting:channel:deploy site-<N> --expires 7d --project angel-log-48bac
```

**Stop if** HEAD isn't `<sha>`, the tree isn't clean (Hosting uploads every file the `ignore` list doesn't hide), or the command offers a live deploy instead of a channel.

**Then** open the printed `…--site-<N>-<hash>.web.app` URL on a phone and on a laptop, EN and ES, and check what the block lists. On every preview:
- the store badges show and open their stores;
- no page scrolls sideways at 320 px;
- "Coach login" opens the coach web.

**Then** say "site ok" on #1522, merge the PR, and run the production deploy from a clean `main` (`docs/ops/website-deploy.md`). Old channels expire on their own after 7 days. To remove one sooner: `npx -y firebase-tools hosting:channel:delete site-<N> --project angel-log-48bac`.

## 2. Swap a store link
Every store button and the coach links take their address from **one file, `store-links.js`**, in its `LINKS` and `COACH_WEB_URL`. A swap is a one-line PR to that file, then section 1. Never hand-edit the deploy checkout: section 1's clean-tree check would stop you, and the change would be lost on the next pull.

| When | The line | To | Also needed |
|---|---|---|---|
| The App Store listing changes (done: WL13, Nov 14) | `apple:` | the listing's `https://apps.apple.com/app/…` URL | nothing; the badge shows on every page |
| **Play production opens** (WL1) | `android:` | `https://play.google.com/store/apps/details?id=com.fullset.app` | **WL1's own PR:** the button still says "Join the Android test", so the Google Play badge replaces it in the same PR. A link swap alone would send people to a store page under a "test" label |
| The coach web moves to `app.thefullsetapp.com` (its DNS is set) | `COACH_WEB_URL` | `https://app.thefullsetapp.com` | that address answering 200 first; then "Coach login" and /coaches' button follow |

- **An empty value hides its button** (`data-hide-empty`), so there's never a dead link. To take a store button down fast, empty its line and deploy.
- **Visitors see a swap at once.** `store-links.js` is served `no-cache` (WL16), so a browser re-checks it on every visit. Pages are cached for an hour, but the script is what sets the links.
- **After the production deploy,** open `https://thefullsetapp.com` and `/es` on a phone, tap each badge, then run the app repo's site URL probe (`node scripts/ops/site-urls-live.mjs`, "After deploying" in `website-deploy.md`).

## 3. Undo
- **A bad link:** revert the one-line PR, then section 1 and the production deploy.
- **A bad deploy:** `website-deploy.md`, "Rolling back" (`hosting:clone` to the version before, or the console's Roll back).

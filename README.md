# fullset-site
Fullset's public website: `/`, `/coaches`, `/support`, `/privacy`, `/terms`, plus `/action/`, the page behind Fullset's account emails. It's served by Firebase Hosting on thefullsetapp.com (MSG-5457; the hosting config is change 217), and by GitHub Pages until the switch: https://angelortuno-maker.github.io/fullset-site/

- **Built from:** the website spec, `docs/design/website-spec.md` in the app repo (the Architect, Oct 14).
- **How it's built:** static HTML and one stylesheet, `styles.css`, with the spec's tokens as CSS variables. `/action/` keeps its own `style.css`.
- **Links:** they're relative, so the same files work at the domain's root and under github.io's `/fullset-site/`.
- **Fonts:** Bebas Neue and Inter, self-hosted as woff2 under `fonts/`, both SIL Open Font License (`fonts/OFL.txt`). The site makes no third-party request.
- **Scripts:** the only script is on `/action/`. It calls Firebase's Identity Toolkit with the key the email link carries. The waitlist form posts to change 217's endpoint once that's wired.
- **Placeholders:** `img/hero-today.png`, `img/hero-eat.png` and `img/coach.png` are placeholders until Angel's build-22 screenshots (390×844 @2x). `img/og.png` is the 1200×630 share image.
- **Contact:** support@thefullsetapp.com (MSG-5466).

# Plan 371 (site part): the privacy policy says the servers report their own failures to Sentry

From: angel-log change 371 (MSG-5790, failure alerts), its plan on #597 (https://github.com/angelortuno-maker/angel-log/issues/597#issuecomment-6482643670) §5 · Status: approved (G1 to G3: the Architect, and Angel's "privacy sentence approved as drafted (EN+ES), site deploy before 371's server deploy", MSG-5792) · Branch: `change/371-privacy-server-failures` in fullset-site (Engineer 2), cut at main cc85db4 · PR into `main`
Architecture-impacting: no. One sentence per language.

## Files in scope
- `privacy/index.html`: in "Crash reports", after the first sentence: "Our servers also report their own failures to Sentry: which feature failed and an error code, nothing about you."
- `es/privacy/index.html`: in "Reportes de fallos", after the first sentence: "Nuestros servidores también reportan sus propios fallos a Sentry: qué función falló y un código de error, nada sobre ti."

Always allowed, not listed: `docs/changes/371-privacy-server-failures/**`.

## Checks
1. Each page has the new sentence exactly once, word for word as approved, and nothing else in either file changes (`git diff --stat`: 2 files, 1 line each).
2. The pages still parse: the Hosting emulator serves `/privacy/` and `/es/privacy/`, each with the sentence.

## Changes during build
None yet.

#!/bin/bash
# Change 285: renders the home page's phone frames. Usage: tools/screens/render.sh <app checkout> <out dir>
# The app checkout is at the build SHA, with its node_modules, the functions built and a production web export in
# dist-qa/ (EXPO_NO_DOTENV=1 EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=emulators.qa npx expo export --platform web
# --output-dir dist-qa; the --dev QA export shows dev-only UI). The emulators run a demo-* project, the same as the
# app's L2 journeys (npm run qa:journeys).
set -euo pipefail
APP_DIR=$(cd "$1" && pwd)
SHOTS_DIR=$(mkdir -p "$2" && cd "$2" && pwd)
HERE=$(cd "$(dirname "$0")" && pwd)
export APP_DIR SHOTS_DIR
cd "$APP_DIR"
node scripts/ci/emulator-ports.cjs
QA_FIREBASE_CONFIG=firebase.ci.json npx firebase emulators:exec --only auth,firestore,functions --project demo-fullset --config firebase.ci.json \
  "npx playwright test -c '$HERE/playwright.config.ts'"

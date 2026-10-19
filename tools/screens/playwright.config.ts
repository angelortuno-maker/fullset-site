// Change 285: the home page's phone frames, rendered from the app's QA web export with a demo seed.
// Run it with tools/screens/render.sh (it needs an app checkout at the build SHA). No import: the Playwright
// that runs it is the app checkout's.
export default {
  testDir: '.',
  testMatch: ['seed.spec.ts'],
  outputDir: process.env.SHOTS_DIR + '/results',
  workers: 1,
  retries: 0,
  timeout: 900_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, timezoneId: 'America/Chicago', locale: 'en-US', actionTimeout: 20_000 },
  projects: [{ name: 'dark', use: { colorScheme: 'dark' } }],
};

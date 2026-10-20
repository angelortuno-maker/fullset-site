// Change 303 (A18): App Store iPad 13" screenshots, 2064×2752 (1032×1376 @2x), light, English, from the app's QA web export.
export default {
  testDir: '.',
  testMatch: ['ipad.spec.ts'],
  outputDir: process.env.SHOTS_DIR + '/results',
  workers: 1,
  retries: 0,
  timeout: 900_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: { browserName: 'chromium', timezoneId: 'America/Chicago', locale: 'en-US', actionTimeout: 20_000 },
  projects: [{ name: 'light', use: { colorScheme: 'light' } }],
};

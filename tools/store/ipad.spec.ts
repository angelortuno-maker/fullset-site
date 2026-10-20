// Change 303 (A18): the App Store's iPad 13" screenshots, replacing the 3 canvas frames. The same demo seed as 285's
// phone frames ("Alex" on the Firebase emulators, a demo-* project), through the app's own screens, then Today, a
// workout in progress and Eat at 1032×1376 @2x = 2064×2752, light, in English.
import fs from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { expect, openTab, test } = require(path.join(process.env.APP_DIR!, 'qa/web/harness'));

const OUT = process.env.SHOTS_DIR!;
const DAY = '2026-10-15'; // a Thursday
const IPAD = { width: 1032, height: 1376 };
const MEALS: { at: string; foods: [string, string, number][] }[] = [
  { at: '07:45', foods: [['Oats', 'Oats, dry', 60], ['Banana', 'Banana', 120], ['Egg', 'Egg, scrambled', 150]] },
  { at: '12:30', foods: [['Chicken breast', 'Chicken breast, (cooked|roasted|grilled)', 200], ['White rice', 'White rice, cooked', 250], ['Broccoli', 'Broccoli, cooked', 100]] },
];
const WORKOUTS: { day: string; type: 'Push' | 'Pull' | 'Legs'; base: number }[] = [
  { day: '2026-10-05', type: 'Push', base: 135 },
  { day: '2026-10-06', type: 'Pull', base: 115 },
  { day: '2026-10-07', type: 'Legs', base: 185 },
  { day: '2026-10-09', type: 'Push', base: 140 },
  { day: '2026-10-12', type: 'Pull', base: 120 },
  { day: '2026-10-13', type: 'Legs', base: 195 },
  { day: '2026-10-14', type: 'Push', base: 145 },
];
const home = async (p: any) => {
  await p.goto(new URL('/', p.url()).href);
  await p.getByTestId('page-today').waitFor();
};
// The iPad's home-indicator inset under the tab bar (20 pt); the web build has none and clips the tab labels.
const ipadBar = (p: any) =>
  p.evaluate(() => {
    const tab = document.querySelector('[data-testid="tab-today"]') as HTMLElement | null;
    const bar = tab?.parentElement?.parentElement?.parentElement;
    if (!tab || !bar) return;
    bar.style.height = '70px';
    bar.style.paddingBottom = '20px';
    document.querySelectorAll('[data-testid^="tab-"] div').forEach((d) => {
      const el = d as HTMLElement;
      if (el.children.length === 0 && el.innerText.trim()) Object.assign(el.style, { overflow: 'visible', height: 'auto', lineHeight: '14px' });
    });
  });
const frame = async (p: any, name: string) => {
  await p.waitForTimeout(1500);
  await ipadBar(p);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/ipad-${name}.png` });
};

test('303 iPad frames', async ({ qa }: any) => {
  fs.mkdirSync(OUT, { recursive: true });
  await qa.atCT(`${WORKOUTS[0].day} 07:00`);
  const me = await qa.person('Alex');
  const p = me.page;
  const today = p.getByTestId('page-today');
  try {
    await today.getByRole('button', { name: 'Set up your week', exact: true }).click();
    await p.getByRole('radio', { name: 'Push / Pull / Legs', exact: true }).click();
    await openTab(p, 'today');
    for (const w of WORKOUTS) {
      await qa.atCT(`${w.day} 18:00`);
      await p.reload();
      await openTab(p, 'today');
      await today.getByRole('button', { name: /^Today's type, / }).click();
      await p.getByTestId('type-sheet').getByRole('radio', { name: w.type, exact: true }).click();
      await today.getByRole('button', { name: /^Start workout: / }).click();
      const weights = p.getByLabel('Set 1 weight', { exact: true });
      await expect(weights.first()).toBeVisible();
      const count = Math.min(await weights.count(), 4);
      for (let i = 0; i < count; i++) {
        await weights.nth(i).fill(String(w.base - 20 * i));
        await p.getByLabel('Set 1 reps', { exact: true }).nth(i).fill(String(8 + (i % 3)));
        await p.getByRole('checkbox', { name: 'Complete set 1', exact: true }).nth(i).click();
        await p.getByLabel('Skip rest', { exact: true }).click();
      }
      await p.getByRole('button', { name: 'Finish workout', exact: true }).click();
      await p.getByRole('button', { name: 'Save workout', exact: true }).click();
      await p.getByRole('button', { name: 'Done', exact: true }).click();
      await expect(today).toBeVisible();
    }

    await qa.atCT(`${DAY} 07:30`);
    await p.reload();
    await openTab(p, 'me');
    await p.getByRole('button', { name: /^Nutrition goal/ }).click();
    await p.getByRole('radio', { name: 'Gain', exact: true }).click();
    await p.getByRole('radio', { name: 'Male', exact: true }).click();
    await p.getByLabel('Birth year', { exact: true }).fill('1994');
    await p.getByLabel('Height, feet', { exact: true }).fill('5');
    await p.getByLabel('Height, inches', { exact: true }).fill('10');
    await p.getByLabel("Today's weight", { exact: true }).fill('176');
    await p.getByRole('button', { name: 'Save weight', exact: true }).click();
    await p.getByRole('radio', { name: /^On my feet some of the day/ }).click();
    await p.getByRole('radio', { name: '4', exact: true }).click();

    for (const meal of MEALS) {
      await qa.atCT(`${DAY} ${meal.at}`);
      await home(p);
      for (const [query, pickName, grams] of meal.foods) {
        await openTab(p, 'eat');
        await p.getByRole('button', { name: '+ Add food', exact: true }).click();
        await p.getByLabel('Search foods', { exact: true }).fill(query);
        await p.getByRole('button', { name: new RegExp(`^${pickName}, ((raw|cooked), )?\\d+ kcal`, 'i') }).first().click();
        await p.getByRole('radio', { name: 'Grams', exact: true }).click();
        await p.getByLabel(/^Amount in /).first().fill(String(grams));
        await p.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(p.getByTestId('eat-timeline')).toContainText(new RegExp(pickName));
      }
    }

    // The frames: Thursday 17:30, the iPad's size.
    await qa.atCT(`${DAY} 17:30`);
    await home(p);
    await p.setViewportSize(IPAD);
    await openTab(p, 'today');
    await frame(p, '1-today');
    await openTab(p, 'eat');
    await frame(p, '3-eat');
    // A Pull day in progress: the first two exercises done, the third half done.
    await openTab(p, 'today');
    await today.getByRole('button', { name: /^Today's type, / }).click();
    await p.getByTestId('type-sheet').getByRole('radio', { name: 'Pull', exact: true }).click();
    await today.getByRole('button', { name: /^Start workout: / }).click();
    const weights = p.getByLabel('Set 1 weight', { exact: true });
    await expect(weights.first()).toBeVisible();
    for (let i = 0; i < Math.min(await weights.count(), 3); i++) {
      await weights.nth(i).fill(String(125 - 20 * i));
      await p.getByLabel('Set 1 reps', { exact: true }).nth(i).fill(String(8 + (i % 3)));
      if (i < 2) {
        await p.getByRole('checkbox', { name: 'Complete set 1', exact: true }).nth(i).click();
        await p.getByLabel('Skip rest', { exact: true }).click();
      }
    }
    // Twelve minutes in, so the timer isn't 0:00 (the harness's clock is fixed).
    await qa.atCT(`${DAY} 17:42`);
    // No field left focused (its text would show selected).
    await p.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await p.waitForTimeout(1200);
    await frame(p, '2-workout');
  } catch (e) {
    await p.screenshot({ path: `${OUT}/FAILED.png` });
    throw e;
  }
  await qa.cleanup();
});

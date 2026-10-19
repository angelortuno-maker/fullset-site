// Change 285: the demo seed behind the home page's phone frames. One person, "Alex", on the app's QA web export,
// signed in on the Firebase emulators (a demo-* project: nothing real is reachable). The seed goes in through the
// app's own screens, with the app's L2 harness (qa/web/harness.ts): a Push / Pull / Legs split, a nutrition goal,
// two weeks of workouts with rising weights, and Thursday's breakfast and lunch. Then Today, Eat and Progress at
// 390×844 @2x, dark, in English, then in Spanish (Me → Settings → Language). The second test is the coach's side (R3,
// the Architect, #597 Oct 19 17:28 and 17:40): a coach's client page for Alex, with goals and an assigned week.
import fs from 'node:fs';
import path from 'node:path';

// The app checkout's harness (render.sh sets APP_DIR).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { addDays, expect, journeyDay, openTab, test } = require(path.join(process.env.APP_DIR!, 'qa/web/harness'));

const OUT = process.env.SHOTS_DIR!;
const DAY = '2026-10-15'; // a Thursday
// Breakfast, a snack and lunch: [search, the food picked (its name starts so), grams].
const MEALS: { at: string; foods: [string, string, number][] }[] = [
  { at: '07:45', foods: [['Oats', 'Oats, dry', 60], ['Banana', 'Banana', 120], ['Egg', 'Egg, scrambled', 150]] },
  { at: '10:15', foods: [['Greek yogurt', 'Greek yogurt, low fat', 200]] },
  { at: '12:30', foods: [['Chicken breast', 'Chicken breast, (cooked|roasted|grilled)', 200], ['White rice', 'White rice, cooked', 250], ['Broccoli', 'Broccoli, cooked', 100]] },
];
// The app's home (Today), as a fresh open: stacked screens (the goal, Settings) have no tab bar.
const home = async (p: any) => {
  await p.goto(new URL('/', p.url()).href);
  await p.getByTestId('page-today').waitFor();
};
// The iPhone's home-indicator inset under the tab bar. The web build has none, and its tab labels are clipped to
// 10 px there; on a phone they show in full.
const phoneBar = (p: any) =>
  p.evaluate(() => {
    const tab = document.querySelector('[data-testid="tab-today"]') as HTMLElement | null;
    const bar = tab?.parentElement?.parentElement?.parentElement;
    if (!tab || !bar) return;
    bar.style.height = '83px';
    bar.style.paddingBottom = '34px';
    document.querySelectorAll('[data-testid^="tab-"] div').forEach((d) => {
      const el = d as HTMLElement;
      if (el.children.length === 0 && el.innerText.trim()) Object.assign(el.style, { overflow: 'visible', height: 'auto', lineHeight: '14px' });
    });
  });
let n = 0;
const snap = async (p: any, name: string) => p.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-${name}.png` });

// Two weeks of Push, Pull, Legs, the weights up a little each time.
const WORKOUTS: { day: string; type: 'Push' | 'Pull' | 'Legs'; base: number }[] = [
  { day: '2026-10-05', type: 'Push', base: 135 },
  { day: '2026-10-06', type: 'Pull', base: 115 },
  { day: '2026-10-07', type: 'Legs', base: 185 },
  { day: '2026-10-09', type: 'Push', base: 140 },
  { day: '2026-10-12', type: 'Pull', base: 120 },
  { day: '2026-10-13', type: 'Legs', base: 195 },
  { day: '2026-10-14', type: 'Push', base: 145 },
];

test('285 demo seed and frames', async ({ qa }: any) => {
  fs.mkdirSync(OUT, { recursive: true });
  await qa.atCT(`${WORKOUTS[0].day} 07:00`);
  const me = await qa.person('Alex');
  const p = me.page;
  const today = p.getByTestId('page-today');
  try {
    // The split, from Today's "Set up your week".
    await today.getByRole('button', { name: 'Set up your week', exact: true }).click();
    await p.getByRole('radio', { name: 'Push / Pull / Legs', exact: true }).click();
    await openTab(p, 'today');
    await expect(today.getByRole('button', { name: /^Today's type, / })).toBeVisible();

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
    await snap(p, 'after-workouts');

    // Thursday: the nutrition goal (Me → Nutrition goal), then breakfast and lunch through Eat's search.
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
    await snap(p, 'goal');

    for (const meal of MEALS) {
      await qa.atCT(`${DAY} ${meal.at}`);
      await home(p);
      for (const [query, pickName, grams] of meal.foods) {
        await openTab(p, 'eat');
        await p.getByRole('button', { name: '+ Add food', exact: true }).click();
        await p.getByLabel('Search foods', { exact: true }).fill(query);
        await p.getByRole('button', { name: new RegExp(`^${pickName}, ((raw|cooked), )?\\d+ kcal`, "i") }).first().click();
        // In grams (a US phone starts in ounces).
        await p.getByRole('radio', { name: 'Grams', exact: true }).click();
        await p.getByLabel(/^Amount in /).first().fill(String(grams));
        await p.getByRole('button', { name: 'Save', exact: true }).click();
        // Saved: back on Eat, with the food in the day.
        await expect(p.getByTestId('eat-timeline')).toContainText(new RegExp(pickName));
      }
    }

    // The frames, at 12:45 on Thursday, in English and then in Spanish.
    await qa.atCT(`${DAY} 12:45`);
    for (const lang of ['en', 'es'] as const) {
      if (lang === 'es') {
        await openTab(p, 'me');
        await p.getByRole('button', { name: 'Settings', exact: true }).click();
        await p.getByRole('radio', { name: 'Español', exact: true }).click();
      }
      await home(p);
      for (const tab of ['today', 'eat', 'progress'] as const) {
        await openTab(p, tab);
        await p.waitForTimeout(1500);
        await phoneBar(p);
        await p.waitForTimeout(300);
        await p.screenshot({ path: `${OUT}/frame-${lang}-${tab}.png` });
      }
      await openTab(p, 'eat');
      await p.getByTestId('eat-timeline').scrollIntoViewIfNeeded();
      await p.screenshot({ path: `${OUT}/check-${lang}-eat-timeline.png` });
    }
  } catch (e) {
    await snap(p, 'FAILED');
    throw e;
  }
  await qa.cleanup();
});

// The coach's side: a coach linked to Alex sets the goals and assigns Tuesday to Saturday of this week, then the
// client page (Coach → Alex) at 390×844 @2x, dark, in English and in Spanish. The coach's invite is checked against
// the real date (MSG-5537), so the seed's day is the journeys' day, and the week is the one it falls in.
const WEEK: [number, string][] = [[1, 'Push'], [2, 'Pull'], [3, 'Legs'], [4, 'Rest'], [5, 'Full body']];

test('285 coach frame', async ({ qa }: any) => {
  fs.mkdirSync(OUT, { recursive: true });
  const day: string = journeyDay();
  // The week's Monday (the journeys' day is never a Sunday).
  const monday = addDays(day, 1 - new Date(`${day}T12:00:00Z`).getUTCDay());
  await qa.atCT(`${day} 09:00`);
  const coach = await qa.person('Coach Maya');
  const me = await qa.person('Alex');
  const c = coach.page;
  try {
    await home(c);
    await home(me.page);
    await qa.link(coach, me);
    await c.getByRole('button', { name: /^Alex, Client since / }).click();
    await c.getByTestId('client-goals').getByRole('button', { name: 'Edit goals', exact: true }).click();
    await c.getByRole('button', { name: 'Push / Pull / Legs', exact: true }).click();
    await c.getByLabel('Sessions per week', { exact: true }).fill('5');
    await c.getByLabel('Calories', { exact: true }).fill('2800');
    await c.getByLabel('Protein (g)', { exact: true }).fill('180');
    await c.getByLabel('Carbs (g)', { exact: true }).fill('330');
    await c.getByLabel('Fat (g)', { exact: true }).fill('85');
    await c.getByLabel(/^Water \(/).fill('100');
    await c.getByRole('button', { name: 'Save goals', exact: true }).click();
    await expect(c.getByTestId('goal-sessions')).toHaveAttribute('aria-label', 'Sessions, 5 a week');

    for (const [offset, type] of WEEK) {
      const date = addDays(monday, offset);
      await c.getByTestId(`week-${date}`).click();
      await c.getByRole('button', { name: type, exact: true }).click();
      await c.getByRole('button', { name: 'Assign to Alex', exact: true }).click();
      await expect(c.getByTestId(`week-${date}`)).toHaveAttribute('aria-label', new RegExp(`, ${type}, assigned`));
    }

    for (const lang of ['en', 'es'] as const) {
      if (lang === 'es') {
        await home(c);
        await openTab(c, 'me');
        await c.getByRole('button', { name: 'Settings', exact: true }).click();
        await c.getByRole('radio', { name: 'Español', exact: true }).click();
      }
      await home(c);
      await openTab(c, 'coach');
      await c.getByRole('button', { name: /^Alex, / }).click();
      await expect(c.getByTestId('client-week')).toBeVisible();
      await c.waitForTimeout(1500);
      await c.screenshot({ path: `${OUT}/frame-${lang}-coach.png` });
    }
  } catch (e) {
    await snap(c, 'FAILED-coach');
    throw e;
  }
  await qa.cleanup();
});

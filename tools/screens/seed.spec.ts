// Change 285 (MSG-5824: re-shot from release/2.0.2 59cc3d61, light, Today on a planned Push day, and every frame
// passes ready(), so a loading skeleton or an empty state can't ship again): the demo seed behind the site's phone
// frames. One person, "Alex", on the app's QA web export,
// signed in on the Firebase emulators (a demo-* project: nothing real is reachable). The seed goes in through the
// app's own screens, with the app's L2 harness (qa/web/harness.ts): a Push / Pull / Legs split, a nutrition goal,
// two weeks of workouts with rising weights (Legs last, so Thursday is a Push day), and Thursday's breakfast, lunch and dinner. Then
// Today, Eat and Progress at 390×844 @2x, light, in English, then in Spanish (Me → Settings → Language). The second test is the coach's side (R3,
// the Architect, #597 Oct 19 17:28 and 17:40): a coach's client page for Alex, with goals and an assigned week.
import fs from 'node:fs';
import path from 'node:path';

// The app checkout's harness (render.sh sets APP_DIR).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { expect, journeyDay, openTab, test } = require(path.join(process.env.APP_DIR!, 'qa/web/harness'));

const OUT = process.env.SHOTS_DIR!;
const DAY = '2026-11-12'; // a Thursday: the Coach shot's day (MSG-6042 item 3)
// Breakfast, lunch and dinner (MSG-5824: three meals): [search, the food picked (its name starts so), grams].
const MEALS: { at: string; foods: [string, string, number][] }[] = [
  { at: '07:45', foods: [['Oats', 'Oats, dry', 60], ['Banana', 'Banana', 120], ['Egg', 'Egg, scrambled', 150]] },
  { at: '12:30', foods: [['Chicken breast', 'Chicken breast, (cooked|roasted|grilled)', 200], ['White rice', 'White rice, cooked', 250], ['Broccoli', 'Broccoli, cooked', 100]] },
  { at: '18:45', foods: [['Salmon', 'Salmon, cooked', 180], ['Sweet potato', 'Sweet potato, cooked', 200], ['Avocado', 'Avocado', 70]] },
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
// MSG-5824: the frames are light. The app follows its own Appearance setting, not only the browser's scheme.
const light = async (p: any) => {
  await openTab(p, 'me');
  await p.getByRole('button', { name: 'Settings', exact: true }).click();
  await p.getByRole('radio', { name: 'Light', exact: true }).click();
  await expect(p.getByRole('radio', { name: 'Light', exact: true })).toHaveAttribute('aria-checked', 'true');
  await home(p);
};
let n = 0;
const snap = async (p: any, name: string) => p.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-${name}.png` });

/** The words a loading state shows, in English and Spanish (the app's *.loading keys and the Skeleton's label). */
const LOADING = /^(Loading|Cargando)\b|^…$/i;
/** Each frame's own content: what an empty or half-loaded screen lacks. */
const CONTENT: Record<string, (p: any) => Promise<void>> = {
  // Today's type is set (the planned day), and the week strip carries this week's training dots.
  today: async (p) => {
    await expect(p.getByTestId('page-today').getByRole('button', { name: /^(Today's type|Tipo de hoy), / })).toBeVisible();
    expect(await p.locator('[data-testid^="marks-"] > div').count()).toBeGreaterThan(0);
  },
  // Thursday's three meals (breakfast, lunch, dinner) are in the day.
  eat: async (p) => {
    const day = p.getByTestId('eat-timeline');
    for (const food of [/Oats/, /Chicken breast/, /Salmon/]) await expect(day).toContainText(food);
  },
  // Records list at least one lift (each row reads "<exercise>: PR <set>, <date>" in both languages).
  progress: async (p) => {
    expect(await p.getByRole('button', { name: /: PR .+, / }).count()).toBeGreaterThan(0);
  },
  // The client's goals are filled in, and the week holds the five assigned days.
  coach: async (p) => {
    await expect(p.getByTestId('goal-sessions')).toHaveAttribute('aria-label', /5/);
    expect(await p.locator('[data-testid^="week-"][aria-label*="ssign"], [data-testid^="week-"][aria-label*="signado"]').count()).toBeGreaterThanOrEqual(5);
  },
};
/**
 * MSG-5824: a frame is taken only when nothing on screen is loading (no Skeleton, no progress spinner, no "Loading…"
 * or bare "…" label) and the frame's own content is there. Otherwise the run fails, with a shot of what it saw.
 */
async function ready(p: any, frame: keyof typeof CONTENT) {
  await expect
    .poll(
      () =>
        p.evaluate((source: string) => {
          const loading = new RegExp(source, 'i');
          const shown = (el: Element) => {
            const r = (el as HTMLElement).getBoundingClientRect();
            return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
          };
          return [...document.querySelectorAll('[role="progressbar"], [aria-busy="true"], [aria-label]')].filter(
            (el) => shown(el) && (el.getAttribute('role') === 'progressbar' || el.getAttribute('aria-busy') === 'true' || loading.test((el.getAttribute('aria-label') ?? '').trim())),
          ).length;
        }, LOADING.source),
      { timeout: 20_000, message: `${frame}: still loading` },
    )
    .toBe(0);
  await CONTENT[frame](p);
}
/** A frame: ready, then the shot, then the size the site allows (250 KB). */
async function frame(p: any, name: string, kind: keyof typeof CONTENT) {
  await ready(p, kind);
  const file = `${OUT}/${name}.png`;
  await p.screenshot({ path: file });
  expect(fs.statSync(file).size, `${name}.png is over 250 KB`).toBeLessThanOrEqual(250 * 1024);
}

// Two weeks of Push, Pull, Legs, the weights up a little each time; Legs last, so Thursday's planned day is Push.
const WORKOUTS: { day: string; type: 'Push' | 'Pull' | 'Legs'; base: number }[] = [
  { day: '2026-11-02', type: 'Push', base: 135 },
  { day: '2026-11-03', type: 'Pull', base: 115 },
  { day: '2026-11-04', type: 'Legs', base: 185 },
  { day: '2026-11-06', type: 'Push', base: 140 },
  { day: '2026-11-09', type: 'Pull', base: 120 },
  { day: '2026-11-11', type: 'Legs', base: 195 },
];

test('285 demo seed and frames', async ({ qa }: any) => {
  fs.mkdirSync(OUT, { recursive: true });
  await qa.atCT(`${WORKOUTS[0].day} 07:00`);
  const me = await qa.person('Alex');
  const p = me.page;
  const today = p.getByTestId('page-today');
  try {
    await light(p);
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

    // The frames, at 19:30 on Thursday (after dinner), in English and then in Spanish.
    await qa.atCT(`${DAY} 19:30`);
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
        // MSG-6042 item 3: Today's "Restoring your workouts…" line is a loading state (W2), so wait until it's gone.
        await expect(p.getByText(/^(Restoring your workouts…|Restaurando tus entrenamientos…)$/)).toHaveCount(0, { timeout: 60_000 });
        await frame(p, `frame-${lang}-${tab}`, tab);
      }
      await openTab(p, 'eat');
      await p.getByTestId('eat-timeline').scrollIntoViewIfNeeded();
      await p.screenshot({ path: `${OUT}/check-${lang}-eat-timeline.png` });
      // A second Eat candidate: scrolled to the action row, with the meals under it.
      await home(p);
      await openTab(p, 'eat');
      await p.waitForTimeout(1500);
      await p.getByRole('button', { name: /^\+ (Add food|Agregar)/ }).first().evaluate((el: Element) => el.scrollIntoView({ block: 'start' }));
      await p.mouse.wheel(0, -120);
      await p.waitForTimeout(800);
      await phoneBar(p);
      await frame(p, `alt-${lang}-eat`, 'eat');
    }
  } catch (e) {
    await snap(p, 'FAILED');
    throw e;
  }
  await qa.cleanup();
});

// The coach's side: a coach linked to Alex sets the goals and assigns the first five days of this week that show
// "+ Assign", then the client page (Coach → Alex) at 390×844 @2x, light, in English and in Spanish. The coach's invite
// is checked against the real date (MSG-5537), so the seed's day is the journeys' day, and the week is the one it falls
// in. App master bc97b543 locks the week's past days (no "+ Assign"), so the days aren't a fixed Tuesday to Saturday.
const WEEK: string[] = ['Push', 'Pull', 'Legs', 'Rest', 'Full body'];

test('285 coach frame', async ({ qa }: any) => {
  fs.mkdirSync(OUT, { recursive: true });
  const day: string = journeyDay();
  await qa.atCT(`${day} 09:00`);
  const coach = await qa.person('Coach Maya');
  const me = await qa.person('Alex');
  const c = coach.page;
  try {
    await home(c);
    await home(me.page);
    await light(c);
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

    // The shown week's rows, in order; the assignable ones show "+ Assign".
    const rows = c.getByTestId('client-week').locator('[data-testid^="week-"]');
    await expect(rows.first()).toBeVisible();
    const open: string[] = [];
    for (const row of await rows.all()) {
      if ((await row.innerText()).includes('+ Assign')) open.push((await row.getAttribute('data-testid'))!.slice('week-'.length));
    }
    if (open.length < WEEK.length) {
      throw new Error(`285 coach frame: needs ${WEEK.length} days with "+ Assign" this week, found ${open.length}: ${open.join(', ') || 'none'}`);
    }
    for (const [i, type] of WEEK.entries()) {
      const date = open[i];
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
      // The frame shipped on Oct 19 was this page still loading (MSG-5824 item 1): ready() refuses that now.
      await phoneBar(c);
      await frame(c, `frame-${lang}-coach`, 'coach');
    }
  } catch (e) {
    await snap(c, 'FAILED-coach');
    throw e;
  }
  await qa.cleanup();
});

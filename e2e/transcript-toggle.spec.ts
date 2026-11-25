/**
 * transcript-toggle.spec.ts — the transcript button names the action it will do, also
 * inside an open accordion around it (`MediaPanel.tsx`).
 *
 * The defect it pins: the two labels were swapped with `group-open:`, which matches ANY
 * open ancestor `group`. A lesson section sits inside an accordion that is itself an open
 * `<details className="group">`, so every transcript button read "Hide transcript" with the
 * eye-off icon even while the transcript was closed. Both labels are always in the DOM, so
 * a unit test that reads the text cannot see it: this measures which one is VISIBLE.
 */
import { expect, test } from '@playwright/test';

import { animationsSettled, exampleReady } from './support';

test('the transcript button shows Show when closed and Hide when open, inside an open accordion around it', async ({
  page,
}) => {
  await page.goto('example.html');
  await exampleReady(page);
  await animationsSettled(page);

  // The example's transcript sits in a tab panel. Select its tab, then wrap the transcript in
  // an OPEN `<details class="group">`, the shape of a real lesson's accordion (the example has
  // none around its transcripts, so it never showed the defect). The wrapper is what leaked.
  const panel = page
    .locator('[role="tabpanel"]')
    .filter({ has: page.locator('details.media-transcript') });
  const tabId = await panel.first().getAttribute('aria-labelledby');
  await page.locator(`[id="${tabId}"]`).click();
  const transcript = page.locator('details.media-transcript').filter({ visible: true }).first();
  await expect(transcript).toBeVisible();
  await transcript.evaluate((element) => {
    const accordion = document.createElement('details');
    accordion.className = 'group';
    accordion.open = true;
    element.before(accordion);
    accordion.append(element);
  });
  await expect(transcript).not.toHaveAttribute('open', '');

  const summary = transcript.locator('summary');
  const show = summary.getByText('Show transcript');
  const hide = summary.getByText('Hide transcript');

  await expect(show).toBeVisible();
  await expect(hide).toBeHidden();

  await summary.click();
  await expect(transcript).toHaveAttribute('open', '');
  await expect(hide).toBeVisible();
  await expect(show).toBeHidden();

  await summary.click();
  await expect(transcript).not.toHaveAttribute('open', '');
  await expect(show).toBeVisible();
  await expect(hide).toBeHidden();
});

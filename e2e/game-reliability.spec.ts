import { expect, test, type Page, devices } from '@playwright/test';

test.use({
  ...devices['Pixel 5'],
});

async function completeSetup(page: Page) {
  await page.goto('/game/setup');
  await expect(page.getByRole('heading', { name: 'Game setup' })).toBeVisible();

  await page.locator('select').selectOption('3');
  await page.getByTestId('setup-team-a-name').fill('Lions');
  await page.getByTestId('setup-team-a-player-0').fill('Alex');
  await page.getByTestId('setup-team-b-name').fill('Tigers');
  await page.getByTestId('setup-team-b-player-0').fill('Riley');
  await page.getByTestId('setup-continue').click();

  await expect(page).toHaveURL(/\/game\/word-entry$/);
}

async function enterWordsForCurrentPlayer(page: Page, words: string[]) {
  for (const [index, word] of words.entries()) {
    await page.getByTestId(`word-entry-input-${index}`).fill(word);
  }
}

async function completeGameSetupToRound(page: Page) {
  await completeSetup(page);

  await enterWordsForCurrentPlayer(page, ['moon', 'river', 'lantern']);
  await page.getByTestId('word-entry-next').click();
  await expect(page.getByTestId('word-entry-current-player')).toContainText(
    'Riley',
  );

  await enterWordsForCurrentPlayer(page, ['forest', 'bridge', 'anchor']);
  await page.getByTestId('word-entry-next').click();

  await expect(page).toHaveURL(/\/game\/round$/);
  await expect(page.getByTestId('round-start')).toBeVisible();
}

function parseTimer(text: string): number {
  return Number.parseInt(text.replace(/[^0-9]/g, ''), 10);
}

test('restores the active player during word entry after reload', async ({
  page,
}) => {
  await completeSetup(page);

  await enterWordsForCurrentPlayer(page, ['moon', 'river', 'lantern']);
  await page.getByTestId('word-entry-next').click();
  await expect(page.getByTestId('word-entry-current-player')).toContainText(
    'Riley',
  );

  await page.reload();

  await expect(page).toHaveURL(/\/game\/word-entry$/);
  await expect(page.getByTestId('word-entry-restored-progress')).toBeVisible();
  await expect(page.getByTestId('word-entry-current-player')).toContainText(
    'Riley',
  );

  await page.getByTestId('word-entry-previous').click();
  await expect(page.getByTestId('word-entry-current-player')).toContainText(
    'Alex',
  );
  await page.getByTestId('word-entry-reveal-0').click();
  await expect(page.getByTestId('word-entry-input-0')).toHaveValue('moon');
});

test('restores an in-progress round and keeps elapsed timer after reload', async ({
  page,
}) => {
  await completeGameSetupToRound(page);

  await page.getByTestId('round-start').click();
  await expect(page.getByTestId('round-timer')).toBeVisible();

  await page.waitForTimeout(2_500);
  await page.reload();

  await expect(page).toHaveURL(/\/game\/round$/);
  await expect(page.getByTestId('round-active-team')).toContainText('Lions');

  const timerText = await page.getByTestId('round-timer').textContent();
  expect(timerText).not.toBeNull();
  const remainingSeconds = parseTimer(timerText ?? '');

  expect(remainingSeconds).toBeLessThan(60);
  await expect(page.getByTestId('round-end')).toBeVisible();
});

test('reset session requires confirmation and clears the saved game on accept', async ({
  page,
}) => {
  await completeGameSetupToRound(page);

  await page.getByTestId('round-reset-session').click();
  await expect(page.getByTestId('confirm-toast')).toBeVisible();
  await page.getByTestId('confirm-cancel').click();
  await expect(page.getByTestId('confirm-toast')).toBeHidden();
  await expect(page).toHaveURL(/\/game\/round$/);

  await page.getByTestId('round-reset-session').click();
  await page.getByTestId('confirm-accept').click();

  await expect(page).toHaveURL(/\/game\/setup$/);
  await expect(page.getByRole('heading', { name: 'Game setup' })).toBeVisible();
  await expect(page.getByText('Saved game detected')).toHaveCount(0);
});

test('setup preserves a recovery path before replacing a saved game', async ({
  page,
}) => {
  await completeGameSetupToRound(page);

  await page.goto('/game/setup');
  await expect(page.getByText('Saved game detected')).toBeVisible();

  await page.getByTestId('setup-continue').click();
  await expect(page.getByTestId('confirm-toast')).toBeVisible();
  await page.getByTestId('confirm-cancel').click();
  await expect(page.getByTestId('confirm-toast')).toBeHidden();

  await page.getByTestId('resume-saved-game').click();
  await expect(page).toHaveURL(/\/game\/round$/);
  await expect(page.getByTestId('round-start')).toBeVisible();
});

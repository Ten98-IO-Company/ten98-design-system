import { expect, test, type Locator, type Page } from '@playwright/test';

async function openFlow(page: Page, flow: string) {
  const query = test.info().project.name === 'narrow-dark' ? '?theme=dark' : '';
  await page.goto(`/${query}#flows/${flow}`);
  const preview = page.locator('.reference-preview');
  await expect(preview).toBeVisible();
  return preview;
}

async function approveInitialPlan(page: Page, preview: Locator) {
  await preview.getByRole('button', { name: 'Inspect Studio opening', exact: true }).click();
  await preview.getByRole('button', { name: 'Request review of v1', exact: true }).click();
  await preview.getByRole('button', { name: 'Review exact version', exact: true }).click();
  await page.getByRole('dialog', { name: 'Review Studio opening v1', exact: true }).getByRole('button', { name: 'Approve v1 locally', exact: true }).click();
}

async function previewDirectAudience(preview: Locator) {
  await preview.getByRole('button', { name: 'Preview synthetic import', exact: true }).click();
  await expect(preview.getByText('Import preview pending. No contacts have been created.', { exact: true })).toBeVisible();
  await preview.getByRole('button', { name: 'Simulate import result ready', exact: true }).click();
  await preview.getByRole('button', { name: 'Refresh local audience preview', exact: true }).click();
  await preview.getByRole('button', { name: 'Simulate consent and suppression result', exact: true }).click();
}

test.describe('Campaign C1 · account copies and media validation', () => {
  test('independent captions and an actual local snapshot survive later edits', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-compose-social');
    const instagram = preview.getByRole('tab', { name: 'Studio Dubai · @studio.demo', exact: true });
    const linkedin = preview.getByRole('tab', { name: 'Studio Company · company/demo', exact: true });
    await preview.getByLabel('Caption for Studio Dubai · @studio.demo', { exact: true }).fill('Saved Instagram draft');
    await preview.getByRole('button', { name: 'Save local draft', exact: true }).click();
    await linkedin.click();
    await expect(preview.getByLabel('Caption for Studio Company · company/demo', { exact: true })).toHaveValue('Our Dubai studio opens on 21 October. Meet the team.');
    await preview.getByLabel('Caption for Studio Company · company/demo', { exact: true }).fill('Independent LinkedIn draft');
    await instagram.click();
    await expect(preview.getByLabel('Caption for Studio Dubai · @studio.demo', { exact: true })).toHaveValue('Saved Instagram draft');
    await preview.getByLabel('Caption for Studio Dubai · @studio.demo', { exact: true }).fill('Unsaved replacement');
    await preview.getByRole('button', { name: 'Restore saved local draft', exact: true }).click();
    await expect(preview.getByLabel('Caption for Studio Dubai · @studio.demo', { exact: true })).toHaveValue('Saved Instagram draft');
    await linkedin.click();
    await expect(preview.getByLabel('Caption for Studio Company · company/demo', { exact: true })).toHaveValue('Our Dubai studio opens on 21 October. Meet the team.');
  });

  test('unverified media blocks checks; exact account empty/inherited choices remain distinct', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-compose-social');
    await expect(preview.getByRole('checkbox', { name: /^Studio Shop/ })).toBeDisabled();
    await preview.getByRole('checkbox', { name: /^Studio Company/ }).uncheck();
    await preview.getByRole('button', { name: 'Validate selected accounts locally', exact: true }).click();
    await expect(preview.getByText('Studio Dubai · @studio.demo: media is pending, failed or unverified. Inspect it before provider preflight.', { exact: true })).toBeVisible();
    await preview.getByRole('button', { name: 'Use no media for this account', exact: true }).click();
    await expect(preview.getByText('Media choice: Explicitly empty', { exact: true })).toBeVisible();
    await preview.getByRole('button', { name: 'Validate selected accounts locally', exact: true }).click();
    await expect(preview.getByText('Ready for app-owned preflight', { exact: true })).toBeVisible();
    await preview.getByRole('button', { name: 'Use inherited media', exact: true }).click();
    await preview.getByRole('button', { name: 'Validate selected accounts locally', exact: true }).click();
    await expect(preview.getByText('Review the draft', { exact: true })).toBeVisible();
    await preview.getByRole('button', { name: 'Simulate ready media evidence', exact: true }).click();
    await preview.getByRole('button', { name: 'Validate selected accounts locally', exact: true }).click();
    await expect(preview.getByText('Ready for app-owned preflight', { exact: true })).toBeVisible();
    await preview.getByLabel('Caption for Studio Dubai · @studio.demo', { exact: true }).fill('');
    await preview.getByRole('button', { name: 'Validate selected accounts locally', exact: true }).click();
    await expect(preview.getByText('Studio Dubai · @studio.demo: add a caption.', { exact: true })).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Save local draft', exact: true })).toBeEnabled();
  });
});

test.describe('Campaign C2 · version approval and separate delivery', () => {
  test('display timezone preserves the instant; approval and planning do not imply delivery', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-plan-approve');
    await preview.getByLabel('Calendar display timezone', { exact: true }).selectOption('UTC');
    await expect(preview.locator('.t98-agenda-when')).toHaveAttribute('datetime', '2026-10-21T10:00:00+04:00');
    await expect(preview.locator('.t98-agenda-when')).toContainText('06:00');
    await approveInitialPlan(page, preview);
    await expect(preview.getByLabel('Planned time · UTC+04:00', { exact: true })).toHaveValue('10:00');
    await preview.getByRole('button', { name: 'Save approved local plan', exact: true }).click();
    await expect(preview.getByText('Plan saved locally', { exact: true })).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Simulate delivery evidence', exact: true })).toBeDisabled();
    await preview.getByRole('button', { name: 'Simulate schedule submission', exact: true }).click();
    await expect(preview.getByText(/Approval: Approved v1.*Delivery: Pending receipt/)).toBeVisible();
    await preview.getByRole('button', { name: 'Simulate delivery evidence', exact: true }).click();
    await expect(preview.getByText(/Delivery: Synthetic provider evidence received/)).toBeVisible();
    if (test.info().project.name === 'narrow-dark') {
      await preview.getByRole('button', { name: 'Back to list', exact: true }).click();
      await expect(preview.getByRole('button', { name: 'Inspect Studio opening', exact: true })).toBeFocused();
    } else await expect(preview.getByRole('button', { name: 'Inspect Studio opening', exact: true })).toBeVisible();
  });

  test('material edit stales approval and change requests require a retained note', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-plan-approve');
    await approveInitialPlan(page, preview);
    await preview.getByLabel('Planned time · UTC+04:00', { exact: true }).fill('11:00');
    await expect(preview.getByText('Review the changed version', { exact: true })).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Save approved local plan', exact: true })).toBeDisabled();
    await preview.getByRole('button', { name: 'Request review of v2', exact: true }).click();
    await preview.getByRole('button', { name: 'Review exact version', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Review Studio opening v2', exact: true });
    await dialog.getByLabel('Note required when requesting changes', { exact: true }).fill('');
    await expect(dialog.getByRole('button', { name: 'Request changes with note', exact: true })).toBeDisabled();
    await dialog.getByLabel('Note required when requesting changes', { exact: true }).fill('Please confirm the new 11:00 time.');
    await dialog.getByRole('button', { name: 'Request changes with note', exact: true }).click();
    await expect(preview.getByText('Please confirm the new 11:00 time.', { exact: true })).toBeVisible();
    await expect(preview.getByLabel('Planned time · UTC+04:00', { exact: true })).toHaveValue('11:00');
    await expect(preview.getByRole('button', { name: 'Save approved local plan', exact: true })).toBeDisabled();
  });
});

test.describe('Campaign C3 · paid creation stays paused', () => {
  test('creation needs readback before a separate explicit activation review', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-create-paid');
    await preview.getByRole('button', { name: 'Validate settings locally', exact: true }).click();
    await preview.getByRole('button', { name: 'Review exact paused creation', exact: true }).click();
    const review = page.getByRole('dialog', { name: 'Review exact outgoing settings', exact: true });
    await expect(review.getByText('AED 100 per day', { exact: true })).toBeVisible();
    await expect(review.getByText('PAUSED', { exact: true })).toBeVisible();
    await review.getByRole('button', { name: 'Simulate create paused', exact: true }).click();
    await expect(preview.getByRole('region', { name: 'Creation receipt and readback', exact: true })).toContainText('Pending confirmation');
    await expect(preview.getByRole('button', { name: 'Review activation of paused campaign', exact: true })).toHaveCount(0);
    await preview.getByRole('button', { name: 'Simulate creation response', exact: true }).click();
    await expect(preview.getByRole('region', { name: 'Creation receipt and readback', exact: true })).toContainText('Synthetic readback: PAUSED');
    await preview.getByRole('button', { name: 'Review activation of paused campaign', exact: true }).click();
    await page.getByRole('dialog', { name: 'Activate this paused campaign?', exact: true }).getByRole('button', { name: 'Leave paused', exact: true }).click();
    await expect(preview.getByRole('region', { name: 'Creation receipt and readback', exact: true })).toContainText('Synthetic readback: PAUSED');
    await preview.getByRole('button', { name: 'Review activation of paused campaign', exact: true }).click();
    await page.getByRole('dialog', { name: 'Activate this paused campaign?', exact: true }).getByRole('button', { name: 'Simulate explicit activation', exact: true }).click();
    await expect(preview.getByText('Synthetic readback: ENABLED. Delivery and spend remain unobserved.', { exact: true })).toBeVisible();
  });

  test('invalid budget retains input and unknown creation blocks repeated writes', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-create-paid');
    await preview.getByLabel('Daily budget · AED', { exact: true }).fill('0');
    await preview.getByRole('button', { name: 'Validate settings locally', exact: true }).click();
    await expect(preview.getByText('Local validation failed', { exact: true })).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Review exact paused creation', exact: true })).toBeDisabled();
    await expect(preview.getByLabel('Headline', { exact: true })).toHaveValue('Visit our Dubai studio');
    await preview.getByLabel('Daily budget · AED', { exact: true }).fill('100');
    await preview.getByLabel('Simulated creation response', { exact: true }).selectOption('unknown');
    await preview.getByRole('button', { name: 'Validate settings locally', exact: true }).click();
    await preview.getByRole('button', { name: 'Review exact paused creation', exact: true }).click();
    await page.getByRole('dialog', { name: 'Review exact outgoing settings', exact: true }).getByRole('button', { name: 'Simulate create paused', exact: true }).click();
    await preview.getByRole('button', { name: 'Simulate creation response', exact: true }).click();
    await expect(preview.getByText('Inspect receipt before another creation', { exact: true })).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Validate settings locally', exact: true })).toBeDisabled();
    await expect(preview.getByRole('button', { name: 'Review activation of paused campaign', exact: true })).toHaveCount(0);
    await preview.getByRole('button', { name: 'Simulate reconciliation: found paused campaign', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Review activation of paused campaign', exact: true })).toBeEnabled();
  });
});

test.describe('Campaign C4 · paid changes and report retrieval', () => {
  test('reviews exact daily before/after and shows confirmed readback', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-performance-change');
    await expect(preview.getByText('Unavailable', { exact: true })).toBeVisible();
    await preview.getByLabel('Proposed daily budget · AED', { exact: true }).fill('125');
    await preview.getByLabel('Simulated paid-change result', { exact: true }).selectOption('confirmed');
    await preview.getByRole('button', { name: 'Review change to 1 campaign', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Review paid change', exact: true });
    await expect(dialog.getByText('AED 100 per day', { exact: true })).toBeVisible();
    await expect(dialog.getByText('AED 125 per day', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Confirm local budget change', exact: true }).click();
    await preview.getByRole('button', { name: 'Simulate paid-change response', exact: true }).click();
    await expect(preview.getByRole('region', { name: 'Budget operation', exact: true })).toContainText('Synthetic current readback: AED 125 daily.');
  });

  test('shared ownership and unknown result block edits; confirmed failure keeps draft', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-performance-change');
    await preview.getByLabel('Simulate shared / unreadable budget ownership', { exact: true }).check();
    await expect(preview.getByLabel('Proposed daily budget · AED', { exact: true })).toBeDisabled();
    await expect(preview.getByRole('button', { name: 'Review change to 1 campaign', exact: true })).toBeDisabled();
    await preview.getByLabel('Simulate shared / unreadable budget ownership', { exact: true }).uncheck();
    await preview.getByRole('button', { name: 'Review change to 1 campaign', exact: true }).click();
    await page.getByRole('dialog', { name: 'Review paid change', exact: true }).getByRole('button', { name: 'Confirm local budget change', exact: true }).click();
    await preview.getByRole('button', { name: 'Simulate paid-change response', exact: true }).click();
    await expect(preview.getByText('Outcome unknown · repeat blocked', { exact: true })).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Review change to 1 campaign', exact: true })).toBeDisabled();
    await preview.getByRole('button', { name: 'Simulate reconciliation: confirmed not applied', exact: true }).click();
    await preview.getByRole('button', { name: 'Review retained draft again', exact: true }).click();
    await expect(preview.getByLabel('Proposed daily budget · AED', { exact: true })).toHaveValue('120');
    await expect(preview.getByRole('button', { name: 'Review change to 1 campaign', exact: true })).toBeEnabled();
  });

  test('report scope is frozen; failed download retries the same job and produces a file', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-performance-change');
    await preview.getByRole('button', { name: 'Request local report job', exact: true }).click();
    await preview.getByLabel('Report start date', { exact: true }).fill('2026-10-01');
    await preview.getByLabel('Report end date', { exact: true }).fill('2026-10-03');
    await preview.getByRole('button', { name: 'Apply date scope · retain stale snapshot', exact: true }).click();
    await expect(preview.getByText('Previous snapshot retained · requested range changed', { exact: true })).toBeVisible();
    await preview.getByRole('button', { name: 'Simulate report ready', exact: true }).click();
    const download = preview.getByRole('link', { name: 'Download bounded synthetic CSV · 1 row', exact: true });
    const originalHref = await download.getAttribute('href');
    expect(decodeURIComponent(originalHref!)).toContain('12–18 October 2026,2026-10-12–2026-10-18,Asia/Dubai');
    await preview.getByRole('button', { name: 'Simulate download failure', exact: true }).click();
    await expect(download).toHaveCount(0);
    await expect(preview.getByRole('button', { name: 'Request local report job', exact: true })).toHaveCount(0);
    await preview.getByRole('button', { name: 'Retry local download retrieval', exact: true }).click();
    await expect(download).toHaveAttribute('href', originalHref!);
    await expect(preview.getByText('Local mounted receipt: demo-report-001. Real jobs and scope snapshots must be persisted by the app.', { exact: true })).toBeVisible();
    const filePromise = page.waitForEvent('download');
    await download.click();
    expect((await filePromise).suggestedFilename()).toBe('synthetic-campaign-report.csv');
  });
});

test.describe('Campaign C5 · OOH quote and readback', () => {
  test('booking and cancellation each wait for separate readback', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-ooh-booking');
    await preview.getByRole('button', { name: 'Save local proposal and fixture quote', exact: true }).click();
    await preview.getByRole('button', { name: 'Check synthetic availability', exact: true }).click();
    await preview.getByRole('button', { name: 'Review exact booking', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Review OOH commitment', exact: true });
    await expect(dialog.getByText('AED 2,400', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Simulate booking submission', exact: true }).click();
    await expect(preview.getByRole('region', { name: 'Booking ledger', exact: true })).toContainText('Pending confirmation');
    await expect(preview.getByRole('button', { name: 'Review cancellation request', exact: true })).toHaveCount(0);
    await preview.getByRole('button', { name: 'Inspect synthetic booking readback', exact: true }).click();
    await expect(preview.getByRole('region', { name: 'Booking ledger', exact: true })).toContainText('Proof of play is not yet available.');
    await preview.getByRole('button', { name: 'Review cancellation request', exact: true }).click();
    await page.getByRole('dialog', { name: 'Request cancellation of demo-book-001?', exact: true }).getByRole('button', { name: 'Simulate cancellation request', exact: true }).click();
    await expect(preview.getByRole('region', { name: 'Booking ledger', exact: true })).toContainText('Cancellation requested; booking is not yet confirmed cancelled.');
    await preview.getByRole('button', { name: 'Simulate confirmed cancellation readback', exact: true }).click();
    await expect(preview.getByRole('region', { name: 'Booking ledger', exact: true })).toContainText('CANCELLED. Refund status remains unknown.');
  });

  test('partial/stale availability blocks commitment until refreshed and rechecked', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-ooh-booking');
    await preview.getByRole('button', { name: 'Save local proposal and fixture quote', exact: true }).click();
    await preview.getByLabel('Simulated availability summary', { exact: true }).selectOption('partial');
    await preview.getByRole('button', { name: 'Check synthetic availability', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Review exact booking', exact: true })).toBeDisabled();
    await expect(preview.getByText('Review inventory before commitment. No per-screen allocation has been inferred.', { exact: true })).toBeVisible();
    await preview.getByLabel('Simulated availability summary', { exact: true }).selectOption('available');
    await preview.getByRole('button', { name: 'Check synthetic availability', exact: true }).click();
    await preview.getByRole('button', { name: 'Simulate quote / availability expiry', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Review exact booking', exact: true })).toBeDisabled();
    await preview.getByRole('button', { name: 'Review refreshed fixture quote', exact: true }).click();
    await preview.getByRole('button', { name: 'Check synthetic availability', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Review exact booking', exact: true })).toBeEnabled();
  });

  test('unknown booking only reconciles before cancellation can be reviewed', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-ooh-booking');
    await preview.getByRole('button', { name: 'Save local proposal and fixture quote', exact: true }).click();
    await preview.getByRole('button', { name: 'Check synthetic availability', exact: true }).click();
    await preview.getByRole('button', { name: 'Review exact booking', exact: true }).click();
    await page.getByRole('dialog', { name: 'Review OOH commitment', exact: true }).getByRole('button', { name: 'Simulate booking submission', exact: true }).click();
    await preview.getByLabel('Simulated booking readback', { exact: true }).selectOption('unknown');
    await preview.getByRole('button', { name: 'Inspect synthetic booking readback', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Review exact booking', exact: true })).toBeDisabled();
    await expect(preview.getByText('Reconcile the booking receipt', { exact: true })).toBeVisible();
    await preview.getByRole('button', { name: 'Simulate reconciliation: whole booking confirmed', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Review cancellation request', exact: true })).toBeEnabled();
  });
});

test.describe('Campaign C6 · targeted recovery and retained inbox drafts', () => {
  test('successful destination is never retried; failure and uncertainty use different actions', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-recovery-inbox');
    const outcomes = preview.getByRole('region', { name: 'Per-destination recovery · post demo-post-4', exact: true });
    const delivered = outcomes.getByRole('listitem').filter({ hasText: 'Studio Company · demo-li-28' });
    const uncertain = outcomes.getByRole('listitem').filter({ hasText: 'Studio Shop · demo-ig-39' });
    await expect(delivered.getByRole('button')).toHaveCount(0);
    await expect(uncertain.getByRole('button')).toHaveCount(1);
    await outcomes.getByRole('button', { name: 'Simulate reconnection and retry failed destination only', exact: true }).click();
    await outcomes.getByRole('button', { name: 'Simulate retry accepted · not published', exact: true }).click();
    await expect(outcomes.getByRole('listitem').filter({ hasText: 'Studio Dubai · demo-ig-17' })).toContainText('Accepted');
    await expect(delivered).toContainText('demo-publish-li-001');
    await uncertain.getByRole('button', { name: 'Simulate reconciliation: published receipt found', exact: true }).click();
    await expect(uncertain).toContainText('Delivered');
    await expect(uncertain.getByRole('button')).toHaveCount(0);
  });

  test('guarded selection retains public draft; internal note remains explicitly local', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-recovery-inbox');
    await preview.getByRole('button', { name: 'Open Sam conversation', exact: true }).click();
    await preview.getByLabel('Public reply text', { exact: true }).fill('The studio opens at 10:00.');
    if (test.info().project.name === 'narrow-dark') {
      await preview.getByRole('button', { name: 'Back to list', exact: true }).click();
      await expect(preview.getByRole('button', { name: 'Open Sam conversation', exact: true })).toBeFocused();
    }
    await preview.getByRole('button', { name: 'Open Robin conversation', exact: true }).click();
    await page.getByRole('dialog', { name: 'Keep this unsaved draft before switching?', exact: true }).getByRole('button', { name: 'Keep draft and switch', exact: true }).click();
    await expect(preview.getByLabel('Public reply text', { exact: true })).toHaveValue('');
    await preview.getByLabel('Reply visibility', { exact: true }).selectOption('note');
    await preview.getByLabel('Internal note text · never sent externally', { exact: true }).fill('Ask the venue team about access.');
    await preview.getByRole('button', { name: 'Add local internal note', exact: true }).click();
    const note = preview.locator('[data-visibility="note"]');
    await expect(note).toContainText('Internal note');
    await expect(note).toContainText('Local note · unsynced');
    await expect(note).toContainText('Ask the venue team about access.');
    await expect(page.getByRole('dialog', { name: 'Review public reply', exact: true })).toHaveCount(0);
    if (test.info().project.name === 'narrow-dark') await preview.getByRole('button', { name: 'Back to list', exact: true }).click();
    await preview.getByRole('button', { name: 'Open Sam conversation', exact: true }).click();
    if (test.info().project.name === 'narrow-dark') await page.getByRole('dialog', { name: 'Keep this unsaved draft before switching?', exact: true }).getByRole('button', { name: 'Keep draft and switch', exact: true }).click();
    await expect(preview.getByLabel('Reply visibility', { exact: true })).toHaveValue('public');
    await expect(preview.getByLabel('Public reply text', { exact: true })).toHaveValue('The studio opens at 10:00.');
  });

  test('unknown public send preserves receipt after permission loss and cannot be repeated', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-recovery-inbox');
    await preview.getByRole('button', { name: 'Open Sam conversation', exact: true }).click();
    await preview.getByLabel('Public reply text', { exact: true }).fill('Your visit is confirmed.');
    await preview.getByRole('button', { name: 'Review public reply', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Review public reply', exact: true });
    await expect(dialog).toContainText('This reply is external and public.');
    await dialog.getByRole('button', { name: 'Simulate public send', exact: true }).click();
    await preview.getByRole('button', { name: 'Simulate lost response', exact: true }).click();
    await expect(preview.getByLabel('Public reply text', { exact: true })).toBeDisabled();
    await expect(preview.getByRole('button', { name: 'Review public reply', exact: true })).toBeDisabled();
    await preview.getByLabel('Simulated reply permission', { exact: true }).selectOption('read-only');
    const receipt = preview.getByRole('region', { name: 'Reply receipt', exact: true });
    await expect(receipt).toBeVisible();
    await expect(receipt).toContainText('demo-inbox-marina-1');
    await expect(receipt).toContainText('Outcome unknown');
    await preview.getByLabel('Simulated reply permission', { exact: true }).selectOption('reply');
    await preview.getByRole('button', { name: 'Simulate reconciliation: accepted reply found', exact: true }).click();
    await expect(receipt).toContainText('Accepted');
    await expect(preview.locator('.t98-conversation-status').filter({ hasText: 'Needs workflow review' })).toBeVisible();
    await expect(preview.getByText('Accepted · delivery unobserved', { exact: true })).toBeVisible();
    await expect(preview.getByLabel('Public reply text', { exact: true })).toHaveValue('');
  });
});

test.describe('Campaign C7 · asset evidence and safe draft attachment', () => {
  test('exact-version approval enables attachment; metadata edit invalidates it', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-media-approval');
    const asset = preview.getByRole('region', { name: 'studio-launch-original.png', exact: true });
    await expect(asset).toContainText('Unverified · never inferred from a filename');
    await expect(preview.getByRole('button', { name: 'Attach reviewed media to selected draft', exact: true })).toBeDisabled();
    await preview.getByRole('button', { name: 'Simulate verified processing result', exact: true }).click();
    await preview.getByRole('button', { name: 'Approve exact fixture version locally', exact: true }).click();
    await preview.getByRole('button', { name: 'Attach reviewed media to selected draft', exact: true }).click();
    const attachments = preview.getByRole('region', { name: 'Local draft attachments · ig-studio', exact: true });
    await expect(attachments).toContainText('studio-launch-original.png · pinned fixture v1');
    await expect(attachments).toContainText('Attached to local draft only');
    await preview.getByLabel('Alternative text for this asset', { exact: true }).fill('Reviewed metadata changed.');
    await expect(preview.getByRole('button', { name: 'Attach reviewed media to selected draft', exact: true })).toBeDisabled();
    await expect(asset).toContainText('Needs review / approval stale');
    await preview.getByLabel('Exact attachment destination', { exact: true }).selectOption('li-company');
    await expect(preview.getByRole('region', { name: 'Local draft attachments · li-company', exact: true })).toContainText('No media attached.');
  });

  test('native file selection stays pending; failures, expiry and changed original block attachment', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-media-approval');
    await preview.getByLabel('Select local files · upload demonstration', { exact: true }).setInputFiles({ name: 'local-upload-demo.png', mimeType: 'image/png', buffer: Buffer.from('Synthetic fixture; no file contents inspected or uploaded.') });
    const asset = preview.getByRole('region', { name: 'local-upload-demo.png', exact: true });
    await expect(asset).toContainText('Media processing is pending. Delivery readiness is unverified.');
    await expect(asset).toContainText('Unverified · never inferred from a filename');
    await preview.getByRole('button', { name: 'Simulate per-file processing failure', exact: true }).click();
    await expect(asset).toContainText('Synthetic transfer / processing failure. Original filename and metadata are retained.');
    await preview.getByLabel('Usage evidence · local metadata', { exact: true }).fill('Synthetic studio permission evidence');
    await preview.getByRole('button', { name: 'Simulate verified processing result', exact: true }).click();
    await preview.getByRole('button', { name: 'Approve exact fixture version locally', exact: true }).click();
    await preview.getByRole('button', { name: 'Simulate delivery expiry', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Attach reviewed media to selected draft', exact: true })).toBeDisabled();
    await preview.getByRole('button', { name: 'Simulate refreshed delivery reference', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Attach reviewed media to selected draft', exact: true })).toBeEnabled();
    await preview.getByRole('button', { name: 'Simulate changed original · invalidate approval', exact: true }).click();
    await expect(asset).toContainText('original version 2 retained');
    await expect(asset).toContainText('Needs review / approval stale');
    await expect(preview.getByRole('button', { name: 'Attach reviewed media to selected draft', exact: true })).toBeDisabled();
  });
});

test.describe('Campaign C8 · transactional audience and explicit recipient send', () => {
  test('import outcomes and exclusions remain readable; acceptance and delivery are separate', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-direct-audience');
    await expect(preview.getByRole('button', { name: 'Review exact send to 2 recipients', exact: true })).toBeDisabled();
    await previewDirectAudience(preview);
    const rows = preview.getByRole('table', { name: 'Import preview · all 5 rows · no identity silently merged', exact: true });
    await expect(rows.getByRole('row')).toHaveCount(6);
    await expect(rows.getByRole('row').filter({ hasText: 'c***@example.test' })).toContainText('Suppressed · earlier consent cannot override suppression');
    await expect(rows.getByRole('row').filter({ hasText: 'invalid row' })).toContainText('identity conflict retained for manual review');
    const audience = preview.getByRole('region', { name: 'Exact audience preview', exact: true });
    await expect(audience.locator('.t98-audience-counts')).toContainText('Eligible2');
    await expect(audience.locator('.t98-audience-counts')).toContainText('Excluded2');
    await expect(audience.locator('.t98-audience-counts')).toContainText('Unverified1');
    await preview.getByRole('button', { name: 'Review exact send to 2 recipients', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Review exact transactional send', exact: true });
    await expect(dialog).toContainText('2 eligible / 5 imported · a*** and b*** only');
    const beforeLines = await dialog.getByRole('columnheader', { name: 'Before', exact: true }).evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set([...range.getClientRects()].map(rect => rect.top)).size;
    });
    expect(beforeLines, 'The Before heading must remain readable on one line').toBe(1);
    await expect(dialog).toContainText('appointments@example.test · immediately after confirmation');
    await expect(dialog.getByText('Your Dubai studio appointment', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Simulate explicit send to 2 recipients', exact: true }).click();
    const receipts = preview.getByRole('region', { name: 'Recipient send receipts', exact: true });
    await expect(receipts.getByRole('listitem')).toHaveCount(2);
    await preview.getByRole('button', { name: 'Simulate provider send response', exact: true }).click();
    await expect(receipts.getByText('Accepted', { exact: true })).toHaveCount(2);
    await expect(receipts.getByText('Delivered', { exact: true })).toHaveCount(0);
    await preview.getByRole('button', { name: 'Simulate separate delivery receipts', exact: true }).click();
    await expect(receipts.getByText('Delivered', { exact: true })).toHaveCount(2);
    await expect(preview.getByText('Delivery is confirmed only within this synthetic result. Read tracking is unavailable for this connection.', { exact: true })).toBeVisible();
  });

  test('stale eligibility blocks review; uncertain recipients are reconciled without resend', async ({ page }) => {
    const preview = await openFlow(page, 'campaign-direct-audience');
    await previewDirectAudience(preview);
    await preview.getByRole('button', { name: 'Simulate changed eligibility / stale review', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Review exact send to 2 recipients', exact: true })).toBeDisabled();
    await expect(preview.getByText('Audience preview is stale', { exact: true })).toBeVisible();
    await preview.getByRole('button', { name: 'Refresh local audience preview', exact: true }).click();
    await preview.getByRole('button', { name: 'Simulate consent and suppression result', exact: true }).click();
    await preview.getByLabel('Transactional subject', { exact: true }).fill('Updated appointment confirmation');
    await preview.getByLabel('Simulated send response', { exact: true }).selectOption('unknown');
    await preview.getByRole('button', { name: 'Review exact send to 2 recipients', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Review exact transactional send', exact: true });
    await expect(dialog.getByText('Updated appointment confirmation', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Simulate explicit send to 2 recipients', exact: true }).click();
    await preview.getByRole('button', { name: 'Simulate provider send response', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Review exact send to 2 recipients', exact: true })).toBeDisabled();
    const receipts = preview.getByRole('region', { name: 'Recipient send receipts', exact: true });
    await expect(receipts.getByText('Outcome unknown', { exact: true })).toHaveCount(2);
    await expect(receipts).toContainText('demo-direct-001-a');
    await expect(receipts).toContainText('demo-direct-001-b');
    await preview.getByRole('button', { name: 'Simulate reconciliation: both accepted', exact: true }).click();
    await expect(receipts.getByText('Accepted', { exact: true })).toHaveCount(2);
    await expect(preview.getByRole('button', { name: 'Simulate provider send response', exact: true })).toHaveCount(0);
    await expect(preview.getByRole('button', { name: 'Review exact send to 2 recipients', exact: true })).toBeDisabled();
  });
});

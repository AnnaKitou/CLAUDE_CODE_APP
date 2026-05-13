import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = 'playwright_test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Playwright Test User';

async function registerUser(page: Page) {
  await page.goto('/register');
  await page.getByLabel('Name').fill(TEST_NAME);
  await page.getByLabel('Email').fill(TEST_EMAIL);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  // May redirect to dashboard or show "email already taken" — either is fine
  await page.waitForURL(/\/(dashboard|register)/, { timeout: 10_000 });
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(TEST_EMAIL);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });
}

test.describe('Landing Page', () => {
  test('shows sign in and register buttons when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'NextNotes' })).toBeVisible();
  });

  test('redirects unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Authentication', () => {
  test('register page loads with all fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('login page loads with all fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('register and login flow works end to end', async ({ page }) => {
    const uniqueEmail = `test_${Date.now()}@example.com`;
    await page.goto('/register');
    await page.getByLabel('Name').fill('New User');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL('/', { timeout: 5_000 });

    // Login again
    await page.goto('/login');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Notes CRUD', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard loads with welcome message', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Notes' })).toBeVisible();
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();
    await expect(page.getByRole('link', { name: 'New Note' })).toBeVisible();
  });

  test('create a new note navigates to editor', async ({ page }) => {
    await page.getByRole('link', { name: 'New Note' }).click();
    await expect(page).toHaveURL('/notes/new', { timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'Create a new note' })).toBeVisible();

    await page.getByLabel('Title').fill('My Test Note');
    await page.getByRole('button', { name: 'Create Note' }).click();
    await expect(page).toHaveURL(/\/notes\/[^/]+$/, { timeout: 10_000 });
    await expect(page.getByLabel('Title')).toHaveValue('My Test Note');
  });

  test('save note returns to dashboard and shows note', async ({ page }) => {
    const noteName = `Note ${Date.now()}`;
    await page.getByRole('link', { name: 'New Note' }).click();
    await page.getByLabel('Title').fill(noteName);
    await page.getByRole('button', { name: 'Create Note' }).click();
    await expect(page).toHaveURL(/\/notes\/[^/]+$/, { timeout: 10_000 });

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });
    await expect(page.getByText(noteName)).toBeVisible();
  });

  test('update note title', async ({ page }) => {
    await page.getByRole('link', { name: 'New Note' }).click();
    await page.getByLabel('Title').fill('Original Title');
    await page.getByRole('button', { name: 'Create Note' }).click();
    await expect(page).toHaveURL(/\/notes\/[^/]+$/, { timeout: 10_000 });

    await page.getByLabel('Title').fill('Updated Title');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });
    await expect(page.getByText('Updated Title')).toBeVisible();
  });

  test('delete a note removes it from dashboard', async ({ page }) => {
    const noteName = `Delete Me ${Date.now()}`;
    await page.getByRole('link', { name: 'New Note' }).click();
    await page.getByLabel('Title').fill(noteName);
    await page.getByRole('button', { name: 'Create Note' }).click();
    await expect(page).toHaveURL(/\/notes\/[^/]+$/, { timeout: 10_000 });

    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });
    await expect(page.getByText(noteName)).not.toBeVisible();
  });
});

test.describe('Note Sharing', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('toggle public sharing shows link and hides on toggle off', async ({ page }) => {
    await page.getByRole('link', { name: 'New Note' }).click();
    await page.getByLabel('Title').fill('Share Toggle Test');
    await page.getByRole('button', { name: 'Create Note' }).click();
    await expect(page).toHaveURL(/\/notes\/[^/]+$/, { timeout: 10_000 });

    const shareToggle = page.getByRole('switch', { name: 'Public sharing' });
    await expect(shareToggle).toBeVisible();
    await expect(shareToggle).toHaveAttribute('aria-checked', 'false');

    // Enable sharing
    await shareToggle.click();
    await expect(shareToggle).toHaveAttribute('aria-checked', 'true', { timeout: 5_000 });
    const publicLinkArea = page.locator('text=/\\/p\\//');
    await expect(publicLinkArea).toBeVisible({ timeout: 5_000 });

    // Disable sharing
    await shareToggle.click();
    await expect(shareToggle).toHaveAttribute('aria-checked', 'false', { timeout: 5_000 });
    await expect(publicLinkArea).not.toBeVisible();
  });

  test('shared note is accessible without authentication', async ({ page, context }) => {
    await page.getByRole('link', { name: 'New Note' }).click();
    await page.getByLabel('Title').fill('Public Access Test Note');
    await page.getByRole('button', { name: 'Create Note' }).click();
    await expect(page).toHaveURL(/\/notes\/[^/]+$/, { timeout: 10_000 });

    const shareToggle = page.getByRole('switch', { name: 'Public sharing' });
    await shareToggle.click();
    await expect(shareToggle).toHaveAttribute('aria-checked', 'true', { timeout: 5_000 });

    const linkText = page.locator('text=/\\/p\\//');
    await expect(linkText).toBeVisible({ timeout: 5_000 });
    const slug = (await linkText.textContent()) ?? '';
    const publicUrl = slug.startsWith('http') ? slug : `http://localhost:3000${slug}`;

    // Open in a new browser context (no session cookies)
    const newContext = await context.browser()!.newContext();
    const newPage = await newContext.newPage();
    await newPage.goto(publicUrl);
    await expect(newPage.getByRole('heading', { name: 'Public Access Test Note' })).toBeVisible({ timeout: 5_000 });
    await newContext.close();
  });

  test('private note returns 404 for public URL', async ({ page, context }) => {
    await page.getByRole('link', { name: 'New Note' }).click();
    await page.getByLabel('Title').fill('Private Note');
    await page.getByRole('button', { name: 'Create Note' }).click();
    await expect(page).toHaveURL(/\/notes\/[^/]+$/, { timeout: 10_000 });

    const shareToggle = page.getByRole('switch', { name: 'Public sharing' });
    await shareToggle.click();
    await expect(shareToggle).toHaveAttribute('aria-checked', 'true', { timeout: 5_000 });

    const linkText = page.locator('text=/\\/p\\//');
    await expect(linkText).toBeVisible({ timeout: 5_000 });
    const slug = (await linkText.textContent()) ?? '';
    const publicUrl = slug.startsWith('http') ? slug : `http://localhost:3000${slug}`;

    // Disable sharing
    await shareToggle.click();
    await expect(shareToggle).toHaveAttribute('aria-checked', 'false', { timeout: 5_000 });

    // Try to access now-private note
    const newContext = await context.browser()!.newContext();
    const newPage = await newContext.newPage();
    await newPage.goto(publicUrl);
    // Should show 404
    await expect(newPage.getByText(/not found|404/i)).toBeVisible({ timeout: 5_000 });
    await newContext.close();
  });
});

test.describe('Rich Text Editor', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'New Note' }).click();
    await page.getByLabel('Title').fill('Editor Test');
    await page.getByRole('button', { name: 'Create Note' }).click();
    await expect(page).toHaveURL(/\/notes\/[^/]+$/, { timeout: 10_000 });
  });

  test('all toolbar buttons are visible', async ({ page }) => {
    await expect(page.getByTitle('Bold')).toBeVisible();
    await expect(page.getByTitle('Italic')).toBeVisible();
    await expect(page.getByTitle('Heading 1')).toBeVisible();
    await expect(page.getByTitle('Heading 2')).toBeVisible();
    await expect(page.getByTitle('Heading 3')).toBeVisible();
    await expect(page.getByTitle('Bullet List')).toBeVisible();
    await expect(page.getByTitle('Inline Code')).toBeVisible();
    await expect(page.getByTitle('Code Block')).toBeVisible();
    await expect(page.getByTitle('Horizontal Rule')).toBeVisible();
  });

  test('bold formatting applies and renders strong tag', async ({ page }) => {
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('bold text');
    await page.keyboard.press('Control+A');
    await page.getByTitle('Bold').click();
    await expect(page.locator('.ProseMirror strong')).toBeVisible();
  });

  test('italic formatting applies', async ({ page }) => {
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('italic text');
    await page.keyboard.press('Control+A');
    await page.getByTitle('Italic').click();
    await expect(page.locator('.ProseMirror em')).toBeVisible();
  });

  test('heading formatting applies', async ({ page }) => {
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('heading text');
    await page.getByTitle('Heading 1').click();
    await expect(page.locator('.ProseMirror h1')).toBeVisible();
  });

  test('bullet list creates list items', async ({ page }) => {
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('list item');
    await page.getByTitle('Bullet List').click();
    await expect(page.locator('.ProseMirror ul li')).toBeVisible();
  });
});

test.describe('Logout', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('logout button redirects to home and shows auth links', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL('/', { timeout: 5_000 });
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Account' })).toBeVisible();
  });
});

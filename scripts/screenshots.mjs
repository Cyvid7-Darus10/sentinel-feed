import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const SITE = 'https://sentinel-feed.pastelero.ph';

async function main() {
  const browser = await chromium.launch();

  // ── Desktop (1440x900, 2x) ──
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 1. Radar view (default)
  await page.screenshot({ path: path.join(OUT, 'radar-desktop.png') });
  console.log('✓ radar-desktop.png');

  // 2. Map view
  await page.click('button:has-text("MAP")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'map-desktop.png') });
  console.log('✓ map-desktop.png');

  // 3. List view
  await page.click('button:has-text("LIST")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'list-desktop.png') });
  console.log('✓ list-desktop.png');

  // 4. Topic filter (AI/ML)
  await page.click('nav button:has-text("AI")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, 'topic-filter.png') });
  console.log('✓ topic-filter.png');

  await ctx.close();

  // ── Mobile (390x844, 2x) ──
  const mCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const mPage = await mCtx.newPage();
  await mPage.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  await mPage.waitForTimeout(3000);

  // 5. Radar mobile
  await mPage.screenshot({ path: path.join(OUT, 'radar-mobile.png') });
  console.log('✓ radar-mobile.png');

  // 6. Map mobile
  await mPage.click('button:has-text("MAP")');
  await mPage.waitForTimeout(1500);
  await mPage.screenshot({ path: path.join(OUT, 'map-mobile.png') });
  console.log('✓ map-mobile.png');

  await mCtx.close();
  await browser.close();
  console.log('\nAll screenshots saved to docs/screenshots/');
}

main().catch((err) => {
  console.error('Screenshot failed:', err.message);
  process.exit(1);
});

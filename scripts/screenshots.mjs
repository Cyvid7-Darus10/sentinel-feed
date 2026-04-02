import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const URL = 'https://sentinel-feed.pastelero.ph';

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // 1. Full dashboard — desktop (map view)
  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await desktop.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2000);
  await desktop.screenshot({
    path: path.join(OUT, 'dashboard-desktop.png'),
    fullPage: false,
  });
  console.log('✓ dashboard-desktop.png');

  // 2. List view — click LIST button
  const listBtns = await desktop.$$('header button');
  for (const btn of listBtns) {
    const text = await btn.evaluate((el) => el.textContent?.trim());
    if (text === 'LIST') {
      await btn.click();
      break;
    }
  }
  await wait(1000);
  await desktop.screenshot({
    path: path.join(OUT, 'list-view.png'),
    fullPage: false,
  });
  console.log('✓ list-view.png');

  // 3. Topic-filtered list — click a topic tab (e.g., AI / ML)
  const topicBtns = await desktop.$$('nav button, header button');
  for (const btn of topicBtns) {
    const text = await btn.evaluate((el) => el.textContent?.trim());
    if (text && text.includes('AI')) {
      await btn.click();
      break;
    }
  }
  await wait(800);
  await desktop.screenshot({
    path: path.join(OUT, 'topic-filter.png'),
    fullPage: false,
  });
  console.log('✓ topic-filter.png');

  // 4. Mobile view (map)
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await mobile.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2000);
  await mobile.screenshot({
    path: path.join(OUT, 'dashboard-mobile.png'),
    fullPage: false,
  });
  console.log('✓ dashboard-mobile.png');

  await browser.close();
  console.log('\nAll screenshots saved to docs/screenshots/');
}

main().catch((err) => {
  console.error('Screenshot failed:', err.message);
  process.exit(1);
});
